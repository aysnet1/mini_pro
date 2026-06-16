import { genkit, z } from 'genkit/beta';
import { googleAI } from '@genkit-ai/google-genai';
import db from '../database/db.js';

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
});

// ═══════════════════════════════════════════════════════════════
//  CHUNK TYPES
// ═══════════════════════════════════════════════════════════════
const ChunkType = {
  THINKING: 'thinking',
  TEXT: 'text',
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',
  ERROR: 'error',
  DONE: 'done',
};

// ═══════════════════════════════════════════════════════════════
//  AgentStream — thin wrapper that keeps chunk-sending DRY
// ═══════════════════════════════════════════════════════════════
class AgentStream {
  #send;

  constructor(sendChunk) {
    this.#send = sendChunk;
  }

  thinking(content) { if (content) this.#send({ type: ChunkType.THINKING, content }); }
  text(content) { if (content) this.#send({ type: ChunkType.TEXT, content }); }
  toolCall(toolName, input) { this.#send({ type: ChunkType.TOOL_CALL, tool: toolName, input }); }
  toolResult(toolName, result) { this.#send({ type: ChunkType.TOOL_RESULT, tool: toolName, result }); }
  error(message, code) { this.#send({ type: ChunkType.ERROR, message, code }); }
  done(meta = {}) { this.#send({ type: ChunkType.DONE, ...meta }); }
}


const activeStreams = new Map();

// ═══════════════════════════════════════════════════════════════
//  Logement row schema (reused in tool + flow output)
// ═══════════════════════════════════════════════════════════════
const LogementSchema = z.object({
  id: z.number(),
  type: z.string(),
  ville: z.string(),
  adress: z.string(),
  prix: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  nb_places: z.number(),
  equipemens: z.string().or(z.array(z.string())),
  photos: z.string().or(z.array(z.string())),
  statut: z.string(),
});

// ═══════════════════════════════════════════════════════════════
//  Tool: searchLogements
// ═══════════════════════════════════════════════════════════════
const searchLogementsTool = ai.defineTool(
  {
    name: 'searchLogements',
    description:
      'Recherche les logements disponibles dans la base de données par ville, budget max, et type.',
    inputSchema: z.object({
      ville: z.string().describe('La ville ciblée (ex: Kairouan)'),
      budgetMax: z.number().optional().describe('Prix maximum par mois en dinars (DT)'),
      type: z.string().optional().describe('Type de logement (ex: studio, appartement, chambre)'),
    }),
    // outputSchema now matches what the function returns
    outputSchema: z.array(LogementSchema),
  },
  async ({ ville, budgetMax, type }, { context }) => {
    const stream = activeStreams.get(context?.sessionKey);
    stream?.toolCall('searchLogements', { ville, budgetMax, type });

    let query = `
      SELECT id, type, ville, latitude ,longitude, adress, prix, nb_places, equipemens, photos, statut

      FROM logement
      WHERE LOWER(ville) LIKE LOWER(?) AND LOWER(statut) = 'disponible'
    `;
    const params = [`%${ville}%`];

    if (budgetMax !== undefined) { query += ` AND prix <= ?`; params.push(budgetMax); }
    if (type !== undefined) { query += ` AND LOWER(type) = LOWER(?)`; params.push(type); }
    query += ` ORDER BY prix ASC`;

    const [rows] = await db.query(query, params);

    // Emit structured envelope to frontend via side-channel
    stream?.toolResult('searchLogements', { success: true, count: rows.length, data: rows });

    return rows;
  },
);

// ═══════════════════════════════════════════════════════════════
//  Flow: chatBotFlow
// ═══════════════════════════════════════════════════════════════
export const chatBotFlow = ai.defineFlow(
  {
    name: 'chatBotFlow',
    inputSchema: z.object({
      message: z.string().optional(),
      userId: z.string().optional(),
      chatHistory: z.array(z.any()).optional(),
    }),
  },
  async ({ message, userId, chatHistory = [] }, { sendChunk }) => {
    const stream = new AgentStream(sendChunk);
    const sessionKey = userId ?? 'anonymous';

    // get student info from db
    const [users] = await db.query(
      `SELECT
        u.id,
        u.nom,
        u.prenom,
        u.email,
        u.tel,
        u.role,
        e.budget,
        e.habitudes,
        e.universite,
        e.recherche_ville
      FROM user u
      LEFT JOIN etudiant e ON u.id = e.id
      WHERE u.id = ?`,
      [userId]
    );


    try {
      activeStreams.set(sessionKey, stream);

      // history
      const messages = chatHistory
        .filter(h => h.role === 'user' || h.role === 'model')
        .slice(-6)
        .map(h => ({ role: h.role, content: [{ text: h.content ?? '' }] }))

      const chat = ai.chat({
        system: `Tu es un assistant de recherche de logement TakLog. Tu aides les utilisateurs à trouver des logements disponibles selon leurs critères (ville, budget, type). Utilise l'outil "searchLogements" dès que l'utilisateur mentionne une ville ou un budget. Présente les résultats de façon claire et concise. aussi, tu peux répondre à des questions générales sur la location de logement étudiant en Tunisie.
        student info: ${JSON.stringify(users[0] || {})}
        `,

        model: googleAI.model('gemini-3.5-flash'),
        tools: [searchLogementsTool],
        messages,

        context: { sessionKey },

        config: {
          thinkingConfig: {
            // thinkingLevel: 'HIGH',
            includeThoughts: true,
          },
        },
      });

      const { stream: genStream, response } = chat.sendStream(message);

      for await (const chunk of genStream) {

        // Thought parts arrive as content parts where
        // part.metadata?.thought === true.
        if (Array.isArray(chunk.content)) {
          for (const part of chunk.content) {
            if (part.metadata?.thought) {
              stream.thinking(part.text);
            } else if (part.text) {
              stream.text(part.text);
            }
            // Log tool requests/responses for debugging
            if (part.toolRequest) console.log('[tool:request] ', JSON.stringify(part.toolRequest));
            if (part.toolResponse) console.log('[tool:response]', JSON.stringify(part.toolResponse));
          }
        }
      }

      const final = await response;

      if (final.interrupts?.length > 0) {
        stream.done({ usage: final.usage, interrupts: final.interrupts });
        return { interrupted: true };
      }

      stream.done({ usage: final.usage });
      return final.text;

    } catch (err) {
      console.error('[chatBotFlow] error:', err);
      stream.error(err.message, err.code ?? 'UNKNOWN');
      throw err;
    } finally {
      activeStreams.delete(sessionKey);
    }
  },
);

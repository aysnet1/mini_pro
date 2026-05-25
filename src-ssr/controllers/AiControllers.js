import { genkit, z } from 'genkit/beta';
import { googleAI } from '@genkit-ai/google-genai';
import db from '../database/db';

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
});

// Define the Database Search Tool for Gemini
const searchLogementsTool = ai.defineTool(
  {
    name: 'searchLogements',
    description: 'Recherche les logements disponibles dans la base de données par ville, budget max, et type.',
    inputSchema: z.object({
      ville: z.string().describe('La ville ciblée (ex: Kairouan)'),
      budgetMax: z.number().optional().describe('Le prix maximum par mois en dinars (DT)'),
      type: z.string().optional().describe('Le type de logement (ex: studio, appartement, chambre)'),
    }),
    outputSchema: z.array(
      z.object({
        id: z.number(),
        type: z.string(),
        ville: z.string(),
        adress: z.string(),
        prix: z.number(),
        nb_places: z.number(),
        equipemens: z.string().or(z.array(z.string())),
        photos: z.string().or(z.array(z.string())),
        statut: z.string()
      })
    ),
  },
  async (input) => {
    const { ville, budgetMax, type } = input;

    let query = `
      SELECT id, type, ville, adress, prix, nb_places, equipemens, photos, statut
      FROM logement
      WHERE LOWER(ville) = LOWER(?)
        AND LOWER(statut) = 'disponible'
    `;

    const queryParams = [ville];

    if (budgetMax) {
      query += ` AND prix <= ?`;
      queryParams.push(budgetMax);
    }

    if (type) {
      query += ` AND LOWER(type) = LOWER(?)`;
      queryParams.push(type);
    }

    query += ` ORDER BY prix ASC`;

    const [rows] = await db.query(query, queryParams);
    return rows;
  }
);

// Unified Chat controller API Endpoint
export const chatBot = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const systemPrompt = `Tu es un assistant intelligent pour une application de logement étudiant en Tunisie (TakeLog).
Ton but est d'aider les étudiants à trouver des logements, des colocataires et répondre à leurs questions.
Si l'utilisateur demande des logements avec des critères précis (comme la ville ou le budget), utilise TOUJOURS l'outil 'searchLogements'.
Quand tu affiches les résultats d'un outil, confirme simplement l'affichage de manière concise sans réécrire tous les détails techniques.`;

    // Format chat history array correctly according to Genkit spec
    // and append the incoming user request message inline to avoid the prompt conflict
    const formattedMessages = [
      ...history.map(msg => ({
        role: msg.role === 'bot' ? 'model' : msg.role,
        content: [{ text: msg.text }]
      })),
      {
        role: 'user',
        content: [{ text: message }]
      }
    ];

    const response = await ai.generate({
      model: googleAI.model('gemini-3-flash-preview'),
      systemInstruction: systemPrompt,
      messages: formattedMessages, // Send the entire message stack here cleanly
      tools: [searchLogementsTool],
    });

    // Extracting dynamic data safely from the execution outputs array
    const toolCalls = response.toolCalls || [];
    let customWidgetData = null;

    if (toolCalls.length > 0) {
      const contents = response.message?.content || [];
      const toolResultObj = contents.find(c => c.toolResponse !== undefined);

      if (toolResultObj?.toolResponse?.output) {
        customWidgetData = toolResultObj.toolResponse.output;
      }
    }

    res.status(200).json({
      reply: response.text || "J'ai trouvé des options correspondantes à vos critères.",
      data: customWidgetData
    });
  } catch (error) {
    console.error("Error in chatBot:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


// Unified Streaming Chat controller API Endpoint
export const chatBotStream = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Set headers for SSE (Server-Sent Events) style chunked streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemPrompt = `Tu es un assistant intelligent pour une application de logement étudiant en Tunisie (TakeLog).
Ton but est d'aider les étudiants à trouver des logements, des colocataires et répondre à leurs questions.
Si l'utilisateur demande des logements avec des critères précis (comme la ville ou le budget), utilise TOUJOURS l'outil 'searchLogements'.
Quand tu affiches les résultats d'un outil, confirme simplement l'affichage de manière concise sans réécrire tous les détails techniques.`;

    const formattedMessages = [
      ...history.map(msg => ({
        role: msg.role === 'bot' ? 'model' : msg.role,
        content: [{ text: msg.text }]
      })),
      {
        role: 'user',
        content: [{ text: message }]
      }
    ];

    // Initialize Genkit Stream engine
    const responseStream = ai.generateStream({
      model: googleAI.model('gemini-3-flash-preview'),
      systemInstruction: systemPrompt,
      messages: formattedMessages,
      tools: [searchLogementsTool],
    });

    // 1. Stream text tokens to the UI as they arrive
    for await (const chunk of responseStream.stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
      }
    }

    // 2. Wait for full resolution to extract finalized tool outputs
    const finalResponse = await responseStream.response;

    let customWidgetData = null;
    const toolCalls = finalResponse.toolCalls || [];

    if (toolCalls.length > 0) {
      const contents = finalResponse.message?.content || [];
      const toolResultObj = contents.find(c => c.toolResponse !== undefined);

      if (toolResultObj?.toolResponse?.output) {
        customWidgetData = toolResultObj.toolResponse.output;
      }
    }

    // 3. Send final data payload structural metadata frame
    if (customWidgetData) {
      res.write(`data: ${JSON.stringify({ data: customWidgetData })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error("Error in chatBotStream:", error);
    res.write(`data: ${JSON.stringify({ error: "Internal Server Error" })}\n\n`);
    res.end();
  }
};

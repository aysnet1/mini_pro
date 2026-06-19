import { genkit, z } from 'genkit/beta';
import { googleAI } from '@genkit-ai/google-genai';
import db from '../database/db.js';
import { sendReservationNotification } from '../services/emailService.js';
import { randomUUID } from 'crypto';

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
});

const ChunkType = {
  THINKING: 'thinking',
  TEXT: 'text',
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',
  ERROR: 'error',
  DONE: 'done',
};


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

    stream?.toolResult('searchLogements', { success: true, count: rows.length, data: rows });

    return rows;
  },
);

// ═══════════════════════════════════════════════════════════════
//  Tool: createReservation
// ═══════════════════════════════════════════════════════════════
const createReservationTool = ai.defineTool(
  {
    name: 'createReservation',
    description:
      'Crée une réservation de logement pour un étudiant et envoie un email au propriétaire. À utiliser après que l étudiant a confirmé son choix et sélectionné les dates.',
    inputSchema: z.object({
      logement_id: z.number().describe('ID du logement à réserver'),
      date_debut: z.string().describe('Date de début de la réservation (format: YYYY-MM-DD)'),
      date_fin: z.string().describe('Date de fin de la réservation (format: YYYY-MM-DD)'),
      duree: z.number().describe('Durée de la réservation en mois'),
      etudiant_id: z.string().describe('ID de l étudiant qui réserve'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      reservation_id: z.number().optional(),
      message: z.string(),
    }),
  },
  async ({ logement_id, date_debut, date_fin, duree, etudiant_id }, { context }) => {
    const stream = activeStreams.get(context?.sessionKey);
    stream?.toolCall('createReservation', { logement_id, date_debut, date_fin, duree, etudiant_id });

    try {
      // Vérifier que le logement existe
      const [logements] = await db.query(
        `SELECT id, proprietaire_id, statut, adress, ville FROM logement WHERE id = ?`,
        [logement_id]
      );

      if (!logements.length) {
        stream?.toolResult('createReservation', {
          success: false,
          message: 'Logement introuvable.',
        });
        return { success: false, message: 'Logement introuvable.' };
      }

      const logement = logements[0];

      // Récupérer les informations du propriétaire
      const [proprietaires] = await db.query(
        `SELECT u.id, u.nom, u.prenom, u.email, u.tel
         FROM user u
         JOIN proprietaire p ON u.id = p.id
         WHERE p.id = ?`,
        [logement.proprietaire_id]
      );

      if (!proprietaires.length) {
        stream?.toolResult('createReservation', {
          success: false,
          message: 'Propriétaire introuvable.',
        });
        return { success: false, message: 'Propriétaire introuvable.' };
      }

      const proprietaire = proprietaires[0];

      // Récupérer les informations de l étudiant
      const [etudiants] = await db.query(
        `SELECT u.id, u.nom, u.prenom, u.email, u.tel
         FROM user u
         JOIN etudiant e ON u.id = e.id
         WHERE e.id = ?`,
        [etudiant_id]
      );

      if (!etudiants.length) {
        stream?.toolResult('createReservation', {
          success: false,
          message: 'Étudiant introuvable.',
        });
        return { success: false, message: 'Étudiant introuvable.' };
      }

      const etudiant = etudiants[0];

      // Vérifier les conflits de dates
      const [conflicts] = await db.query(
        `SELECT 1 FROM etudiant_logement
         WHERE logement_id = ? AND statut = 'acceptee'
         AND date_debut < ? AND date_fin > ?
         LIMIT 1`,
        [logement_id, date_fin, date_debut]
      );

      if (conflicts.length > 0) {
        stream?.toolResult('createReservation', {
          success: false,
          message: 'Ce logement est déjà réservé pour cette période.',
        });
        return { success: false, message: 'Ce logement est déjà réservé pour cette période.' };
      }

      // Créer la réservation
      const [result] = await db.query(
        `INSERT INTO etudiant_logement
         (etudiant_id, logement_id, date_debut, date_fin, duree, statut)
         VALUES (?, ?, ?, ?, ?, 'en_attente')`,
        [etudiant_id, logement_id, date_debut, date_fin, duree]
      );

      const reservation_id = result.insertId;

      // Envoyer l email au propriétaire
      try {
        await sendReservationNotification({
          proprietaireEmail: proprietaire.email,
          proprietaireNom: `${proprietaire.nom} ${proprietaire.prenom}`,
          etudiantNom: etudiant.nom,
          etudiantPrenom: etudiant.prenom,
          etudiantEmail: etudiant.email,
          etudiantTel: etudiant.tel,
          logementAdresse: logement.adress,
          logementVille: logement.ville,
          dateDebut: date_debut,
          dateFin: date_fin,
          duree: duree,
        });
      } catch (emailError) {
        console.error('[createReservation] email error:', emailError);
        // On continue même si l email échoue
      }

      const resultData = {
        success: true,
        reservation_id,
        message: `Réservation créée avec succès. Un email a été envoyé au propriétaire ${proprietaire.nom} ${proprietaire.prenom}.`,
        metadata: {
          logement_nom: logement.adress,
          logement_ville: logement.ville,
          proprietaire_nom: proprietaire.nom,
          montant_total: logement.prix * duree,
          etudiant_nom: `${etudiant.nom} ${etudiant.prenom}`,
        },
      };

      stream?.toolResult('createReservation', resultData);

      return resultData;
    } catch (error) {
      console.error('[createReservation] error:', error);
      stream?.toolResult('createReservation', {
        success: false,
        message: `Erreur lors de la création de la réservation: ${error.message}`,
      });
      return { success: false, message: `Erreur: ${error.message}` };
    }
  },
);

// ═══════════════════════════════════════════════════════════════
//  Tool: getStudentInfo
// ═══════════════════════════════════════════════════════════════
const getStudentInfoTool = ai.defineTool(
  {
    name: 'getStudentInfo',
    description:
      'Récupère les informations complètes d un étudiant, y compris ses réservations actives et son historique. Utilise cet outil pour vérifier si l étudiant a déjà des réservations avant d en créer une nouvelle.',
    inputSchema: z.object({
      etudiant_id: z.string().describe('ID de l étudiant'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      student: z.object({
        id: z.number(),
        nom: z.string(),
        prenom: z.string(),
        email: z.string(),
        tel: z.string(),
        budget: z.number().nullable(),
        universite: z.string().nullable(),
        recherche_ville: z.string().nullable(),
        habitudes: z.string().nullable(),
      }).nullable(),
      reservations: z.array(z.object({
        id: z.number(),
        logement_id: z.number(),
        logement_adresse: z.string(),
        logement_ville: z.string(),
        date_debut: z.string(),
        date_fin: z.string(),
        duree: z.number(),
        statut: z.string(),
        created_at: z.string(),
      })),
      hasActiveReservation: z.boolean(),
      activeReservationsCount: z.number(),
    }),
  },
  async ({ etudiant_id }, { context }) => {
    const stream = activeStreams.get(context?.sessionKey);
    stream?.toolCall('getStudentInfo', { etudiant_id });

    try {
      // Récupérer les informations de l étudiant
      const [etudiants] = await db.query(
        `SELECT u.id, u.nom, u.prenom, u.email, u.tel, u.role,
                e.budget, e.habitudes, e.universite, e.recherche_ville
         FROM user u
         LEFT JOIN etudiant e ON u.id = e.id
         WHERE u.id = ?`,
        [etudiant_id]
      );

      if (!etudiants.length) {
        stream?.toolResult('getStudentInfo', {
          success: false,
          student: null,
          reservations: [],
          hasActiveReservation: false,
          activeReservationsCount: 0,
        });
        return {
          success: false,
          student: null,
          reservations: [],
          hasActiveReservation: false,
          activeReservationsCount: 0,
        };
      }

      const student = etudiants[0];

      // Récupérer toutes les réservations de l étudiant
      const [reservationsRows] = await db.query(
        `SELECT el.etudiant_id as id, el.logement_id, l.adress as logement_adresse, l.ville as logement_ville,
                DATE_FORMAT(el.date_debut, '%Y-%m-%d') as date_debut,
                DATE_FORMAT(el.date_fin, '%Y-%m-%d') as date_fin,
                el.duree, 'en_attente' as statut, DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') as created_at
         FROM etudiant_logement el
         JOIN logement l ON el.logement_id = l.id
         WHERE el.etudiant_id = ?
         ORDER BY el.date_debut DESC`,
        [etudiant_id]
      );

      const reservations = reservationsRows || [];

      // Vérifier si l étudiant a des réservations actives (en_attente ou acceptee)
      const activeReservations = reservations.filter(
        r => r.statut === 'en_attente' || r.statut === 'acceptee'
      );

      const hasActiveReservation = activeReservations.length > 0;
      const activeReservationsCount = activeReservations.length;

      const resultData = {
        success: true,
        student: {
          id: student.id,
          nom: student.nom,
          prenom: student.prenom,
          email: student.email,
          tel: student.tel,
          budget: student.budget,
          universite: student.universite,
          recherche_ville: student.recherche_ville,
          habitudes: student.habitudes,
        },
        reservations,
        hasActiveReservation,
        activeReservationsCount,
      };

      stream?.toolResult('getStudentInfo', resultData);

      return resultData;
    } catch (error) {
      console.error('[getStudentInfo] error:', error);
      stream?.toolResult('getStudentInfo', {
        success: false,
        student: null,
        reservations: [],
        hasActiveReservation: false,
        activeReservationsCount: 0,
      });
      return {
        success: false,
        student: null,
        reservations: [],
        hasActiveReservation: false,
        activeReservationsCount: 0,
      };
    }
  },
);

//  Flow: chatBotFlow
export const chatBotFlow = ai.defineFlow(
  {
    name: 'chatBotFlow',
    inputSchema: z.object({
      message: z.string().optional(),
      userId: z.string().optional(),
      chatHistory: z.array(z.any()).optional(),
      resumeData: z
        .object({
          messages: z.array(z.any()).optional(),
          interruptObject: z.any().optional(),
          replyPayload: z.any().optional(),
        })
        .optional()
        .describe('Données pour reprendre après un interrupt'),
    }),
  },
  async ({ message, userId, chatHistory = [], resumeData }, { sendChunk }) => {
    const stream = new AgentStream(sendChunk);
    const sessionKey = userId ?? randomUUID();

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
      LEFT JOIN etablissement etu ON e.universite = etu.id
      WHERE u.id = ?`,
      [userId]
    );

    const studentData = users[0] || {};

    try {
      activeStreams.set(sessionKey, stream);

      // history
      let messages;
      let resumeOption = undefined;

      if (resumeData && resumeData.messages && resumeData.interruptObject) {
        // Ce cas n'est plus utilisé car on a supprimé les interrupts
        messages = resumeData.messages;
      } else {
        messages = chatHistory
          .filter(h => h.role === 'user' || h.role === 'model')
          .slice(-6)
          .map(h => ({ role: h.role, content: [{ text: h.content ?? '' }] }));
      }

      const chat = ai.chat({
        system: `Tu es l'assistant virtuel de recherche de logement "TakLog". Ton rôle est d'aider les étudiants en Tunisie à trouver un logement disponible selon leurs critères (ville, budget, type) et de les accompagner dans leur réservation.

CONSIGNES GÉNÉRALES :
- use "getStudentInfoTool" pour vérifier les informations de l'étudiant et ses réservations actives avant de créer une nouvelle réservation.
- Utilise l'outil "searchLogements" dès que l'utilisateur mentionne une ville, un type ou un budget.
- Présente toujours les résultats de façon claire, structurée et concise.
- Tu es autorisé à répondre à des questions générales sur la location étudiante en Tunisie.

CONTEXTE UTILISATEUR :
- Données de l'étudiant connecté : ${JSON.stringify(studentData)}
- IMPORTANT : Pour tous les outils exigeant "etudiant_id", utilise strictement la valeur du champ "id" présente dans les données ci-dessus.

PROCESSUS DE RÉSERVATION STRICT (À suivre dans l'ordre) :
1. RECHERCHE : Fais une recherche via "searchLogements" selon les critères demandés.
2. SÉLECTION : Attends que l'étudiant choisit un logement précis et confirme son intention de réserver.
3. VÉRIFICATION ANTECÉDENTS : Avant toute chose, appelle impérativement "getStudentInfo" avec l'ID de l'étudiant.
4. CONFLIT DE RÉSERVATION : Si "hasActiveReservation" est vrai (true), informe poliment l'étudiant qu'il a déjà une réservation en cours (en attente ou acceptée) et demande-lui s'il souhaite l'annuler avant d'aller plus loin. Bloque le processus tant qu'il n'a pas annulé.
5. COLLECTE DES DATES : Si aucune réservation n'est active, demande à l'étudiant ses dates de séjour ("date_debut" et "date_fin") au format YYYY-MM-DD, ainsi que la durée totale en mois.
6. CRÉATION : Une fois les dates confirmées par l'étudiant, appelle l'outil "createReservation" avec les paramètres : logement_id, date_debut, date_fin, duree, etudiant_id
7. CONFIRMATION : Confirme le succès à l'étudiant en lui rappelant qu'un email de notification automatique a été envoyé au propriétaire.

        `,

        model: googleAI.model('gemini-3.5-flash'),
        tools: [getStudentInfoTool, searchLogementsTool, createReservationTool],
        messages,
        resume: resumeOption,

        context: { sessionKey, logementId: studentData.logement_id },

        config: {
          thinkingConfig: {
            // thinkingLevel: 'HIGH',
            includeThoughts: true,
          },
        },
      });

      const { stream: genStream, response } = chat.sendStream(message);

      for await (const chunk of genStream) {


        if (Array.isArray(chunk.content)) {
          for (const part of chunk.content) {
            if (part.metadata?.thought) {
              stream.thinking(part.text);
            } else if (part.text) {
              stream.text(part.text);
            }

          }
        }
      }

      const final = await response;

      if (final.interrupts?.length > 0) {
        stream.done({ usage: final.usage, interrupts: final.interrupts, messages: final.messages });
        return { interrupted: true, messages: final.messages };
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

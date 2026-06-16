import db from '../database/db.js';

/**
 * Envoyer un message
 * @route POST /api/messages
 */
export const SendMessage = async (req, res) => {
  try {
    const { expediteur_id, destinataire_id, contenu, role = 'user' } = req.body;

    if (!expediteur_id || !destinataire_id || !contenu) {
      return res.status(400).json({ error: "Champs requis: expediteur_id, destinataire_id, contenu" });
    }

    const allowedRoles = ['user', 'model', 'tools'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Rôle invalide. Valeurs acceptées: user, model, tools" });
    }

    const [result] = await db.query(
      `INSERT INTO message (expediteur_id, destinataire_id, role, contenu) VALUES (?, ?, ?, ?)`,
      [expediteur_id, destinataire_id, role, contenu]
    );

    res.status(201).json({ message: "Message envoyé.", msg_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'envoi du message", details: err.message });
  }
};

/**
 * Récupérer les messages échangés entre deux utilisateurs
 * @route GET /api/messages/conversation/:user1/:user2
 */
export const GetConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const [messages] = await db.query(
      `SELECT * FROM message
       WHERE (expediteur_id = ? AND destinataire_id = ?)
          OR (expediteur_id = ? AND destinataire_id = ?)
       ORDER BY date ASC`,
      [user1, user2, user2, user1]
    );

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Erreur de récupération de la conversation", details: err.message });
  }
};

/**
 * Supprimer tous les messages d'une conversation
 * @route DELETE /api/messages/conversation/:user1/:user2
 */
export const DeleteConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    await db.query(
      `DELETE FROM message
       WHERE (expediteur_id = ? AND destinataire_id = ?)
          OR (expediteur_id = ? AND destinataire_id = ?)`,
      [user1, user2, user2, user1]
    );

    res.status(200).json({ message: "Conversation supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression de la conversation", details: err.message });
  }
};

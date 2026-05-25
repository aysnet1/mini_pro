import db from '../database/db.js';

/**
 * Ajouter un avis sur un logement
 * @route POST /api/avis
 */
export const AddAvis = async (req, res) => {
    try {
        const { logement_id, auteur_id, note, commentaire, status } = req.body;

        if (!logement_id || !auteur_id || note === undefined) {
            return res.status(400).json({ error: "Champs requis manquants: logement_id, auteur_id, note." });
        }

        const [result] = await db.query(
            `INSERT INTO avis (logement_id, auteur_id, note, commentaire, status)
       VALUES (?, ?, ?, ?, ?)`,
            [logement_id, auteur_id, note, commentaire, status || 'publie']
        );

        res.status(201).json({ message: "Avis ajouté avec succès", id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de l'ajout de l'avis", details: err.message });
    }
};

/**
 * Récupérer tous les avis d'un logement
 * @route GET /api/avis/logement/:logement_id
 */
export const GetLogementAvis = async (req, res) => {
    try {
        const { logement_id } = req.params;

        const [avisList] = await db.query(
            `SELECT a.*, u.nom, u.prenom
       FROM avis a
       JOIN user u ON a.auteur_id = u.id
       WHERE a.logement_id = ?`,
            [logement_id]
        );

        res.status(200).json(avisList);
    } catch (err) {
        res.status(500).json({ error: "Erreur de récupération des avis", details: err.message });
    }
};

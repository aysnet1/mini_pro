import db from '../database/db.js';

/**
 * Réserver un logement (ou ajouter un étudiant à une colocation)
 * @route POST /api/reservations
 */
export const ReserveLogement = async (req, res) => {
  try {
    const { etudiant_id, logement_id, date_debut, date_fin, duree } = req.body;

    if (!etudiant_id || !logement_id || !date_debut || !date_fin || !duree) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    await db.query(
      `INSERT INTO etudiant_logement (etudiant_id, logement_id, date_debut, date_fin, duree)
       VALUES (?, ?, ?, ?, ?)`,
      [etudiant_id, logement_id, date_debut, date_fin, duree]
    );

    res.status(201).json({ message: "Réservation effectuée avec succès" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "L'étudiant réserve déjà ce logement." });
    }
    res.status(500).json({ error: "Erreur lors de la réservation", details: err.message });
  }
};

/**
 * Récupérer les occupants d'un logement (colocataires)
 * @route GET /api/reservations/logement/:logement_id
 */
export const GetLogementOccupants = async (req, res) => {
  try {
    const { logement_id } = req.params;

    // Jointure pour obtenir les détails de l'étudiant à partir de user/etudiant_logement
    const [occupants] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, el.date_debut, el.date_fin
       FROM etudiant_logement el
       JOIN user u ON el.etudiant_id = u.id
       WHERE el.logement_id = ?`,
      [logement_id]
    );

    res.status(200).json(occupants);
  } catch (err) {
    res.status(500).json({ error: "Erreur de récupération des occupants", details: err.message });
  }
};

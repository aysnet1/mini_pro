import db from '../database/db.js';

let avisSchemaChecked = false;

const ensureReservationStatusColumn = async () => {
    if (avisSchemaChecked) return;

    const [rows] = await db.query(
        `SELECT COUNT(*) AS total
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'etudiant_logement'
           AND COLUMN_NAME = 'statut'`
    );

    if (Number(rows[0]?.total || 0) === 0) {
        await db.query("ALTER TABLE etudiant_logement ADD COLUMN statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' AFTER duree");
    }

    avisSchemaChecked = true;
};

/**
 * Ajouter un avis sur un logement
 * @route POST /api/avis
 */
export const AddAvis = async (req, res) => {
    try {
        await ensureReservationStatusColumn();

        const auteur_id = req.user?.id;
        const { logement_id, note, commentaire, status } = req.body;
        const logementId = Number(logement_id);
        const noteValue = Number(note);

        if (!auteur_id || !Number.isInteger(logementId) || note === undefined) {
            return res.status(400).json({ error: "Champs requis manquants: logement_id, note." });
        }

        if (!Number.isInteger(noteValue) || noteValue < 1 || noteValue > 5) {
            return res.status(400).json({ error: "La note doit etre un entier entre 1 et 5." });
        }

        const [eligible] = await db.query(
            `SELECT 1
             FROM etudiant_logement
             WHERE etudiant_id = ? AND logement_id = ? AND statut = 'acceptee'
             LIMIT 1`,
            [auteur_id, logementId]
        );

        if (!eligible.length) {
            return res.status(403).json({ error: "Avis non autorise: reservation acceptee requise pour ce logement." });
        }

        const [existingAvis] = await db.query(
            `SELECT id FROM avis WHERE logement_id = ? AND auteur_id = ? LIMIT 1`,
            [logementId, auteur_id]
        );

        if (existingAvis.length) {
            await db.query(
                `UPDATE avis
                 SET note = ?, commentaire = ?, status = ?
                 WHERE id = ?`,
                [noteValue, commentaire || null, status || 'publie', existingAvis[0].id]
            );

            return res.status(200).json({ message: "Avis mis a jour avec succes", id: existingAvis[0].id });
        }

        const [result] = await db.query(
            `INSERT INTO avis (logement_id, auteur_id, note, commentaire, status)
       VALUES (?, ?, ?, ?, ?)`,
            [logementId, auteur_id, noteValue, commentaire || null, status || 'publie']
        );

        res.status(201).json({ message: "Avis ajoute avec succes", id: result.insertId });
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
        const logement_id = Number(req.params.logement_id);

        if (!Number.isInteger(logement_id) || logement_id <= 0) {
            return res.status(400).json({ error: "logement_id invalide." });
        }

        const [avisList] = await db.query(
            `SELECT a.*, u.nom, u.prenom
       FROM avis a
       JOIN user u ON a.auteur_id = u.id
       WHERE a.logement_id = ? AND a.status = 'publie'
       ORDER BY a.id DESC`,
            [logement_id]
        );

        res.status(200).json(avisList);
    } catch (err) {
        res.status(500).json({ error: "Erreur de récupération des avis", details: err.message });
    }
};

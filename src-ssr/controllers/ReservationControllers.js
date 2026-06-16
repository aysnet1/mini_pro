import db from '../database/db.js';
import { sendReservationNotification } from '../services/emailService.js';

let reservationSchemaReady = false;
let reservationSchemaPromise = null;

const ensureReservationSchema = async () => {
  if (reservationSchemaReady) return;
  if (reservationSchemaPromise) {
    await reservationSchemaPromise;
    return;
  }

  reservationSchemaPromise = (async () => {
    const requiredColumns = {
      statut: "ALTER TABLE etudiant_logement ADD COLUMN statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' AFTER duree",
      note_proprietaire: "ALTER TABLE etudiant_logement ADD COLUMN note_proprietaire VARCHAR(500) NULL AFTER statut",
      updated_at: "ALTER TABLE etudiant_logement ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER note_proprietaire"
    };

    for (const [columnName, alterSql] of Object.entries(requiredColumns)) {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS total
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'etudiant_logement'
           AND COLUMN_NAME = ?`,
        [columnName]
      );

      const exists = Number(rows[0]?.total || 0) > 0;
      if (!exists) {
        await db.query(alterSql);
      }
    }

    reservationSchemaReady = true;
  })();

  try {
    await reservationSchemaPromise;
  } finally {
    reservationSchemaPromise = null;
  }
};

const RESERVATION_STATUS = {
  PENDING: 'en_attente',
  ACCEPTED: 'acceptee',
  REJECTED: 'refusee',
  CANCELED: 'annulee'
};

const OWNER_ALLOWED_DECISIONS = new Set([
  RESERVATION_STATUS.ACCEPTED,
  RESERVATION_STATUS.REJECTED
]);

/**
 * Réserver un logement (ou ajouter un étudiant à une colocation)
 * @route POST /api/reservations
 */
export const ReserveLogement = async (req, res) => {
  try {
    await ensureReservationSchema();

    const etudiant_id = req.user?.id;
    const { logement_id, date_debut, date_fin, duree } = req.body;

    if (!etudiant_id || !logement_id || !date_debut || !date_fin || !duree) {
      return res.status(400).json({ error: "Champs requis: logement_id, date_debut, date_fin, duree." });
    }

    const logementId = Number(logement_id);
    const dureeMois = Number(duree);

    if (!Number.isInteger(logementId) || logementId <= 0) {
      return res.status(400).json({ error: "logement_id invalide." });
    }

    if (!Number.isInteger(dureeMois) || dureeMois <= 0) {
      return res.status(400).json({ error: "duree invalide." });
    }

    const start = new Date(date_debut);
    const end = new Date(date_fin);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ error: "Période invalide: date_debut doit être antérieure à date_fin." });
    }

    const [logements] = await db.query(
      `SELECT id, proprietaire_id, statut, adress, ville FROM logement WHERE id = ?`,
      [logementId]
    );

    if (!logements.length) {
      return res.status(404).json({ error: "Logement introuvable." });
    }

    const logement = logements[0];

    if (Number(logement.proprietaire_id) === Number(etudiant_id)) {
      return res.status(403).json({ error: "Vous ne pouvez pas reserver votre propre logement." });
    }

    // Récupérer les informations du propriétaire
    const [proprietaires] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.tel
       FROM user u
       JOIN proprietaire p ON u.id = p.id
       WHERE p.id = ?`,
      [logement.proprietaire_id]
    );

    if (!proprietaires.length) {
      return res.status(404).json({ error: "Propriétaire introuvable." });
    }

    const proprietaire = proprietaires[0];

    // Récupérer les informations de l'étudiant
    const [etudiants] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.tel
       FROM user u
       JOIN etudiant e ON u.id = e.id
       WHERE e.id = ?`,
      [etudiant_id]
    );

    if (!etudiants.length) {
      return res.status(404).json({ error: "Étudiant introuvable." });
    }

    const etudiant = etudiants[0];

    // Check for date overlap with existing ACCEPTED reservations
    const [conflicts] = await db.query(
      `SELECT 1 FROM etudiant_logement
       WHERE logement_id = ? AND statut = 'acceptee'
       AND date_debut < ? AND date_fin > ?
       LIMIT 1`,
      [logementId, date_fin, date_debut]
    );
    if (conflicts.length > 0) {
      return res.status(409).json({ error: "Ce logement est d\u00e9j\u00e0 r\u00e9serv\u00e9 pour cette p\u00e9riode." });
    }

    const [existingRows] = await db.query(
      `SELECT statut FROM etudiant_logement WHERE etudiant_id = ? AND logement_id = ? LIMIT 1`,
      [etudiant_id, logementId]
    );

    if (existingRows.length > 0) {
      const currentStatus = existingRows[0].statut;

      if (currentStatus === RESERVATION_STATUS.PENDING) {
        return res.status(409).json({ error: "Une demande est deja en attente pour ce logement." });
      }

      if (currentStatus === RESERVATION_STATUS.ACCEPTED) {
        return res.status(409).json({ error: "Votre reservation est deja acceptee pour ce logement." });
      }

      await db.query(
        `UPDATE etudiant_logement
         SET date_debut = ?, date_fin = ?, duree = ?, statut = ?, note_proprietaire = NULL, updated_at = NOW()
         WHERE etudiant_id = ? AND logement_id = ?`,
        [date_debut, date_fin, dureeMois, RESERVATION_STATUS.PENDING, etudiant_id, logementId]
      );
    } else {
      await db.query(
        `INSERT INTO etudiant_logement (etudiant_id, logement_id, date_debut, date_fin, duree, statut)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [etudiant_id, logementId, date_debut, date_fin, dureeMois, RESERVATION_STATUS.PENDING]
      );
    }

    // Envoyer une notification email au propriétaire (en arrière-plan, ne bloque pas la réponse)
    sendReservationNotification({
      proprietaireEmail: proprietaire.email,
      proprietaireNom: proprietaire.nom,
      etudiantNom: etudiant.nom,
      etudiantPrenom: etudiant.prenom,
      etudiantEmail: etudiant.email,
      etudiantTel: etudiant.tel,
      logementAdresse: logement.adress,
      logementVille: logement.ville,
      date_debut,
      date_fin,
      duree: dureeMois,
    }).catch((emailError) => {
      console.error('Erreur lors de l\'envoi de la notification email:', emailError.message);
      // On ne retourne pas d'erreur à l'utilisateur car la réservation a réussi
    });

    res.status(201).json({
      message: "Demande de reservation envoyee au proprietaire.",
      reservation: {
        etudiant_id,
        logement_id: logementId,
        date_debut,
        date_fin,
        duree: dureeMois,
        statut: RESERVATION_STATUS.PENDING
      }
    });
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
    await ensureReservationSchema();

    const { logement_id } = req.params;

    const [occupants] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.tel, el.date_debut, el.date_fin
       FROM etudiant_logement el
       JOIN user u ON el.etudiant_id = u.id
       WHERE el.logement_id = ? AND el.statut = ?`,
      [logement_id, RESERVATION_STATUS.ACCEPTED]
    );

    res.status(200).json(occupants);
  } catch (err) {
    res.status(500).json({ error: "Erreur de récupération des occupants", details: err.message });
  }
};

/**
 * Récupérer les réservations de l'étudiant connecté
 * @route GET /api/reservations/me
 */
export const GetMyReservations = async (req, res) => {
  try {
    await ensureReservationSchema();

    const etudiant_id = req.user?.id;

    const [reservations] = await db.query(
      `SELECT
         el.etudiant_id,
         el.logement_id,
         el.date_debut,
         el.date_fin,
         el.duree,
         el.statut AS reservation_statut,
         el.note_proprietaire,
         l.adress,
         l.ville,
         l.type,
         l.prix,
         l.statut AS logement_statut,
         l.photos,
         u.id AS proprietaire_id,
         u.nom AS proprietaire_nom,
         u.prenom AS proprietaire_prenom,
         u.tel AS proprietaire_tel
       FROM etudiant_logement el
       JOIN logement l ON l.id = el.logement_id
       JOIN proprietaire p ON p.id = l.proprietaire_id
       JOIN user u ON u.id = p.id
       WHERE el.etudiant_id = ?
       ORDER BY el.date_debut DESC, el.logement_id DESC`,
      [etudiant_id]
    );

    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ error: "Erreur de récupération des réservations", details: err.message });
  }
};

/**
 * Annuler une réservation de l'étudiant connecté
 * @route DELETE /api/reservations/:logement_id
 */
export const CancelMyReservation = async (req, res) => {
  try {
    await ensureReservationSchema();

    const etudiant_id = req.user?.id;
    const logement_id = Number(req.params.logement_id);

    if (!Number.isInteger(logement_id) || logement_id <= 0) {
      return res.status(400).json({ error: "logement_id invalide." });
    }

    const [rows] = await db.query(
      `SELECT statut FROM etudiant_logement WHERE etudiant_id = ? AND logement_id = ? LIMIT 1`,
      [etudiant_id, logement_id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Réservation introuvable." });
    }

    const previousStatus = rows[0].statut;

    await db.query(
      `UPDATE etudiant_logement
       SET statut = ?, updated_at = NOW()
       WHERE etudiant_id = ? AND logement_id = ?`,
      [RESERVATION_STATUS.CANCELED, etudiant_id, logement_id]
    );

    if (previousStatus === RESERVATION_STATUS.ACCEPTED) {
      const [remainingAccepted] = await db.query(
        `SELECT COUNT(*) AS total FROM etudiant_logement WHERE logement_id = ? AND statut = ?`,
        [logement_id, RESERVATION_STATUS.ACCEPTED]
      );

      const remainingCount = Number(remainingAccepted[0]?.total || 0);
      if (remainingCount === 0) {
        await db.query(`UPDATE logement SET statut = 'disponible' WHERE id = ?`, [logement_id]);
      }
    }

    res.status(200).json({ message: "Réservation annulée avec succès." });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'annulation", details: err.message });
  }
};

/**
 * Récupérer les demandes reçues pour les logements du propriétaire connecté
 * @route GET /api/reservations/owner/me
 */
export const GetOwnerReservations = async (req, res) => {
  try {
    await ensureReservationSchema();

    const proprietaire_id = req.user?.id;

    const [reservations] = await db.query(
      `SELECT
         el.etudiant_id,
         el.logement_id,
         el.date_debut,
         el.date_fin,
         el.duree,
         el.statut AS reservation_statut,
         el.note_proprietaire,
         el.updated_at,
         l.adress,
         l.ville,
         l.type,
         l.prix,
         l.statut AS logement_statut,
         l.photos,
         u.id AS etudiant_profile_id,
         u.nom AS etudiant_nom,
         u.prenom AS etudiant_prenom,
         u.email AS etudiant_email,
         u.tel AS etudiant_tel
       FROM etudiant_logement el
       JOIN logement l ON l.id = el.logement_id
       JOIN user u ON u.id = el.etudiant_id
       WHERE l.proprietaire_id = ?
       ORDER BY
         CASE el.statut
           WHEN 'en_attente' THEN 1
           WHEN 'acceptee' THEN 2
           WHEN 'refusee' THEN 3
           WHEN 'annulee' THEN 4
           ELSE 5
         END,
         el.date_debut DESC,
         el.logement_id DESC`,
      [proprietaire_id]
    );

    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ error: 'Erreur de recuperation des demandes proprietaire', details: err.message });
  }
};

/**
 * Decision proprietaire: accepter/refuser une demande
 * @route PATCH /api/reservations/:logement_id/etudiant/:etudiant_id/status
 */
export const UpdateReservationStatusByOwner = async (req, res) => {
  await ensureReservationSchema();

  const proprietaire_id = req.user?.id;
  const logement_id = Number(req.params.logement_id);
  const etudiant_id = Number(req.params.etudiant_id);
  const requestedStatus = `${req.body?.statut || ''}`.trim().toLowerCase();
  const note = req.body?.note_proprietaire ? `${req.body.note_proprietaire}`.trim() : null;

  if (!Number.isInteger(logement_id) || logement_id <= 0 || !Number.isInteger(etudiant_id) || etudiant_id <= 0) {
    return res.status(400).json({ error: 'Parametres invalides.' });
  }

  if (!OWNER_ALLOWED_DECISIONS.has(requestedStatus)) {
    return res.status(400).json({ error: "Statut invalide. Valeurs autorisees: acceptee, refusee." });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT
         el.statut AS reservation_statut,
         el.date_debut,
         el.date_fin,
         l.id AS logement_id,
         l.statut AS logement_statut,
         l.proprietaire_id
       FROM etudiant_logement el
       JOIN logement l ON l.id = el.logement_id
       WHERE el.logement_id = ? AND el.etudiant_id = ?
       LIMIT 1`,
      [logement_id, etudiant_id]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Demande de reservation introuvable.' });
    }

    const reservation = rows[0];

    if (Number(reservation.proprietaire_id) !== Number(proprietaire_id)) {
      await connection.rollback();
      return res.status(403).json({ error: "Acces refuse. Cette demande ne vous appartient pas." });
    }

    if (reservation.reservation_statut === RESERVATION_STATUS.CANCELED) {
      await connection.rollback();
      return res.status(409).json({ error: 'Cette demande a deja ete annulee par l etudiant.' });
    }

    if (requestedStatus === RESERVATION_STATUS.ACCEPTED) {
      // Accept this reservation
      await connection.query(
        `UPDATE etudiant_logement
         SET statut = ?, note_proprietaire = ?, updated_at = NOW()
         WHERE logement_id = ? AND etudiant_id = ?`,
        [RESERVATION_STATUS.ACCEPTED, note || null, logement_id, etudiant_id]
      );

      // Auto-refuse OTHER pending reservations that overlap with this period
      await connection.query(
        `UPDATE etudiant_logement
         SET statut = 'refusee',
             note_proprietaire = COALESCE(note_proprietaire, 'Demande non retenue : période déjà attribuée.'),
             updated_at = NOW()
         WHERE logement_id = ?
           AND etudiant_id <> ?
           AND statut = 'en_attente'
           AND date_debut < ? AND date_fin > ?`,
        [logement_id, etudiant_id, reservation.date_fin, reservation.date_debut]
      );
    } else {
      const nextStatus = RESERVATION_STATUS.REJECTED;

      await connection.query(
        `UPDATE etudiant_logement
         SET statut = ?, note_proprietaire = ?, updated_at = NOW()
         WHERE logement_id = ? AND etudiant_id = ?`,
        [nextStatus, note || null, logement_id, etudiant_id]
      );

    }

    await connection.commit();

    return res.status(200).json({
      message: requestedStatus === RESERVATION_STATUS.ACCEPTED
        ? 'Demande acceptee.'
        : 'Demande refusee.',
      logement_id,
      etudiant_id,
      statut: requestedStatus
    });
  } catch (err) {
    await connection.rollback();
    return res.status(500).json({ error: 'Erreur lors de la mise a jour du statut', details: err.message });
  } finally {
    connection.release();
  }
};

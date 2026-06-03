import db from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseJsonField = (value, fallback = []) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeLogement = (logement) => ({
  ...logement,
  latitude: logement.latitude == null ? null : Number(logement.latitude),
  longitude: logement.longitude == null ? null : Number(logement.longitude),
  prix: logement.prix == null ? null : Number(logement.prix),
  nb_places: logement.nb_places == null ? null : Number(logement.nb_places),
  equipemens: parseJsonField(logement.equipemens, []),
  photos: parseJsonField(logement.photos, [])
});

const normalizeText = (value) => `${value || ''}`.trim().toLowerCase();

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const take = (items, count = 10) => items.slice(0, count);

const extractUniversityKeywords = (universite) => {
  const stopWords = new Set(['universite', 'université', 'faculte', 'faculté', 'institut', 'iset', 'ecole', 'école']);
  return normalizeText(universite)
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !stopWords.has(word));
};

const computeUniversityMatchScore = (logement, keywords) => {
  if (!Array.isArray(keywords) || keywords.length === 0) return 0;

  const haystack = normalizeText([
    logement.ville,
    logement.adress,
    logement.description,
    Array.isArray(logement.equipemens) ? logement.equipemens.join(' ') : ''
  ].join(' '));

  return keywords.reduce((score, keyword) => {
    return haystack.includes(keyword) ? score + 1 : score;
  }, 0);
};

/**
 * Ajouter un nouveau logement
 * @route POST /api/logements
 */
export const AddLogement = async (req, res) => {
  try {
    const { adress, ville, latitude, longitude, type, prix, nb_places, equipemens, description, statut, photos } = req.body;
    const proprietaire_id = req.user?.id;

    if (!proprietaire_id || !adress || !ville || !type || prix == null) {
      return res.status(400).json({ error: "Champs requis manquants: adress, ville, type, prix." });
    }

    const latitudeNumber = latitude == null ? null : Number(latitude);
    const longitudeNumber = longitude == null ? null : Number(longitude);
    const prixNumber = Number(prix);
    const nbPlacesNumber = nb_places == null ? null : Number(nb_places);

    if (!Number.isFinite(prixNumber)) {
      return res.status(400).json({ error: "Le champ prix est invalide." });
    }

    if (latitudeNumber != null && !Number.isFinite(latitudeNumber)) {
      return res.status(400).json({ error: "Latitude invalide." });
    }

    if (longitudeNumber != null && !Number.isFinite(longitudeNumber)) {
      return res.status(400).json({ error: "Longitude invalide." });
    }

    // equipemens is JSON type in DB, we should pass it stringified or let mysql driver handle it if supported.
    const equipementsJson = equipemens ? JSON.stringify(equipemens) : JSON.stringify([]);
    const photosJson = photos ? JSON.stringify(photos) : JSON.stringify([]);

    const [result] = await db.query(
      `INSERT INTO logement (proprietaire_id, adress, ville, latitude, longitude, type, prix, nb_places, equipemens, description, statut, photos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [proprietaire_id, adress, ville, latitudeNumber, longitudeNumber, type, prixNumber, nbPlacesNumber, equipementsJson, description || null, statut || 'disponible', photosJson]
    );

    res.status(201).json({ message: "Logement créé avec succès", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la création du logement", details: err.message });
  }
};

/**
 * Récupérer tous les logements (avec filtres optionnels)
 * @route GET /api/logements
 */
export const GetAllLogements = async (req, res) => {
  try {
    let query = "SELECT * FROM logement WHERE 1=1";
    const queryParams = [];
    let studentContext = null;
    let selectedVille = null;
    let selectedUniversite = null;

    // Filtres carte : budget, type, localisation (ville/adresse)
    const { budget_max, budget_min, type, localisation, ville, universite, all_villes, statut, minLat, maxLat, minLng, maxLng } = req.query;
    const showAllVilles = ['1', 'true', 'yes', 'oui'].includes(String(all_villes || '').toLowerCase());

    if (req.user?.role !== 'admin') {
      query += " AND statut = ?";
      queryParams.push('disponible');
    }

    if (req.user?.role === 'etudiant') {
      const [students] = await db.query(
        `SELECT recherche_ville, universite
         FROM etudiant
         WHERE id = ?
         LIMIT 1`,
        [req.user.id]
      );

      studentContext = students[0] || null;
      selectedVille = showAllVilles
        ? null
        : (ville || studentContext?.recherche_ville || '').trim() || null;
      selectedUniversite = (universite || studentContext?.universite || '').trim() || null;

      if (selectedVille) {
        query += " AND ville = ?";
        queryParams.push(selectedVille);
      } else if (!showAllVilles) {
        return res.status(200).json({
          logements: [],
          contexte: {
            filtreVille: null,
            universite: selectedUniversite,
            message: 'Veuillez renseigner votre ville de recherche pour obtenir des logements pertinents.'
          }
        });
      }
    }

    if (budget_max) {
      query += " AND prix <= ?";
      queryParams.push(parseFloat(budget_max));
    }
    if (budget_min) {
      query += " AND prix >= ?";
      queryParams.push(parseFloat(budget_min));
    }
    if (type) {
      query += " AND type = ?";
      queryParams.push(type);
    }
    if (ville && req.user?.role !== 'etudiant') {
      selectedVille = ville;
      query += " AND ville = ?";
      queryParams.push(ville);
    }
    if (localisation) {
      query += " AND adress LIKE ?";
      queryParams.push(`%${localisation}%`);
    }
    if (statut) {
      query += " AND statut = ?";
      queryParams.push(statut);
    }
    if (minLat && maxLat && minLng && maxLng) {
      query += " AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?";
      queryParams.push(Number(minLat), Number(maxLat), Number(minLng), Number(maxLng));
    }

    query += " ORDER BY id DESC";

    const [logements] = await db.query(query, queryParams);

    let normalizedLogements = logements.map(normalizeLogement);

    if (req.user?.role === 'etudiant') {
      const universityKeywords = extractUniversityKeywords(selectedUniversite);
      normalizedLogements = normalizedLogements
        .map((logement) => {
          const universityScore = computeUniversityMatchScore(logement, universityKeywords);
          return {
            ...logement,
            match_universite: universityScore > 0,
            university_score: universityScore
          };
        })
        .sort((a, b) => {
          if (b.university_score !== a.university_score) return b.university_score - a.university_score;
          return a.prix - b.prix;
        });

      return res.status(200).json({
        logements: normalizedLogements,
        contexte: {
          filtreVille: selectedVille,
          universite: selectedUniversite,
          message: showAllVilles
            ? (selectedUniversite
              ? 'Résultats sur toutes les villes, priorisés selon votre université.'
              : 'Résultats sur toutes les villes.')
            : (selectedUniversite
              ? 'Résultats filtrés selon votre ville de recherche et priorisés selon votre université.'
              : 'Résultats filtrés selon votre ville de recherche.')
        }
      });
    }

    res.status(200).json({
      logements: normalizedLogements,
      contexte: {
        filtreVille: selectedVille || null,
        universite: (universite || '').trim() || null,
        message: 'Résultats de recherche.'
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur de récupération des logements", details: err.message });
  }
};

/**
 * Home feed personnalisé pour la page d'accueil
 * @route GET /api/logements/home-feed
 */
export const GetHomeFeed = async (req, res) => {
  try {
    const userId = req.user?.id;

    const [logementsRaw] = await db.query(
      `SELECT l.*, COALESCE(r.rating, 0) AS rating, COALESCE(r.avis_count, 0) AS avis_count
       FROM logement l
       LEFT JOIN (
         SELECT logement_id, AVG(note) AS rating, COUNT(*) AS avis_count
         FROM avis
         GROUP BY logement_id
       ) r ON r.logement_id = l.id
       WHERE l.statut = 'disponible'
       ORDER BY l.id DESC`
    );

    const logements = logementsRaw.map((item) => ({
      ...normalizeLogement(item),
      rating: Number(item.rating || 0),
      avis_count: Number(item.avis_count || 0)
    }));

    const [users] = await db.query(
      `SELECT u.id, u.role, e.universite, e.recherche_ville
       FROM user u
       LEFT JOIN etudiant e ON e.id = u.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    const profile = users[0] || null;
    const studyWilaya = normalizeText(profile?.recherche_ville);
    const universityKeywords = extractUniversityKeywords(profile?.universite);

    const sameWilaya = studyWilaya
      ? logements.filter((item) => normalizeText(item.ville) === studyWilaya)
      : [];

    const nearUniversity = universityKeywords.length > 0
      ? logements.filter((item) => {
        const haystack = `${normalizeText(item.ville)} ${normalizeText(item.adress)}`;
        return universityKeywords.some((keyword) => haystack.includes(keyword));
      })
      : sameWilaya;

    const popular = [...logements].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.avis_count !== a.avis_count) return b.avis_count - a.avis_count;
      return (a.prix || 0) - (b.prix || 0);
    });

    const recommended = uniqueById(
      [...sameWilaya, ...nearUniversity, ...popular, ...logements]
    );

    res.status(200).json({
      recommended: take(recommended, 14),
      nearUniversity: take(uniqueById(nearUniversity), 14),
      sameStudyWilaya: take(uniqueById(sameWilaya), 14),
      popular: take(uniqueById(popular), 14),
      context: {
        role: profile?.role || null,
        universite: profile?.universite || null,
        recherche_ville: profile?.recherche_ville || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur de récupération du feed accueil', details: err.message });
  }
};

/**
 * Récupérer les logements du propriétaire connecté
 * @route GET /api/logements/me
 */
export const GetMyLogements = async (req, res) => {
  try {
    const proprietaireId = req.user?.id;
    if (!proprietaireId) {
      return res.status(401).json({ error: "Non authentifié." });
    }

    const [logements] = await db.query(
      "SELECT * FROM logement WHERE proprietaire_id = ? ORDER BY id DESC",
      [proprietaireId]
    );

    res.status(200).json(logements.map(normalizeLogement));
  } catch (err) {
    res.status(500).json({ error: "Erreur de récupération des logements propriétaire", details: err.message });
  }
};

/**
 * Récupérer un logement par ID
 * @route GET /api/logements/:id
 */
export const GetLogementById = async (req, res) => {
  try {
    const { id } = req.params;
    const [logements] = await db.query("SELECT * FROM logement WHERE id = ?", [id]);

    if (logements.length === 0) {
      return res.status(404).json({ error: "Logement non trouvé." });
    }

    res.status(200).json(normalizeLogement(logements[0]));
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur.", details: err.message });
  }
};

/**
 * Mettre à jour un logement
 * @route PUT /api/logements/:id
 */
export const UpdateLogement = async (req, res) => {
  try {
    const { id } = req.params;
    const proprietaireId = req.user?.id;
    const { adress, ville, latitude, longitude, type, prix, nb_places, equipemens, description, statut, photos } = req.body;

    const [existing] = await db.query("SELECT id, proprietaire_id FROM logement WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Logement non trouvé." });
    }

    if (Number(existing[0].proprietaire_id) !== Number(proprietaireId)) {
      return res.status(403).json({ error: "Accès refusé. Ce logement ne vous appartient pas." });
    }

    // Build dynamic update
    const updates = [];
    const values = [];

    if (adress) { updates.push("adress = ?"); values.push(adress); }
    if (ville) { updates.push("ville = ?"); values.push(ville); }
    if (latitude !== undefined) { updates.push("latitude = ?"); values.push(latitude); }
    if (longitude !== undefined) { updates.push("longitude = ?"); values.push(longitude); }
    if (type) { updates.push("type = ?"); values.push(type); }
    if (prix !== undefined) { updates.push("prix = ?"); values.push(prix); }
    if (nb_places !== undefined) { updates.push("nb_places = ?"); values.push(nb_places); }
    if (equipemens) { updates.push("equipemens = ?"); values.push(JSON.stringify(equipemens)); }
    if (description) { updates.push("description = ?"); values.push(description); }
    if (statut) { updates.push("statut = ?"); values.push(statut); }
    if (photos) { updates.push("photos = ?"); values.push(JSON.stringify(photos)); }

    if (updates.length > 0) {
      values.push(id);
      await db.query(`UPDATE logement SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    res.status(200).json({ message: "Mise à jour réussie." });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur.", details: err.message });
  }
};

/**
 * Supprimer un logement
 * @route DELETE /api/logements/:id
 */
export const DeleteLogement = async (req, res) => {
  try {
    const { id } = req.params;
    const proprietaireId = req.user?.id;

    const [existing] = await db.query("SELECT id, proprietaire_id FROM logement WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Logement non trouvé." });
    }

    if (Number(existing[0].proprietaire_id) !== Number(proprietaireId)) {
      return res.status(403).json({ error: "Accès refusé. Ce logement ne vous appartient pas." });
    }

    const [result] = await db.query("DELETE FROM logement WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Logement non trouvé." });
    }

    res.status(200).json({ message: "Logement supprimé avec succès." });
  } catch (err) {
    res.status(500).json({ error: "Erreur de suppression.", details: err.message });
  }
};

/**
 * Mettre à jour le statut d'un logement (admin)
 * @route PATCH /api/logements/:id/status
 */
export const SetLogementStatusByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const requestedStatus = `${req.body?.statut || ''}`.trim().toLowerCase();
    const allowedStatuses = ['disponible', 'indisponible', 'desactive'];

    if (!allowedStatuses.includes(requestedStatus)) {
      return res.status(400).json({ error: "Statut invalide." });
    }

    const [existing] = await db.query(
      "SELECT id, statut FROM logement WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Logement non trouvé." });
    }

    await db.query(
      "UPDATE logement SET statut = ? WHERE id = ?",
      [requestedStatus, id]
    );

    res.status(200).json({
      message: "Statut du logement mis à jour.",
      logement: {
        id: Number(id),
        statut: requestedStatus
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur de mise à jour du statut.", details: err.message });
  }
};

/**
 * Upload photos for a logement (max 5 total)
 * @route POST /api/logements/:id/photos
 */
export const UploadLogementPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const proprietaireId = req.user?.id;

    const [existing] = await db.query("SELECT id, proprietaire_id, photos FROM logement WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Logement non trouvé." });
    }

    if (Number(existing[0].proprietaire_id) !== Number(proprietaireId)) {
      return res.status(403).json({ error: "Accès refusé. Ce logement ne vous appartient pas." });
    }

    const currentPhotos = parseJsonField(existing[0].photos, []);
    const newFiles = req.files || [];

    if (newFiles.length === 0) {
      return res.status(400).json({ error: "Aucune image envoyée." });
    }

    if (currentPhotos.length + newFiles.length > 5) {
      // Remove uploaded files since we're rejecting
      for (const file of newFiles) {
        fs.unlink(file.path, () => { });
      }
      return res.status(400).json({
        error: `Maximum 5 photos autorisées. Vous en avez déjà ${currentPhotos.length}.`,
      });
    }

    const newUrls = newFiles.map((f) => `/uploads/logements/${f.filename}`);
    const updatedPhotos = [...currentPhotos, ...newUrls];

    await db.query("UPDATE logement SET photos = ? WHERE id = ?", [JSON.stringify(updatedPhotos), id]);

    res.status(200).json({ message: "Photos ajoutées avec succès.", photos: updatedPhotos });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'upload des photos.", details: err.message });
  }
};

/**
 * Delete a single photo from a logement
 * @route DELETE /api/logements/:id/photos
 */
export const DeleteLogementPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    const proprietaireId = req.user?.id;

    if (!url) {
      return res.status(400).json({ error: "L'URL de la photo est requise." });
    }

    const [existing] = await db.query("SELECT id, proprietaire_id, photos FROM logement WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Logement non trouvé." });
    }

    if (Number(existing[0].proprietaire_id) !== Number(proprietaireId)) {
      return res.status(403).json({ error: "Accès refusé. Ce logement ne vous appartient pas." });
    }

    const currentPhotos = parseJsonField(existing[0].photos, []);
    const updatedPhotos = currentPhotos.filter((p) => p !== url);

    await db.query("UPDATE logement SET photos = ? WHERE id = ?", [JSON.stringify(updatedPhotos), id]);

    // Delete file from disk
    const filePath = path.resolve(__dirname, '../../public', url.replace(/^\//, ''));
    fs.unlink(filePath, (err) => {
      if (err) console.warn(`[DeleteLogementPhoto] Could not delete file: ${filePath}`, err.message);
    });

    res.status(200).json({ message: "Photo supprimée.", photos: updatedPhotos });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression de la photo.", details: err.message });
  }
};

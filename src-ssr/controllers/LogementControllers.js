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

    const {
      q,
      budget_max, budget_min,
      type, types,
      localisation, adress,
      ville,
      universite,
      all_villes,
      statut,
      nb_places_min,
      minLat, maxLat, minLng, maxLng
    } = req.query;

    const showAllVilles = ['1', 'true', 'yes', 'oui'].includes(String(all_villes || '').toLowerCase());

    if (req.user?.role !== 'admin') {
      query += " AND statut = ?";
      queryParams.push('disponible');
    }

    // --- Student context ---
    if (req.user?.role === 'etudiant') {
      const [students] = await db.query(
        `SELECT recherche_ville, universite FROM etudiant WHERE id = ? LIMIT 1`,
        [req.user.id]
      );
      studentContext = students[0] || null;
      selectedVille = showAllVilles
        ? null
        : (ville || studentContext?.recherche_ville || '').trim() || null;
      selectedUniversite = (universite || studentContext?.universite || '').trim() || null;

      if (selectedVille && !q) {
        query += " AND ville = ?";
        queryParams.push(selectedVille);
      } else if (!showAllVilles && !q) {
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

    // --- Free-text search: q matches ville, adress, type, description ---
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      query += " AND (ville LIKE ? OR adress LIKE ? OR type LIKE ? OR description LIKE ?)";
      queryParams.push(term, term, term, term);
    }

    // --- Budget ---
    if (budget_max) {
      query += " AND prix <= ?";
      queryParams.push(parseFloat(budget_max));
    }
    if (budget_min) {
      query += " AND prix >= ?";
      queryParams.push(parseFloat(budget_min));
    }

    // --- Type: single value or comma-separated list ---
    const typeList = types
      ? String(types).split(',').map(t => t.trim()).filter(Boolean)
      : type ? [String(type).trim()] : [];
    if (typeList.length === 1) {
      query += " AND type = ?";
      queryParams.push(typeList[0]);
    } else if (typeList.length > 1) {
      query += ` AND type IN (${typeList.map(() => '?').join(',')})`;
      queryParams.push(...typeList);
    }

    // --- Ville (non-etudiant or when q is also set) ---
    if (ville && req.user?.role !== 'etudiant') {
      selectedVille = ville;
      query += " AND ville = ?";
      queryParams.push(ville);
    }

    // --- Address text search ---
    const addrTerm = adress || localisation;
    if (addrTerm) {
      query += " AND adress LIKE ?";
      queryParams.push(`%${addrTerm.trim()}%`);
    }

    // --- Minimum places ---
    if (nb_places_min) {
      query += " AND nb_places >= ?";
      queryParams.push(parseInt(nb_places_min, 10));
    }

    // --- Statut override (admin) ---
    if (statut && req.user?.role === 'admin') {
      query += " AND statut = ?";
      queryParams.push(statut);
    }

    // --- Bounding box ---
    if (minLat && maxLat && minLng && maxLng) {
      query += " AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?";
      queryParams.push(Number(minLat), Number(maxLat), Number(minLng), Number(maxLng));
    }

    // --- Pagination ---
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12; // Default 12 items per page
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const countQuery = query.replace(/ORDER BY id DESC/, '');
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM (${countQuery}) as count_sub`, queryParams);
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    query += " LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    const [logements] = await db.query(query, queryParams);
    let normalizedLogements = logements.map(normalizeLogement);

    // --- University scoring for students ---
    if (req.user?.role === 'etudiant') {
      const universityKeywords = extractUniversityKeywords(selectedUniversite);
      normalizedLogements = normalizedLogements
        .map((logement) => {
          const universityScore = computeUniversityMatchScore(logement, universityKeywords);
          return { ...logement, match_universite: universityScore > 0, university_score: universityScore };
        })
        .sort((a, b) => {
          if (b.university_score !== a.university_score) return b.university_score - a.university_score;
          return a.prix - b.prix;
        });

      const contextMsg = q
        ? `Résultats pour "${q}"${selectedUniversite ? ', priorisés selon votre université.' : '.'}`
        : showAllVilles
          ? (selectedUniversite ? 'Résultats sur toutes les villes, priorisés selon votre université.' : 'Résultats sur toutes les villes.')
          : (selectedUniversite ? 'Résultats filtrés selon votre ville de recherche et priorisés selon votre université.' : 'Résultats filtrés selon votre ville de recherche.');

      return res.status(200).json({
        logements: normalizedLogements,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        contexte: { filtreVille: selectedVille, universite: selectedUniversite, message: contextMsg }
      });
    }

    const contextMsg = q
      ? `Résultats pour "${q.trim()}".`
      : 'Résultats de recherche.';

    res.status(200).json({
      logements: normalizedLogements,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      contexte: {
        filtreVille: selectedVille || null,
        universite: (universite || '').trim() || null,
        message: contextMsg
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur de récupération des logements", details: err.message });
  }
};

const SELECT_LOGEMENT_WITH_STATS = `
  SELECT l.*,
    COALESCE((SELECT AVG(note) FROM avis WHERE logement_id = l.id), 0) AS rating,
    COALESCE((SELECT COUNT(*) FROM avis WHERE logement_id = l.id), 0) AS avis_count
  FROM logement l
  WHERE l.statut = 'disponible'
`;

export const GetHomeFeed = async (req, res) => {

  try {
    const [popularResult, latestResult] = await Promise.all([
      db.query(`${SELECT_LOGEMENT_WITH_STATS} ORDER BY rating DESC, avis_count DESC, l.prix ASC LIMIT 14`),
      db.query(`${SELECT_LOGEMENT_WITH_STATS} ORDER BY l.id DESC LIMIT 14`)
    ]);

    return res.status(200).json({
      popular: popularResult[0].map(normalizeLogement),
      latest: latestResult[0].map(normalizeLogement)
    });

  } catch (err) {
    console.error('Error fetching home feed:', err);
    return res.status(500).json({ error: 'Erreur serveur home feed' });
  }
};

export const GetRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId || isNaN(Number(userId))) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const [users] = await db.query(
      `SELECT
        u.role,
        e.universite as id_universite,
        e.recherche_ville,
        et.id AS etablissement_id,
        et.label_fr AS universite,
        et.lon AS universite_longitude,
        et.lat AS universite_latitude
       FROM user u
       LEFT JOIN etudiant e ON e.id = u.id
       LEFT JOIN etablissement et ON e.universite = et.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    const profile = users[0];
    if (!profile) {
      return res.status(404).json({ error: 'Profil inexistant' });
    }

    const studyWilaya = normalizeText(profile.recherche_ville);

    const promises = {};

    // -----------------------------
    // 1. Same study wilaya
    // -----------------------------
    if (studyWilaya) {
      promises.sameStudyWilaya = db.query(
        `${SELECT_LOGEMENT_WITH_STATS} AND l.ville = ? ORDER BY l.id DESC LIMIT 14`,
        [studyWilaya]
      ).then(([rows]) => rows.map(normalizeLogement));
    }


    // -----------------------------
    // 3. NEW: Nearest logements by distance (REAL GEO)
    // -----------------------------
    if (profile.universite_latitude && profile.universite_longitude) {
      promises.nearUniversityByDistance = db.query(
        `
        SELECT
          l.*,
          (
            ST_Distance_Sphere(
              POINT(l.longitude, l.latitude),
              POINT(?, ?)
            ) / 1000
          ) AS distance_km
        FROM logement l
        WHERE l.latitude IS NOT NULL
          AND l.longitude IS NOT NULL
        ORDER BY distance_km ASC
        LIMIT 5
        `,
        [
          profile.universite_longitude,
          profile.universite_latitude
        ]
      ).then(([rows]) =>
        rows.map(r => ({
          ...normalizeLogement(r),
          distance:
            r.distance_km < 1
              ? `${Math.round(r.distance_km * 1000)} m`
              : `${r.distance_km.toFixed(2)} km`
        }))
      );
    }

    // -----------------------------
    // Resolve all promises
    // -----------------------------
    const keys = Object.keys(promises);
    const resolvedValues = await Promise.all(Object.values(promises));

    const feed = {
      sameStudyWilaya: [],
      nearUniversityByDistance: [],
      ...Object.fromEntries(keys.map((key, i) => [key, resolvedValues[i]]))
    };


    return res.status(200).json({
      sameStudyWilaya: feed.sameStudyWilaya,
      nearUniversityByDistance: feed.nearUniversityByDistance,

      context: {
        role: profile.role || null,
        universite: profile.universite || null,
        recherche_ville: profile.recherche_ville || null
      }
    });

  } catch (err) {
    console.error('Error fetching personalized recommendations:', err);
    return res.status(500).json({
      error: 'Erreur serveur recommandations'
    });
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

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    // Search and filter parameters
    const { q, type, statut, ville, prix_min, prix_max } = req.query;

    // Build dynamic WHERE clause
    const whereClauses = ["proprietaire_id = ?"];
    const values = [proprietaireId];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      whereClauses.push("(adress LIKE ? OR ville LIKE ? OR description LIKE ?)");
      values.push(searchTerm, searchTerm, searchTerm);
    }

    if (type) {
      whereClauses.push("type = ?");
      values.push(type);
    }

    if (statut) {
      whereClauses.push("statut = ?");
      values.push(statut);
    }

    if (ville && ville.trim()) {
      whereClauses.push("ville = ?");
      values.push(ville.trim());
    }

    if (prix_min) {
      whereClauses.push("prix >= ?");
      values.push(parseFloat(prix_min));
    }

    if (prix_max) {
      whereClauses.push("prix <= ?");
      values.push(parseFloat(prix_max));
    }

    const whereClause = whereClauses.join(" AND ");

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM logement WHERE ${whereClause}`,
      values
    );
    const total = countResult[0]?.total || 0;

    // Get paginated results
    const selectQuery = `SELECT * FROM logement WHERE ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const selectValues = [...values, limit, offset];
    const [logements] = await db.query(selectQuery, selectValues);

    res.status(200).json({
      logements: logements.map(normalizeLogement),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + logements.length < total
      },
      filters: {
        q: q || null,
        type: type || null,
        statut: statut || null,
        ville: ville || null,
        prix_min: prix_min || null,
        prix_max: prix_max || null
      }
    });
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

/**
 * Recherche inline de logements par q (adress, ville, type)
 * @route GET /api/logements/search?q=&ville=&type=&adress=
 */
export const SearchLogements = async (req, res) => {
  try {
    const { q = '', ville, type, adress } = req.query;
    const term = q.trim();

    if (!term && !ville && !type && !adress) {
      return res.status(200).json({ logements: [] });
    }

    const conditions = ["statut = 'disponible'"];
    const params = [];

    if (term) {
      conditions.push('(ville LIKE ? OR adress LIKE ? OR type LIKE ?)');
      params.push(`%${term}%`, `%${term}%`, `%${term}%`);
    }
    if (ville) {
      conditions.push('ville LIKE ?');
      params.push(`%${ville.trim()}%`);
    }
    if (type) {
      conditions.push('type LIKE ?');
      params.push(`%${type.trim()}%`);
    }
    if (adress) {
      conditions.push('adress LIKE ?');
      params.push(`%${adress.trim()}%`);
    }

    const sql = `SELECT id, type, ville, adress, prix, photos, statut FROM logement WHERE ${conditions.join(' AND ')} LIMIT 7`;
    const [rows] = await db.query(sql, params);

    const logements = rows.map((l) => ({
      ...l,
      photos: parseJsonField(l.photos, [])
    }));

    return res.status(200).json({ logements });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur de recherche.', details: err.message });
  }
};

/**
 * Récupérer les périodes réservées (acceptées) d'un logement — public
 * @route GET /api/logements/:id/booked-dates
 */
export const GetLogementBookedDates = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT el.date_debut, el.date_fin, u.prenom
       FROM etudiant_logement el
       JOIN user u ON u.id = el.etudiant_id
       WHERE el.logement_id = ? AND el.statut = 'acceptee'
       ORDER BY el.date_debut ASC`,
      [id]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur de récupération des dates réservées', details: err.message });
  }
};

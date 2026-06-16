import db from "../database/db.js";


/**
 * Récupérer tous les établissements (avec support de recherche)
 * @route GET /api/etablissements
 * @query {string} search - Terme de recherche optionnel (recherche dans label_fr, label_ar, etablissement_code)
 */
export const GetAllEtablissements = async (req, res) => {
  try {
    const { search } = req.query;

    let query;
    let params = [];

    if (search && search.trim().length >= 2) {
      // Recherche avec terme - LIVE SEARCH
      const searchTerm = `%${search.trim()}%`;
      query = `
        SELECT * FROM etablissement
        WHERE label_fr LIKE ? OR label_ar LIKE ? OR etablissement_code LIKE ? OR website LIKE ?
        ORDER BY label_fr ASC
        LIMIT 8
      `;
      params = [searchTerm, searchTerm, searchTerm, searchTerm];
    } else {
      // Tous les établissements (sans filtre)
      query = `SELECT * FROM etablissement ORDER BY label_fr ASC`;
    }

    const [etablissements] = await db.query(query, params);
    res.status(200).json(etablissements);
  } catch (err) {
    res.status(500).json({
      error: "Erreur de récupération des établissements",
      details: err.message
    });
  }
};

/**
 * Récupérer un établissement par son ID
 * @route GET /api/admin/etablissements/:id
 */
export const GetEtablissementById = async (req, res) => {
  try {
    const { id } = req.params;
    const [etablissement] = await db.query(
      `SELECT * FROM etablissement WHERE id = ?`,
      [id]
    );

    if (etablissement.length === 0) {
      return res.status(404).json({ error: "Établissement non trouvé" });
    }

    res.status(200).json(etablissement[0]);
  } catch (err) {
    res.status(500).json({
      error: "Erreur de récupération de l'établissement",
      details: err.message
    });
  }
};

/**
 * Ajouter un nouvel établissement
 * @route POST /api/admin/etablissements
 */
export const AddEtablissement = async (req, res) => {
  try {
    const {
      etablissement_code,
      university_code,
      label_ar,
      label_fr,
      website,
      gouvernorat,
      type,
      lat,
      lon
    } = req.body;

    // Vérification des champs obligatoires
    if (!etablissement_code || !university_code || !label_ar || !label_fr || !gouvernorat || !type) {
      return res.status(400).json({
        error: "Champs requis manquants: etablissement_code, university_code, label_ar, label_fr, gouvernorat, type"
      });
    }

    // Vérifier si le code établissement existe déjà
    const [existing] = await db.query(
      `SELECT id FROM etablissement WHERE etablissement_code = ?`,
      [etablissement_code]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: "Un établissement avec ce code existe déjà"
      });
    }

    const [result] = await db.query(
      `INSERT INTO etablissement
      (etablissement_code, university_code, label_ar, label_fr, website, gouvernorat, type, lat, lon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        etablissement_code,
        university_code,
        label_ar,
        label_fr,
        website || null,
        gouvernorat,
        type,
        lat || null,
        lon || null
      ]
    );

    res.status(201).json({
      message: "Établissement ajouté avec succès",
      etablissement_id: result.insertId
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de l'ajout de l'établissement",
      details: err.message
    });
  }
};

/**
 * Mettre à jour un établissement
 * @route PUT /api/admin/etablissements/:id
 */
export const UpdateEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      etablissement_code,
      university_code,
      label_ar,
      label_fr,
      website,
      gouvernorat,
      type,
      lat,
      lon
    } = req.body;

    // Vérifier si l'établissement existe
    const [existing] = await db.query(
      `SELECT id FROM etablissement WHERE id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Établissement non trouvé" });
    }

    // Vérifier si le nouveau code existe déjà (sauf si c'est le même)
    if (etablissement_code) {
      const [codeExists] = await db.query(
        `SELECT id FROM etablissement WHERE etablissement_code = ? AND id != ?`,
        [etablissement_code, id]
      );

      if (codeExists.length > 0) {
        return res.status(409).json({
          error: "Un établissement avec ce code existe déjà"
        });
      }
    }

    await db.query(
      `UPDATE etablissement SET
        etablissement_code = COALESCE(?, etablissement_code),
        university_code = COALESCE(?, university_code),
        label_ar = COALESCE(?, label_ar),
        label_fr = COALESCE(?, label_fr),
        website = COALESCE(?, website),
        gouvernorat = COALESCE(?, gouvernorat),
        type = COALESCE(?, type),
        lat = COALESCE(?, lat),
        lon = COALESCE(?, lon)
      WHERE id = ?`,
      [
        etablissement_code,
        university_code,
        label_ar,
        label_fr,
        website,
        gouvernorat,
        type,
        lat,
        lon,
        id
      ]
    );

    res.status(200).json({
      message: "Établissement mis à jour avec succès",
      etablissement_id: id
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de la mise à jour de l'établissement",
      details: err.message
    });
  }
};

/**
 * Supprimer un établissement
 * @route DELETE /api/admin/etablissements/:id
 */
export const DeleteEtablissement = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'établissement existe
    const [existing] = await db.query(
      `SELECT id FROM etablissement WHERE id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Établissement non trouvé" });
    }

    await db.query(`DELETE FROM etablissement WHERE id = ?`, [id]);

    res.status(200).json({
      message: "Établissement supprimé avec succès",
      etablissement_id: id
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de la suppression de l'établissement",
      details: err.message
    });
  }
};

/**
 * Importer des établissements depuis un fichier JSON
 * @route POST /api/admin/etablissements/import
 */
export const ImportEtablissements = async (req, res) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const etablissements = req.body;

    // Vérifier que les données sont un tableau
    if (!Array.isArray(etablissements)) {
      return res.status(400).json({
        error: "Les données doivent être un tableau d'établissements"
      });
    }

    if (etablissements.length === 0) {
      return res.status(400).json({
        error: "Le tableau d'établissements est vide"
      });
    }

    let importedCount = 0;
    let skippedCount = 0;
    let errors = [];

    for (const etablissement of etablissements) {
      try {
        const {
          etablissement_code,
          university_code,
          label_ar,
          label_fr,
          website,
          gouvernorat,
          type,
          lat,
          lon
        } = etablissement;

        // Vérifier les champs obligatoires
        if (!etablissement_code || !university_code || !label_ar || !label_fr || !gouvernorat || !type) {
          errors.push({
            etablissement_code,
            error: "Champs requis manquants"
          });
          skippedCount++;
          continue;
        }

        // Vérifier si le code existe déjà
        const [existing] = await connection.query(
          `SELECT id FROM etablissement WHERE etablissement_code = ?`,
          [etablissement_code]
        );

        if (existing.length > 0) {
          errors.push({
            etablissement_code,
            label_fr,
            error: "Code déjà existant"
          });
          skippedCount++;
          continue;
        }

        // Insérer l'établissement
        await connection.query(
          `INSERT INTO etablissement
          (etablissement_code, university_code, label_ar, label_fr, website, gouvernorat, type, lat, lon)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            etablissement_code,
            university_code,
            label_ar,
            label_fr,
            website || null,
            gouvernorat,
            type,
            lat || null,
            lon || null
          ]
        );

        importedCount++;
      } catch (err) {
        errors.push({
          etablissement_code: etablissement.etablissement_code,
          error: err.message
        });
        skippedCount++;
      }
    }

    await connection.commit();

    res.status(200).json({
      message: "Import terminé",
      summary: {
        total: etablissements.length,
        imported: importedCount,
        skipped: skippedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: "Erreur lors de l'import des établissements",
      details: err.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Exporter tous les établissements en JSON
 * @route GET /api/admin/etablissements/export
 */
export const ExportEtablissements = async (req, res) => {
  try {
    const [etablissements] = await db.query(
      `SELECT * FROM etablissement ORDER BY etablissement_code ASC`
    );

    res.status(200).json(etablissements);
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de l'export des établissements",
      details: err.message
    });
  }
};
/**
 * Importer des logements depuis un fichier JSON
 * @route POST /api/admin/logements/import
 */
export const ImportLogements = async (req, res) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const logements = req.body;
    const proprietaire_id = req.user?.id;

    // Vérifier que les données sont un tableau
    if (!Array.isArray(logements)) {
      return res.status(400).json({
        error: "Les données doivent être un tableau de logements"
      });
    }

    if (logements.length === 0) {
      return res.status(400).json({
        error: "Le tableau de logements est vide"
      });
    }

    let importedCount = 0;
    let skippedCount = 0;
    let errors = [];

    for (const logement of logements) {
      try {
        const {
          adress,
          ville,
          latitude,
          longitude,
          type,
          prix,
          nb_places,
          equipemens,
          description,
          statut,
          photos
        } = logement;

        // Vérifier les champs obligatoires
        if (!adress || !ville || !type || prix == null) {
          errors.push({
            adress,
            ville,
            error: "Champs requis manquants: adress, ville, type, prix"
          });
          skippedCount++;
          continue;
        }

        // Insérer le logement
        const equipementsJson = equipemens ? JSON.stringify(equipemens) : JSON.stringify([]);
        const photosJson = photos ? JSON.stringify(photos) : JSON.stringify([]);
        const statutValue = statut || 'actif';

        await connection.query(
          `INSERT INTO logement
          (proprietaire_id, adress, ville, latitude, longitude, type, prix, nb_places, equipemens, description, statut, photos)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            proprietaire_id || null,
            adress,
            ville,
            latitude || null,
            longitude || null,
            type,
            Number(prix),
            nb_places || null,
            equipementsJson,
            description || null,
            statutValue,
            photosJson
          ]
        );

        importedCount++;
      } catch (err) {
        errors.push({
          adress: logement.adress,
          ville: logement.ville,
          error: err.message
        });
        skippedCount++;
      }
    }

    await connection.commit();

    res.status(200).json({
      message: "Import des logements terminé",
      summary: {
        total: logements.length,
        imported: importedCount,
        skipped: skippedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({
      error: "Erreur lors de l'import des logements",
      details: err.message
    });
  } finally {
    connection.release();
  }
};

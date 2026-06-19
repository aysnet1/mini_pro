import { normalizeLogement } from "@/services";
import db from "../database/db";




const normalizeText = (value) => `${value || ''}`.trim().toLowerCase();


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

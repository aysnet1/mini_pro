import db from "../database/db";

const parseJsonField = (value, fallback = []) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
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

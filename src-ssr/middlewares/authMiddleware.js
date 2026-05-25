import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    // Priorité au header Authorization: Bearer <token>, avec fallback cookie.
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const token = bearerToken || req.cookies?.auth_token;

    //si le client n'envoi pas le token (ceci veux dire que auth_token est vide) alors on envoi "Non authentifié"
    if (!token) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    //on vérifie si le token est valide ou non
    const validUser = jwt.verify(token, "SECRET_KEY");

    req.user = validUser;

    next(); // Passe au contrôleur suivant si l’authentification est valide
  } catch {
    return res.status(401).json({
      error: "Token invalide ou expiré",
    });
  }
};

export default authMiddleware;

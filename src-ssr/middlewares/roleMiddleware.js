export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: "Accès refusé. Vous devez être administrateur." });
  }
};

export const isEtudiant = (req, res, next) => {
  if (req.user && req.user.role === 'etudiant') {
    next();
  } else {
    return res.status(403).json({ error: "Accès refusé. Vous devez être étudiant." });
  }
};

export const isProprietaire = (req, res, next) => {
  if (req.user && req.user.role === 'proprietaire') {
    next();
  } else {
    return res.status(403).json({ error: "Accès refusé. Vous devez être propriétaire." });
  }
};

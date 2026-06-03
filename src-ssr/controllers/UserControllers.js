import mysql from "../database/db.js";
import jwt from "jsonwebtoken";
import { genSalt, hash, compare } from 'bcrypt';

/**
 * Contrôleur pour ajouter un nouvel utilisateur.
 * @route POST /

 */
const AddUser = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      password,
      mot_de_passe,
      tel,
      telephone,
      role,
      photo_profil,
      budget,
      habitudes,
      universite,
      recherche_ville,
      adress,
      type
    } = req.body;

    const plainPassword = password || mot_de_passe;
    const userPhone = tel ?? telephone ?? null;

    // Vérification des champs obligatoires
    if (!nom || !prenom || !email || !plainPassword || !role) {
      return res.status(400).json({
        error: "Champs requis manquants.",
      });
    }

    // Validation des rôles autorisés
    if (!["etudiant", "proprietaire", "admin"].includes(role)) {
      return res.status(400).json({
        error: "Rôle invalide.",
      });
    }

    //gérer un mot de passe (HashPwd) sécurisé
    const salt = await genSalt(10);
    const HashPwd = await hash(plainPassword, salt);

    const connection = await mysql.getConnection();
    await connection.beginTransaction();

    try {
      const [userResult] = await connection.query(
        `INSERT INTO user
        (nom, prenom, email, password, tel, role, photo_profil)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nom,
          prenom,
          email,
          HashPwd,
          userPhone,
          role,
          photo_profil || null
        ]
      );

      const userId = userResult.insertId;

      if (role === "etudiant") {
        await connection.query(
          `INSERT INTO etudiant (id, budget, habitudes, universite, recherche_ville)
          VALUES (?, ?, ?, ?, ?)`,
          [userId, budget || null, habitudes || null, universite || null, recherche_ville || null]
        );
      } else if (role === "proprietaire") {
        await connection.query(
          `INSERT INTO proprietaire (id, adress, type)
          VALUES (?, ?, ?)`,
          [userId, adress || null, type || null]
        );
      }

      await connection.commit();

      res.status(201).json({
        message: "Utilisateur créé avec succès.",
        user: {
          id: userId,
          nom,
          prenom,
          email,
          role
        }
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (err) {

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "champs déjà utilisée.",
      });
    }

    res.status(500).json({
      error: "Erreur lors de la création.",
      details: err.message,
    });
  }
};


/**
 * Contrôleur pour récupérer tous les utilisateurs.
 * @route GET /users

 */
const GetAllUser = async (req, res) => {
  try {

    const [users] = await mysql.query(
      `SELECT
        id,
        nom,
        prenom,
        email,
        tel,
        role,
        photo_profil
      FROM user`
    );

    res.status(200).json(users);

  } catch (err) {

    res.status(500).json({
      error: "Erreur récupération utilisateurs.",
      details: err.message,
    });
  }
};


/**
 * Contrôleur pour récupérer un utilisateur par son identifiant.
 * @route GET /:id

 */
const GetUser = async (req, res) => {
  try {

    const { id } = req.params;

    const [users] = await mysql.query(
      `SELECT
        u.id,
        u.nom,
        u.prenom,
        u.email,
        u.tel,
        u.role,
        u.photo_profil,
        e.budget,
        e.habitudes,
        e.universite,
        e.recherche_ville,
        p.adress,
        p.type
      FROM user u
      LEFT JOIN etudiant e ON u.id = e.id
      LEFT JOIN proprietaire p ON u.id = p.id
      WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé.",
      });
    }

    res.status(200).json(users[0]);

  } catch (err) {

    res.status(500).json({
      error: "Erreur serveur.",
      details: err.message,
    });
  }
};


/**
 * Contrôleur pour modifier un utilisateur par son identifiant.
 * @route PUT /:id

 */
const UpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom, prenom, email, tel, photo_profil,
      password, mot_de_passe,
      budget, habitudes, universite, recherche_ville,
      adress, type
    } = req.body;

    const [existing] = await mysql.query(
      "SELECT id, role FROM user WHERE id = ?",
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const userRole = existing[0].role;

    // Démarrer une transaction
    const connection = await mysql.getConnection();
    await connection.beginTransaction();

    try {
      // Mettre à jour la table de base `user`
      const userUpdates = {};
      if (nom !== undefined) userUpdates.nom = nom;
      if (prenom !== undefined) userUpdates.prenom = prenom;
      if (email !== undefined) userUpdates.email = email;
      if (tel !== undefined) userUpdates.tel = tel;
      if (photo_profil !== undefined) userUpdates.photo_profil = photo_profil;

      const nextPassword = password || mot_de_passe;
      if (nextPassword) {
        const salt = await genSalt(10);
        userUpdates.password = await hash(nextPassword, salt);
      }

      if (Object.keys(userUpdates).length > 0) {
        await connection.query("UPDATE user SET ? WHERE id = ?", [userUpdates, id]);
      }

      // Mettre à jour les tables spécifiques
      if (userRole === "etudiant") {
        const studentUpdates = {};
        if (budget !== undefined) studentUpdates.budget = budget;
        if (habitudes !== undefined) studentUpdates.habitudes = habitudes;
        if (universite !== undefined) studentUpdates.universite = universite;
        if (recherche_ville !== undefined) studentUpdates.recherche_ville = recherche_ville;

        if (Object.keys(studentUpdates).length > 0) {
          const [studentExist] = await connection.query("SELECT id FROM etudiant WHERE id = ?", [id]);
          if (studentExist.length > 0) {
            await connection.query("UPDATE etudiant SET ? WHERE id = ?", [studentUpdates, id]);
          } else {
            await connection.query("INSERT INTO etudiant SET ?", [{ id, ...studentUpdates }]);
          }
        }
      } else if (userRole === "proprietaire") {
        const ownerUpdates = {};
        if (adress !== undefined) ownerUpdates.adress = adress;
        if (type !== undefined) ownerUpdates.type = type;

        if (Object.keys(ownerUpdates).length > 0) {
          const [ownerExist] = await connection.query("SELECT id FROM proprietaire WHERE id = ?", [id]);
          if (ownerExist.length > 0) {
            await connection.query("UPDATE proprietaire SET ? WHERE id = ?", [ownerUpdates, id]);
          } else {
            await connection.query("INSERT INTO proprietaire SET ?", [{ id, ...ownerUpdates }]);
          }
        }
      }

      await connection.commit();
      res.status(200).json({ message: "Mise à jour réussie." });

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (err) {
    res.status(500).json({
      error: "Erreur serveur.",
      details: err.message,
    });
  }
};

/**
 * Contrôleur pour supprimer un utilisateur par son identifiant.
 * @route DELETE /:id

 */
const DeleteUser = async (req, res) => {
  try {

    const { id } = req.params;

    const [result] = await mysql.query(
      "DELETE FROM user WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé.",
      });
    }

    res.status(200).json({
      message: "Utilisateur supprimé avec succès.",
    });

  } catch (err) {

    res.status(500).json({
      error: "Erreur suppression.",
      details: err.message,
    });
  }
};

/**
 * Contrôleur de connexion utilisateur (signin).
 * @route POST /signin

 */

const SigninUser = async (req, res) => {
  try {
    //récuperer l email et le mot de passe à partir du request body
    const { email, mot_de_passe } = req.body;

    //test si les champs sont vides
    if (!email || !mot_de_passe) {
      return res.status(400).json({
        error: "Email et mot de passe requis.",
      });
    }
    //faite une recherche sur l'email, s'il exist !
    const [users] = await mysql.query(
      "SELECT * FROM user WHERE email = ?",
      [email]
    );

    //tester si l email n existe pas alors on retourne une response (res) "Utilisateur introuvable."
    if (!users.length) {
      return res.status(404).json({
        error: "Utilisateur introuvable.",
      });
    }

    // à cet emplacement l'utilisateur (user) existe dans la BD avec le bon mail
    const user = users[0];

    // Comparer le mot de passe passer dans le request est égale à celui récupérer dans la variable user
    const result = await compare(
      mot_de_passe,
      user.password
    );

    //si le résutat (result) est faux alors afficher Mot de passe incorrect
    if (!result) {
      return res.status(401).json({
        error: "Mot de passe incorrect.",
      });
    }

    // a ce stade l email et le mot de passe recu sont valide
    // le client recoit alors un message avec un clé JWT ou token JWT

    // On commence par générer le token JWT avec la fonction sign
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      "SECRET_KEY", // à récupérer à partir du .env
      { expiresIn: "1d" } // ce token expire dans 1 jour (1d)
    );

    res.status(200)
      .cookie('auth_token', token, {
        maxAge: 24 * 60 * 60 * 1000, // Valable 1 jour
        sameSite: "strict",    //  protection CSRF
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // true en production
      })
      .json({
        message: "Connexion réussie.",
        token,
        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
        },
      });

  } catch (err) {
    res.status(500).json({
      error: "Erreur serveur.",
      details: err.message,
    });
  }
};

/**
 * Contrôleur pour inscrire un utilisateur (Register).
 * @route POST /register

 */
const RegisterUser = async (req, res) => {
  try {
    // Les champs selon le nouveau schéma: nom, prenom, email, tel, password, role, et champs spécifiques selon le rôle
    const { nom, prenom, email, tel, password, role, photo_profil, budget, habitudes, universite, recherche_ville, adress, type } = req.body;

    // Vérification des champs obligatoires
    if (!nom || !prenom || !email || !password || !role) {
      return res.status(400).json({
        error: "Champs requis manquants.",
      });
    }

    // Validation du rôle
    if (!["etudiant", "proprietaire", "admin"].includes(role)) {
      return res.status(400).json({ error: "Rôle invalide." });
    }

    // Hachage du mot de passe
    const salt = await genSalt(10);
    const HashPwd = await hash(password, salt);

    // Démarrer une transaction pour garantir que les deux insertions réussissent
    const connection = await mysql.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Insertion dans la table `user`
      const [userResult] = await connection.query(
        `INSERT INTO user (nom, prenom, email, tel, password, role, photo_profil) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nom, prenom, email, tel || null, HashPwd, role, photo_profil || null]
      );

      const userId = userResult.insertId;

      // 2. Insertion dans la table spécifique au rôle
      if (role === 'etudiant') {
        await connection.query(
          `INSERT INTO etudiant (id, budget, habitudes, universite, recherche_ville) VALUES (?, ?, ?, ?, ?)`,
          [userId, budget || null, habitudes || null, universite || null, recherche_ville || null]
        );
      } else if (role === 'proprietaire') {
        await connection.query(
          `INSERT INTO proprietaire (id, adress, type) VALUES (?, ?, ?)`,
          [userId, adress || null, type || null]
        );
      } else if (role === 'admin') {
        //       await connection.rollback();
        //   return res.status(403).json({ error: "Inscription d'admin non autorisée." });
        await connection.query(
          `INSERT INTO admin (id, permissions) VALUES (?, ?)`,
          [userId, JSON.stringify(["all"])] // Exemple de permissions par défaut
        );
      }

      await connection.commit();

      // Auto-login: generate JWT token just like signin
      const token = jwt.sign(
        {
          id: userId,
          email: email,
          role: role,
        },
        "SECRET_KEY",
        { expiresIn: "1d" }
      );

      res.status(201)
        .cookie('auth_token', token, {
          maxAge: 24 * 60 * 60 * 1000, // Valable 1 jour
          sameSite: "strict",
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        })
        .json({
          message: "Inscription réussie.",
          token,
          user: {
            id: userId,
            nom,
            prenom,
            email,
            role,
          }
        });
    } catch (err) {
      await connection.rollback();
      throw err; // Renvoyer au catch principal
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Register error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Cet email est déjà utilisé.",
      });
    }
    res.status(500).json({
      error: "Erreur lors de l'inscription.",
      details: err.message,
    });
  }
};

/**
 * Statistiques globales pour le dashboard admin.
 * @route GET /admin/stats
 * @access Admin
 */
const GetAdminStats = async (req, res) => {
  try {
    const [[usersCount]] = await mysql.query(
      'SELECT COUNT(*) AS total_users FROM user'
    );

    const [[adminsCount]] = await mysql.query(
      "SELECT COUNT(*) AS total_admins FROM user WHERE role = 'admin'"
    );

    const [[ownersCount]] = await mysql.query(
      "SELECT COUNT(*) AS total_owners FROM user WHERE role = 'proprietaire'"
    );

    const [[studentsCount]] = await mysql.query(
      "SELECT COUNT(*) AS total_students FROM user WHERE role = 'etudiant'"
    );

    const [[logementsCount]] = await mysql.query(
      'SELECT COUNT(*) AS total_logements FROM logement'
    );

    const [[activeLogementsCount]] = await mysql.query(
      "SELECT COUNT(*) AS total_active_logements FROM logement WHERE statut <> 'desactive' OR statut IS NULL"
    );

    const [[disabledLogementsCount]] = await mysql.query(
      "SELECT COUNT(*) AS total_disabled_logements FROM logement WHERE statut = 'desactive'"
    );

    res.status(200).json({
      users: {
        total: Number(usersCount.total_users || 0),
        admins: Number(adminsCount.total_admins || 0),
        proprietaires: Number(ownersCount.total_owners || 0),
        etudiants: Number(studentsCount.total_students || 0)
      },
      logements: {
        total: Number(logementsCount.total_logements || 0),
        actifs: Number(activeLogementsCount.total_active_logements || 0),
        desactives: Number(disabledLogementsCount.total_disabled_logements || 0)
      }
    });
  } catch (err) {
    res.status(500).json({
      error: 'Erreur de récupération des statistiques admin.',
      details: err.message,
    });
  }
};

const LogoutUser = (req, res) => {
  res.clearCookie('auth_token', {
    sameSite: "strict",
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  res.status(200).json({ message: "Déconnexion réussie." });
};

export {
  AddUser,
  GetAllUser,
  GetUser,
  UpdateUser,
  DeleteUser,
  GetAdminStats,
  SigninUser,
  RegisterUser,
  LogoutUser
};

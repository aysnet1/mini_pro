# ⚡ Configuration Rapide - Notifications Email

## 🚀 Installation (5 minutes)

### 1. Installer Nodemailer

```bash
pnpm add nodemailer
```

### 2. Configurer Gmail (Recommandé)

**Étape 1:** Activer la validation en deux étapes

- https://myaccount.google.com/security
- Activer "Validation en deux étapes"

**Étape 2:** Générer un mot de passe d'application

- https://myaccount.google.com/apppasswords
- Choisir "Messagerie" → Votre appareil
- Copier le mot de passe (16 caractères)

**Étape 3:** Créer le fichier `.env`

```env
# Copiez ceci dans .env à la racine
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  # Mot de passe d'application
SMTP_FROM_EMAIL=noreply@takelog.com
SMTP_FROM_NAME=TakeLog Notifications
```

### 3. Tester

```bash
node src-ssr/services/testEmail.js
```

## ✅ C'est tout!

Maintenant, quand un étudiant réserve un logement:

1. ✅ La réservation est créée
2. ✅ Le propriétaire reçoit automatiquement un email
3. ✅ L'email contient tous les détails (étudiant, logement, dates)

## 📧 Exemple d'email reçu

Le propriétaire reçoit un email avec:

- 👤 **Informations étudiant:** Nom, prénom, email, téléphone
- 🏠 **Détails logement:** Adresse, ville
- 📅 **Période:** Dates de début/fin, durée en mois
- 🔔 **Action requise:** Bouton pour accepter/refuser

## 🔧 Problèmes?

**Email ne s'envoie pas?**

```bash
# Vérifiez la configuration
node src-ssr/services/testEmail.js

# Consultez les logs du serveur
```

**Erreur "Invalid login"?**

- Utilisez un mot de passe d'application (pas votre mot de passe normal)
- Vérifiez que la validation en deux étapes est activée

**Erreur de connexion?**

- Vérifiez `SMTP_HOST` et `SMTP_PORT`
- Testez: `telnet smtp.gmail.com 587`

## 📚 Documentation complète

Voir `src-ssr/docs/EMAIL_NOTIFICATIONS.md` pour:

- Configuration détaillée
- Autres fournisseurs SMTP (Outlook, Yahoo, etc.)
- Personnalisation du template
- Dépannage avancé

## 🎯 Prochaines étapes

1. ✅ Configurer SMTP dans `.env`
2. ✅ Tester avec `testEmail.js`
3. ✅ Faire une réservation test
4. ✅ Vérifier l'email reçu par le propriétaire

---

**Besoin d'aide?** Consultez la documentation complète ou vérifiez les logs du serveur.

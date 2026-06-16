# 📧 Système de Notification Email - TakeLog

## Vue d'ensemble

Le système de notification email envoie automatiquement un email au propriétaire lorsqu'un étudiant réserve son logement. Cette fonctionnalité utilise **Nodemailer** pour l'envoi d'emails via SMTP.

## 🏗️ Architecture

```
┌─────────────────┐
│   Étudiant      │
│  Réserve un     │
│    logement     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ReservationControllers.js          │
│  - Crée la réservation en BDD       │
│  - Récupère infos propriétaire      │
│  - Récupère infos étudiant          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  emailService.js                    │
│  - sendReservationNotification()    │
│  - Génère email HTML/text           │
│  - Envoie via SMTP                  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Serveur SMTP  │
│  (Gmail, etc.)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Propriétaire  │
│  Reçoit l'email │
│   de notification│
└─────────────────┘
```

## ⚙️ Configuration

### 1. Installation des dépendances

```bash
pnpm add nodemailer
```

### 2. Configuration SMTP

Créez ou mettez à jour votre fichier `.env` à la racine du projet:

```env
# Configuration SMTP pour les notifications email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_application
SMTP_FROM_EMAIL=noreply@takelog.com
SMTP_FROM_NAME=TakeLog Notifications
```

### 3. Configuration pour Gmail

Pour utiliser Gmail comme serveur SMTP:

1. **Activez la validation en deux étapes:**
   - Allez sur https://myaccount.google.com/security
   - Activez la "Validation en deux étapes"

2. **Générez un mot de passe d'application:**
   - Allez sur https://myaccount.google.com/apppasswords
   - Sélectionnez "Messagerie" et votre appareil
   - Copiez le mot de passe généré (16 caractères)
   - Utilisez-le dans `SMTP_PASSWORD`

### 4. Autres fournisseurs SMTP

**Outlook/Hotmail:**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Yahoo Mail:**

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465
SMTP_SECURE=true
```

**SMTP personnalisé (ex: OVH, Ionos, etc.):**

```env
SMTP_HOST=smtp.votre-fournisseur.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@domaine.com
SMTP_PASSWORD=votre_mot_de_passe
```

## 🧪 Tester le service email

### Test de connexion SMTP

```bash
node src-ssr/services/testEmail.js
```

Ce script teste:

- La connexion au serveur SMTP
- L'envoi d'un email de test (à configurer dans le script)

### Test manuel dans le code

```javascript
import { sendReservationNotification } from './src-ssr/services/emailService.js'

sendReservationNotification({
  proprietaireEmail: 'proprietaire@example.com',
  proprietaireNom: 'Dupont',
  etudiantNom: 'Ben Ali',
  etudiantPrenom: 'Mohamed',
  etudiantEmail: 'mohamed@etudiant.tn',
  etudiantTel: '+216 12 345 678',
  logementAdresse: '15 Avenue Habib Bourguiba',
  logementVille: 'Tunis',
  dateDebut: '2026-09-01',
  dateFin: '2027-06-30',
  duree: 10,
})
  .then((result) => console.log('Email envoyé:', result.messageId))
  .catch((error) => console.error('Erreur:', error.message))
```

## 📝 Fonctionnement

### Quand un étudiant réserve un logement

1. **Vérification des données**
   - Validation des champs requis
   - Vérification de la disponibilité du logement
   - Contrôle des doublons

2. **Enregistrement en base de données**
   - Insertion dans `etudiant_logement`
   - Statut: `en_attente`

3. **Récupération des informations**
   - Propriétaire: nom, prénom, email, téléphone
   - Étudiant: nom, prénom, email, téléphone
   - Logement: adresse, ville

4. **Envoi de l'email**
   - Génération du contenu HTML et texte
   - Envoi asynchrone (ne bloque pas la réponse API)
   - Log des erreurs (n'affecte pas la réservation)

### Contenu de l'email

L'email envoyé au propriétaire contient:

- **En-tête:** Logo et titre TakeLog
- **Message d'introduction:** Notification de nouvelle réservation
- **Section étudiant:** Nom, prénom, email, téléphone
- **Section logement:** Adresse complète
- **Section période:** Dates de début/fin, durée
- **Call-to-action:** Bouton vers l'espace propriétaire
- **Pied de page:** Informations légales

## 🔧 Dépannage

### L'email ne s'envoie pas

**Vérifiez les logs:**

```bash
# Les erreurs sont journalisées dans la console du serveur
```

**Points à vérifier:**

1. Variables d'environnement correctement définies
2. Mot de passe d'application (pour Gmail)
3. Port SMTP correct (587 pour TLS, 465 pour SSL)
4. Firewall ne bloque pas le port SMTP

### Erreur: "Invalid login"

- Vérifiez `SMTP_USER` et `SMTP_PASSWORD`
- Pour Gmail, utilisez un mot de passe d'application, pas votre mot de passe normal
- Vérifiez que la validation en deux étapes est activée (Gmail)

### Erreur: "Connection timeout"

- Vérifiez `SMTP_HOST` et `SMTP_PORT`
- Testez la connexion avec telnet:
  ```bash
  telnet smtp.gmail.com 587
  ```
- Vérifiez votre connexion internet

### Les emails arrivent en spam

- Configurez correctement `SMTP_FROM_EMAIL` et `SMTP_FROM_NAME`
- Utilisez un domaine vérifié
- Évitez le contenu trop commercial
- Ajoutez un en-tête SPF/DKIM à votre domaine

## 📊 Flux de données

```
Étudiant → POST /api/reservations
    ↓
ReservationControllers.ReserveLogement()
    ↓
1. Validation des données
2. Vérification disponibilité
3. Récupération infos propriétaire
4. Récupération infos étudiant
5. INSERT INTO etudiant_logement
6. sendReservationNotification() [async]
    ↓
emailService.sendReservationNotification()
    ↓
1. Création du transporteur SMTP
2. Génération contenu HTML/text
3. Envoi via nodemailer
4. Log succès/erreur
    ↓
Réponse HTTP 201 à l'étudiant
```

## 🔒 Sécurité

- **Email envoyé en arrière-plan:** L'échec d'envoi n'affecte pas la réservation
- **Données sensibles:** Les mots de passe SMTP sont dans `.env` (non versionné)
- **Validation:** Toutes les données sont validées avant envoi
- **Logs:** Les erreurs sont journalisées sans exposer de données sensibles

## 🎨 Personnalisation

### Modifier le template d'email

Éditez `src-ssr/services/emailService.js`:

- **Style CSS:** Modifiez la section `<style>` dans `htmlContent`
- **Couleurs:** Changez les codes hexadécimaux (ex: `#667eea`)
- **Contenu:** Modifiez le texte dans les sections HTML
- **Logo:** Ajoutez une balise `<img>` avec l'URL de votre logo

### Ajouter d'autres notifications

Le service peut être étendu pour:

- Notification d'acceptation/refus à l'étudiant
- Rappel avant échéance
- Notification de nouveaux messages
- Récapitulatif mensuel

Exemple:

```javascript
// Dans emailService.js
export const sendAcceptanceNotification = async (options) => {
  // Implémentation similaire
}
```

## 📈 Améliorations futures

- [ ] Template d'email personnalisable par le propriétaire
- [ ] Support multi-langues (FR/AR/EN)
- [ ] Historique des emails envoyés
- [ ] Statistiques d'ouverture/clic
- [ ] Files d'attente pour les emails (Bull/Agenda)
- [ ] Provider alternatif (SendGrid, Mailgun, etc.)

## 📚 Références

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail SMTP Configuration](https://support.google.com/mail/answer/7126229)
- [Application Passwords](https://support.google.com/accounts/answer/185833)

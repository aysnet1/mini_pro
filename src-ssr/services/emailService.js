import nodemailer from 'nodemailer';
import config from '../config.js';

/**
 * Service d'envoi d'emails
 * Configure un transporteur SMTP et fournit des méthodes pour envoyer des notifications
 */

// Configuration du transporteur SMTP
const createTransporter = () => {
  const smtpConfig = config.smtp || {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER_GMAIL,
      pass: process.env.EMAIL_PASS_GMAIL,
    },
  };

  return nodemailer.createTransport(smtpConfig);
};

export const sendReservationNotification = async (options) => {
  const {
    proprietaireEmail,
    proprietaireNom,
    etudiantNom,
    etudiantPrenom,
    etudiantEmail,
    etudiantTel,
    logementAdresse,
    logementVille,
    dateDebut,
    dateFin,
    duree,
  } = options;

  // Validation des champs requis
  if (!proprietaireEmail || !etudiantNom || !etudiantPrenom || !logementAdresse) {
    throw new Error('Champs requis manquants pour l\'envoi de la notification');
  }

  const transporter = createTransporter();

  // Formatage des dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
  };

  // Sujet de l'email
  const subject = 'Nouvelle demande de réservation - TakeLog';

  // Contenu HTML de l'email (Haute conformité & Contraste Élevé)
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #09090b; -webkit-font-smoothing: antialiased;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f5; padding: 10px 5px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 2px solid #09090b; padding: 0;">

              <tr>
                <td style="padding: 40px 40px 30px 40px; border-bottom: 2px solid #09090b; background-color: #ffffff;">
                  <span style="font-family: monospace; font-size: 11px; text-transform: uppercase; tracking-widest: 0.2em; color: #71717a; display: block; margin-bottom: 4px; font-weight: bold;">Notification Système</span>
                  <h1 style="font-size: 32px; font-weight: 900; letter-spacing: -0.04em; margin: 0; color: #000000; text-transform: uppercase;">TakeLog</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <p style="font-size: 16px; line-height: 1.5; margin: 30px 0 20px 0; color: #09090b;">
                    Bonjour <strong>${proprietaireNom}</strong>,
                  </p>
                  <p style="font-size: 15px; line-height: 1.5; margin: 0 0 30px 0; color: #27272a;">
                    Une nouvelle proposition de réservation vient d'être initiée pour votre parc immobilier. Veuillez passer en revue les détails du dossier ci-dessous.
                  </p>

                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f5; border-left: 4px solid #000000; margin-bottom: 35px;">
                    <tr>
                      <td style="padding: 20px;">
                        <span style="font-family: monospace; font-size: 11px; font-weight: bold; text-transform: uppercase; display: block; color: #09090b; margin-bottom: 4px;">Action requise</span>
                        <p style="font-size: 14px; margin: 0; color: #27272a; font-weight: 500;">
                          Veuillez statuer sur cette demande (approbation ou rejet) directement depuis votre console d'administration en ligne.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #09090b; padding-bottom: 6px; margin: 0 0 15px 0; color: #000000;">
                    Informations Candidat
                  </h2>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Nom Complet</td>
                      <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right; color: #09090b;">${etudiantPrenom} ${etudiantNom}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #71717a; border-top: 1px solid #e4e4e7;">Adresse Email</td>
                      <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right; color: #09090b; border-top: 1px solid #e4e4e7;">${etudiantEmail}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #71717a; border-top: 1px solid #e4e4e7;">Téléphone</td>
                      <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right; color: #09090b; border-top: 1px solid #e4e4e7;">${etudiantTel || 'Non renseigné'}</td>
                    </tr>
                  </table>

                  <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #09090b; padding-bottom: 6px; margin: 0 0 15px 0; color: #000000;">
                    Désignation du Logement
                  </h2>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Adresse</td>
                      <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right; color: #09090b;">${logementAdresse}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #71717a; border-top: 1px solid #e4e4e7;">Ville</td>
                      <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right; color: #09090b; border-top: 1px solid #e4e4e7;">${logementVille || 'Non spécifiée'}</td>
                    </tr>
                  </table>

                  <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #09090b; padding-bottom: 6px; margin: 0 0 15px 0; color: #000000;">
                    Modalités Temporelles
                  </h2>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 40px;">
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Prise d'effet</td>
                      <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right; color: #09090b;">${formatDate(dateDebut)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #71717a; border-top: 1px solid #e4e4e7;">Échéance contractuelle</td>
                      <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right; color: #09090b; border-top: 1px solid #e4e4e7;">${formatDate(dateFin)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #71717a; border-top: 1px solid #e4e4e7;">Durée totale</td>
                      <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right; color: #000000; border-top: 1px solid #e4e4e7;">
                        <span style="background-color: #09090b; color: #ffffff; padding: 2px 8px; font-family: monospace; font-size: 12px;">${duree} MOIS</span>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                      <td align="center">
                        <a href="${config.url}/proprietaire/reservations" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 36px; font-size: 13px; font-weight: bold; font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; border: 2px solid #000000; transition: background-color 0.15s ease;">
                          Accéder au tableau de bord
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <tr>
                <td style="padding: 30px 40px; background-color: #f4f4f5; border-top: 2px solid #09090b; text-align: center;">
                  <p style="font-size: 11px; line-height: 1.6; color: #71717a; margin: 0 0 6px 0;">
                    Ceci est une notification automatique de sécurité générée par TakeLog. Ne pas répondre directement à cet expéditeur.
                  </p>
                  <p style="font-family: monospace; font-size: 11px; color: #09090b; margin: 0; font-weight: bold;">
                    &copy; ${new Date().getFullYear()} TAKELOG — SYSTEM RECORDS
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Contenu texte brut (fallback)
  const textContent = `
Bonjour ${proprietaireNom},

Vous avez reçu une nouvelle demande de réservation pour votre logement.

CANDIDAT:
- Nom Complet: ${etudiantPrenom} ${etudiantNom}
- Email: ${etudiantEmail}
- Téléphone: ${etudiantTel || 'Non renseigné'}

LOGEMENT:
- Adresse: ${logementAdresse}
- Ville: ${logementVille}

MODALITÉS:
- Prise d'effet: ${formatDate(dateDebut)}
- Échéance: ${formatDate(dateFin)}
- Durée: ${duree} mois

Veuillez vous connecter à votre espace propriétaire sur ${config.url} pour traiter cette demande.

Cordialement,
L'équipe TakeLog
  `.trim();

  // Configuration de l'email
  const mailOptions = {
    from: `"TakeLog" <${process.env.SMTP_FROM_EMAIL || 'noreply@takelog.com'}>`,
    to: proprietaireEmail,
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  // Envoi de l'email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email de notification envoyé avec succès:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error.message);
    throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
  }
};

/**
 * Teste la connexion au serveur SMTP
 * @returns {Promise<boolean>} true si la connexion réussit
 */
export const testSmtpConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Connexion SMTP réussie');
    return true;
  } catch (error) {
    console.error('Erreur de connexion SMTP:', error.message);
    return false;
  }
};

export default {
  sendReservationNotification,
  testSmtpConnection,
};

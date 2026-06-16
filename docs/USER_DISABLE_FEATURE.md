# Gestion des Utilisateurs Désactivés

## Résumé des modifications

Cette mise à jour ajoute la fonctionnalité de désactivation/activation des comptes utilisateurs et empêche les utilisateurs désactivés de se connecter.

---

## 1. Base de données

### Migration SQL

**Fichier:** `src-ssr/database/migrations/add_is_disabled_to_user.sql`

Ajoute la colonne `is_disabled` à la table `user`:

- Type: `TINYINT(1)`
- Valeur par défaut: `0` (actif)
- `1` = compte désactivé
- Index ajouté pour optimiser les performances

**Pour appliquer la migration:**

```sql
mysql -u root -p logement_etudiant < src-ssr/database/migrations/add_is_disabled_to_user.sql
```

---

## 2. Backend (API)

### Contrôleur - UserControllers.js

#### a) Modification de `SigninUser`

**Ligne:** ~370

- Ajoute une vérification du statut `is_disabled` après la validation du mot de passe
- Retourne une erreur 403 avec un message explicite si le compte est désactivé

```javascript
if (user.is_disabled === 1) {
  return res.status(403).json({
    error:
      "Votre compte a été désactivé par l'administrateur. Veuillez le contacter pour plus d'informations.",
  })
}
```

#### b) Modification de `GetAllUser`

**Ligne:** ~127

- Inclut le champ `is_disabled` dans la requête SELECT pour afficher le statut dans l'interface admin

#### c) Nouveau contrôleur `ToggleUserStatus`

**Ligne:** ~620

- Endpoint: `PATCH /api/users/:id/toggle-status`
- Permissions: Admin uniquement
- Corps de la requête: `{ is_disabled: boolean }`
- Met à jour le statut de l'utilisateur dans la base de données
- Retourne les informations de l'utilisateur avec le nouveau statut

---

### Routes - UserRoutes.js

**Nouvelle route:**

```javascript
userroutes.patch('/:id/toggle-status', authMiddleware, isAdmin, ToggleUserStatus)
```

---

## 3. Frontend (Interface Utilisateur)

### Page de Login - `src/pages/auth/LoginPage.vue`

**Modifications:**

- Gestion améliorée des erreurs de connexion
- Détection des comptes désactivés via le message d'erreur
- Affichage d'un message spécifique avec couleur "warning" pour les comptes désactivés
- Caption ajoutée: "Contactez l'administrateur pour réactiver votre compte."
- Timeout augmenté à 6 secondes pour les comptes désactivés

---

### Composant Admin - `src/components/admin/AdminUsersManagement.vue`

**Modifications majeures:**

#### Suppressions:

- ❌ Bouton "Ajouter" un utilisateur
- ❌ Sélecteur "Rôle nouveau"
- ❌ Bouton "Modifier" dans le tableau
- ❌ Formulaire de création/édition (dialog)
- ❌ Fonctions: `openCreateUser()`, `openEditUser()`, `saveUser()`, `confirmDeleteUser()`
- ❌ Variables d'état liées au formulaire

#### Ajouts:

- ✅ Bouton toggle "Activer/Désactiver" dans la colonne Actions
  - Icône `block` (orange) quand l'utilisateur est actif
  - Icône `check_circle` (vert) quand l'utilisateur est désactivé
  - Confirmation par dialog avant action
  - Désactivé pour l'utilisateur connecté (ne peut pas se désactiver lui-même)

- ✅ Fonction `toggleUserStatus(row)`:
  - Envoie une requête PATCH à `/api/users/:id/toggle-status`
  - Rafraîchit la liste après succès
  - Notifications appropriées selon le résultat

#### Fonctionnalités conservées:

- ✅ Affichage des informations utilisateurs dans le tableau
- ✅ Filtre par rôle
- ✅ Bouton "Actualiser"
- ✅ Badges de rôle avec couleurs
- ✅ Protection du compte utilisateur connecté

---

## 4. Flux d'utilisation

### Pour un Admin:

1. **Désactiver un utilisateur:**
   - Aller sur la page d'administration
   - Cliquer sur l'icône 🔴 (block) dans la colonne Actions
   - Confirmer la désactivation
   - L'utilisateur est immédiatement désactivé

2. **Réactiver un utilisateur:**
   - Cliquer sur l'icône 🟢 (check_circle) dans la colonne Actions
   - Confirmer la réactivation
   - L'utilisateur peut à nouveau se connecter

### Pour un Utilisateur Désactivé:

1. Tente de se connecter avec ses identifiants
2. Reçoit le message: "Votre compte a été désactivé par l'administrateur. Veuillez le contacter pour plus d'informations."
3. Ne peut pas accéder à l'application
4. Doit contacter l'administrateur pour réactivation

---

## 5. Tests recommandés

### Backend:

```bash
# Tester la désactivation
curl -X PATCH http://localhost:3000/api/users/1/toggle-status \
  -H "Authorization: Bearer <token_admin>" \
  -H "Content-Type: application/json" \
  -d '{"is_disabled": true}'

# Tester la connexion avec un compte désactivé
curl -X POST http://localhost:3000/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "mot_de_passe": "password123"}'
```

### Frontend:

- [ ] Se connecter en tant qu'admin
- [ ] Naviguer vers la gestion des utilisateurs
- [ ] Désactiver un utilisateur test
- [ ] Vérifier que le bouton change d'icône et de couleur
- [ ] Tenter de se connecter avec le compte désactivé
- [ ] Vérifier le message d'erreur approprié
- [ ] Réactiver l'utilisateur
- [ ] Vérifier que la connexion fonctionne à nouveau

---

## 6. Notes importantes

⚠️ **Sécurité:**

- Seul un admin peut désactiver/réactiver des utilisateurs
- Un admin ne peut pas désactiver son propre compte
- La vérification du statut se fait côté serveur lors du login

📝 **Base de données:**

- Penser à exécuter la migration SQL avant d'utiliser la fonctionnalité
- La colonne `is_disabled` est obligatoire avec valeur par défaut à 0

🎨 **UX:**

- Messages d'erreur clairs et explicites
- Confirmations avant action destructive
- Feedback visuel immédiat (couleurs, icônes, notifications)

---

## 7. Fichiers modifiés

1. `src-ssr/database/migrations/add_is_disabled_to_user.sql` ✨ Nouveau
2. `src-ssr/controllers/UserControllers.js` ✏️ Modifié
3. `src-ssr/routers/UserRoutes.js` ✏️ Modifié
4. `src/pages/auth/LoginPage.vue` ✏️ Modifié
5. `src/components/admin/AdminUsersManagement.vue` ✏️ Modifié

---

**Date:** 2026-06-15
**Statut:** ✅ Implémenté

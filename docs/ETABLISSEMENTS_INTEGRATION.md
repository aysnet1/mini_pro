# Intégration des Établissements - Inscription et Profil Étudiant

## Résumé des Modifications

Cette mise à jour intègre un sélecteur d'établissements d'enseignement pour permettre aux étudiants de sélectionner leur université/école lors de l'inscription et de la modification du profil.

---

## 1. Nouveau Composable - `useEtablissements`

**Fichier**: `src/composables/useEtablissements.js`

### Fonctionnalités

- **`fetchEtablissements(showLoading)`**: Charge tous les établissements depuis l'API
- **`getEtablissementsOptions()`**: Formate les établissements pour q-select
- **`getEtablissementById(id)`**: Trouve un établissement par son ID
- **`getEtablissementByCode(code)`**: Trouve un établissement par son code
- **`filterByGouvernorat(gouvernorat)`**: Filtre par gouvernorat
- **`filterByType(type)`**: Filtre par type d'établissement

### Utilisation

```javascript
import { useEtablissements } from '@/composables/useEtablissements'

const { etablissements, fetchEtablissements, getEtablissementsOptions } = useEtablissements()
await fetchEtablissements()
```

---

## 2. Route API Publique

**Fichier**: `src-ssr/routers/AppRoutes.js`

### Changement

La route `GET /api/etablissements` est maintenant **publique** (accessible sans authentification) pour permettre aux étudiants de charger la liste des établissements lors de l'inscription.

```javascript
// Routes publiques - Accessible à tous (pour inscription et profil étudiant)
appRoutes.get('/etablissements', GetAllEtablissements)
```

---

## 3. Page d'Inscription - `RegisterPage.vue`

**Fichier**: `src/pages/auth/RegisterPage.vue`

### Modifications

#### Template

- Remplacement du champ texte `universite` par un `q-select` avec recherche
- Affichage de la liste complète des établissements avec filtrage
- Validation requise pour le champ établissement

```vue
<q-select
  id="universite"
  v-model="selectedEtablissement"
  :options="etablissementsOptions"
  option-label="label_fr"
  option-value="id"
  outlined
  dense
  color="dark"
  label="Université / École"
  placeholder="Sélectionnez votre établissement"
  use-input
  input-debounce="300"
  @filter="filterEtablissements"
  hide-bottom-space
  :rules="[(val) => (val && val.id) || 'Requis']"
>
```

#### Script

- Import du composable `useEtablissements`
- Chargement des établissements au montage du composant (`onMounted`)
- Stockage de l'établissement sélectionné dans `selectedEtablissement`
- Envoi du `label_fr` de l'établissement dans `payload.universite`

---

## 4. Dialog de Modification de Profil - `ProfileEditDialog.vue`

**Fichier**: `src/components/profile/ProfileEditDialog.vue`

### Modifications

#### Template

- Remplacement du champ texte `universite` par un `q-select` identique à celui de l'inscription
- Même fonctionnalité de recherche et de filtrage

```vue
<q-select
  v-model="selectedEtablissement"
  :options="etablissementsOptions"
  option-label="label_fr"
  option-value="id"
  outlined
  dense
  class="form-field"
  label="Université / École"
  placeholder="Sélectionnez votre établissement"
  use-input
  input-debounce="300"
  @filter="filterEtablissements"
>
```

#### Script

- Import du composable `useEtablissements`
- Chargement des établissements au montage (`onMounted`)
- Détection automatique de l'établissement actuel lors de l'ouverture du dialog
- Mise à jour de `universite` avec le label de l'établissement sélectionné lors de la soumission

```javascript
// Si l'utilisateur a déjà une université, essayer de trouver l'établissement correspondant
if (props.initialForm?.universite) {
  const foundEtab = etablissements.value.find(
    (etab) => etab.label_fr === props.initialForm.universite,
  )
  if (foundEtab) {
    selectedEtablissement.value = foundEtab
  }
}
```

---

## 5. Base de Données

**Table**: `etablissement`

La table doit contenir les établissements avec au minimum les champs suivants:

- `id`: Identifiant unique
- `etablissement_code`: Code unique de l'établissement
- `university_code`: Code de l'université rattachée
- `label_fr`: Nom en français (affiché dans le sélecteur)
- `label_ar`: Nom en arabe
- `type`: Type d'établissement (université, institut, etc.)
- `gouvernorat`: Gouvernorat où se trouve l'établissement
- `website`: Site web (optionnel)
- `lat`, `lon`: Coordonnées GPS (optionnel)

---

## 6. Flux de Données

### Inscription (RegisterPage)

1. L'utilisateur sélectionne "Je suis Étudiant"
2. Le composant charge les établissements via `fetchEtablissements()`
3. L'utilisateur tape ou sélectionne son établissement dans la liste
4. Lors de la soumission, `payload.universite = selectedEtablissement.value?.label_fr`
5. Les données sont envoyées au backend via `/api/users/register`

### Modification de Profil (ProfileEditDialog)

1. L'utilisateur ouvre le dialog de modification
2. Le composant charge les établissements via `fetchEtablissements()`
3. Si l'utilisateur a déjà une université, elle est pré-sélectionnée
4. L'utilisateur peut changer d'établissement
5. Lors de la soumission, `formData.universite = selectedEtablissement.value?.label_fr || localForm.value.universite`
6. Les données sont envoyées au backend via `/api/users/profile`

---

## 7. Avantages

### Pour l'Utilisateur

- ✅ Sélection rapide et précise de l'établissement
- ✅ Évite les erreurs de saisie et les doublons
- ✅ Recherche intuitive avec filtrage en temps réel
- ✅ Cohérence des données (tous les étudiants utilisent les mêmes noms d'établissements)

### Pour le Système

- ✅ Données normalisées et structurées
- ✅ Possibilité d'ajouter des métadonnées (type, gouvernorat, code)
- ✅ Facilite les statistiques et analyses par établissement
- ✅ Permet des fonctionnalités futures (filtrage par établissement, recommandations, etc.)

---

## 8. Tests à Effectuer

### Tests Fonctionnels

- [ ] Charger la page d'inscription et vérifier que la liste des établissements se charge
- [ ] Taper quelques lettres dans le champ et vérifier le filtrage
- [ ] Sélectionner un établissement et vérifier qu'il s'affiche correctement
- [ ] Soumettre le formulaire et vérifier que l'université est enregistrée
- [ ] Ouvrir le dialog de modification de profil et vérifier que l'établissement actuel est pré-sélectionné
- [ ] Changer d'établissement et vérifier la mise à jour

### Tests Techniques

- [ ] Vérifier que la route `/api/etablissements` est accessible sans authentification
- [ ] Vérifier que la route retourne bien un tableau JSON
- [ ] Vérifier qu'il n'y a pas d'erreurs de compilation dans les fichiers modifiés
- [ ] Tester avec un grand nombre d'établissements (performance)

---

## 9. Améliorations Futures Possibles

- **Filtrage par gouvernorat**: Ajouter un filtre supplémentaire pour limiter les établissements par région
- **Filtrage par type**: Permettre de filtrer par type (université, institut, école, etc.)
- **Affichage personnalisé**: Utiliser un template personnalisé dans q-select pour afficher plus d'informations (gouvernorat, type)
- **Établissement favori**: Permettre aux étudiants de marquer leur établissement comme favori
- **Statistiques**: Afficher le nombre d'étudiants par établissement

---

## 10. Fichiers Modifiés

| Fichier                                        | Type       | Description                               |
| ---------------------------------------------- | ---------- | ----------------------------------------- |
| `src/composables/useEtablissements.js`         | ✨ Nouveau | Composable pour gérer les établissements  |
| `src-ssr/routers/AppRoutes.js`                 | 🔄 Modifié | Route publique pour GET /etablissements   |
| `src/pages/auth/RegisterPage.vue`              | 🔄 Modifié | Intégration du sélecteur d'établissements |
| `src/components/profile/ProfileEditDialog.vue` | 🔄 Modifié | Intégration du sélecteur d'établissements |

---

## 11. Notes Importantes

⚠️ **Important**: Assurez-vous que la table `etablissement` contient des données avant de tester. Vous pouvez utiliser la route d'import admin `/api/admin/etablissements/import` pour charger un fichier JSON.

📝 **Format JSON attendu pour l'import**:

```json
[
  {
    "etablissement_code": "ISET-SO-001",
    "university_code": "UNIV-SO",
    "label_ar": "المعهد العالي للدراسات التكنولوجية بسوسة",
    "label_fr": "ISET Sousse",
    "website": "http://www.isetso.rnu.tn",
    "gouvernorat": "Sousse",
    "type": "institut",
    "lat": 35.8256,
    "lon": 10.6369
  }
]
```

---

**Date**: 2026-06-14  
**Statut**: ✅ Terminé

# API Etablissements - Documentation

## Vue d'ensemble

Cette API permet aux administrateurs de gérer les établissements universitaires avec des opérations CRUD complètes et l'import/export de données JSON.

## Endpoints

### Base URL

```
/api/admin/etablissements
```

### Authentification Requise

- **Rôle**: Admin uniquement
- **Header**: `Authorization: Bearer <token>`

---

## Opérations CRUD

### 1. Récupérer tous les établissements

```http
GET /api/admin/etablissements
Authorization: Bearer <token>
```

**Réponse**:

```json
[
  {
    "id": 1,
    "etablissement_code": 806,
    "university_code": 8,
    "label_ar": "المعهد العالي لمهن الموضة بالمنستير",
    "label_fr": "Institut Supérieur de la Mode de Monastir",
    "website": "ismmm.rnu.tn",
    "gouvernorat": "Monastir",
    "type": "Public",
    "lat": 35.76710391471817,
    "lon": 10.841475766021075
  }
]
```

---

### 2. Récupérer un établissement par ID

```http
GET /api/admin/etablissements/:id
Authorization: Bearer <token>
```

**Réponse**:

```json
{
  "id": 1,
  "etablissement_code": 806,
  "university_code": 8,
  "label_ar": "المعهد العالي لمهن الموضة بالمنستير",
  "label_fr": "Institut Supérieur de la Mode de Monastir",
  "website": "ismmm.rnu.tn",
  "gouvernorat": "Monastir",
  "type": "Public",
  "lat": 35.76710391471817,
  "lon": 10.841475766021075
}
```

---

### 3. Ajouter un établissement

```http
POST /api/admin/etablissements
Authorization: Bearer <token>
Content-Type: application/json
```

**Corps de la requête**:

```json
{
  "etablissement_code": 806,
  "university_code": 8,
  "label_ar": "المعهد العالي لمهن الموضة بالمنستير",
  "label_fr": "Institut Supérieur de la Mode de Monastir",
  "website": "ismmm.rnu.tn",
  "gouvernorat": "Monastir",
  "type": "Public",
  "lat": 35.76710391471817,
  "lon": 10.841475766021075
}
```

**Champs requis**:

- `etablissement_code` (Integer, Unique)
- `university_code` (Integer)
- `label_ar` (String)
- `label_fr` (String)
- `gouvernorat` (String)
- `type` (Enum: "Public" ou "Privé")

**Champs optionnels**:

- `website` (String)
- `lat` (Decimal)
- `lon` (Decimal)

**Réponse (201)**:

```json
{
  "message": "Établissement ajouté avec succès",
  "etablissement_id": 1
}
```

---

### 4. Mettre à jour un établissement

```http
PUT /api/admin/etablissements/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Corps de la requête** (tous les champs sont optionnels):

```json
{
  "label_fr": "Nouveau nom de l'établissement",
  "website": "nouveau-site.rnu.tn"
}
```

**Réponse (200)**:

```json
{
  "message": "Établissement mis à jour avec succès",
  "etablissement_id": 1
}
```

---

### 5. Supprimer un établissement

```http
DELETE /api/admin/etablissements/:id
Authorization: Bearer <token>
```

**Réponse (200)**:

```json
{
  "message": "Établissement supprimé avec succès",
  "etablissement_id": 1
}
```

---

## Import/Export

### 6. Importer des établissements depuis JSON

```http
POST /api/admin/etablissements/import
Authorization: Bearer <token>
Content-Type: application/json
```

**Corps de la requête** (Tableau d'établissements):

```json
[
  {
    "etablissement_code": 807,
    "university_code": 8,
    "label_ar": "المعهد العالي للتكنولوجيا الطبية بالمنستير",
    "label_fr": "Institut Supérieur des Technologies Médicales de Monastir",
    "website": "istm.rnu.tn",
    "gouvernorat": "Monastir",
    "type": "Public",
    "lat": 35.7612,
    "lon": 10.8234
  },
  {
    "etablissement_code": 808,
    "university_code": 8,
    "label_ar": "المدرسة الوطنية للمهندسين بالمنستير",
    "label_fr": "Ecole Nationale d'Ingénieurs de Monastir",
    "website": "enim.rnu.tn",
    "gouvernorat": "Monastir",
    "type": "Public",
    "lat": 35.7534,
    "lon": 10.8312
  }
]
```

**Réponse (200)**:

```json
{
  "message": "Import terminé",
  "summary": {
    "total": 2,
    "imported": 2,
    "skipped": 0,
    "errors": 0
  }
}
```

**Réponse avec erreurs**:

```json
{
  "message": "Import terminé",
  "summary": {
    "total": 3,
    "imported": 2,
    "skipped": 1,
    "errors": 1
  },
  "errors": [
    {
      "etablissement_code": 806,
      "label_fr": "Institut Supérieur de la Mode de Monastir",
      "error": "Code déjà existant"
    }
  ]
}
```

---

### 7. Exporter les établissements en JSON

```http
GET /api/admin/etablissements/export
Authorization: Bearer <token>
```

**Réponse**:

```json
[
  {
    "id": 1,
    "etablissement_code": 806,
    "university_code": 8,
    "label_ar": "...",
    "label_fr": "...",
    "website": "...",
    "gouvernorat": "...",
    "type": "Public",
    "lat": 35.76710391471817,
    "lon": 10.841475766021075
  }
]
```

---

## Codes d'erreur

| Code | Description                                |
| ---- | ------------------------------------------ |
| 200  | Succès                                     |
| 201  | Établissement créé avec succès             |
| 400  | Requête invalide (champs manquants)        |
| 401  | Non authentifié                            |
| 403  | Non autorisé (rôle insuffisant)            |
| 404  | Établissement non trouvé                   |
| 409  | Conflit (code établissement déjà existant) |
| 500  | Erreur serveur                             |

---

## Exemple d'utilisation avec Fetch

```javascript
// Récupérer tous les établissements
const response = await fetch('/api/admin/etablissements', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
const etablissements = await response.json()

// Ajouter un établissement
const newEtablissement = {
  etablissement_code: 806,
  university_code: 8,
  label_ar: 'المعهد العالي لمهن الموضة بالمنستير',
  label_fr: 'Institut Supérieur de la Mode de Monastir',
  website: 'ismmm.rnu.tn',
  gouvernorat: 'Monastir',
  type: 'Public',
  lat: 35.76710391471817,
  lon: 10.841475766021075,
}

const createResponse = await fetch('/api/admin/etablissements', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newEtablissement),
})

// Importer depuis JSON
const jsonData = [
  {
    etablissement_code: 807,
    university_code: 8,
    label_ar: '...',
    label_fr: '...',
    gouvernorat: 'Monastir',
    type: 'Public',
  },
]

const importResponse = await fetch('/api/admin/etablissements/import', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(jsonData),
})
```

---

## Fichiers de référence

- **Controller**: `src-ssr/controllers/AppControllers.js`
- **Routes**: `src-ssr/routers/AppRoutes.js`
- **Migration SQL**: `src-ssr/database/migrations/create_etablissement_table.sql`
- **Sample JSON**: `src-ssr/data/etablissements-sample.json`
- **Tests HTTP**: `src-ssr/etablissements.http`

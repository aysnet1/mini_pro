# Guide d'Installation - Google Maps

## 📦 Installation

```bash
pnpm install vue3-google-map
```

## ⚠️ Important

Le package `vue3-google-marker` **N'EXISTE PAS**. Il faut utiliser les composants fournis par `vue3-google-map` :

- `GoogleMap` - Le composant carte principal
- `AdvancedMarker` - Les marqueurs (remplace l'ancien `Marker`)
- `Marker` - Ancien composant (déprécié mais encore fonctionnel)

## 🎯 Utilisation Correcte

### Import des Composants

```vue
<script setup>
import { GoogleMap, AdvancedMarker } from 'vue3-google-map'
</script>
```

### Template

```vue
<template>
  <GoogleMap
    :center="{ lat: 40.689247, lng: -74.044502 }"
    :zoom="15"
    style="width: 100%; height: 300px"
  >
    <AdvancedMarker
      v-for="point in points"
      :key="point.id"
      :options="{
        position: { lat: point.lat, lng: point.lng },
        title: point.name,
      }"
    />
  </GoogleMap>
</template>
```

## 📍 Exemple Complet - Chat Widget

```vue
<template>
  <div v-if="msg.mapData && msg.mapData.points" class="mt-3">
    <div class="rounded-xl overflow-hidden border border-zinc-200 shadow-md">
      <GoogleMap
        :center="{ lat: msg.mapData.points[0].lat, lng: msg.mapData.points[0].lng }"
        :zoom="12"
        style="width: 100%; height: 300px"
      >
        <AdvancedMarker
          v-for="point in msg.mapData.points"
          :key="point.id"
          :options="{
            position: { lat: point.lat, lng: point.lng },
            title: point.name,
          }"
        />
      </GoogleMap>
    </div>
  </div>
</template>

<script setup>
import { GoogleMap, AdvancedMarker } from 'vue3-google-map'
</script>
```

## 🔧 Configuration Requise

### Clé API Google Maps

Vous devez avoir une clé API Google Maps valide avec :

- **Maps JavaScript API** activé
- **Marker Library** activé (pour AdvancedMarker)

### MapId (Requis pour AdvancedMarker)

Pour utiliser `AdvancedMarker`, vous devez spécifier un `MapId` :

```vue
<GoogleMap
  api-key="VOTRE_CLE_API"
  map-id="VOTRE_MAP_ID"
  :center="center"
  :zoom="12"
  style="width: 100%; height: 300px"
>
  <AdvancedMarker :options="markerOptions" />
</GoogleMap>
```

### Créer un MapId

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/maps-platform)
2. Naviguez vers **Maps Management**
3. Créez un nouveau **Map ID**
4. Copiez l'ID et utilisez-le dans votre composant

## 📚 Props de AdvancedMarker

### `options` (Obligatoire)

Objet de type `AdvancedMarkerElementOptions` :

```javascript
{
  position: { lat: number, lng: number },
  title: string,
  label?: string,
  gmpDraggable?: boolean,
  collisionBehavior?: string
}
```

### `pinOptions` (Optionnel)

Pour personnaliser l'apparence du marker :

```javascript
{
  background: string,      // Couleur de fond
  borderColor: string,     // Couleur de la bordure
  glyphColor: string,      // Couleur de l'icône
  scale?: number           // Échelle
}
```

### `content` (Slot)

Pour utiliser du contenu HTML personnalisé :

```vue
<AdvancedMarker :options="markerOptions">
  <template #content>
    <div class="custom-marker">
      <img src="/icon.png" alt="Marker" />
    </div>
  </template>
</AdvancedMarker>
```

## 🎨 Exemples Avancés

### Marqueurs Multiples avec Couleurs Différentes

```vue
<template>
  <GoogleMap :center="center" :zoom="12" style="width: 100%; height: 400px">
    <AdvancedMarker
      v-for="(poi, index) in pois"
      :key="poi.id"
      :options="{
        position: { lat: poi.lat, lng: poi.lng },
        title: poi.name,
      }"
      :pin-options="{
        background: index === 0 ? '#10b981' : '#3b82f6',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
      }"
    />
  </GoogleMap>
</template>
```

### Marqueur avec Contenu Personnalisé

```vue
<template>
  <GoogleMap :center="center" :zoom="15">
    <AdvancedMarker :options="{ position: center, title: 'Position Actuelle' }">
      <template #content>
        <div class="bg-yellow-500 rounded-full p-2 shadow-lg">📍</div>
      </template>
    </AdvancedMarker>
  </GoogleMap>
</template>
```

### Gestion des Événements

```vue
<template>
  <AdvancedMarker
    :options="markerOptions"
    @click="handleMarkerClick"
    @mouseover="handleMouseOver"
  />
</template>

<script setup>
const handleMarkerClick = (event) => {
  console.log('Marker clicked:', event)
}

const handleMouseOver = (event) => {
  console.log('Mouse over marker:', event)
}
</script>
```

## ⚠️ Erreurs Courantes

### ❌ Incorrect

```vue
<!-- N'EXISTE PAS -->
<vue3-google-marker :position="position" />

<!-- ANCIENNE API -->
<Marker :position="position" />
```

### ✅ Correct

```vue
<!-- NOUVELLE API -->
<AdvancedMarker :options="{ position, title }" />

<!-- AVEC PERSONNALISATION -->
<AdvancedMarker :options="{ position, title }" :pin-options="{ background: '#10b981' }" />
```

## 🔗 Ressources Officielles

- [Documentation vue3-google-map](https://vue3-google-map.com/)
- [Advanced Marker Docs](https://vue3-google-map.com/components/advanced-marker.html)
- [Google Maps Advanced Markers](https://developers.google.com/maps/documentation/javascript/advanced-markers)
- [AdvancedMarkerElementOptions](https://developers.google.com/maps/documentation/javascript/reference/advanced-markers#AdvancedMarkerElementOptions)

## 📝 Notes

- `AdvancedMarker` nécessite un `MapId` valide
- La bibliothèque `marker` doit être activée dans votre clé API
- `AdvancedMarker` est la nouvelle norme (depuis février 2024)
- L'ancien composant `Marker` est déprécié mais fonctionne encore

## 🎯 Dans le Chat Widget

Le composant `ChatWidget.vue` utilise déjà la bonne syntaxe :

```vue
<GoogleMap
  :center="{ lat: points[0].lat, lng: points[0].lng }"
  :zoom="12"
  style="width: 100%; height: 300px"
>
  <AdvancedMarker
    v-for="point in points"
    :key="point.id"
    :options="{
      position: { lat: point.lat, lng: point.lng },
      title: point.name
    }"
  />
</GoogleMap>
```

Assurez-vous simplement d'avoir installé le package et configuré votre clé API Google Maps !

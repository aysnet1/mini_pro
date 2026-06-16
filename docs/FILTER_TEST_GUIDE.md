# Guide de Test - Filtres de Recherche de Logements

## ✅ Corrections Apportées (Production Ready)

### Problèmes Résolus

1. **Synchronisation URL ↔ Filtres** : Les paramètres de filtre sont maintenant correctement synchronisés avec l'URL
2. **Réactivité des Composants** : Correction des problèmes de mutation directe des props
3. **Boucles Infinies** : Évite les re-rendus infinis avec des watchers optimisés
4. **État d'Initialisation** : Gestion propre du chargement initial

---

## 🧪 Scénarios de Test

### Test 1 : Filtres de Base

**Objectif** : Vérifier que les filtres simples fonctionnent

1. **Ville**
   - Sélectionner "Tunis" dans le filtre Ville
   - ✅ L'URL doit afficher `?ville=Tunis`
   - ✅ Les résultats doivent se mettre à jour
   - ✅ Rafraîchir la page → le filtre "Tunis" doit être conservé

2. **Type de Logement**
   - Sélectionner "Studio" et "S+1"
   - ✅ L'URL doit afficher `?types=studio,s+1`
   - ✅ Les résultats doivent correspondre aux types sélectionnés
   - ✅ Rafraîchir → les types doivent être conservés

3. **Budget**
   - Entrer "300" dans Budget min et "600" dans Budget max
   - ✅ L'URL doit afficher `?budget_min=300&budget_max=600`
   - ✅ Seuls les logements entre 300 et 600 DT doivent s'afficher

4. **Places Minimum**
   - Sélectionner "2+"
   - ✅ L'URL doit afficher `?nb_places_min=2`
   - ✅ Tous les logements doivent avoir au moins 2 places

5. **Université**
   - Entrer "ISG Tunis"
   - ✅ L'URL doit afficher `?universite=ISG%20Tunis`
   - ✅ Les résultats doivent être filtrés par proximité

---

### Test 2 : Combinaison de Filtres

**Objectif** : Vérifier que plusieurs filtres fonctionnent ensemble

**Scénario** :

- Ville : "Sfax"
- Types : "Studio", "Chambre"
- Budget : 200 - 500 DT
- Places : 1+
- Université : "FSS"

**Résultats Attendus** :

- ✅ URL : `?ville=Sfax&types=studio,chambre&budget_min=200&budget_max=500&nb_places_min=1&universite=FSS`
- ✅ Tous les filtres sont appliqués simultanément
- ✅ La pagination fonctionne avec les filtres actifs
- ✅ Rafraîchir la page conserve TOUS les filtres

---

### Test 3 : Navigation et Historique

**Objectif** : Vérifier la navigation navigateur

1. **Bouton Retour**
   - Appliquer un filtre (ex: Tunis)
   - Appliquer un autre filtre (ex: Sfax)
   - Cliquer sur le bouton retour du navigateur
   - ✅ Doit revenir à "Tunis"
   - ✅ Les résultats doivent correspondre

2. **Bouton Avant**
   - Après le test retour, cliquer sur avant
   - ✅ Doit revenir à "Sfax"

3. **Signet/Partage**
   - Copier l'URL avec des filtres actifs
   - Ouvrir dans un nouvel onglet
   - ✅ Tous les filtres doivent être appliqués
   - ✅ Les mêmes résultats doivent s'afficher

---

### Test 4 : Pagination

**Objectif** : Vérifier que la pagination fonctionne avec les filtres

1. **Changement de Page**
   - Appliquer des filtres
   - Aller à la page 2
   - ✅ L'URL doit afficher `?page=2` (avec les autres filtres)
   - ✅ Les résultats de la page 2 doivent s'afficher

2. **Retour Page 1**
   - Revenir à la page 1
   - ✅ Le paramètre `page` doit disparaître de l'URL
   - ✅ Les résultats de la page 1 doivent s'afficher

3. **Changement de Filtre**
   - Être à la page 3 avec des filtres
   - Changer un filtre
   - ✅ La page doit revenir à 1 automatiquement
   - ✅ L'URL doit montrer `?page=1` (ou pas de paramètre page)

---

### Test 5 : Réinitialisation

**Objectif** : Vérifier le bouton de réinitialisation

1. **Bouton Reset**
   - Appliquer plusieurs filtres
   - Cliquer sur le bouton "Réinitialiser" (icône refresh)
   - ✅ Tous les filtres doivent être effacés
   - ✅ L'URL doit être nettoyée (pas de paramètres de filtres)
   - ✅ Tous les logements doivent s'afficher

2. **Effacer Recherche Texte**
   - Entrer du texte dans la barre de recherche
   - Cliquer sur la croix (X)
   - ✅ Le texte doit être effacé
   - ✅ La recherche doit se déclencher avec le texte vide

---

### Test 6 : Dialog Mobile

**Objectif** : Vérifier les filtres sur mobile

1. **Ouverture Dialog**
   - Sur mobile (ou fenêtre réduite)
   - Cliquer sur "Filtres"
   - ✅ Le dialog doit s'ouvrir
   - ✅ Tous les filtres doivent être accessibles

2. **Application Filtres**
   - Modifier des filtres dans le dialog
   - Cliquer sur "Voir les résultats"
   - ✅ Le dialog doit se fermer
   - ✅ Les filtres doivent être appliqués
   - ✅ L'URL doit être mise à jour

3. **Réinitialisation Mobile**
   - Dans le dialog, cliquer sur "Réinitialiser"
   - ✅ Tous les filtres doivent être effacés
   - ✅ Les résultats doivent se mettre à jour

---

### Test 7 : Cas Spéciaux

1. **Valeurs Nulles/Vides**
   - Entrer des espaces dans les champs texte
   - ✅ Doit être traité comme vide
   - ✅ Ne doit pas apparaître dans l'URL

2. **Types Multiples**
   - Sélectionner TOUS les types
   - ✅ L'URL doit avoir `?types=studio,s+1,s+2,s+3,s+4,chambre,colocation,appartement,maison`
   - ✅ Doit fonctionner correctement

3. **Budget Extrêmes**
   - Tester avec 0 comme budget min
   - Tester avec 9999 comme budget max
   - ✅ Doit gérer les valeurs extrêmes sans erreur

4. **Navigation Directe par URL**
   - Entrer manuellement : `?ville=Tunis&types=studio&budget_max=500&page=2`
   - ✅ La page doit charger avec ces filtres
   - ✅ Doit afficher la page 2 des résultats filtrés

---

## 🐛 Bugs à Surveiller (Déjà Corrigés)

### Avant (❌)

- Mutation directe des props Vue
- Boucles infinies de re-rendu
- URL non synchronisée avec les filtres
- Perte des filtres au rafraîchissement
- Pagination non préservée dans l'URL

### Après (✅)

- Utilisation de `ref` locaux avec watchers
- Watchers optimisés avec conditions
- Synchronisation bidirectionnelle URL ↔ Filtres
- Persistance des filtres via l'URL
- Pagination correctement gérée dans l'URL

---

## 📋 Checklist de Validation Production

Avant le déploiement, vérifier :

- [ ] Tous les filtres individuels fonctionnent
- [ ] La combinaison de filtres fonctionne
- [ ] L'URL se met à jour correctement
- [ ] Le rafraîchissement conserve les filtres
- [ ] La navigation historique (retour/avant) fonctionne
- [ ] La pagination avec filtres fonctionne
- [ ] Le bouton reset fonctionne
- [ ] Le dialog mobile fonctionne
- [ ] Les cas limites sont gérés
- [ ] Aucune erreur console JavaScript
- [ ] Les performances sont bonnes (pas de re-rendus inutiles)

---

## 🔧 Dépannage

### Les filtres ne se mettent pas à jour

→ Vérifier la console pour les erreurs JavaScript
→ S'assurer que le store Pinia est bien initialisé

### L'URL ne se met pas à jour

→ Vérifier que `updateRouteQuery()` est appelé
→ Contrôler que le router Vue Router est accessible

### Boucle infinie de rechargement

→ Vérifier les watchers avec `{ deep: true }`
→ S'assurer que `isInitializing` est bien utilisé

### Les filtres ne persistent pas

→ Vérifier que `applyRouteQuery()` est appelé dans `onMounted`
→ Contrôler que les paramètres URL sont correctement parsés

---

## 📞 Support

En cas de problème en production :

1. Ouvrir la console du navigateur (F12)
2. Reproduire le problème
3. Noter les erreurs JavaScript
4. Vérifier les appels réseau (onglet Network)
5. Comparer avec les scénarios de test ci-dessus

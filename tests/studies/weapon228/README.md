# Build 228 — armes et PNJ

688 tests passent (`npm test`), dont une matrice de 11 520 comparaisons armé/non armé (20 profils, fatigue, exposition, boosts et actions). Déplacements effectifs, sauvegardes et valuation PNJ couverts.

500 parties avec le code final : BB2 normal 200, avancé 100, coop 100 ; BB1 normal 100. Aucun échec de validation. Équipes en rotation imposées ; repêchage non simulé. Quatre équipes en normal/avancé, deux en coop. BB2 seul : 100/200, 48/100, 2/100 victoires ; BB1 normal : 25/100.

Comparaison appariée avec la variante précédente (même règle d’arme, ancien BB2) : recherches d’arme 9 → 12 en normal, 6 → 10 en avancé, 1 → 4 en coop. Victoires 102 → 100, 49 → 48, 2 → 2. Pas de gain de victoire démontré ; acquisition toujours rare et coop peu performante. Le changement améliore les critères de décision sans imposer un quota d’armes ni retarder une intervention locale prête.

Reproduire depuis la racine : `node tests/studies/weapon228/simulate.mjs regular 200 bb2` ; remplacer le mode par `advanced` ou `cooperative`, ou le bot par `bb1`. Les fichiers prior-bb2 sont les observations conservées de l’expérience build 227 avec règle d’arme étendue ; les autres JSON sont les parties exécutées avec build 228. Les graines avancées sont distinctes du normal. Le journal parle de scénarios mais ce script final ne lance que la version mise à jour.

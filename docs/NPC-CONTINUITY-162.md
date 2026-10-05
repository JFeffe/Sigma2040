# IA Normal — continuité des enquêtes, version 162

Le planificateur Normal abandonnait trop souvent une progression locale pour protéger une autre menace. Cette version favorise le dossier local le plus avancé, avec une priorité conservée aux menaces potentiellement fatales. Le relais accélère une nouvelle localisation quand un dossier préparé a perdu sa position. Les règles de réussite, coûts, fatigue, crise et prestige ne changent pas.

Jeu : https://sigma-2040.docile-hero-2836.chatgpt.site

## Changements de décision

- Priorité du dossier : préparation achevée, deux preuves dont une vérifiée, preuve vérifiée, preuve brute, intimidation déjà effectuée. Égalités déterministes sur l’identifiant ; cible déjà visée par une arrestation exclue.
- Bonus de choix de 24 pour les étapes du dossier retenu ; 12 pour ses démarches d’accès et d’autorisation. Ce sont des poids internes de décision, jamais des points de réussite.
- Ces poids supplémentaires cessent quand la crise actuelle, les attaques non couvertes à trois tours et les tensions projetées peuvent atteindre 100. Fatigue, blessure, soins et secours gardent leurs contrôles existants.
- Le relais peut être acheté, aux conditions ordinaires, avant de relocaliser une cible dont l’arrestation est déjà préparée. Une position valable pour l’arrestation d’un tour ne nécessite pas ce détour.
- Facile et Expert n’utilisent pas ces nouvelles priorités. Normal garde la première vérification avant la seconde collecte et ses renforts limités aux interventions.
- Aucune nouvelle donnée persistante : les sauvegardes existantes restent compatibles et les ordres déjà engagés conservent leurs probabilités.

## Méthode

Référence v161 : `7728cbd7148d372d075887cbe1665f594b4e2bb6`. 1 840 exécutions, témoins et conditions appariées compris ; ce ne sont pas 1 840 observations indépendantes.

- Développement : 100 graines 1–100 × avant/après, toutes les équipes hybrides (200).
- Validation : nouvelles graines 1001–1100 × trois profils homogènes × avant/après (600).
- Crise : mêmes nouveaux départs, nouvelle IA avec +3 ou +2 (200). Dans `crisis.json.gz`, `current` désigne l’essai +2 et `baseline` la nouvelle IA à +3.
- Solo : mêmes nouveaux départs, pays focal piloté par une référence fixe v161, cinq PNJ avant/après (200). Cela contrôle le moteur solo, sans simuler un véritable joueur humain.
- Prestige : 100 nouveaux départs × trois profils du pays focal × avant/après, les cinq autres pays hybrides (600).
- Non-régression Facile/Expert : 10 départs par niveau × avant/après (40), résultats enregistrés strictement identiques à chaque paire.

Le pays focal tourne entre les six puissances ; quatre personnages par défaut pour ce pays, recrutement habituel pour les PNJ. Pour chaque scénario, l’état initial est cloné avant/après. Les séquences de jets divergent ensuite lorsque les décisions divergent. Toutes les campagnes finales passent `validateSave`. L’ordre de résolution des tests entièrement IA est celui du multijoueur ; le contrôle solo utilise son ordre natif.

## Validation sur de nouveaux départs

100 parties par version, six équipes Normal hybrides :

| Mesure | v161 | v162 |
| --- | ---: | ---: |
| Arrestations par partie | 2,87 | 3,61 |
| Première arrestation mondiale, tour moyen conditionnel | 15,61 | 13,51 |
| Aucune arrestation | 6 % | 3 % |
| Victoires collectives | 2/100 | 6/100 |
| Défaites par crise | 38/100 | 32/100 |
| Attaques réussies | 2,08 | 2,10 |
| Attaques interceptées | 12,70 | 12,06 |
| Attaques annulées | 0,97 | 1,62 |

L’augmentation appariée des arrestations est de +0,74 par partie, intervalle exploratoire 95 % [0,35 ; 1,13], soit +25,8 % en moyenne. Première arrestation calculée uniquement sur les parties avec au moins une arrestation. La hausse de 2 à 6 victoires reste trop petite pour conclure à une difficulté bien calibrée ; 62 défaites atteignent encore la limite de tours avec la nouvelle IA.

Sur le contrôle solo à politique focale fixe : 3,37 → 3,87 arrestations ; première arrestation T15,96 → T13,55 ; 1 → 5 victoires sur 100. Les deux profils homogènes supplémentaires progressent aussi : enquête 3,10 → 3,79 arrestations ; défense 0,65 → 1,28.

## Retest de la crise

Nouvelle IA seulement, 100 nouveaux départs identiques :

| Mesure | +3/tour, conservé | +2/tour, essai seulement |
| --- | ---: | ---: |
| Victoires | 6/100 | 6/100 |
| Défaites par crise | 32/100 | 12/100 |
| Défaites à la limite de tours | 62/100 | 82/100 |
| Arrestations | 3,61 | 3,93 |
| Attaques réussies | 2,10 | 2,30 |

L’essai +2 change surtout la cause de défaite et ne démontre pas une amélioration de la victoire. La publication conserve +3. Il ne s’agit pas d’une preuve que +3 est optimal.

## Retest du prestige

Pays focal en Normal révisé, cinq autres pays hybrides ; 100 nouveaux départs par profil :

| Profil du pays focal | Prestige moyen | Arrestations du pays |
| --- | ---: | ---: |
| Hybride | 24,97 | 0,58 |
| Enquête | 24,22 | 0,87 |
| Défense | 23,73 | 0,08 |

Différences appariées de prestige face à l’hybride : enquête −0,75 [−3,08 ; 1,59] ; défense −1,24 [−3,40 ; 0,92], intervalles exploratoires 95 %. Aucun profil dominant démontré. Barème de prestige conservé ; le rapport entre investissement d’enquête et récompense reste à examiner avec des parties humaines et des équipes variées.

## Vérification et reproduction

367 tests passent, dont six nouveaux cas ciblés : poursuite d’un dossier, urgence de crise, repos nécessaire, arrestation à la dernière date valide, relais avant relocalisation et absence de consultation d’informations cachées. Imports de tests et URLs de cache alignés sur la nouvelle version. Aucun changement de taux de réussite ni de statistiques.

Script : `scripts/benchmark-continuity162.mjs`. Les JSON complets sont conservés compressés dans `docs/simulations/r162/`, avec `summary.json` lisible. Options : `--baseline`, `--candidate`, `--start`, `--count`, `--strategies balanced,investigation,defense`, `--scope focus`, `--mode solo-reference`, `--levels easy,normal,expert`, `--out`.

Pour comparer deux révisions, exporter leur moteur dans un fichier `.mjs` et résoudre ses imports relatifs vers les modules clients correspondants ; fournir le chemin absolu avec `--baseline` ou `--candidate`. Pour l’essai +2, remplacer uniquement l’expression `campaignRules(s).crisisPerTurn` dans une copie de test du moteur. Ne pas publier cette copie. Les probabilités, statistiques et autres règles sont identiques entre les deux révisions testées.

Limites : politiques heuristiques, échantillons appariés, aucun joueur humain, pas de recherche de stratégie optimale. Les faibles taux de victoire collective restent un sujet de travail. Aucun contrôle visuel supplémentaire nécessaire pour cette modification de décisions sans changement d’interface.

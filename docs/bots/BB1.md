# BotBrillant1 (BB1) — guide de jeu et de validation

Depuis la version 174, **BotBrillant1 (BB1)** est un quatrième choix de bot, à côté de
**Facile, Normal et Expert**. Normal reste le choix par défaut. Les anciennes
sauvegardes restent sur leur difficulté d’origine ; aucun remplacement automatique.

## Tester en solo

Avec Node.js 20 ou supérieur, depuis ce dépôt :

```sh
git fetch origin
git switch main
node scripts/preview-bb1.mjs
```

Ouvrir <http://127.0.0.1:4180>, choisir **Nouvelle partie**, son pays et quatre agents,
puis **BotBrillant1 (BB1)** dans Difficulté, et lancer l’opération.
Le port 4180 utilise un stockage navigateur distinct du site de production.
Le script ne nécessite aucune installation de dépendance.

## Multijoueur

L’hôte peut choisir BB1 dans le salon avant de lancer la campagne. Ce choix s’applique
aux places contrôlées par l’ordinateur ; les humains restent manuels. Tous les participants
doivent utiliser la version 174 ou une version ultérieure compatible. Le serveur d’aperçu ci-dessus sert le client solo seulement :
pour une partie réseau, utiliser l’environnement de test du projet avec son relais habituel.
Les contrôles de l’hôte, la propagation de BB1 et la confidentialité des souvenirs du bot
sont couverts par les tests d’intégration.

## Périmètre et vérifications

- Planificateur BB1 dans `dist/client/bot-brillant-1.js`, mémoire privée `faction.bb1`.
- Routage vers BB1 uniquement si `aiDifficulty === 'bb1'`.
- Corps du planificateur historique conservé, sans changement des règles ni des ressources.
- Le bot utilise ses dossiers, les menaces visibles et les observations publiques. Il ne lit
  pas l’authenticité cachée des preuves, les positions cachées, les dossiers/ordres adverses
  ou le futur générateur aléatoire pour choisir ses ordres.
- Lors de l’intégration 174, 415 tests passaient, dont 19 tests BB1/intégration. Neuf campagnes complètes couvrant
  Facile, Normal et Expert reproduisent exactement les empreintes capturées sur main
  avant intégration (`tests/fixtures/build173-legacy-bots.json`).
- Les 720 départs du candidat archivé ont été rejoués avec l’option BB1 : mêmes issues,
  tours et six scores. 660 victoires collectives, soit 91,7 %. C’est un contrôle d’équivalence
  du conditionnement, pas un nouveau lot indépendant ni un taux contre des humains.

```sh
npm test
```

BB1 est intégré au jeu publié : [Jouer à Sigma 2040](https://sigma-2040.docile-hero-2836.chatgpt.site).
Les numéros de build, les notes de version et les versions de cache suivent AGENTS.md.
Le script d’aperçu ci-dessus reste un outil local sans relais réseau de production.

Le [laboratoire statistique](https://github.com/JFeffe/Sigma2040/tree/feat/stats-dashboard/docs/bots)
est sur une branche indépendante : il peut être révisé sans intégrer BB1.

## Correction du passage clandestin — version 175

La version 174 ne proposait jamais `sneak`. Son absence dans les statistiques mesurait donc une lacune du planificateur, sans permettre de conclure que l’action était trop faible.

La version 175 ajoute une comparaison dans les trajets d’enquête. Une projection des étapes restantes compare les chances avec l’arme et l’exposition réellement obtenues à l’arrivée, l’énergie et les durées du moteur. Elle est pondérée par les chances du passage, le coût du renfort et le risque de perdre du temps ou un agent. La logistique accélère uniquement le passeport. La projection est une heuristique à partir des connaissances de l’équipe ; elle ne simule aucun tirage futur et ne consulte aucune information adverse cachée. Les retours de soins et les trajets de protection gardent l’arrivée garantie.

Les 1 200 départs de validation, graines 2615050001 à 2615051200, sont distincts de l’étude précédente. Chaque départ est joué une fois avec chaque version, sans humain et avec six BB1. Les six pays sont chacun le pays focal sur 200 départs ; ses quatre agents et son chef sont tirés uniformément, les cinq autres équipes suivent le tirage initial du moteur.

| Mesure | Version 174 | Version 175 |
|---|---:|---:|
| Victoires collectives | 1 113 (92,75 %) | 1 109 (92,42 %) |
| Défaites par crise | 79 | 82 |
| Défaites à la limite du tour 30 | 8 | 9 |
| Prestige moyen par pays et partie | 23,85 | 23,81 |
| Ordres de passage clandestin | 0 | 170 |
| Parties avec au moins un passage | 0 | 147 |

168 passages sont résolus : 139 réussites et 29 échecs ; les deux derniers restent en cours à la fin de la campagne. Les échecs entraînent un décès, sept captures, treize blessures et huit renoncements sans nouvelle blessure. Cette rareté est compatible avec les coûts et risques de l’action : la correction n’impose aucun quota d’utilisation.

Bootstrap apparié sur 10 000 rééchantillonnages de campagnes (graine 26151005), intervalles à 95 % : voir les valeurs exactes dans [le bilan JSON](bb1-travel175-validation.json). Les résultats ne démontrent pas un gain de prestige ou de victoire. Les 1 053 campagnes sans passage gardent le même état final complet que la version 174. Les sauvegardes sont validées sur un échantillon, avec contrôle à chaque tour sur les premiers départs de chaque processus ; douze rejeux déterministes et douze rejeux des sources finales correspondent aux empreintes enregistrées. Aucun échec de simulation.

Reproduction avec Node.js 20 ou supérieur depuis un clone GitHub :

```sh
mkdir -p /tmp/sigma-bb1-174
git archive a04d15f45b7adc8269586df614adac22f8c2c47b dist/client package.json | tar -x -C /tmp/sigma-bb1-174
node scripts/benchmark-bb1-travel.mjs /tmp/sigma-bb1-174/dist/client 1200 /tmp/bb1-travel-results.json
```

Le script lance les deux moteurs, vérifie les parties, enregistre les résultats par graine, les empreintes des sources et les intervalles appariés. Les 421 tests, dont six nouvelles régressions du passage, passent ; les neuf états complets historiques Facile/Normal/Expert restent identiques.


## Appuis et gouvernement - version 176

BB1 évalue les trois faveurs avant de choisir celle dont l'utilité immédiate est la plus forte. Il compare le gain d'énergie à la récupération disponible, les chances des prochaines actions au plafond réel de 90 %, les crédits qui débloquent une intervention et le coût de confiance, y compris les seuils de revenus. Financement et diplomatie préservent dix points de confiance avant la fin de campagne ; une faveur conserve le délai commun de deux tours. Les trois soutiens médicaux sont réservés aux épisodes de fatigue collective ou aux urgences utiles. Les chances des missions déjà confirmées ne sont pas recalculées.

L'assistance IA peut soutenir un lot de preuves ou terminer un recoupement utile. Le relais peut prolonger une position expirant pendant que l'intervenant achève son ordre. Les activations anticipées de ces deux modules gardent un créneau terrain libre et six crédits après les réserves des protections. La logistique continue d'accélérer uniquement le passeport. La recherche d'arme est considérée pendant une attente locale, si le gain d'arrestation reste positif après fatigue, exposition et risque d'échec. Aucun quota d'action n'est imposé.

Une nouvelle validation compare 1 200 départs, graines 2617050001 à 2617051200, identiques entre versions, sans humain et avec six BB1. Pays focal équilibré (200 départs chacun), quatre profils et chef focal tirés uniformément ; les cinq autres pays utilisent les compositions initiales du moteur. Ces départs sont distincts des essais de réglage et de la validation 175.

| Mesure | Version 175 | Version 176 |
|---|---:|---:|
| Victoires collectives | 1 106 (92,17 %) | 1 121 (93,42 %) |
| Défaites par crise mondiale | 86 | 69 |
| Défaites à la limite T30 | 8 | 10 |
| Prestige moyen par pays et partie | 23,75 | 23,80 |
| Financement par équipe et partie | 2,61 | 3,26 |
| Soutien médical par équipe et partie | 2,99 | 2,99 |
| Démarche diplomatique par équipe et partie | 0 | 0,96 |

L'écart de victoire est de +1,25 point de pourcentage, IC apparié à 95 % [-0,75 ; +3,25]. L'écart de prestige est de +0,04, IC [-0,22 ; +0,31]. Cette validation confirme de nouveaux choix d'appui sans démontrer une hausse des résultats. Les trois propositions de règles sont des variantes isolées du laboratoire : elles ne sont pas intégrées au moteur publié. Tous les effets et coûts actuels sont conservés.

Les huit combinaisons de règles et la version 175 représentent 10 800 campagnes ; des retraits appariés de chacune des 23 actions actives, des trois faveurs et des trois modules ajoutent 20 880 campagnes. Pour ces retraits, seule l'équipe focale est privée de l'action. Les cinq autres pays gardent leurs possibilités. Intervalles bootstrap appariés, 5 000 rééchantillonnages par statistique, graine 261706 ; le nombre de départs indépendants est 1 200, pas 31 680. La crise est comptée en priorité lorsque la crise et le tour 30 arrivent ensemble.

Les données et les conclusions détaillées sont dans le [bilan de validation](bb1-support176-validation.json). Les 431 tests passent, dont dix régressions ciblant les faveurs, les modules, l'arme et l'absence d'information cachée. Les historiques Facile/Normal/Expert restent identiques. Douze campagnes complètes (266 résolutions) vérifient l'équivalence de l'instrumentation à chaque tour ; 72 contrôles isolent les effets exacts des variantes.

Les retraits gardent des gains de prestige incertains pour le financement (+0,57, IC [-0,31 ; +1,48]) et les trois modules : IA -0,32 [-0,95 ; +0,30], relais +0,19 [-0,30 ; +0,66], logistique +0,67 [-0,28 ; +1,59]. Ils mesurent les substitutions de la politique entière, pas un effet isolé d’un bonus. Le médical conserve un gain focal de +1,06 [0,17 ; 1,94]. Les règles médicales à +12 appliquées aux six pays diminuent les victoires de 5,83 points de pourcentage [-8,00 ; -3,67], sans réduire les demandes (2,99 par équipe). Les intervalles de retrait sont exploratoires et non corrigés pour les comparaisons multiples.

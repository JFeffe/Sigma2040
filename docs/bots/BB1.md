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
- 415 tests passent, dont 19 tests BB1/intégration. Neuf campagnes complètes couvrant
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

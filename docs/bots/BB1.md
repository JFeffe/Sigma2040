# BotBrillant1 (BB1) — évaluation par le PO

Cette branche ajoute **BotBrillant1 (BB1)** comme quatrième choix de bot, à côté de
**Facile, Normal et Expert**. Normal reste le choix par défaut. Les anciennes
sauvegardes restent sur leur difficulté d’origine ; aucun remplacement automatique.

## Tester en solo

Avec Node.js 20 ou supérieur, depuis ce dépôt :

```sh
git fetch origin
git switch feat/bot-brillant-1
node scripts/preview-bb1.mjs
```

Ouvrir <http://127.0.0.1:4180>, choisir **Nouvelle partie**, son pays et quatre agents,
puis **BotBrillant1 (BB1)** dans Difficulté, et lancer l’opération.
Le port 4180 utilise un stockage navigateur distinct du site de production.
Le script ne nécessite aucune installation de dépendance.

## Multijoueur

L’hôte peut choisir BB1 dans le salon avant de lancer la campagne. Ce choix s’applique
aux places contrôlées par l’ordinateur ; les humains restent manuels. Tous les participants
doivent utiliser cette branche. Le serveur d’aperçu ci-dessus sert le client solo seulement :
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

La branche est destinée à l’évaluation. Elle ne publie pas le jeu de production et ne change
pas son numéro de build. La publication décidée par le propriétaire devra suivre AGENTS.md
(numéro de build, notes de version et versions de cache alignées).

Le [laboratoire statistique](https://github.com/JFeffe/Sigma2040/tree/feat/stats-dashboard/docs/bots)
est sur une branche indépendante : il peut être révisé sans intégrer BB1.

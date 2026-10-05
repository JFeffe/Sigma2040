# BotBrillant1 (BB1) — évaluation par le PO

Cette branche ajoute **BotBrillant1 (BB1)** comme quatrième choix de bot, à côté de
**Facile, Normal et Expert**. Normal reste le choix par défaut. Les anciennes
sauvegardes restent sur leur difficulté d’origine ; aucun remplacement automatique.

## Recette du PO : sur le serveur

Le PO teste BB1 depuis une **URL hébergée**, sans installer Node.js, cloner le dépôt
ni lancer un serveur sur son ordinateur. La branche à déployer est
`feat/bot-brillant-1` ; aucune fusion dans `main` n’est nécessaire pour sa recette.

**État actuel : branche poussée, URL de test pas encore configurée.** Le dépôt GitHub
ne contient actuellement aucun workflow de déploiement ni environnement déployé.
Le site de production indiqué dans le README est hébergé sur Sites ; sa gestion
n’est pas accessible au compte Sites connecté à ce chantier. L’environnement de test
et l’accès à son hébergeur doivent être identifiés avant de fournir une URL validée.

L’environnement de test doit déployer le client et son relais multijoueur D1 avec
une base de test distincte. Tous les participants utilisent la même URL/version.
Une fois l’URL disponible : **Nouvelle partie → pays et quatre agents → BotBrillant1
(BB1) → Lancer l’opération**. En multijoueur, l’hôte choisit BB1 dans le salon avant
le lancement ; les places humaines restent manuelles.

Le propriétaire conserve le choix de la fusion et de la publication en production.
Une branche GitHub poussée ne constitue pas, à elle seule, un déploiement jouable.

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

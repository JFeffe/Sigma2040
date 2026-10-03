# Sigma 2040

Jeu d’espionnage et de stratégie au tour par tour, en français, solo et multijoueur bêta.

**[Jouer à Sigma 2040](https://sigma-2040.docile-hero-2836.chatgpt.site)** · **[Versions et nouveautés](https://github.com/JFeffe/Sigma2040/releases)**

## Version importée

Version 161 : jeu complet, portraits et illustrations, musiques, serveur multijoueur, tests et documentation. Cet import GitHub ne change pas la version du jeu en ligne.

## Organisation

- `dist/client/` : jeu et ressources graphiques/audio ; les sources sont directement dans ce dossier.
- `dist/server/index.js` : relais HTTP multijoueur utilisant une base D1.
- `db/` et `migrations/` : schéma et migrations, lorsqu’applicables.
- `tests/`, `scripts/`, `benchmarks/` : tests, simulations et outils.
- `docs/` : documentation, résultats de simulations et historique de développement.
- `main` : version de référence du jeu.
- `mods` : branche de développement des mods, avec le Bureau des enquêtes et son manifeste dans `mods/bureau-des-enquetes/`.

## Développement

Node.js 22 ou supérieur recommandé.

```sh
npm ci
npm test
npm run dev
```

Le serveur Vite sert le client pour le développement. Il ne lance pas le relais multijoueur D1. Le jeu publié conserve son hébergement Sites ; GitHub n’héberge pas automatiquement le jeu ni sa base de données.

## Mods

Le Bureau des enquêtes existant est activable depuis **Menu principal → Mods**. Il reste livré avec le jeu pour préserver cette fonction. Sa branche dédiée `mods` contient le jeu compatible et les instructions pour le modifier ; ce n’est pas encore un système de téléchargement de mods depuis GitHub.

## Publications

À chaque nouvelle version poussée sur `main`, le workflow crée une GitHub Release avec les notes de version correspondantes et le lien cliquable du jeu. Voir [la procédure de publication](docs/PUBLICATION.md).

Les anciens détails de développement sont conservés dans [l’historique](docs/HISTORIQUE-DEVELOPPEMENT.md) ; certaines règles historiques ont été remplacées dans les versions suivantes. Les règles actuelles sont décrites par le manuel intégré et le code.

## Crédits

Portraits et illustrations créés pour le projet. Les attributions et licences des ressources tierces sont conservées dans `dist/client/assets/`, notamment Natural Earth, Three.js, D3 et les polices Barlow. Aucun changement de licence du jeu n’est effectué par cet import.

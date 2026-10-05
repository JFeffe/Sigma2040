# Laboratoire statistique Sigma 2040

## Accès depuis GitHub

Cette branche contient l’interface, les résultats et les journaux détaillés. Le dépôt reste
privé : le PO et les collaborateurs autorisés peuvent consulter et télécharger ces fichiers.
GitHub affiche le code HTML, pas une application interactive. Pour ouvrir le laboratoire :

```sh
git fetch origin
git switch feat/stats-dashboard
node scripts/serve-normal-bot-dashboard.mjs docs/bots/explorer 4177
```

Avec Node.js 20 ou supérieur, ouvrir <http://127.0.0.1:4177/dashboard.html>.
Aucune installation de dépendances ni connexion à un service tiers n’est requise.
Un hébergement GitHub Pages n’est pas activé : sa configuration et l’exposition éventuelle
du contenu privé relèvent du propriétaire du dépôt.

## Libellés durables

| Libellé | Signification | Identifiant d’archive |
| --- | --- | --- |
| BotBrillant1 — 6 bots | Six exemplaires du candidat retenu, BB1 | `v3` |
| Prototype compétitif — 6 bots | Six exemplaires du prédécesseur expérimental | `v2` |
| BB1 face à 5 prototypes | Pays suivi contrôlé par BB1, cinq adversaires expérimentaux | `mixed` |
| BB1 — 48 compositions d’équipe | Étude de compositions avec six BB1 | `benchmark` |

Le **Prototype compétitif n’est pas le bot Normal du jeu publié**. Les identifiants
techniques restent stables pour préserver les liens, graines et fichiers existants.
Le catalogue est conservé dans `tools/bot-explorer/populations.json` et les métadonnées.

## Données et lecture

- Validation : 720 départs × trois populations = 2 160 parties avec journal détaillé.
  Les replays ont reproduit les issues, durées et six scores de l’archive. BB1 : 660/720
  victoires collectives (91,7 %), sans changement de bot pour produire ce dashboard.
- Benchmark : 48 équipes × 72 départs = 3 456 parties supplémentaires, sans journal
  tour par tour. Chaque agent apparaît dans 12 compositions ; six pays et quatre chefs
  tournent. Les équipes ont été sélectionnées sans consulter leurs résultats.
- Les 72 graines sont réutilisées entre équipes : les 3 456 lignes ne sont pas indépendantes.
  Les intervalles par équipe sont indicatifs, le classement n’établit pas une supériorité causale.
- Victoire individuelle : victoire collective ET premier rang du pays suivi, ex æquo fractionnés.
  Les moyennes de prestige, rang et durée incluent les défaites.
- Les filtres d’agents se combinent avec ET. Les comparaisons avec/sans un agent et les duos
  restent descriptifs : elles ne séparent pas ses effets de ceux de ses partenaires.
- Les comparaisons utilisent les mêmes graines. Filtrer sur l’issue de BB1 crée une comparaison
  conditionnelle, pas une nouvelle mesure globale de performance.
- Les opérations automatiques et interruptions sont exclues du taux de jets. Le prestige immédiat
  ne contient pas les récompenses différées des protections ; elles figurent au registre.
- Les jalons d’enquête concernent le pays focal. Les pays initiaux des suspects sont observés
  après simulation et ne sont pas fournis au bot.

Les vues proposent recherche, tri, pagination, filtres croisés, exports CSV et liens vers les
parties. Le journal présente les scores des six pays, la crise, les ordres et leurs justifications,
les opérations résolues, l’état des agents et le registre de prestige.

## Maintenance et reproduction

Les modules historiques nécessaires sont figés sous `docs/bots/reference/build173/`.
Ils servent uniquement aux simulations : **cette branche ne modifie aucun fichier de `dist/client`**.
La branche jouable de [BB1](https://github.com/JFeffe/Sigma2040/tree/feat/bot-brillant-1/docs/bots/BB1.md)
est indépendante et opt-in.

```sh
node scripts/build-bot-explorer-ui.mjs
node --test tests/bot-explorer.test.js
node scripts/audit-bot-explorer.mjs
# Rejouer tous les résultats et journaux (plusieurs minutes) :
node scripts/build-bot-explorer-data.mjs
```

Les assets éditables sont sous `tools/bot-explorer/` ; le script UI les copie dans
`docs/bots/explorer/`. Les résultats compressés (~70 Mo) sont versionnés et les journaux
chargés à la demande. Les noms affichés ne doivent plus être « nouveau », « précédent »
ou un simple numéro de révision. Les références exactes restent dans la méthode et les exports.

Le design d’exploration s’inspire du [Stats Lab partagé](https://claude.ai/artifact/8EheCj5RsVuuHD5D2ercwb).
Ses résultats concernent un autre build/protocole et ne sont pas mélangés aux nôtres.

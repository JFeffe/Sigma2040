# Laboratoire statistique Sigma 2040

## Ouvrir le dashboard

**[Accéder au dashboard interactif](https://jutrasimon.github.io/sigma2040-stats/)**

Aucune installation ni serveur local à lancer. Le dashboard est hébergé sur GitHub Pages,
avec accès public autorisé par le propriétaire des données. Le dépôt privé du jeu reste privé.

[Dépôt public de publication](https://github.com/jutrasimon/sigma2040-stats) : interface
et résultats fictifs des simulations uniquement, sans code du jeu jouable ni sauvegardes humaines.
Les sources de développement et les outils de reproduction restent dans cette branche.

Pour mettre à jour le site, synchroniser les fichiers de `docs/bots/explorer/` vers la branche
`gh-pages` du dépôt de publication, et copier `dashboard.html` vers `index.html`.
Ne pas copier les modules du jeu ni le contenu de `docs/bots/reference/` dans le dépôt public.

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

## Interpréter les écarts entre pays

La vue d’ensemble conserve les résultats du **pays suivi** : dans la validation BB1,
120 parties distinctes par pays (72 tirages au hasard, 24 complémentaires et seulement
8 par test de compétence faible). Ces sous-échantillons ne constituent pas une comparaison
sur les mêmes campagnes. La vue **Pays** ajoute maintenant les six pays sur les mêmes
parties sélectionnées, avec des scores finaux complets et des ex æquo fractionnés.

L’audit `node scripts/audit-country-balance.mjs` produit `country-balance-audit.json`.
Sur les mêmes 720 campagnes BB1 : États-Unis 18,17 %, Chine 16,55 %, Royaume-Uni 15,32 %,
France 13,96 %, Inde 13,87 %, Russie 13,80 %. La somme vaut le taux de victoire collective
91,67 % : les défaites ne produisent aucune victoire individuelle.

Les bonus nationaux sont désactivés, mais la proximité n’est pas parfaitement symétrique :
Canada et Brésil sont à un tour des seuls États-Unis ; Allemagne de trois puissances ;
Turquie de cinq ; Japon de deux ; Afrique du Sud d’aucune. La concurrence locale peut donc
différer malgré deux destinations proches par puissance. Cela constitue une hypothèse
explicative, pas une mesure de l’effet causal de la géographie.

Autre limite du protocole : le pays focal tourne selon l’indice de graine et reste associé
à un résidu fixe modulo six. Certaines initialisations utilisent aussi ce résidu. Une étude
causale dédiée doit croiser pays, équipes et scénarios, sans attacher un pays à une série
particulière de graines. Aucun équilibrage du jeu n’a été changé par cet audit.

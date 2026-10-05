# Tests complémentaires des réglages acceptés — 2026-10-04

Aucun réglage du jeu modifié ou publié pendant ces tests. Source : v164 plus les
ajustements combinés Easy/Normal sélectionnés ; Expert reste la politique publiée.
4 000 campagnes nouvelles au total, toutes entièrement contrôlées par les NPC.
Toutes les sauvegardes finales ont été validées. Les simulations ne prouvent pas
l'expérience humaine, la difficulté ressentie ou le plaisir des fins de partie.

## 1. Scénarios inédits

1 000 graines 200001–201000 par niveau, non utilisées dans les ajustements.
Pays initial tournant par seed modulo six ; équipe initiale Iris/Bishop/Amber/Lei.

| Niveau | Victoire collective | Crise | Tour 30 |
|---|---:|---:|---:|
| Facile | 21,0 % | 23,3 % | 55,7 % |
| Normal | 32,6 % | 16,3 % | 51,1 % |
| Expert | 51,9 % | 10,3 % | 37,8 % |

Écarts de victoire par rapport aux chiffres acceptés : +0,7, −1,3 et −2,7 points.
Les deux séries sont des estimations ; pas d'indice suffisant de dérive pour changer
les réglages sur cette seule comparaison. Conserver les réglages.

## 2. Compositions (pilote Normal, 200 graines identiques)

Seule l'équipe du pays initial est remplacée ; les cinq autres équipes gardent le
recrutement natif. Tout le monde est piloté par la même IA. Ce n'est pas un classement
universel des personnages ni une comparaison de joueurs humains spécialistes.

| Équipe | Agents | Victoires collectives | Prestige moyen du pays testé |
|---|---|---:|---:|
| Polyvalente | Iris, Bishop, Amber, Lei | 33,5 % | 24,84 |
| Enquête | Bishop, Apéro, Dante, Rocket | 30,5 % | 23,77 |
| Intervention | Lei, Mercer, Dante, Raven | 40,5 % | 25,32 |
| Soutien | Mira, Midnight, Selin, Rocket | 32,0 % | 25,12 |

L'équipe intervention est prometteuse, mais le pilote reste limité à 200 scénarios
et quatre compositions. Aucun nerf ni buff recommandé à ce stade.

## 3. Stratégies (pilote Normal, 200 graines identiques)

Les deux modes expérimentaux changent le poids attribué à la protection dans le
planificateur de tous les pays. Ce ne sont pas de nouvelles stratégies complètes.

| Priorité | Victoire | Crise | Tour 30 |
|---|---:|---:|---:|
| Équilibrée | 33,5 % | 18,0 % | 48,5 % |
| Enquête | 39,0 % | 48,0 % | 13,0 % |
| Défense | 0,0 % | 1,5 % | 98,5 % |

La défense seule ne termine pas les enquêtes. L'enquête intensive expose à la crise.
Conserver l'arbitrage équilibré sélectionné.

## 4. Six superpuissances

Prestige moyen sur les 1 000 parties Normal : FR 25,23 ; US 26,13 ; CN 25,63 ;
IN 25,78 ; RU 25,64 ; GB 25,34. Écart extrême de 0,90 point, environ 3,6 % du
score le plus bas. Pas de déséquilibre majeur détecté sur cette mesure ; cela ne
constitue pas une preuve d'équivalence sur tous les indicateurs. Pas de changement.

## 5. Défaites au tour 30

| Condition manquante | Facile (557) | Normal (511) | Expert (378) |
|---|---:|---:|---:|
| Architecte seulement | 328 | 243 | 254 |
| Deux cellules démantelées seulement | 79 | 88 | 51 |
| Les deux | 150 | 180 | 73 |

Dans 423 des 511 défaites Normal au tour 30, l'Architecte est encore libre.
État du dossier le plus avancé d'un même pays : 10 sans piste ; 20 sans identité
confirmée ; 118 sans deux preuves recevables dont une vérifiée ; 105 sans préparation ;
80 avec préparation mais position expirée ; 90 avec dossier complet et position valide.
Les conditions ne sont jamais recomposées à partir de pays différents.

38 de ces 423 parties contiennent au moins une tentative d'arrestation de l'Architecte
échouée ; ce nombre recoupe les catégories précédentes et ne prouve pas que le jet
est la seule cause de défaite. Un dossier complet ne garantit pas la disponibilité
d'un agent sur place. Les causes de placement et de calendrier ne sont pas isolées
par ce classement. Si l'on souhaite plus tard réduire les fins au tour 30, étudier
la finalisation et l'acheminement des agents avant d'augmenter les chances aux dés.

Reproduction : `node scripts/audit-accepted-holdout.mjs LEVEL baseline OUTPUT`.
Pilotes Normal : variantes investigators, intervention, support,
strategy-investigation et strategy-defense. Données agrégées :
`accepted-policy-holdout-results.json`.

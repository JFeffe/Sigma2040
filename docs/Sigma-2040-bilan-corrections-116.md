# Sigma 2040 — Corrections et simulations, révision 116

## Changements intégrés

- Passage clandestin : **+0 exposition à la réussite, +10 à l’échec**, avec ou sans arme et avec ou sans Infiltration. L’exposition préexistante n’est pas effacée. Les risques de blessure, capture et décès subsistent. Menus, prévisions, wiki et description du talent Infiltration cohérents.
- L’explication d’indisponibilité apparaît **au-dessus de Confirmer l’ordre**.
- Préparer une arrestation : confirmation bloquée sur une cible déjà préparée. Action grisée lorsque aucune cible locale ne permet une préparation. Deux préparations simultanées ne donnent qu’une réussite ; la seconde est interrompue sans nouveau jet.
- Intimidation : **1/1 restante ou 0/1 restante** pour la cible choisie, indication dans le choix des cibles, et nombre de cibles disponibles lorsque aucune cible précise n’est sélectionnée. Une réussite par cible et équipe ; les échecs permettent une nouvelle tentative.
- Hack d’un pays : le rapport affiche le **pays ciblé**, en conservant le QG comme origine.
- Sélection d’agent : vérification de concordance entre la fenêtre affichée et l’agent confirmé, en solo et multijoueur. Les tests de deux agents au même endroit, avec deux cibles distinctes, conservent correctement acteur, cible et rapport. Aucune inversion reproduite ; cette protection ne constitue pas la preuve que tous les chemins d’interaction visuelle sont exempts de défaut.
- Bilan : onglet **Agents**, sélection d’un personnage et détail par catégorie/action : total, réussites, échecs, interruptions, taux réel. Rôle du personnage et activité dominante affichés. Les agents morts ou relevés restent dans le suivi. Les actions automatiques sont séparées du taux avec jet.
- Bilan : onglet **Appuis & gouvernement**, activations, annulations, crédits ou confiance dépensés, remboursements. Le Hack d’un pays et les protections d’agent restent aussi comptabilisés dans les missions.
- Chronologie : matrice compacte, une colonne par tour, six lignes de pays, marqueurs et détail sélectionnable. Plus de vaste frise horizontale à faire défiler. Le détail peut nécessiter du défilement vertical sur une petite fenêtre.
- Alerte rouge persistante à **80 % de crise**, ou plus tôt si les attaques annoncées dues ce tour et la hausse passive pourraient conduire à 100 %. Tient compte des protections de tous les pays. Le texte signale un risque, pas une défaite certaine : les ordres du tour peuvent encore changer l’issue.
- Nouvelles parties : **14 attaques au lieu de 10**, tous les **2 tours** de T3 à T29, contre tous les 3 tours auparavant. Les reports et changements de cible de Fracture subsistent. Une cellule démantelée perd toujours ses attaques restantes ; aucune cellule n’est ressuscitée. Les sauvegardes en cours conservent leur calendrier déjà tiré.
- PNJ : choix aléatoire de quatre personnages validés, sans doublon dans une équipe, pondéré pour renforcer la capacité actuellement la plus faible. Répartition reproductible avec la graine de la partie.
- PNJ : analyste au QG, coordination des collectes/vérifications/préparations/interventions, actions combinées, mandat avant intervention, récupération, gestion d’exposition, protection anticipée, appuis et faveurs gouvernementales utiles. Évite les extensions de hack inutiles et les affectations identiques superflues.

## Vol prioritaire : résultat de la vérification

Le module actuellement nommé **Logistique prioritaire** coûte 3 crédits et reste actif **2 tours, tour d’activation inclus**. Il réduit d’un tour les nouveaux voyages sous passeport, avec un minimum de 1 tour. Aucun effet sur les passages clandestins ni sur les voyages déjà lancés. Le compteur passe donc normalement de 2 à 1 après une fin de tour. L’historique disponible ne montre pas de réduction récente de cette durée : elle était déjà de 2 tours dans la version d’introduction retrouvée. Aucun changement de règle appliqué à ce module.

## Méthode de simulation

**3 100 parties** exécutées par le script reproductible `scripts/simulate.mjs`, réparties entre référence, mise au point, comparaison de politiques et validation. Les mêmes graines sont volontairement réutilisées pour certaines comparaisons. Cela ne représente donc pas 3 100 scénarios initiaux indépendants. La suite de tests comprend également ses propres simulations, exclues de ce total.

- Référence : 300 parties, ancien moteur et ancienne IA, calendrier de 10 attaques.
- Premier essai : 100 parties avec la nouvelle logique, avant l’ajustement final des mandats et du calendrier.
- Mise au point : 4 lots de 300 parties ; priorités de défense différentes, calendrier de 14 attaques. Le lot `balanced.json` est une version intermédiaire trop orientée protection ; `balanced60.json` correspond au réglage retenu.
- Validation finale : **600 graines nouvelles, 1001–1600**, six équipes automatisées, réglage retenu.
- Comparaison individuelle : 3 × 300 parties, graines **2001–2300** identiques, rotation du pays étudié. Seule sa priorité varie ; ses cinq adversaires gardent le réglage retenu. Même équipe humaine de référence pour les trois politiques.

Ces expériences testent des politiques heuristiques, pas toutes les stratégies possibles. Les taux ne prédisent pas directement la difficulté face à un joueur humain. Les changements de recrutement et de calendrier empêchent d’attribuer toute la différence avec la référence à un seul correctif.

## Ancien comportement et version finale

| Indicateur | Référence, 300 parties | Validation finale, 600 parties |
|---|---:|---:|
| Victoire collective | 0,7 % | 84,3 % |
| Durée moyenne | 17,3 tours | 25,3 tours |
| Arrestations par partie | 2,02 | 6,39 |
| Équipes sans prestige | 22,8 % | 0,2 % |
| Attaques exécutées par partie | 5,28 | 7,97 |
| Part des attaques exécutées interceptées | 25,8 % | 86,8 % |

Sur les 600 parties finales : **506 victoires, 5 défaites par crise et 89 défaites à l’échéance**. L’IA défend désormais efficacement ; la contrainte principale devient la clôture des enquêtes à temps. Ce résultat justifie de ne pas augmenter arbitrairement encore la crise passive.

## Comparaison des stratégies individuelles

| Priorité de l’équipe étudiée | Prestige moyen | Première au prestige, égalités incluses | Arrestations propres / partie | Victoire collective |
|---|---:|---:|---:|---:|
| Enquêtes | 18,28 | 20,0 % | 1,38 | 86,0 % |
| Équilibre retenu | 17,52 | 17,0 % | 1,01 | 85,3 % |
| Défense renforcée | 14,88 | 8,3 % | 0,33 | 77,0 % |

**Meilleure des trois politiques testées : priorité aux enquêtes.** Elle obtient davantage de prestige et d’arrestations. La défense systématique mobilise trop de voyages et deux tours de préparation par mission ; elle devient moins rentable lorsque plusieurs pays se partagent les mêmes 6 points. La défense reste nécessaire pour empêcher la crise de terminer la partie.

Conseil issu des tests : garder un bon analyste au QG, exploiter l’intimidation disponible puis le drone ou l’intrusion selon les talents et l’accès, préparer le mandat, et réserver la protection aux menaces accessibles et au danger réel de crise. Renforcer les jets déterminants plutôt que multiplier les soutiens sans effet concret.

## Points et actions — validation finale

Le prestige ci-dessous est tiré du registre des contributions, **pas** du simple delta affiché à la résolution d’une mission. Les 6 points d’une arrestation rémunèrent trois contributions distinctes ; une preuve authentifiée récompense son découvreur. Une protection réussie sans attaque ne rapporte aucun point.

| Source de prestige | Points cumulés, 600 parties | Points par partie |
|---|---:|---:|
| Attaques interceptées | 24888 | 41,48 |
| Preuves authentifiées | 16646 | 27,74 |
| Préparations décisives | 7666 | 12,78 |
| Localisations décisives | 7666 | 12,78 |
| Interpellations | 7666 | 12,78 |

| Action | Résolutions | Réussites | Échecs | Interruptions | Réussite hors interruptions |
|---|---:|---:|---:|---:|---:|
| Intimider | 17436 | 12193 | 4948 | 295 | 71,1 % |
| Drone | 15106 | 9803 | 4862 | 441 | 66,8 % |
| Intrusion numérique | 7239 | 4818 | 1564 | 857 | 75,5 % |
| Vérifier une preuve | 28989 | 24367 | 3625 | 997 | 87,0 % |
| Préparer une arrestation | 13489 | 7142 | 5657 | 690 | 55,8 % |
| Négocier une autorisation | 14976 | 9321 | 5655 | 0 | 62,2 % |
| Arrêter | 6547 | 3833 | 2296 | 418 | 62,5 % |
| Protéger | 19542 | 14337 | 5205 | 0 | 73,4 % |
| Hack d’un pays | 14480 | 10464 | 4016 | 0 | 72,3 % |
| Recueillir une preuve | 1211 | 762 | 317 | 132 | 70,6 % |
| Localiser | 5568 | 3252 | 1928 | 388 | 62,8 % |

Les taux ne sont pas un classement intrinsèque des actions : les agents, talents, fatigue, exposition et situations diffèrent. La faible fréquence de collecte simple signale que les actions combinées sont souvent préférées ; c’est un point d’équilibrage à surveiller, pas une preuve de leur supériorité universelle. Aucun coût ou bonus de ces actions n’a été modifié pour forcer les résultats.

## Secourisme — proposition, non appliquée

Aujourd’hui : 50 % de chance d’éviter une blessure lorsqu’un incident devrait blesser le porteur, sans protection contre capture ou décès ; soins au QG rendant 50 énergie au lieu de 40. Le talent n’accélère pas les soins et n’aide pas directement les coéquipiers. Il ne se manifeste que dans une situation déjà défavorable, ce qui explique son manque de présence.

**Proposition : ajouter « Premiers secours »**, action automatique de 1 tour réservée au porteur, sur lui-même ou un coéquipier blessé dans le même pays. Elle soigne la blessure et rend 20 énergie à la cible ; elle ne libère pas un captif et ne remplace pas un repos complet. Conserver les effets actuels. Cela crée un rôle de soutien identifiable et peut éviter un aller-retour au QG. La possibilité de se soigner soi-même évite de rendre le talent inutile lorsqu’un agent est isolé. À tester séparément avant intégration, notamment pour le coût énergétique de l’intervenant.

## Compatibilité et vérification

- 252 tests passent, dont scénarios nouveaux d’exposition clandestine, concurrence dans une même zone, préparation unique, destination du hack, confidentialité du bilan, remboursements, alerte de crise et durée de Logistique prioritaire.
- Chargement des sauvegardes et reproductibilité vérifiés. Les anciens totaux ne permettent pas de recréer exactement les statistiques par agent ou les activations passées : ces sections sont signalées comme partielles pour une ancienne sauvegarde.
- En multijoueur, les statistiques étrangères restent privées jusqu’à la fin de la partie.
- Contrôles de code et de contenu généré effectués. Pas de validation visuelle dans un navigateur réel pendant cette révision, ni de partie avec deux joueurs humains à distance.
- Données brutes et script conservés avec le projet dans `docs/simulations/r116/` et `scripts/simulate.mjs`.

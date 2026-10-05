# Revue des PNJ — version 160

## Décisions et effets

Le planificateur partage `options`, `missionFatigue` et `missionExposure` avec le joueur. Les chances, coûts et durées incluent ainsi les talents, la fatigue, les armes, le mandat, la coopération, le soutien numérique et Coordination. Il ne modifie pas les probabilités selon la difficulté.

- Énergie : coût total de la mission, Endurance compris, et fatigue projetée. Repos adapté à Endurance ; une intervention imminente peut passer avant un repos non critique.
- Exposition : espérance des gains en réussite/échec, Infiltration comprise, et seuil de risque projeté. Aucun avantage fictif pour les diminutions d’exposition.
- Talents : choix du meilleur analyste par probabilité réelle ; priorité au tacticien pour préparer ; arme envisagée pour une arrestation faible ; secouriste sur place évite un retour au QG inutile. Langues étrangères entre automatiquement dans les chances des planques et armes.
- Coordination : les équipiers planifient avant le départ du chef ; Expert peut envoyer un chef ou un spécialiste rejoindre un agent sur place.
- Enquête : respecte preuves disponibles, vérification, préparation, localisation valable jusqu’à l’intervention et cible déjà réclamée. Intrusion valorise aussi ses effets de soutien et de recherche. Pas d’inspection de l’authenticité cachée des preuves ni des déplacements non observés.
- Intimidation : conserve la limite d’une réussite par équipe/cible et évite les doublons prévisibles, même si plusieurs ordres restent autorisés pour le joueur.
- Menaces : temps de trajet effectif, fenêtre de protection et risque de crise. Priorité accrue à l’Architecte accessible et aux fuites annoncées.
- Soutien : vise les prochaines affectations, car les chances des ordres déjà confirmés sont figées ; activation du relais/logistique seulement en présence de bénéficiaires pertinents.
- Difficultés : Facile garde des priorités simples et aucun renfort payant. Normal attend une première vérification et réserve les renforts aux interventions. Expert mène davantage d’actions en parallèle, compare durée et risque, et peut renforcer l’enquête.

## Vérification et limites

Tests ciblés : calcul et application des quatre talents, réussite/échec, réservation/annulation/interruption du bonus tactique, migration idempotente de l’énergie restante, choix du tacticien et des soins, absence d’accès aux informations cachées. La suite existante couvre aussi les ordres multijoueurs et la restauration des parties.

Benchmark reproductible : `node scripts/benchmark-talents160.mjs /chemin/du/projet`. Six équipes autonomes de même niveau, six pays de départ et dix graines : 60 campagnes par niveau, 180 avant et 180 après. Les JSON sont dans `docs/simulations/r160`. L’état final de chaque partie passe la validation des sauvegardes.

| Mesure moyenne | Facile avant → après | Normal avant → après | Expert avant → après |
|---|---|---|---|
| Suspects arrêtés | 2,48 → 2,33 | 3,12 → 2,48 | 4,32 → 4,72 |
| Attaques interceptées | 9,62 → 8,15 | 11,30 → 12,15 | 10,67 → 10,20 |
| Attaques subies | 2,58 → 2,85 | 2,30 → 2,22 | 2,08 → 2,17 |

Résultats mixtes : Expert arrête davantage de suspects, Normal privilégie davantage la protection. Ce benchmark change simultanément les règles des talents et les décisions ; il n’isole pas l’effet causal du planificateur. Ces petites séries déterministes ne mesurent ni un taux de victoire contre un humain ni une amélioration universelle. L’IA reste une heuristique sans recherche exhaustive de plans à plusieurs tours. Les identités/niveaux des équipes et les hasards successifs influencent fortement les issues.

Contrôle visuel interactif non effectué : le navigateur requis par le workflow de prévisualisation n’est pas disponible dans cette session. Structure des cartes, boutons et biographies contrôlée par tests ; styles adaptatifs définis pour petits écrans.

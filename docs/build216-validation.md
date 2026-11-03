# Build 216 — Carte, alertes et archives

Six corrections d’interface, sans modification de l’équilibrage.

- Base réconciliée : GitHub `804fdf75b1b2e173ee097ca56a132c4b62189cda`, Site `e9bb46c593fd36c277e10e93bf1eaf43d09e6470`. Les 315 fichiers runtime existants ont les mêmes hashes Git.
- Report d’attaque causé par la protection : titre explicite au débriefing, bannière sur la carte et rappel dans les menaces. Les rapports restent visibles pendant le tour suivant, jusqu’à la prochaine résolution ; les attaques résolues/annulées sont exclues.
- Nationalité plus petite et pays actuel séparé sur les fiches compactes. Un trajet commencé indique son origine et sa destination sans prétendre que l’agent est arrivé.
- Archives du bilan : accès direct aux performances individuelles, choix d’agent et de pays, retour au bilan et journal séparé. Données historiques conservées.
- Hack de pays dans les actions rapides au QG ; sélection du pays et de l’opérateur avant confirmation.
- Cellule ÉCLIPSE : nom centralisé dans les fiches et le suivi coop.
- Vérification des preuves depuis le panneau pays : preuves des dossiers connus de ce pays, ou toutes au QG ; seuls les analystes propres disponibles au QG peuvent être affectés. Pièces déjà affectées et pays sans preuve bloqués.

Validation : suite complète `npm test` : 630 tests réussis ; test complémentaire de projection coop FR/US réussi (631 tests au total). Vérification navigateur : carte, raccourci hack et sélection de cible, archives après fin de campagne, changements d’agent et de pays. Correction de deux débordements observés sur la carte (bannière et hauteur des fiches).

# Build 215 — Réussite unifiée

- Source réconciliée : GitHub f0358d49ea906618fa90f60a48d05a54892c0370 et Site 4660cef8ea3c7722c50db8ec080e4b24aeae1ca3 ; fichiers runtime identiques avant modification.
- Formule unique : `50 + 7 × (stat − 5) + bonus − pénalités`. Suppression de la difficulté propre aux actions ; automatique à 100 %, limites et renfort existants conservés.
- Tous les modes, humains et bots. Aucun changement aux règles coopératives, aux conséquences des échecs ou aux décisions des bots.
- Anciennes missions affectées : probabilités enregistrées conservées. Nouvelles affectations : formule commune.
- Tests : `npm test` — 625 réussis, 0 échec. Couverture ajoutée pour toutes les actions et les trois modes, reprise de sauvegarde et aide intégrée. Attente Bishop actualisée ; scénarios aux seuils de BB1 réajustés pour conserver les probabilités testées.
- Historique des patch notes conservé. Toutes les références runtime v214 passent à v215.
- Comparaison BB2 préalable (2 200 simulations) : coop 1/500 → 3/500, régulier 127/300 → 134/300, avancé 121/300 → 130/300. Écarts de victoire non statistiquement concluants ; aucune compensation appliquée.

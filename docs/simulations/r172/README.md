# Rythme en Normal — version 172

800 campagnes automatiques : graines 1–200 pour chacune des quatre conditions, pays de départ alternés, même sélection de quatre agents. Cinq adversaires en Normal ; le pays du joueur suit une politique Normal ou Expert. Comparaison des moteurs v170 et v171 avec leurs propres calendriers de menaces. Le moteur v172 conserve les règles de v171.

| Calendrier | Politique du joueur simulé | Victoires | Tour moyen des victoires | Médiane | Victoires T20 ou avant | Défaites par crise |
|---|---|---:|---:|---:|---:|---:|
| v170 | Normal | 64/200 | 26,80 | 28 | 2/200 | 27/200 |
| v171 | Normal | 41/200 | 26,15 | 27 | 4/200 | 50/200 |
| v170 | Expert | 68/200 | 26,76 | 27 | 3/200 | 27/200 |
| v171 | Expert | 55/200 | 26,05 | 27 | 4/200 | 45/200 |

Une victoire au tour 20 est possible mais précoce dans ces simulations. Aucun motif ici pour allonger globalement les missions. La répartition plus espacée des menaces demande une surveillance de la difficulté défensive : moins de regroupements signifie aussi moins d’attaques couvertes par une même protection.

Limites : ces politiques automatiques ne reproduisent ni un joueur humain ni la coordination multijoueur. Graines communes, mais le nouveau tirage des pays consomme des nombres aléatoires supplémentaires : il ne s’agit pas de jets identiques mission par mission. Pas de modification de l’équilibrage dans cette publication. Les défaites à l’échéance complètent les totaux ; voir pace.json pour les résultats individuels et scripts/benchmark-pace172.mjs pour la méthode.

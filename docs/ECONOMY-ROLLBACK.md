# Économie facultative — version de test

## Point de retour

- Site : appgprj_6aaf0e54587c8191b611c0d7ecae6130
- Publication avant changement : version 82.
- Identifiant de version : appgprj_6aaf0e54587c8191b611c0d7ecae6130~appgver_946d4be4cdf8819197a773f14f22a434.
- Commit source : 86e91b571d5db2c683e799bb2c85721017f3755b.
- Tag local : backup-before-free-actions-v82.

La publication 82 et le commit restent conservés. Pour revenir au comportement
antérieur, redéployer cette version via Sites, sans réécrire l’historique Git.
Pour reprendre ensuite les développements, restaurer les fichiers de ce commit
dans un nouveau commit (ne pas forcer la branche distante).

La première ancienne campagne solo chargée conserve ses octets originaux dans
`sigma2040-before-free-actions-v82`. Aide permet d’exporter cette copie pour la
réimporter après retour à la version 82. Ne pas importer une campagne contenant
les nouveaux renforts dans l’ancien moteur. La première sauvegarde multijoueur reprise est également conservée dans
`sigma2040-multiplayer-before-free-actions-v82` et exportable depuis le salon.
Le protocole réseau passe à 2 : les anciens salons sont migrés à la reprise,
mais les clients doivent tous recharger le jeu pour échanger des commandes.

## Règles de test

6 crédits au départ ; revenu fixe +2/tour ; plafond de revenu 18. Missions et
recrutement gratuits. Renfort unique : 6 crédits, +10 points sur la chance de
base bornée, plafond 90 %, uniquement pour les actions avec jet. Durées,
fatigue, exposition, modules et prérequis inchangés. IA 4, sentinelle 5,
influence interne 6, décisions et coopérations payantes inchangées. L’influence
interne ne modifie plus les revenus ; son intérêt devra être réévalué au test.

Les anciennes réserves et missions déjà payées ne sont pas réécrites ; leurs
coûts enregistrés restent remboursables. Les revenus ne réduisent jamais une
réserve supérieure au plafond. Les nouvelles parties sont nécessaires pour
évaluer la rareté des renforts. Les jets et la graine ne sont pas relancés.

Un renfort est payé à l’affectation, remboursé une seule fois si la mission est
annulée avant résolution, consommé en cas de réussite, échec ou interruption.
Annuler un soutien numérique obtenu ne rembourse pas son renfort consommé.
Les PNJ recrutent sans budget et réservent les renforts aux missions importantes.

# Validation — économie facultative

## Résultats

- Référence avant changement : 173 tests réussis.
- Après changement : 184 tests réussis, aucune erreur.
- 100 campagnes déterministes complètes, sauvegarde/relecture à chaque tour :
  37 victoires, 63 défaites (référence : 35/65). Budgets non négatifs, équipes
  de quatre postes au maximum, campagnes terminées avant ou au tour 40.
- Tous les ordres disponibles testés à zéro crédit, puis chaque ordre avec jet
  testé avec le renfort. Actions automatiques et plafond : achat interdit.
- Facturation unique, missions de plusieurs tours, annulations avant/après début,
  double annulation, insuffisance de crédits, plafonds 10/90 %, réussite/échec.
- Recrutement gratuit, délai de deux tours, poste occupé par un agent capturé.
- Drone : deux tours, module occupé/libéré, aucune reconnaissance après annulation.
- Hack : durée inchangée, aucun revenu, renfort consommé même si soutien annulé.
- IA : le retrait du bonus conserve correctement le renfort payé, même près du
  plafond, après sauvegarde/relecture.
- Anciens ordres et réserves préservés, remboursements au-delà du plafond conservés,
  migration idempotente, sauvegarde originale conservée avant écriture.
- Multijoueur : propriété des agents, autorité hôte, facturation/remboursement,
  doublons, reprise, protocole ancien rejeté sans mutation.
- Interface simulée avec JSDOM : menu/continuer/personnel, renfort 0→6 crédits et
  50→60 %, confirmation et autosauvegarde, deuxième mission gratuite à zéro,
  annulation/remboursement, recrutement et gouvernement.

## Limites

Pas de contrôle visuel dans un navigateur réel ni de partie réseau à distance
entre deux personnes. Le relais et son transport disposent de tests automatisés.
Les simulations ne représentent pas le taux de victoire humain. Équilibrage
à juger sur une nouvelle partie : les anciennes réserves ne sont pas amputées.
Influence Interne reste disponible au même coût, mais ne procure plus de revenu :
son utilité est un point à reprendre après ce premier test.

## Retour arrière

Voir ECONOMY-ROLLBACK.md. La publication 82 et son commit sont conservés.

# Criminels variables — version 173

Chaque nouvelle partie solo ou multijoueur tire sans remise six identités parmi les douze criminels. L’Architecte est exclu de ce tirage et toujours ajouté. Les six identités occupent les six emplacements de campagne existants : deux par cellule. Le tirage utilise un flux aléatoire indépendant ; le placement, les menaces, les faux documents, les jets de mission et les décisions IA ne consomment aucun tirage supplémentaire.

Les identités sont persistées dans `suspects[].templateId`, indépendamment des identifiants de dossiers `s0` à `s5`. Les preuves portent la même identité afin que leurs intitulés restent corrects dans les vues solo et multijoueur. Le validateur rétablit les noms et les rôles depuis le catalogue, rejette un tirage incomplet, un doublon ou une identité inconnue, et conserve les parties anciennes sans nouveau tirage. `s6` reste réservé à l’Architecte. Le protocole multijoueur 16 transmet les identités aux invités et recharge les salons du protocole 15.

| Criminel | Rôle | Preuve 1 | Preuve 2 | Preuve 3 |
| --- | --- | --- | --- | --- |
| Sable | Transactions clandestines | Virements d’une société de conseil écran | Agenda chiffré des négociations | Déposition d’une intermédiaire financière |
| Rook | Transport clandestin | Factures de transit sous fausse identité | Relevés des balises des convois | Déposition d’un chauffeur de relève |
| Nyx | Communications chiffrées | Paiements de serveurs relais anonymes | Archives d’un relais de communication | Déposition d’une opératrice réseau |
| Silas | Blanchiment de capitaux | Mouvements d’un fonds de placement écran | Grand livre des transferts dissimulés | Déposition d’un auditeur interne |
| Vega | Logistique de terrain | Bordereaux de location des dépôts | Carnet des itinéraires de livraison | Déposition d’une gestionnaire d’entrepôt |
| Onyx | Vol de données sensibles | Paiements d’une vente de données volées | Journal d’accès aux archives sécurisées | Déposition d’un receleur de données |

Les trois faux restent attribués à trois dossiers distincts parmi les sept présents, comme avant cette version. Chaque faux occupe l’une des deux premières positions ; la troisième pièce est authentique. Les liens de déduction suivent le partenaire effectivement présent dans la cellule. Aucun coût, chance, délai, prestige, nombre de menaces ou condition de victoire n’est modifié.

## Vérification

- 300 graines : six identités distinctes, couverture des douze criminels, deux membres par cellule, six pays secondaires, Architecte permanent et trois falsifications.
- Portraits, biographies, trois pièces par identité, déductions entre partenaires présents, sauvegardes anciennes/nouvelles et projections multijoueurs vérifiés.
- Comparaison avec la version 172 sur 30 campagnes complètes (10 par difficulté), soit 829 tours : état de jeu identique à chaque tour pour les jets, agents, arrestations, preuves/authenticité, menaces, crise, scores, budgets et connaissances hors textes narratifs.

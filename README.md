# Publication GitHub — build 179

[Jouer à Sigma 2040](https://sigma-2040.docile-hero-2836.chatgpt.site)

Les nouvelles parties réunissent quatre superpuissances choisies parmi six : un humain et trois PNJ en solo ; deux humains et deux PNJ, trois humains et un PNJ, ou quatre humains en multijoueur. Les pays PNJ sont tirés au sort parmi les pays non choisis.

Le menu Mode de jeu, près de la difficulté, propose Régulier par défaut et Avancé. En Avancé, confirmez d’abord votre pays, puis choisissez les seize agents exclusifs lors d’un repêchage aléatoire en serpentin (1–4, 4–1, 1–4, 4–1). Après le repêchage, réorganisez vos quatre agents, désignez le premier comme Chef et confirmez l’équipe. L’hôte attend toutes les confirmations avant de lancer la partie. Le repêchage multijoueur et les équipes sont conservés après export, déconnexion et reprise du salon.

Un passage clandestin réussi remet l’exposition à zéro. La relève en Avancé propose les anciens agents hors des seize du repêchage, avec réservation exclusive pour les humains et les PNJ. Le bouton Renforts & relève a été retiré du menu Agents ; les postes vacants et les annonces de décès permettent toujours de recruter.

Les campagnes déjà commencées conservent leurs participants. Toutes les corrections des builds 177 et 178 restent incluses. Les fichiers `dist/client/` et `dist/server/` publiés sont identiques à ceux du dépôt GitHub pour ce build.

Validation du build 179 : `npm test`, 468 tests réussis, dont les parcours solo et multijoueur du repêchage, les quatre formats de participants, les reprises de salon, les remplacements exclusifs et la remise à zéro de l’exposition.

BotBrillant1 (BB1) est disponible comme quatrième choix d’IA en solo et en multijoueur. [Guide BB1](docs/bots/BB1.md). La version 176 améliore ses choix gouvernementaux, ses modules et la recherche d’arme.

# Sigma 2040 — Ligne de faille

Prototype de jeu de stratégie solo et multijoueur bêta, en français. Site avec relais HTTP et base D1 pour les salons. Le client et ses ressources sont dans `dist/client/`, le relais dans `dist/server/index.js`. L’hôte conserve le calcul et la sauvegarde intégrale sur son appareil.

## Jouer

Sélectionner une puissance, la difficulté et le mode de jeu. En Régulier, choisir librement quatre agents ; en Avancé, confirmer le pays, terminer le repêchage puis désigner le Chef et confirmer l’équipe. Parcourir Monde / Enquête pour localiser les premières pistes. Déployer des agents, ouvrir un accès par contact, collecter deux preuves et garder un analyste au QG pour les vérifier. Préparer le dossier, localiser la cible puis intervenir. Le manuel intégré détaille les règles et l’export de sauvegarde.

## Règles implémentées

- Quatre puissances actives parmi six au choix, avec chacune quatre agents ; les six territoires secondaires restent sur la carte.
- Analyse, Habileté, Sang-froid (1–10), vingt talents, fatigue, exposition, blessure, capture, décès et relève.
- Vingt ordres au tour par tour ; déplacements légaux publics et passages clandestins.
- Sept suspects en trois cellules et une direction, preuves avec provenance, fausses traces, localisation temporaire, arrestations avec prérequis.
- Budget, deux modules de soutien, drones, IA, protection d’infrastructures, neuf projets d’attaque et cinq communications à choix.
- Décisions des puissances fondées sur leurs connaissances privées et soumises aux mêmes ordres et ressources. Partage périodique entre PNJ, échanges volontaires avec le joueur.
- Victoire collective (direction + deux cellules) ou défaite commune à 40 tours / 100 crise. Prestige national uniquement décisif en cas de victoire collective.
- Générateur aléatoire déterministe persisté, sauvegarde locale automatique, import/export JSON.

## Validation

`npm test` exécute les tests du moteur avec Node 20 ou supérieur : durées, remboursement, prérequis, provenance, fatigue, capacités de soutien, relève, extraction, protection, conditions de fin, relecture déterministe et cent campagnes simulées.

Le projet statique ne dispose pas d’un serveur de développement compatible avec l’aperçu supervisé de cet environnement. Les interactions sont vérifiées via DOM simulé ; la mise en page n’a pas fait l’objet d’un contrôle dans un navigateur réel. WebMCP est détecté à l’exécution ; la validation native n’est pas disponible dans cet environnement.

## Limites du prototype

Équilibrage exploratoire. Le réseau et ses pays de départ sont scénarisés ; le calendrier des menaces est fixe et leurs pays sont tirés au sort. La diplomatie et la protection sont abstraites. Pas de backend de campagne, de simulation tactique de combat, de sauvegarde cloud ou de doublage. Le multijoueur bêta est décrit en fin de document. Les agents PNJ sont identifiés par des indicatifs nationaux.

## Crédits

Portraits originaux générés pour ce projet, à partir des planches de direction artistique approuvées. Fond cartographique Natural Earth, domaine public : jeu de données `ne_50m_admin_0_countries`. Les pays jouables sont un choix de fiction pour 2040, pas un classement géopolitique actuel.

Les interfaces WebMCP exposent uniquement les renseignements connus via `read_sigma_campaign`, l’affectation via `stage_sigma_operation` et la progression effective via `advance_sigma_turn`.

## Interface v2

Navigation horizontale, cadres biseautés bleu nuit / lavande, contrôles ambre, vues de villes 2040 pour douze pays. Écran Personnel avec grille de portraits, douze représentations en pied et dossier détaillé. Illustration des échanges diplomatiques et refonte cohérente des fenêtres de dialogue et des ordres.

Carte géographique 1:50m, fond terrestre teinté, frontières vectorielles et repères interactifs. Zoom 1–6 centré sous le curseur, déplacement souris/tactile, pincement, boutons, raccourcis clavier, centrage du pays, vue agrandie, masquage des trajets et renseignements. L’état de caméra est indépendant de la sauvegarde de campagne.

Fond terrestre : `examples/textures/planets/earth_atmos_2048.jpg` du projet Three.js, licence incluse. Drapeaux : FlagCDN. Villes et agents en pied : deux atlas originaux générés depuis les références approuvées.

Vérification de cette mise à jour : parcours de l’interface dans un DOM simulé, 12 pays, zoom et centrage, vue agrandie, sélection d’agent, ordres et une campagne complète. Vérification séparée des limites de caméra, du zoom sous le curseur et du centrage des douze pays. L’aperçu supervisé reste indisponible pour ce projet statique ; aucun contrôle visuel dans un navigateur réel n’est revendiqué.


### Ergonomie : interface compacte

Coque adaptée à une fenêtre de bureau (à partir de 1000 × 620), avec défilement interne pour les panneaux longs. Actions filtrées selon la présence au QG, destinations regroupées par catégorie, badges de disponibilité, cinq étapes explicites par dossier et communications consultables plus tard sans avancer le tour. Atlases des douze agents révisés avec des proportions naturelles ; affichage des portraits en SVG pour conserver leurs proportions. Sauvegardes et moteur inchangés.

Validation : contrôles de syntaxe/imports/assets, intégration DOM des six onglets et d’une campagne complète ; scénarios ciblés sur actions QG/terrain, groupes de pays, disponibilité, preuves/position expirée/clôture et consultation des menus pendant une communication. Pas de validation visuelle dans un navigateur réel pour cette mise à jour.


### Opérations, enquêtes et coopération

- Prévisions : résultat attendu, risques, fin de résolution, fatigue totale et avertissements contextuels. Chances et budget restent calculés par le moteur.
- Comptes rendus : réussite/échec/interruption, conséquences observées, ressources et prochaine opération conseillée. Historique des huit dernières missions dans Opérations et événements mondiaux dans le rapport du tour.
- Sept dossiers narratifs et 21 pièces nommées. Les analystes recoupent automatiquement deux pièces authentifiées pour révéler le complice ; trois suspects avec des preuves authentifiées révèlent la direction. Les sources falsifiées restent écartées automatiquement. La communication du témoin peut fournir une déposition brute.
- Les autres pays demandent des preuves liées à une cellule lors d’une alerte. Accepter transfère les pièces vérifiées, fait payer 3 crédits au partenaire et protège le pays jusqu’à l’échéance. Le partenaire participe au partage des points de défense ; la provenance des preuves est conservée. Refus et expiration ne créent aucune protection.
- Échanges manuels précédés d’une explication des conséquences ; annonces internationales et présences datées. Le contre-espionnage détecte les agents étrangers présents au QG sans dévoiler leurs ordres.
- Sauvegardes antérieures compatibles ; nouveaux champs facultatifs validés. Mécaniques de progression et personnalité des agents réservées à la prochaine étape.

Validation : 18 tests réussis, dont 100 campagnes avec un joueur automatisé, et contrôles DOM sur les six onglets, ordres, rapports, enquêtes, coopération, échanges, zoom et communications différées. Dans cette simulation sans réponse aux demandes de coopération : 19 victoires / 100 ; ce résultat n’est pas une estimation de la difficulté pour un joueur humain. L’équilibrage demeure exploratoire. Aucun rendu dans un navigateur réel n’a été vérifié pour cette mise à jour.


### Planques, armes et nouvelle partie

Bouton Nouvelle partie explicite, confirmation et retour possible à la campagne avant son remplacement. Planques personnelles persistantes par pays : recherche en un tour, 2 crédits, jet de réussite ; repos sûr de 20 fatigue et 15 exposition par tour. QG : 30 fatigue. Profil bas : seulement −35 exposition. Chaque agent reçoit son arme au QG ; départ sous passeport sans arme, clandestinité conserve l’arme, acquisition locale possible. Retour au QG : réarmement automatique. Migration des anciennes sauvegardes sans armer les agents à l’étranger. Les puissances utilisent aussi les planques et réacquièrent une arme pour leurs tireurs avant une intervention.

Vérification : tests des trajets légaux/clandestins, annulations, réarmement, planques réussies/échouées, restrictions par agent/pays et migration. Contrôle DOM du bouton Nouvelle partie et du retour à la campagne sans effacer la sauvegarde.


### Atlas holographique et relief tactique

Refonte visuelle de la carte uniquement : terrain existant teinté, relief des frontières, grille holographique, cadre métallique, balayage lent, trajets animés et pulsations des menaces. Portraits ronds sans noms affichés, statut par symbole et couleur, taille constante à l’écran, placement évitant les superpositions et liens vers les positions. Cliquer ou activer au clavier un portrait ouvre le panneau d’agent existant. Tous les contrôles et menus sont conservés ; moteur, règles et format de sauvegarde inchangés. Respect des préférences de mouvement réduit.

Validation : contrôles de syntaxe/imports et tests DOM des menus, ordres, zoom, calques, focus/réinitialisation, portraits circulaires, évitement de superposition, activation clavier et absence de mutation du jeu. Pas de vérification du rendu dans un navigateur réel ; l’aspect est une adaptation interactive de la maquette sur la géographie existante.


### Palette de l’atlas corrigée

Désaturation partielle du terrain au lieu d’une teinte cyan uniforme ; nuances roche, sable et forêt conservées. Océan bleu nuit séparé, texture terrestre limitée à la silhouette géographique (suppression de la bande de glace rectangulaire au nord), éclairage des côtes et frontières intérieures plus fines. Cadre davantage biseauté, commandes métalliques arrondies. Contrôles et règles conservés. Palette inspectée sur un rendu SVG statique ; ce contrôle ne remplace pas une vérification du rendu complet en navigateur.


## Inquiry card overflow correction
Dossier rows now size to their content, preserving all five investigation steps inside the existing scrollable grid. No gameplay changes. DOM integration checked; complete browser rendering unavailable in this static execution profile.


## Operations, evidence and government support (v9)
- Recovery: HQ 50, personal safehouse 30, low profile 10 energy; existing exposure recovery preserved. Legal cover gives +15 to safehouse search. Weapon acquisition adds +10 exposure and is hidden/rejected when armed.
- Local known targets filter collection, surveillance, preparation, arrest and intrusion. Intrusion is field-only. Free drone reconnaissance opens a local access and finds/locates an eligible local suspect; it never reveals an unknown mastermind. Blackmail retired from UI and assignment.
- New HQ cyber support: 1 turn, 2 credits, 10 fatigue; +10 to newly assigned local rolls for own agents in the chosen foreign country on the next three turns. No stacking or retroactive odds changes.
- Evidence queue separates pending, reserved verification, verified and discarded. Verification targets a selected proof and prevents duplicate assignment. Evidence and investigation steps record contributing countries; missing historical authors remain unrecorded.
- Diplomatic exchanges provide frozen, dated foreign progress snapshots without exposing raw evidence content or agent orders. No live enemy progress or additional spying mechanic.
- Confidence begins at 50, influence at 3 (max 20). Each once-only prestige contribution grants +2 confidence/+1 influence. Spend 3 influence for +10 confidence once per turn; spend 1 for +10 diplomacy/influence roll (max 90%), refunded on queued cancellation. Funding at confidence 70/90 rises from 4 to 5/6 credits per turn and caps from 30 to 40/50. NPCs use the same rules.
- Existing saves migrate new fields and refund withdrawn blackmail/HQ intrusion orders once.
Validation: 29 rule tests including 100 deterministic campaigns (29 collective wins / 71 defeats under automated play); application DOM integration covers all six menus and new operation, evidence, diplomacy and influence controls. Full rendered browser QA unavailable in this static profile.


## Grouped agent actions (v10)
Action selection uses six named groups, hiding empty groups and retaining all existing availability checks. Rescue appears only with a captured teammate in the acting agent's country; its target list contains only those local teammates. No changes to costs or resolution rules. Verified with DOM interaction checks and targeted state checks.


## Funding adjustment (v11)
Recurring funding raised to 6/8/10 credits at the existing confidence thresholds 70/90. Reserve caps remain 30/40/50. Applies to all powers and existing campaigns starting at the next end of turn. Government panel and manual updated.

## Mira — La Vigie

Agente indienne affichée après Apéro. Analyse 8, Habileté 6, Sang-froid 7 ; Secourisme, Langues étrangères et Surveillance. Portrait dédié dans la sélection, les dossiers et les médaillons de la carte mondiale. Fiche plein pied assortie aux autres agents. Les quatre agents sélectionnés par défaut restent Iris, Bishop, Amber et Lei.

Validation ciblée : sélection, recrutement, sauvegarde/rechargement, nationalité, affichage du portrait et de la carte ; tests existants des talents et d’Apéro réussis.


## Interface Obsidienne et globe terrestre

- Navigation latérale compacte, globe central, dossier territorial ou agent et fil du renseignement repliable. Les fonctions existantes restent accessibles.
- Terre orthographique, texture Three.js géoréférencée et masque terrestre Natural Earth ; mer bleue, frontières, trajets et médaillons des agents dans la même projection. Rotation, zoom, vues régionales, clavier et écran agrandi.
- D3 7.9.0 servi localement, licence ISC dans assets/LICENSE-d3.txt. Aucun CDN nécessaire au fonctionnement du globe.
- Texture colorée et masque préparés une seule fois, projection inverse directe, détails réduits pendant les gestes et rendu en cache à l’arrêt. Pas d’animation continue de carte.
- Fond vectoriel initial : world.json (136 Ko, contre 1,58 Mo). Six portraits WebP de 320 pixels : 92 Ko au total, contre 14,2 Mo en PNG ; originaux conservés.
- Les 12 talents et les 3 capacités ont des pictogrammes accompagnés de leur libellé.
- Passeport du pays de campagne ajouté aux origines, sans doublon, à la création, au recrutement et au chargement. Les autres passeports acquis sont conservés.
- Validation : 45 tests de règles/sauvegardes réussis, dont 100 campagnes simulées. Projection du terrain comparée à D3 pour 900 points (écart inférieur à 1e-8 degré), rendu raster inspecté. Tests de rendu isolés : environ 19 ms en mouvement et 30 ms détaillé, hors tracés SVG ; ce ne sont pas des mesures FPS navigateur. Prévisualisation navigateur indisponible pour ce site statique dans cet environnement.

### Correction de la disposition (v21)

Navigation dans une colonne réservée sur toutes les pages, globe agrandi sans zoom automatique à la sélection, commandes horizontales et dossier agent compact. Palette de la maquette Obsidienne : anthracite, bordeaux, blanc et fond texturé ; océan bleu et relief géographique conservés. Modules versionnés ensemble pour éviter un mélange de versions en cache. Prévisualisation Vite (`npm run dev`) sans modifier les fichiers statiques de production. Rendu contrôlé dans le navigateur sur Monde et Enquête, avec sélection d’un agent.

### Vue Dôme compact

Un sélecteur Dôme compact / Globe conserve le globe d’origine et mémorise le choix localement. Le dôme présente le monde sur une calotte bombée avec les marges du Pacifique comprimées. Une projection géographique inversible commune aligne terrain, frontières, trajets et agents. À 100 %, glisser oriente la calotte dans des limites qui maintiennent sa face visible ; après zoom, glisser déplace la carte. Vues régionales, centrage sur le pays, clavier, pincement et agrandissement restent disponibles. Rendu de terrain en cache et résolution réduite pendant les gestes ; aucune animation permanente. Tests d’inversion aux limites de rotation et contrôle visuel du basculement, du zoom régional et de la sélection de pays.

### Polish des opérations — septembre 2026

- Statuts explicites (ordre planifié, voyage, mission, repos, soins, détention) et progression en tours sur les cartes agents.
- Confirmation non bloquante avec portrait, coût réservé, durée et tour de résolution prévu.
- Rapports avec portrait, conséquences chiffrées en énergie/exposition/prestige/crise, état de l’agent et accès au lieu.
- Signaux temporaires de planification, trajet et résultat sur le globe et le dôme ; les résultats attendent la fermeture du rapport. Respect des préférences de réduction des animations.
- Les rapports nouvellement produits mémorisent l’agent et le lieu ; les anciens restent lisibles. Aucun changement des règles de simulation.
- Vérification : 46 tests existants réussis, syntaxe et imports contrôlés, parcours de planification/repos/voyage/arrivée vérifié dans le navigateur.

### Suite du polish — renseignements et ambiance

- Variations temporaires près des crédits, de la confiance, de l’influence, du prestige, de la crise et de l’énergie ; solde du tour dans le rapport.
- Panneau de nouveautés consultable, pièces ouvrables avec état connu et accès à la vérification, badges de réception et d’analyse dans le registre.
- Jauge d’exposition segmentée, alertes uniquement au franchissement d’une pénalité supérieure, signalement des blessures/captures/décès.
- Journal et dernières transmissions avec portraits, importance, tour et liens vers les dossiers connus.
- Répliques courtes selon le personnage et le résultat ; aucune transmission d’un agent capturé ou décédé.
- Sons synthétisés discrets (désactivés par défaut), volume et réduction des animations dans Règles et sauvegarde. Préférences conservées localement ; respect du réglage système.
- Raisons explicites des soutiens indisponibles et confirmation d’ordre liée à son explication de blocage.
- Validation : 46 tests existants et 3 tests ciblés réussis (confidentialité des preuves, seuils d’exposition sans répétition, absence de mutation du jeu). Contrôles visuels du journal, des réglages, des ressources, des preuves et des alertes.

### Carte immersive et rapports compacts

- Carte sur toute la surface de la fenêtre ; navigation, ressources, contrôles et dossiers en couches superposées. Les autres sections s’ouvrent en panneaux au-dessus de la carte.
- Dossier territorial/agent repliable ; ouverture au clic sur un agent ou un pays. Hauteur du bandeau prise en compte dynamiquement.
- Barre de quatre agents compacte (70 px par carte sur ordinateur), avec disponibilité, ville, énergie et durée restante. Défilement horizontal sur petit écran.
- Rapports : portrait, nom, action, résultat et ligne tour/ville toujours visibles ; conséquences, transmission et suite conseillée dans un volet fermé par défaut. Bilan global et journal repliés séparément.
- Vérifié dans le navigateur : quatre comptes rendus visibles sans défilement à 1363 × 936, ouverture des détails, affectations depuis la barre, menus superposés et petit écran 390 × 800. Syntaxe et références locales valides.

### Personnel and development audit — 2026-09-21

Personnel now uses a compact selection list and one operational dossier. Assignment and condition appear first; talent explanations and the full character illustration expand on demand. The globe remains behind the overlay. Existing actions and save format are unchanged.

Audit: five AI-controlled national factions plan every turn through `planFaction`, using `options`, `assign`, and the same resolution code as the player. They investigate, analyze, prepare/arrest, recover, rescue, protect and replace losses. Their planner never selects sneak, hack, drone or influence; technology activation is player-specific. Intelligence exchange among NPC factions follows a six-turn schedule. Recruitment for NPC replacements follows a separate simplified path. All national planners use the same priority rules; doctrines affect action bonuses but do not supply distinct strategies. Turn resolution follows agent array order, not a contested initiative system.

Fracture is not an equivalent autonomous faction: seven attacks are scheduled at campaign creation (randomized countries), suspects stay in their initial countries, and narrative communications occur at fixed turns. There is no reactive enemy planning or network relocation. The static client owns the entire game state; player-facing views hide intelligence, but this is not a secure multiplayer architecture.

Validation: 49 existing tests passed, including 100 seeded campaigns with automatic player planning (28 collective victories, 72 defeats). These establish tested engine invariants and termination, not balance for human players. Browser checked selection and assignment on desktop, plus a narrow viewport layout.

Proposed priorities: (1) responsive interface and complete human playthrough; (2) broader AI action choice, strategic coordination and fair contested resolution; (3) reactive Fracture; (4) campaign pacing, balance and replayability; (5) onboarding, accessibility and save robustness before release. Multiplayer would require separate server-authoritative design.

### Reactive Fracture trial — 2026-09-21

Supersedes the static-enemy portion of the earlier audit. National AI remains unchanged. Fracture now reacts only to completed target-operation failures (+1 pressure), arrests (+3), and established protection observations. Secret orders, evidence and player intentions are not read. Each of three cells starts with four nonrenewable reaction resources. At pressure 3, a cell may reserve a flight (cost 2, four-turn cooldown). Known dossiers receive a two-turn departure warning. Missions resolve before departures; an arrest on that turn prevents the move. Every suspect can move at most once, only to a non-power country; the Architect stays in Turkey. Known dossiers receive a destination lead with expired precise localization, retaining evidence and preparation. In-flight old-country targeted missions close without phantom success if the suspect has left.

For an upcoming attack facing observed protection through its deadline, JANUS/CENDRE may postpone two turns (cost 1); PRISME may reroute and postpone one (cost 2). One protection adaptation per attack; all delays, including flight disruption, are capped at two turns. Reactions never occur on the attack's resolution turn. No dates exceed turn 40. Changed threats remain announced, and accepted protection stays at its original location. Pending cooperation requests for an adapted attack expire; historical entries retain their original city. Full autonomy, recruiting enemies and dynamic resource production remain out of scope.

Reactions appear directly in the turn report, in the journal, in map threat updates and departure warnings in dossiers. Phase labels are derived from time remaining (preparation/logistics/imminent); this trial does not yet simulate separate logistical missions.

Old saves initialize reaction state without retroactive pressure or defense knowledge. New state is validated and persists, including pending flights and resource caps. Validation: 56 passing tests (7 dedicated Fracture tests), plus the existing 100-seed full-campaign simulation, now 17 victories / 83 defeats versus the prior 28/72. This is automated-player behavior, not measured human difficulty. Browser verified a fixture turn containing a departure warning, delay and reroute with four collapsed agent reports.

### Investigation milestones — cinematic banners

A short city-image pan and optional credited agent portrait now introduce meaningful investigation progress before the turn report: identity confirmation, first authenticated evidence, arrest evidence threshold, first/reacquired location, preparation, arrest and completed cells. Changes within one case are grouped into a single scene. Mere location renewals stay quiet. The detector reads player-known dossier/evidence states, never hidden authenticity. Collective arrests credit their country rather than inventing a player contribution.

Scenes wait for Continue, can be skipped immediately (including Escape/close), and lead into the normal turn report. That report offers replay for the current session's latest turn. Diplomatic exchanges also show newly acquired milestones. Motion lasts five seconds at most and respects reduced-motion preferences. No game rules or save format changed. Four targeted tests cover grouping, no repeat, hidden-information isolation, collective attribution and reacquisition.

## Multijoueur bêta — v37

Menu **Multijoueur** : créer un salon, choisir sa puissance et quatre agents, copier le lien, rejoindre avec un pseudo, puis lancer à deux humains minimum. De deux à six humains ; les autres puissances restent des PNJ. Les ordres sont envoyés à l’hôte, qui les valide, réserve le budget et calcule les résultats. « Je suis prêt » verrouille les décisions, « Modifier mes ordres » les déverrouille avant la résolution. Aucun délai de tour. Une connexion silencieuse pendant 15 secondes est traitée comme une coupure, pas comme une fin de tour. Les pays déconnectés restent réservés, et seul l’hôte peut explicitement les confier à un PNJ.

La sauvegarde complète est chez l’hôte, dans un emplacement distinct de la sauvegarde solo. Elle inclut ordres, progression, graine aléatoire et identités de reconnexion. Export/import disponible dans le salon. Reprendre réouvre le même salon ; l’invité rejoint avec le même navigateur. Aucun transfert automatique de l’hôte. Ne pas lancer deux instances de la même sauvegarde hébergée. Les jetons de place sont des secrets de reconnexion ; ne pas partager le fichier de sauvegarde complet avec un invité qui ne doit pas devenir hôte.

Transport : le site relaie les messages courts par HTTP et D1. Les invitations donnent accès au salon, mais les ordres sont validés et calculés uniquement par le navigateur de l’hôte. D1 conserve temporairement les messages du salon et les identifiants hachés, jamais la sauvegarde complète. La connexion ne dépend plus de WebRTC, de STUN ou de TURN. Le site doit être accessible aux invités. L’hôte doit garder son jeu ouvert et sa sauvegarde reste locale. Les utilisateurs d’une sauvegarde existante peuvent reprendre le même salon avec le même lien.

L’hôte émet une projection par pays (`playerView`), pas la sauvegarde complète : aucune graine RNG, authenticité cachée, dossier étranger, ordre étranger, position non observée ou attaque non annoncée. Il garde nécessairement accès au monde complet : mode entre personnes de confiance. Les six pays ont leurs communications individuelles ; les PNJ ne planifient jamais les ordres d’une puissance humaine. Les opérations sont résolues dans un ordre mélangé par le RNG sauvegardé, indépendant de l’ordre d’arrivée des états prêts. Les propositions d’échange entre humains nécessitent le consentement du destinataire. Un mandat national transmet volontairement des dossiers sans récupérer ceux d’un autre humain sans accord.

Validation : tests du moteur multijoueur et test HTTP intégrant le relais, une base SQLite et deux contrôleurs navigateur simulés, depuis la création du salon jusqu’au tour suivant. Un essai avec deux appareils réels reste nécessaire pour vérifier la disponibilité du réseau de chaque joueur.

## Déplacements et planques partagées
Les trajets commencés, légaux ou clandestins, ne peuvent plus être annulés. Le médaillon apparaît à mi-chemin de la route pendant le déplacement ; les départs encore planifiés restent annulables. Les planques sont communes à la faction et persistent après le départ de leur découvreur. Les anciennes planques personnelles sont reprises au chargement. Le menu des opérations regroupe le parcours d’arrestation et grise les actions indisponibles sans empêcher leur consultation.

Le soutien numérique affiche son bonus fixe de +10 et ses tours restants dans les statuts territoriaux. Chaque piratage réussi ajoute trois tours (y compris plusieurs réussites le même tour) ; après expiration, une réussite ouvre une nouvelle période de trois tours. Les icônes territoriales actives sont vertes.

## Implantation variable de Fracture
Les nouvelles campagnes répartissent les criminels uniquement dans les six pays secondaires, avec deux pays distincts par cellule et un maximum de deux criminels par pays. Les fuites restent dans les pays secondaires. Les actions nationales et leurs catégories sont revenues au fonctionnement antérieur.
Au chargement d’une campagne active, les criminels libres situés dans une superpuissance et les destinations de fuite incompatibles sont replacés dans un pays secondaire. Les preuves sont conservées ; la localisation et la préparation des cibles transférées sont à refaire. Les missions directement affectées sont annulées et remboursées. Les campagnes terminées sont conservées telles quelles.


## Midnight — Le Coordinateur (v45)

Agent chinois affiché immédiatement après Mira. Analyse 8, Habileté 7, Sang-froid 5 ; Drones, Planification tactique et Surveillance. Portrait PNG et WebP dédié, silhouette plein pied et dossier sans âge affiché. Même portrait dans les sélections, fiches et médaillons de carte, y compris les identités de session multijoueur. Sélection par défaut inchangée.


## Mercer — L’Intermédiaire (v46)

Agent américain affiché immédiatement après Midnight. Analyse 7, Habileté 6, Sang-froid 7 ; Réseau de contacts, Combat et Infiltration. Portrait validé conservé, déclinaison WebP optimisée pour les cartes et la carte mondiale, portrait détouré, silhouette plein pied sans texte et dossier sans âge. Identité partagée entre sélection, recrutement et multijoueur.


### Révision UX et règles — septembre 2026

- Panneau agent : carte de mission, durée et fin prévue, annulation directe avec règle de remboursement ; affectation désactivée pendant une mission. Les trajets commencés restent verrouillés.
- Multijoueur : le salon fermé ne se rouvre plus sur les snapshots, erreurs transitoires ou reconnexions. Son actualisation automatique exige une fenêtre réellement ouverte.
- Fenêtres : un glissement de sélection de texte depuis un champ vers le fond ne ferme plus la fenêtre ; seul un clic entièrement sur le fond la ferme.
- Globe et dôme : les libellés pays/icônes évitent les rectangles mesurés des villes ; badge numérique du hack actif.
- Manuel : cinq communications documentées avec tous les choix, coûts et limites ; attaques, fuites, coopération, incidents, renforts et fin de campagne. Choix impossibles désactivés avec raison ; effets chiffrés des décisions dans le journal.
- Ordre de résolution inchangé : mélange déterministe des agents à chaque tour en multijoueur ; première arrestation réussie décisive, missions devenues inutiles interrompues sans remboursement. Les décisions immédiates suivent leur réception par l’hôte.
- IA inchangée : activation manuelle, 6 tours inclusifs (4 pour l’audit), compte à rebours indépendant des analyses ; +10 aux chances fixées à l’affectation, non cumulable ; aucune vérification automatique. L’activation ordinaire ajoute une remontée de recherche, l’audit événementiel aucune.

Validation : scénarios du moteur, contrôleur réseau et géométrie, régression sélection de texte, cinq événements et IA ; aucun contrôle visuel dans un navigateur réel revendiqué.

## Composition, débriefings et statistiques — v68

Le parcours multijoueur sépare Rejoindre et Créer. La composition utilise le même écran complet qu’en solo : pays, quatre agents, capacités et talents, graphique des totaux et conseils sur les spécialistes manquants. Les commandes sont sous l’invitation. La confirmation de chaque équipe est obligatoire côté moteur ; une modification de pays, une reprise du salon ou une modification d’équipe retire la confirmation. Les joueurs doivent aussi être connectés au lancement.

La campagne démarre sans agent sélectionné, centrée sur son pays. Le briefing initial se consulte à volonté. Les trajets partagés séparent les portraits, y compris dans les deux sens. Les suggestions d’opérations utilisent uniquement la condition de l’agent et les renseignements connus ; elles ouvrent la préparation d’un ordre, sans exécution automatique.

Recueillir une preuve est indisponible à partir de deux pièces recevables (brutes ou vérifiées) pour la cible et l’équipe. Une pièce écartée ne compte pas. La résolution vérifie à nouveau ce seuil pour éviter deux collectes simultanées excédentaires. La limite ne change pas l’intimidation. Une arrestation ne supprime que les pièces non vérifiées de la cible arrêtée ; les preuves vérifiées et les pièces d’autres cibles sont conservées. Le cas Mantis au Japon après une autre arrestation est couvert par un test de conservation, de vue privée, d’export et de reconnexion ; la disparition signalée n’a pas été reproduite.

Chaque fin de tour conserve un débriefing privé des agents, avec réussite, échec, interruption, mission en cours ou absence d’ordre. La révélation comporte une attente visuelle de 850 ms, immédiatement passable, sans nouveau tirage. Sept illustrations fournies sont associées au voyage sous passeport, drone, collecte, arrestation, arme, intrusion et soutien numérique ; les autres affichent « À venir ». Le dernier débriefing peut être relu.

Le bilan final affiche les arrestations et le prestige de tous les pays, y compris en défaite sans attribuer de victoire nationale. Les compteurs par action et capacité survivent à la réduction du journal : réussites, échecs, interruptions, chances moyennes prévues, coût et fatigue nette. Les anciennes sauvegardes reprennent uniquement les rapports encore présents et indiquent un historique partiel. Les missions en cours ou annulées sont exclues. Les opérations automatiques sont séparées des statistiques de capacité.

Validation : suite du moteur et relais HTTP multijoueur, complétée par les scénarios de confirmation, preuves, suggestions, trajets, confidentialité, débriefings et statistiques. Aucun essai visuel sur navigateur ni sur deux appareils réels revendiqué.


## Rythme des attaques — v70
Les nouvelles campagnes comportent neuf projets aux tours 7, 11, 15, 19, 23, 27, 31, 35 et 39 : trois par cellule. La première attaque et le préavis de trois tours sont conservés. Les adaptations de Fracture restent possibles et les anciennes sauvegardes conservent leur calendrier. La validation des demandes diplomatiques accepte une demande par projet, y compris pour les neuf attaques. Le partage de prestige reste de 6 points par attaque déjouée, répartis également entre les nations effectivement défenseuses à la résolution, sans multiplication par le nombre d’agents ou modules.

## Économie et coopération — v71
L’influence comme ressource est retirée, sans conversion du stock ancien en crédits. Le prestige conserve sa récompense de +2 confiance. Renfort diplomatique facultatif : +2 crédits au coût total pour +10 points sur mandat ou chantage, plafond 90 %. Le coût total est réservé puis remboursé seulement si l’ordre est annulé avant son commencement. Les anciennes missions conservent leurs chances et coûts déjà engagés.

Influence Interne, dans Gouvernement : action immédiate de 6 crédits pour +10 confiance (maximum 100), disponible dès T3, maximum trois utilisations par pays. Après T3, T4/T5/T6 sont bloqués, prochaine utilisation T7 ; troisième au plus tôt T11. Le moteur, les PNJ et l’hôte multijoueur appliquent les mêmes limites. Les sauvegardes conservent le compteur et la date. Les anciennes campagnes commencent ce nouveau compteur à zéro.

Les nouvelles équipes utilisent la matrice INITIAL_COOPERATION : chaque puissance a 1 Soutien total, 1 Favorable, 2 Neutres, 1 Réticente et 1 Hostile parmi les pays secondaires. Chaque pays secondaire a exactement une puissance hostile. Les relations des sauvegardes commencées sont conservées ; la matrice est visible pendant la composition. Les relations avec les superpuissances restent inchangées.

Illustrations fournies ajoutées : Passage clandestin, Activer un contact, Faire profil bas, Trouver une planque. Le visuel de Recueillir une preuve passe à Vérifier une preuve ; la collecte reprend son encadré À venir, car la vérification ne possédait aucune illustration.

## Économie facultative (version de test)

Toutes les missions d’agents et le recrutement sont gratuits. Un renfort facultatif
coûte 6 crédits pour +10 points de réussite, plafond 90 %, une seule fois par
mission avec jet. Départ : 6 crédits ; revenu fixe : +2 par tour ; plafond de
revenu : 18. Les appuis et décisions gouvernementales restent payants. Les
contraintes du drone et les effets du Hack sont conservés. Les anciennes
réserves et missions payées sont préservées ; tester l’équilibre sur une nouvelle
partie. Les copies de sauvegardes antérieures sont exportables depuis Aide ou
le salon multijoueur. Tous les participants doivent recharger le jeu.

Validation : 184 tests réussis, dont 100 campagnes complètes, et parcours
fonctionnels dans un DOM simulé. Aucun contrôle visuel dans un navigateur réel.
Voir `docs/ECONOMY-VALIDATION.md` et `docs/ECONOMY-ROLLBACK.md`.


## Révision 116 — PNJ, bilan et rythme des menaces

Voir [le bilan des corrections et des 3 100 simulations](docs/Sigma-2040-bilan-corrections-116.md). Passage clandestin +0/+10 exposition ; garde d’identité dans les ordres ; préparation unique ; intimidation 1/1 ou 0/1 ; bon pays dans les rapports de hack. Bilan par agent et catégorie, appuis et gouvernement, frise compacte. Alerte de crise. PNJ aléatoires pondérés par équilibre, coordination d’enquête et gestion des ressources. Quatorze attaques tous les deux tours dans les nouvelles parties.

Validation finale : 252 tests, plus lots comparatifs et 600 nouvelles graines de validation. Secourisme et durée de Logistique prioritaire inchangés. Les statistiques détaillées d’anciennes campagnes sont partielles ; leur calendrier existant est préservé.

## Révision 117 — Coopération, menaces et personnel

Chaque puissance reçoit une permutation indépendante des niveaux 0/1/2/2/3/4 pour les six pays secondaires au lancement. Les sauvegardes existantes gardent leurs relations. Les menaces couvertes par le joueur jusqu’au tour d’attaque inclus restent consultables mais ne déclenchent plus le badge rouge, qui affiche le délai de la prochaine attaque non couverte. Cartes compactes de taille stable, date de l’attaque mise en avant et retrait du soutien depuis cet onglet. Nouveau dossier Agents avec sélection d’équipe, portraits en pied visibles, capacités, état, affectations et talents.

Validation : 256 tests réussis, dont distribution sur 100 graines, échéances de protection, isolation des puissances, affichage des dix agents et régressions générales. Pas de contrôle visuel dans un navigateur réel.

## Révision 118 — Interface compacte

Menaces : délai avant attaque en titre, numéro du tour en second plan ; suppression de « Surveillance active » et de la note de bas de page. Agents : dossier, statistiques et portraits ajustés à la hauteur disponible ; Renforts & relève et Retour à la carte regroupés dans cet ordre. Disposition mobile conservée avec défilement naturel.

## Révision 119 — Adler, Le Consul

Adler rejoint la sélection après Nox : nationalité allemande, Analyse 8, Habileté 9, Sang-froid 3 ; Diplomatie, Réseau de contacts et Planification tactique. Portrait et fiche dédiés, représentation sur la carte et compatibilité des identifiants multijoueurs. Les identifiants existants et l’équipe initiale restent stables. Tests ciblés : recrutement, sauvegarde, ordre du catalogue et portraits en solo/multijoueur.

## Révision 120 — Menaces initiales et notifications d’enquête

Toutes les attaques du calendrier initial ciblent les pays secondaires. Les campagnes existantes et les réactions ultérieures de Fracture sont conservées. Build visible en haut à gauche du menu principal. Diplomatie précède Enquête. Enquête s’allume en violet pour les preuves non vérifiées ou un nouveau dossier ; le compteur et le point d’exclamation coexistent. La lecture efface uniquement le point d’exclamation, avec mémorisation locale par campagne, salon et puissance.

## Révision 121 — Dante, Le Traqueur

Dante rejoint le catalogue après Adler : Brésil, Analyse 8, Habileté 5, Sang-froid 7 ; Enquête, Combat et Endurance. Portrait, fiche et plein pied dédiés avec compatibilité du recrutement, des sauvegardes et des identifiants multijoueurs.

## Révision 122 — Navigation, prestige et Lei

Diplomatie suit Gouvernement. Le badge Menaces compte les attaques connues en cours, protégées comprises. Les interceptions affichent le prestige gagné par pays participant. Lei passe à A4/H7/SF9, avec migration des anciennes statistiques en sauvegarde solo et multijoueur, et fiche illustrée corrigée.


## Version 123 — Hôte observateur

Dans le salon, l’hôte choisit Joueur ou Observateur avant le lancement. L’observateur n’occupe aucune des six places et ne choisit pas d’équipe. Deux joueurs humains sont requis au lancement. Son rôle reste fixe pendant la campagne. Tous les participants voient la mention d’accès aux informations des joueurs.

L’observateur consulte les onglets de chaque joueur via un sélecteur et voit les agents humains et leurs déplacements sur le globe, avec une couleur par pays. Ses commandes de jeu sont bloquées par le contrôleur et par le moteur faisant autorité. Il conserve l’invitation, la sauvegarde et la gestion du salon. Seuls les joueurs doivent être prêts ; une déconnexion de joueur suspend toujours le passage de tour. La reprise conserve le rôle observateur ; les anciens hôtes restent joueurs. Protocole 9 : tous les participants doivent recharger la page.

## Version 124 — Bilan des agents et chronologie

L’annulation d’une mission libère son agent sans remboursement ; les renforts facultatifs restent consommés. Les mentions obsolètes ont été retirées des fenêtres d’affectation, de confirmation et du panneau des opérations. Les règles propres aux appuis technologiques restent inchangées.

Chaque agent dispose au bas de son bilan d’un graphique commun énergie/exposition, enregistré au départ puis à chaque fin de tour. Les historiques incluent les agents remplacés et le dernier tour de campagne. Les anciennes sauvegardes reprennent le suivi à partir des données observées, sans inventer le passé.

La chronologie conserve les opérations terminées, avec une infobulle personnalisée : portrait, agent, action, résultat, chance, lieu, cible, compte rendu et gains de prestige. Accès par survol, focus clavier ou clic ; fermeture par Échap. Les rapports et courbes des autres équipes restent privés jusqu’à la fin, sauf accès de l’hôte observateur. Protocole 10, compatible avec la reprise des sauvegardes précédentes ; tous les participants doivent recharger la page.

Validation : 271 tests automatisés réussis avant publication. Le navigateur local n’a pas pu être installé ; contrôle visuel réel non effectué.


## Version 125 — Déplacements, échéances et gouvernement

Passage clandestin : suppression du tour supplémentaire pour les nouveaux ordres (durée de base 1 à 2 tours). Probabilités et conséquences inchangées ; Logistique reste réservée aux voyages sous passeport. Les trajets déjà affectés gardent leur durée.

Menaces et bandeau Sigma Info : « Attaque à la fin du tour X » et « N tours pour agir », avec le calcul X − tour courant + 1. Aucune modification de la résolution : les actions se terminent avant les attaques de fin de tour.

Financement exceptionnel : 15 confiance. Soutien médical : 25 confiance, maximum 3 utilisations par partie et par joueur, compteur restant affiché. Diplomatie : 20 / 20 / 15 / 10 confiance. Délai partagé de deux tours inchangé. Le quota est sauvegardé et vérifié par l’hôte ; les anciennes sauvegardes reprennent le nombre enregistré dans les statistiques gouvernementales (à défaut, la dernière faveur médicale connue). Protocole multijoueur 11 ; rechargement requis pour tous.

Validation : tests de quota, dépenses atomiques, migration, isolation des joueurs, enforcement multijoueur et durées, plus suite existante.


## Version 126 — Échecs du passage clandestin

Après un échec : décès 3,5 %, capture 24,5 %, blessure 36 %, retour sans nouvelle blessure 36 %. Premiers secours évite la moitié des blessures : 18 % blessure et 54 % sans nouvelle blessure. Ces probabilités sont conditionnelles à l’échec ; chances de réussite, exposition +10 et durée restent inchangées. Une capture place l’agent dans le pays de destination et le rapport indique ce pays. Les autres survivants restent au départ ; un retour sans nouvelle blessure ne soigne pas une blessure préexistante. Arrestation et extraction inchangées. Protocole 12 avec reprise des anciennes sauvegardes.

Validation : 28 tests ciblés passants, dont simulation reproductible de 1 200 échecs avec et sans Premiers secours, localisation, exposition, maintien de l’arme et blessure préexistante.


## Version 127 — Relais satellite et compteur médical

Le relais conserve la localisation en un tour et ajoute +1 tour à toutes les positions encore valides à son activation. Toutes les localisations obtenues pendant ses deux tours actifs gagnent aussi +1 tour (localisation, intrusion, drone et intimidation). Le bonus concerne uniquement l’équipe propriétaire, ne réactive pas les positions expirées et ne bloque pas les fuites. Les prolongations déjà acquises restent après expiration ou annulation. Toute prolongation consomme l’effet du module et retire le remboursement. Coût et durée du relais inchangés.

Le soutien médical affiche son compteur restant en gros et en gras. Tests ciblés sur les sources de localisation, expiration, sauvegarde, annulation et compteur. Protocole multijoueur 13, recharge requise.

## Enquêtes depuis le globe — version 166

Dans le panneau d’un pays, les boutons des cibles connues ouvrent une fenêtre compacte d’enquête. Les actions suivent l’ordre du menu d’affectation. Les conditions manquantes permettent d’aller à l’étape correspondante ; les agents sont comparés avec leurs portraits, disponibilités, chances et durées réelles. Le renfort reste unique (+10 points, coût habituel, plafond 90 %). La vérification reste au QG et porte uniquement sur les pièces du dossier choisi. La fenêtre reste ouverte après l’affectation. En multijoueur, les ordres passent par l’hôte et les restrictions de consultation sont conservées.

## Dossiers et menaces — version 167

Les actions du dossier sont regroupées dans un menu déroulant, avec détails repliables. Seuls les agents présents au lieu de l’action sont proposés (QG pour les vérifications). Cliquer sur leur portrait ouvre leur fenêtre habituelle. Les menaces annoncées apparaissent dans le panneau du pays avec leur cellule et leur échéance ; leur fenêtre permet d’affecter une protection avec les règles existantes.

## Catégories des dossiers — version 168

Les trois boutons Contact, Preuves et Arrestation filtrent les actions du dossier selon les catégories demandées. Les liens de prérequis changent de catégorie au besoin. Le compteur Menaces correspond aux attaques annoncées non couvertes par une protection de notre pays valable au tour de l’attaque.

## Version 169 — Enquêtes

Parcours partagé en cinq étapes dans les dossiers et l’onglet Enquête, boutons d’actions et intervention en parallèle. Mandat optionnel par pays. La deuxième preuve peut toujours être vérifiée et plusieurs agents peuvent recevoir la même action. Identification conservée uniquement pour la révélation du portrait.

## Version 174 — BotBrillant1 (BB1)

BB1 rejoint les choix d’IA sans remplacer Facile, Normal ou Expert. Normal reste le choix par défaut. Les règles du jeu et le niveau des anciennes sauvegardes sont conservés. En multijoueur, l’hôte sélectionne BB1 pour les pays contrôlés par l’ordinateur.

Validation : 415 tests réussis, dont les tests BB1, sauvegardes et multijoueur. Neuf campagnes sur les niveaux historiques reproduisent les états complets de la version 173. Les résultats archivés des 720 départs BB1 restent un contrôle d’équivalence, pas une mesure de difficulté face à des humains.

## Version 175 — Passage clandestin de BB1

BB1 compare désormais le voyage sous passeport au passage clandestin pour ses enquêtes. Le choix tient compte de l’arme conservée, de l’exposition, de l’énergie, du risque d’échec, du prix du renfort et du raccourcissement réservé à la logistique du passeport. Les passages en cours comptent dans les affectations à destination.

Validation : 421 tests réussis et 1 200 paires de parties à six BB1, avec les mêmes départs avant et après correction. 170 passages choisis contre zéro ; 1 109 victoires contre 1 113. L’écart ne démontre pas une amélioration du taux de victoire. [Méthode et résultats](docs/bots/BB1.md#correction-du-passage-clandestin--version-175).

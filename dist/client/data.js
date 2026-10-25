export const COUNTRIES = [
 {id:'FR',iso:'FRA',name:'France',city:'Paris',pos:[2.35,48.86],power:true,perk:'Diplomatie',talent:'diplomatie',desc:'Des contacts solides. +10 aux demandes officielles.',coop:75},
 {id:'US',iso:'USA',name:'États-Unis',city:'Washington',pos:[-77,39],power:true,perk:'Logistique',talent:'drones',desc:'Supériorité aérienne. +10 aux opérations avec drone.',coop:65},
 {id:'CN',iso:'CHN',name:'Chine',city:'Pékin',pos:[116.4,40],power:true,perk:'Renseignement numérique',talent:'hacking',desc:'Un réseau étendu. +10 au Hack.',coop:45},
 {id:'IN',iso:'IND',name:'Inde',city:'New Delhi',pos:[77.2,28.6],power:true,perk:'Réseaux humains',talent:'contacts',desc:'Des relais locaux. +10 à la recherche de contacts.',coop:60},
 {id:'RU',iso:'RUS',name:'Russie',city:'Moscou',pos:[37.6,55.7],power:true,perk:'Opérations clandestines',talent:'infiltration',desc:'Des passages discrets. +10 aux infiltrations.',coop:40},
 {id:'GB',iso:'GBR',name:'Royaume-Uni',city:'Londres',pos:[-.12,51.5],power:true,perk:'Interception',talent:'forensique',desc:'Des analystes aguerris. +10 à la collecte numérique.',coop:70},
 {id:'CA',iso:'CAN',name:'Canada',city:'Ottawa',pos:[-75.7,45.4],coop:80,sector:'Recherche'},
 {id:'BR',iso:'BRA',name:'Brésil',city:'Brasília',pos:[-47.9,-15.8],coop:60,sector:'Logistique'},
 {id:'DE',iso:'DEU',name:'Allemagne',city:'Berlin',pos:[13.4,52.5],coop:80,sector:'Industrie'},
 {id:'TR',iso:'TUR',name:'Turquie',city:'Ankara',pos:[32.8,39.9],coop:50,sector:'Transit'},
 {id:'ZA',iso:'ZAF',name:'Afrique du Sud',city:'Pretoria',pos:[28.2,-25.7],coop:65,sector:'Approvisionnement'},
 {id:'JP',iso:'JPN',name:'Japon',city:'Tokyo',pos:[139.7,35.7],coop:75,sector:'Robotique'}
];
export const COUNTRY=Object.fromEntries(COUNTRIES.map(c=>[c.id,c]));
export const TALENTS={
 chef:['Chef — Coordination',''],
 informatique:['Informatique','+10 à l’intrusion numérique et au hack d’un pays.'],
 enquete:['Enquête','+10 à la collecte et à la vérification des preuves.'],
 surveillance:['Surveillance','+10 à la localisation, au contre-espionnage et à la protection d’infrastructure.'],
 contacts:['Réseau de contacts','+10 aux contacts, à la recherche de planque et d’arme.'],
 diplomatie:['Diplomatie','+10 aux mandats et au chantage diplomatique.'],
 langues:['Langues étrangères','Annule le malus linguistique de −5. +5 pour trouver une planque ou une arme à l’étranger. Ce +5 se cumule avec le bonus des autres talents.'],
 infiltration:['Infiltration','+10 au passage clandestin et à la recherche de planque. −20 % de tous les gains d’exposition des missions, réussite ou échec (arrondi supérieur).'],
 tactique:['Planification tactique','+10 à la préparation d’arrestation et à l’extraction.'],
 combat:['Combat','+10 aux arrestations, extractions et intimidations, avec ou sans arme.'],
 drones:['Drones','+10 à la reconnaissance par drone.'],
 secours:['Secourisme','En fin de tour, soigne une blessure sur un coéquipier dans le même pays, sinon sur lui-même. Secouriste présent, ni en voyage ni capturé, même après une autre action. Aucun gain d’énergie.'],
 endurance:['Endurance','−25 % de toutes les dépenses d’énergie des missions (arrondi supérieur).']
};
export const LEGACY_TALENTS=['hacking','cybersecurite','forensique','analyse','filature','contacts','diplomatie','charisme','manipulation','polyglotte','infiltration','identite','arts','tir','conduite','secours','drones','autonome','protection','endurance'];
// National bonuses are temporarily disabled; keep their mapping for a future rebalance.
export const NATIONAL_BONUSES_ENABLED=false;
export const DOCTRINE_ACTIONS={FR:['authorize','influence'],US:['drone'],CN:['hack','cyberSupport'],IN:['contacts','surveil','findSafehouse','equip'],RU:['sneak','findSafehouse','rescue'],GB:['collect','analyze']};
export const STAT_NAMES=['Analyse','Habileté','Sang-froid'];
const cast=[
 ['IRIS','L’Ambassadrice',[9,4,7],['diplomatie','contacts','langues'],'Elle repère une hésitation avant même que la phrase soit terminée.'],
 ['SABLE','Infiltrateur',[5,8,7],['infiltration','surveillance','combat'],'Une identité pour chaque frontière. Une seule loyauté.'],
 ['NYX','Intrusion numérique',[8,8,5],['informatique','enquete','surveillance'],'Les systèmes mentent. Les traces, beaucoup moins.'],
 ['ATLAS','Protection & extraction',[5,8,8],['tactique','secours','endurance'],'Toujours le dernier à quitter les lieux.'],
 ['VEGA','Renseignement',[8,6,7],['surveillance','contacts','enquete'],'Son carnet de contacts vaut une ambassade.'],
 ['ÉCHO','Guerre électronique',[8,7,6],['informatique','drones','enquete'],'Il écoute ce que les machines ne devaient pas raconter.'],
 ['ROOK','Intervention',[5,8,8],['combat','tactique','endurance'],'La force n’est utile qu’au bon moment.'],
 ['ONYX','Agent de terrain',[6,8,6],['infiltration','contacts','endurance'],'Elle traverse les villes comme une habitante.'],
 ['KAI','Analyste',[9,5,7],['enquete','surveillance','informatique'],'Il relie les détails que tout le monde a classés.'],
 ['MARA','Négociations sensibles',[7,5,9],['diplomatie','langues','tactique'],'Un secret peut ouvrir plus de portes qu’une clé.'],
 ['SOL','Opérateur drones',[6,8,7],['drones','tactique','secours'],'Des yeux dans le ciel, les pieds sur terre.'],
 ['ASH','Contre-espionnage',[8,6,8],['surveillance','enquete','infiltration'],'La meilleure piste est parfois celle laissée pour vous.'],
 ['BISHOP','Officier de terrain',[9,6,5],['enquete','infiltration','tactique'],'Il prépare toujours une sortie avant de franchir la première porte.'],
 ['AMBER','L’Entrepreneuse',[5,7,8],['contacts','informatique','drones'],'Des biens du quotidien aux équipements sensibles, ses réseaux livrent là où les autres renoncent.'],
 ['LEI','Le Prédateur',[4,7,9],['combat','endurance','infiltration'],'Il attend sans bruit. Quand il intervient, chaque mouvement compte.'],
 ['APÉRO','Le Hacker',[9,8,3],['surveillance','informatique','enquete'],'Génie de la tech, il préfère les connexions à distance aux relations humaines.'],
 ['MIRA','La Vigie',[6,7,7],['secours','langues','surveillance'],'Elle veille sur les autres sans jamais perdre de vue ce qui se passe autour d’elle.'],
 ['MIDNIGHT','Le Coordinateur',[8,7,5],['drones','tactique','surveillance'],'Ancien coordinateur de recherche et de secours, il organise les opérations avec méthode et un humour sec. Il veut parfois trop préparer avant d’agir.'],
 ['MERCER','L’Intermédiaire',[7,6,7],['contacts','combat','infiltration'],'Ancien agent sous couverture dans les réseaux de corruption et de courtage international, il ouvre les portes avec un sourire. Difficile de savoir quand il abandonne son personnage.'],
 ['MARLOWE','La Convoyeuse',[4,8,8],['contacts','drones','endurance'],'Ancienne logisticienne humanitaire devenue intermédiaire pour les missions sensibles, elle trouve toujours un passage et un contact fiable. Directe et débrouillarde, elle ne promet jamais une livraison impossible.'],
 ['NOX','La Veilleuse',[7,9,4],['informatique','surveillance','drones'],'Passionnée de jeux de stratégie et de cryptographie, cette spécialiste nocturne du hack d’un pays reste patiente avec les autres. Quand les systèmes tombent et que la mission dérape, elle garde son calme.'],
 ['ADLER','Le Consul',[8,9,3],['diplomatie','contacts','tactique'],'Ancien diplomate chargé de négociations commerciales sensibles, il ouvre les portes avec charme et prépare chaque rencontre avec soin. Cultivé et légèrement vaniteux, il perd son assurance lorsque la menace devient physique.'],
 ['DANTE','Le Traqueur',[8,5,7],['enquete','combat','endurance'],'Ancien enquêteur spécialisé dans les fraudes portuaires, il suit les pistes que les autres abandonnent. Tenace et direct, il relie les indices sur le terrain et ne recule pas lorsque la confrontation devient inévitable.'],
 ['SELIN','La Stratège',[6,8,6],['langues','informatique','tactique'],'Ancienne conceptrice de simulations de crise pour un réseau de transport international, elle croise les communications et les données pour anticiper les incidents. Précise et légèrement sarcastique, elle prépare toujours une solution de rechange.'],
 ['ROCKET','Le Médiateur',[8,8,4],['secours','diplomatie','enquete'],'Ancien ambulancier devenu enquêteur sur les interventions d’urgence controversées, il relie les accidents aux réseaux qui les provoquent. Chaleureux et patient, il désamorce les tensions, mais la violence délibérée le déstabilise.'],
 ['ALBA','La Faussaire',[7,7,6],['diplomatie','endurance','infiltration'],'Ancienne restauratrice de documents, elle a découvert un réseau de faux certificats derrière des acquisitions de musées. Joueuse et théâtrale, elle négocie les passages difficiles et se glisse dans les milieux les mieux gardés.'],
 ['RAVEN','L’Expérimentée',[5,6,9],['secours','langues','combat'],'Secouriste aguerrie aux interventions internationales, elle soigne, traduit et protège son équipe quand la situation dégénère. Austère et difficile à déstabiliser, elle refuse d’abandonner quelqu’un sur le terrain.'],
 ['LINK','Le Furtif',[3,9,8],['informatique','infiltration','secours'],'Ancien technicien des réseaux urbains, il a appris à entrer discrètement, réparer vite et ressortir avec les autres. Habile et calme, il préfère une solution concrète à un long exposé. Il improvise parfois avant de mesurer toutes les conséquences.'],
 ['VIKTOR','Le Repéreur',[6,9,5],['drones','enquete','langues'],'Ancien inspecteur de sites industriels internationaux, il a découvert des sabotages dissimulés derrière de faux rapports d’accident. Curieux et sociable, il suit les traces depuis le terrain comme depuis les airs. Il cherche parfois une dernière donnée quand il faudrait déjà décider.'],
 ['MONROE','Le Gardien',[8,3,9],['combat','diplomatie','surveillance'],'Ancien responsable de la sécurité de délégations franco-britanniques, il lit une salle aussi attentivement qu’un dossier. Courtois, protecteur et doté d’un humour sec, il négocie sans perdre son calme et intervient quand il le faut. Son besoin de tout contrôler laisse peu de place à l’improvisation.'],
 ['TARA','La Prévoyante',[9,5,6],['tactique','endurance','secours'],'Ancienne préparatrice d’opérations et d’évacuations sur des terrains isolés, elle prévoit les itinéraires, les réserves et les solutions de repli. Patiente et directe, elle prépare son équipe à tenir jusqu’au retour. Elle doit parfois accepter de partir avant que le plan soit parfait.']
];
export const ROSTER=cast.map((c,i)=>({id:'p'+i,name:c[0],role:c[1],stats:c[2],talents:c[3],bio:c[4],portrait:i<12?i:null,nationalities:i===0?['GB']:i===12?['US']:i===13?['RU']:i===14?['CN']:i===15?['FR']:i===16?['IN']:i===17?['CN']:i===18?['US']:i===19?['ZA']:i===20?['JP']:i===21?['DE','US']:i===22?['BR']:i===23?['TR']:i===24?['CA']:i===25?['FR','BR']:i===26?['CN']:i===27?['DE']:i===28?['RU']:i===29?['GB','FR']:i===30?['IN']:[],...(i===15?{age:28}:{})}));
// Presentation order is independent of stable roster IDs and NPC templates.
export const DISPLAY_ROSTER=['p0','p12','p13','p14','p15','p16','p17','p18','p19','p20','p21','p22','p23','p24','p25','p26','p27','p29','p30','p28'].map(id=>ROSTER.find(a=>a.id===id));
export const DEFAULT_TEAM_IDS=Object.freeze(DISPLAY_ROSTER.slice(0,4).map(a=>a.id));
export const ACTIONS={
 travel:{name:'Voyager sous passeport',icon:'plane',stat:2,duration:1,cost:0,fatigue:6,talents:[],safe:true,desc:'Voyage sans arme. Arrivée signalée dans les renseignements du pays et en Diplomatie (nom, pays, tour), sans portrait sur le globe ; la mission reste secrète. Au retour au QG, votre arme de service est récupérée.'},
 sneak:{name:'Passage clandestin',icon:'ghost',stat:2,duration:2,cost:0,fatigue:12,talents:['infiltration'],desc:'Permet de conserver votre arme. Remet votre exposition à 0 en cas de réussite ; +10 en cas d’échec. Durée de base identique au voyage sous passeport. Un échec fait rater le voyage : 36 % sans nouvelle blessure, 36 % blessure, 24,5 % capture à destination, 3,5 % décès.'},
 contacts:{name:'Activer un contact',icon:'people',stat:1,duration:1,cost:0,fatigue:8,talents:['contacts'],desc:'Ouvre l’accès local et ajoute 1 point de Recherche. Tous les gains se cumulent ; 3 points découvrent un dossier, surplus conservé.'},
 collect:{name:'Recueillir une preuve',icon:'file',stat:0,duration:2,cost:0,fatigue:8,talents:['enquete'],desc:'Récupère une pièce brute sur une cible connue. Nécessite un accès local. Indisponible dès que deux preuves non écartées sont réunies pour cette cible. Si la cible quitte le pays, la mission est interrompue immédiatement et l’agent est libéré.'},
 analyze:{name:'Vérifier une preuve',icon:'scan',stat:0,duration:1,cost:0,fatigue:8,talents:['enquete'],home:true,desc:'Authentifie une pièce brute au QG. Les preuves falsifiées sont écartées.'},
 surveil:{name:'Localiser une cible',icon:'eye',stat:0,duration:1,cost:0,fatigue:8,talents:['surveillance'],desc:'Action de 1 tour. Position valable après résolution : Hostile 2 tours, Réticente 2, Neutre 3, Favorable 3, Soutien total 4. Relais satellite : +2 tours. La coopération des autorités modifie les chances ; une fuite reste possible.'},
 hack:{field:true,name:'Intrusion numérique',icon:'terminal',stat:1,duration:2,cost:0,fatigue:8,talents:['informatique'],desc:"Une preuve brute disponible à vérifier (maximum 2 pièces recevables ; falsification possible), +1 tour de hack dans ce pays et +1 point de Recherche. Aucune localisation. Le hack démarre au tour suivant si absent, ou prolonge sa durée restante ; bonus fixe de +10 points. Recherche : tous les gains se cumulent, surplus conservé. Accès local et cible connue dans le pays étranger requis. Interruption sans jet si la cible est arrêtée ; si elle quitte le pays, interruption immédiate et agent libéré."},
 authorize:{name:'Obtenir un mandat',icon:'seal',stat:1,duration:1,cost:0,fatigue:8,talents:['diplomatie'],desc:'Obtient un mandat pour une arrestation légale. La coopération des autorités modifie les chances de −25 (Hostile) à +20 points (Soutien total). Un échec ne dégrade pas la coopération.'},
 prepare:{name:'Préparer une arrestation',icon:'target',stat:0,duration:1,cost:0,fatigue:8,talents:['tactique'],desc:'Prépare le dossier, les accès et l’extraction. Nécessite deux preuves, dont une vérifiée. Avec Planification tactique : +5 à la prochaine tentative d’arrestation de votre équipe sur cette cible.'},
 arrest:{name:'Procéder à l’arrestation',icon:'cuffs',stat:2,duration:1,cost:0,fatigue:18,talents:['combat'],desc:'Capture une cible préparée et localisée. Intervention clandestine possible sans mandat, avec davantage de risques et une perte d’un niveau de coopération après la tentative, réussite ou échec. Avec mandat, la coopération modifie les chances.'},
 hide:{name:'Faire profil bas',icon:'ghost',stat:2,duration:1,cost:0,fatigue:0,safe:true,talents:[],desc:'Réduit l’exposition de 35 et récupère 10 d’énergie.'},
 findSafehouse:{name:'Trouver une planque',icon:'ghost',stat:2,duration:1,cost:0,fatigue:8,talents:['contacts', 'infiltration', 'langues'],field:true,desc:'Cherche un refuge partagé par tous les agents de votre équipe. Couverture légale : +15 points de réussite. Permet ensuite le repos sur place.'},
 fieldRest:{name:'Se reposer dans la planque',icon:'moon',stat:2,duration:1,cost:0,fatigue:0,safe:true,field:true,talents:[],desc:'Nécessite une planque de votre équipe dans ce pays. Récupère 30 d’énergie et réduit l’exposition de 15.'},
 rest:{name:'Se reposer au QG',icon:'moon',stat:2,duration:1,cost:0,fatigue:0,safe:true,home:true,talents:[],desc:'Récupère 50 d’énergie et réduit l’exposition de 20.'},
 heal:{name:'Recevoir des soins',icon:'plus',stat:2,duration:2,cost:0,fatigue:0,safe:true,home:true,talents:[],desc:'Soigne une blessure et rend 40 d’énergie.'},
 protect:{tech:true,name:'Protéger une infrastructure',icon:'shield',stat:1,duration:2,cost:0,fatigue:8,talents:['surveillance'],desc:"Assure la protection du pays où se trouve l’agent, y compris au QG. Deux tours de préparation sans protection. En cas de réussite : protège pendant quatre tours, celui de la résolution et les trois suivants. En cas d’échec : aucune protection ajoutée. Ne découvre pas de dossier et ne détecte pas d’agent étranger. Utilise Habileté et Surveillance ; réserve un module pendant les deux tours de mission, puis le libère. Une attaque réellement déjouée grâce à cette protection améliore la coopération d’un niveau, une fois par attaque."},
 counter:{name:'Contre-espionnage',icon:'radar',stat:0,duration:1,cost:0,fatigue:8,home:true,talents:['surveillance'],desc:"Au QG : après réussite, balayage mondial des agents adverses à 20+ exposition. Dernière position connue pendant 2 tours, résolution incluse ; aucun suivi ni mission révélée. Recherche : +2 points, tous les gains se cumulent ; dossier découvert à 3 points, surplus conservé. Ne protège pas le QG. Analyse + Surveillance ; aucun module requis."},
 equip:{field:true,name:'Trouver une arme',icon:'case',stat:2,duration:1,cost:0,fatigue:8,talents:['contacts', 'langues'],desc:'Équipe une arme : +10 en arrestation, exposition +10 à l’acquisition. Indisponible si déjà armé.'},
 influence:{name:'Chantage diplomatique',icon:'seal',stat:0,duration:1,cost:0,fatigue:8,talents:['diplomatie'],desc:'Analyse et Diplomatie. Ouvre l’accès local aux preuves et intrusions ; coopération des autorités +1 niveau, au maximum une montée par pays et par tour pour votre équipe. Au niveau maximal, disponible uniquement si l’accès est fermé.'},
 intimidate:{field:true,name:'Intimider un intermédiaire',icon:'people',stat:2,duration:1,cost:0,fatigue:12,talents:['combat'],desc:'Sang-froid et Combat. Sur une cible connue dans ce pays : recueille une preuve brute disponible et confirme sa position jusqu’à la fin du tour suivant la réussite. Aucun accès requis ni ouvert ; coopération inchangée. +20 exposition à la réussite comme à l’échec. Une seule réussite par cible pour votre équipe. Si toutes les preuves sont déjà recueillies, seule la localisation est obtenue.'},
 blackmail:{disabled:true,name:'Faire pression',icon:'lock',stat:2,duration:1,cost:0,fatigue:12,talents:['diplomatie'],desc:'Une preuve vérifiée devient un levier pour obtenir accès et mandat. Accroît l’exposition.'},
 drone:{name:'Reconnaissance par drone',icon:'drone',stat:1,duration:1,cost:0,fatigue:12,talents:['drones'],tech:true,desc:"Ouvre l’accès local et découvre/localise tous les suspects présents dans le pays à la résolution, sauf L’Architecte encore inconnu et les suspects arrêtés. Habileté + Drones. 1 tour, 12 énergie. Position valide 4 tours après résolution, 6 avec relais satellite. Aucune preuve et aucun bonus d’arrestation. Réserve 1 module pendant la mission, libéré à la fin. Réussite : exposition +10."},
 cyberSupport:{name:'Hack d’un pays',icon:'terminal',stat:1,duration:1,cost:0,fatigue:10,talents:['informatique'],home:true,desc:'Depuis le QG : +10 aux jets de votre équipe dans le pays visé pendant les trois tours suivant la réussite. Chaque nouvelle réussite ajoute 3 tours à la durée restante. Le bonus reste à +10 ; aucune preuve obtenue.'},
 rescue:{name:'Extraire un agent capturé',icon:'plane',stat:2,duration:2,cost:0,fatigue:12,talents:['tactique', 'combat'],desc:'Dans le pays de détention, libère un coéquipier. Opération risquée.'}
};
// Current talent help follows the engine's enabled action/talent mappings.
const talentPassives={
 tactique:'Après une préparation réussie, accorde +5 points à la prochaine tentative d’arrestation de son équipe sur cette cible. Réservé lors de la confirmation de l’ordre, consommé au jet, même en cas d’échec. Annulation ou interruption avant le jet : bonus conservé. Non cumulable.',
 chef:'Accorde +5 points de réussite aux autres agents de son équipe dans le même pays, dans la limite de 90 %. Le chef doit être vivant, libre et hors transit. Bonus fixé à la confirmation de l’ordre, sans effet sur ses propres actions ni les actions automatiques.',
 langues:'À l’étranger, annule le malus linguistique de −5 points pour Activer un contact, Obtenir un mandat et Chantage diplomatique. Bonus de +5 points pour Trouver une planque et Trouver une arme, cumulable avec les autres talents.',
 infiltration:'Réduit de 20 % tous les gains d’exposition des missions, en réussite comme en échec, y compris les voyages. Gain final arrondi au supérieur ; les baisses d’exposition sont inchangées.',
 secours:'En fin de tour, soigne une blessure dans le même pays : coéquipier prioritaire, sinon lui-même. Secouriste et bénéficiaire présents, ni en voyage ni capturés. Fonctionne après une autre action et même si le secouriste est blessé, sans restaurer d’énergie.',
 endurance:'Réduit de 25 % toutes les dépenses d’énergie des missions, chaque tour, quel que soit le résultat. Dépense finale arrondie au supérieur. Ne modifie pas la récupération d’énergie.'
};
for(const [id,talent] of Object.entries(TALENTS)){
 const actions=Object.values(ACTIONS).filter(a=>!a.disabled&&!a.safe&&a.talents.includes(id));
 const bonus=id!=='langues'&&actions.length?`+10 points de réussite pour : ${actions.map(a=>a.name).join(' ; ')}.`:'';
 talent[1]=[bonus,talentPassives[id],''].filter(Boolean).join(' ');
}
export const SUSPECTS=[
 {id:'s0',name:'Vesper',role:'Financement',cell:0,country:'DE'}, {id:'s1',name:'Cobalt',role:'Réseaux logistiques',cell:0,country:'TR'},
 {id:'s2',name:'Mantis',role:'Systèmes autonomes',cell:1,country:'JP'}, {id:'s3',name:'Relay',role:'Intrusion numérique',cell:1,country:'BR'},
 {id:'s4',name:'Orphée',role:'Coordination terrain',cell:2,country:'ZA'}, {id:'s5',name:'Kestrel',role:'Approvisionnement',cell:2,country:'CA'},
 {id:'s6',name:'L’Architecte',role:'Direction de Fracture',cell:3,country:'TR'}
];
export const CELLS=['Cellule JANUS','Cellule PRISME','Cellule CENDRE'];
export const EVIDENCE_NAMES=['Flux financiers','Journal d’accès','Déposition recoupée'];
export const TECH={
ai:{name:'IA d’analyse',cost:2,duration:3,icon:'terminal',art:'analyze',effect:'+10 aux nouvelles vérifications · plafond 90 %',desc:'Pendant 3 tours, +10 points aux nouvelles vérifications affectées au QG. Aucun agent dédié ; les preuves doivent être traitées par vos agents. Recherche +1 à la première fin de tour, cumulable avec tous les autres gains de Recherche. Le bonus aux vérifications ne se cumule pas.'},
relay:{name:'Relais satellite',cost:2,duration:2,icon:'world',art:'surveil',effect:'Positions prolongées de +2 tours',desc:'Module actif 2 tours, tour d’activation inclus. Localiser prend toujours 1 tour. Validité de la position après résolution : Hostile/Réticente 2 tours, Neutre/Favorable 3, Soutien total 4 ; avec relais : 4/4/5/5/6 tours. Drone : 4 → 6 tours ; intimidation : 1 → 3 tours. Toutes les positions encore valides gagnent immédiatement 2 tours ; les nouvelles localisations obtenues pendant le relais gagnent aussi 2 tours, quelle que soit leur source. Les prolongations restent après expiration naturelle, mais sont retirées à l’annulation. Une fuite invalide toujours la position. Annulation le tour d’activation : coût remboursé.'},
logistics:{name:'Logistique prioritaire',cost:3,duration:2,icon:'plane',art:'travel',effect:'Nouveaux voyages sous passeport : −1 tour',desc:'Pendant 2 tours, tous les nouveaux voyages sous passeport de votre équipe durent un tour de moins, minimum 1. Aucun effet sur les voyages commencés ou clandestins. Annuler le module annule les voyages accélérés encore planifiés. Annulation le tour d’activation : coût remboursé.'},
guard:{name:'Sentinelle autonome',cost:5,duration:5,icon:'shield',art:'protect',desc:'Ancien appui : protège un pays pendant 5 tours.'}
};

export const cellName=cell=>CELLS[cell]||(cell===3?'L’Architecte':'Direction de Fracture');
export const namedCells=text=>typeof text==='string'?text.replace(/cellule\s+([123])\b/gi,(_,n)=>cellName(Number(n)-1)):text;

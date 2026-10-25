import {isNpcTutorial,tutorialParticipants,tutorialSeed} from './tutorial-mode.js?v=204';
import {NPC_MISSIONS,setupNpcTutorial} from './tutorial-npc.js?v=204';
import * as E from './engine.js?v=204';
import {tutorialTechAllowed} from './tutorial-advanced.js?v=204';
import {SUSPECTS} from './data.js?v=204';
import {isTutorial,TUTORIAL_IDS,tutorialObjective} from './tutorial-rules.js?v=204';
export {isTutorial,tutorialObjective};
export const TUTORIAL_KEY='sigma2040-filigrane-v1';
export const TUTORIAL_MISSIONS=Object.freeze([
 {id:'contact',number:'01',title:'Premier contact',place:'Paris → Berlin',duration:'3–5 min',agents:1,skills:'Choisir un agent · Voyager · Ouvrir un accès',brief:'Une archiviste de Berlin a repéré des transferts sous le nom de « Filigrane ». Elle ne parlera qu’à IRIS. Rejoignez-la et activez le contact.',goals:['Rejoindre Berlin','Activer le contact'],lesson:'Un ordre confirmé est planifié. Il ne commence qu’à la fin du tour. L’accès local permet ensuite la collecte de preuves.',next:'Les archives sont ouvertes. Deux documents nous attendent.'},
 {id:'evidence',number:'02',title:'La pièce suspecte',place:'Berlin / QG de Paris',duration:'6–9 min',agents:2,skills:'Collecter · Vérifier au QG · Écarter un faux',brief:'Les archives lient Vesper au réseau Filigrane, mais deux documents se contredisent. BISHOP poursuit l’enquête à Berlin pendant qu’APÉRO vérifie les pièces au QG.',goals:['Première collecte','Collecte et vérification en parallèle','Planque et seconde vérification','Remplacement et récupération','Dernière vérification'],lesson:'Les preuves sont partagées par votre équipe. Vérifiez la première pendant la deuxième collecte. Pendant les autres attentes, préparez une planque et récupérez l’énergie dépensée. Un faux écarté doit être remplacé.',next:'Vesper prépare son départ. Il reste une courte fenêtre pour intervenir.'},
 {id:'arrest',number:'03',title:'La fenêtre d’intervention',place:'Berlin · Départ à la fin de T6',duration:'5–7 min',agents:3,skills:'Préparer · Obtenir un mandat · Localiser · Arrêter',brief:'Le dossier est prêt à être exploité : deux preuves vérifiées, trois agents à Berlin. Vesper quittera la ville à la fin du tour 6. Coordonnez BISHOP, IRIS et LEI pour l’arrêter légalement.',goals:['Préparer le dossier','Obtenir le mandat','Confirmer la position','Arrêter Vesper'],lesson:'Préparation, mandat et localisation peuvent avancer au même tour avec trois agents différents. La position, elle, expire : localisez près du moment de l’arrestation et vérifiez toujours sa date de validité.',next:'Vesper révèle une attaque imminente contre Berlin.'},
 {id:'countdown',number:'04',title:'Compte à rebours',place:'Berlin · Attaque à la fin de T4',duration:'5–8 min',agents:3,skills:'Déployer · Protéger à temps · Poursuivre l’enquête',brief:'Les aveux de Vesper révèlent une attaque contre Berlin au tour 4. La couverture actuelle expire ce soir. IRIS doit rejoindre Berlin et préparer une protection pendant que BISHOP et APÉRO exploitent deux documents.',goals:['Comparer couverture actuelle et future','Voyager puis protéger Berlin','Collecter et vérifier en parallèle','Intercepter l’attaque'],lesson:'Protéger demande deux tours sur place. La protection dure le tour de résolution et trois tours supplémentaires. Une couverture active maintenant peut expirer avant l’attaque. Une interception rapporte 4 points.',next:'Le dossier révèle une branche de Filigrane à Tokyo.'},
 {id:'longrange',number:'05',title:'Opération longue portée',place:'Paris → Tokyo',duration:'5–8 min',agents:3,skills:'Logistique · Relais satellite · Deux emplacements',brief:'Une nouvelle piste de Vesper mène à Tokyo. BISHOP est sur place ; IRIS et LEI attendent à Paris. Le dossier contient deux preuves vérifiées. Utilisez les modules pour réduire le voyage et prolonger la localisation, puis coordonnez l’intervention.',goals:['Activer la logistique et le relais','Voyager et localiser au même tour','Préparer et mandater en parallèle','Intervenir à Tokyo'],lesson:'Logistique prioritaire coûte 3 crédits et retire un tour aux nouveaux voyages sous passeport, minimum un. Le relais coûte 2 crédits et prolonge les localisations de deux tours. Chaque module est actif deux tours ; une position prolongée reste valide après son expiration naturelle. Deux emplacements seulement.',next:'La dernière piste de Filigrane se trouve en Turquie, en terrain hostile.'},
 {id:'hostile',number:'06',title:'Terrain hostile',place:'Turquie / QG de Paris',duration:'5–8 min',agents:4,skills:'Coopération · Gouvernement · Récupération · Autonomie',brief:'La piste de Vesper mène à Ankara. Les autorités sont hostiles, vos agents fatigués et la réserve presque vide. Une première preuve attend au QG. Choisissez votre soutien, ouvrez l’accès et répartissez librement les rôles pour mener l’arrestation.',goals:['Améliorer la coopération','Choisir financement ou soutien médical','Récupérer pendant l’enquête','Obtenir deux preuves dont une vérifiée et arrêter Vesper'],lesson:'Les faveurs sont immédiates et ne mobilisent aucun agent, mais consomment de la confiance et partagent un délai de deux tours. Le chantage diplomatique ouvre l’accès et améliore la coopération. Une planque permet de récupérer sans rentrer. Une preuve vérifiée parmi les deux suffit pour arrêter ; la seconde vérification reste facultative et peut avancer en parallèle. Les suggestions ne sont pas obligatoires : plusieurs répartitions fonctionnent.',next:'Un passage discret ouvre la dernière phase de Filigrane.'},
 {id:'stealth',number:'07',title:'Effacer les traces',place:'Paris → Ankara',duration:'8–11 min',agents:4,skills:'Deux cibles · Passage clandestin · Exposition · Planque',brief:'Une équipe de surveillance a repéré vos agents. LEI doit rejoindre Ankara discrètement en conservant son arme. Vesper et Cobalt sont tous deux à Ankara : IRIS prépare l’intervention sur Vesper pendant que LEI et APÉRO enquêtent sur Cobalt. BISHOP réduit son exposition et récupère dans une planque. Le dossier de Vesper est prêt ; celui de Cobalt contient une première pièce brute.',goals:['Rejoindre Ankara clandestinement','Planque, repos et profil bas','Enquêter sur Cobalt pendant l’intervention sur Vesper','Arrêter les deux cibles'],lesson:'Dans le panneau d’Ankara, choisissez le dossier Vesper ou Cobalt avant d’affecter une action : preuves, préparation et localisation sont propres à chaque cible. Le mandat et l’accès concernent tout le pays. Un passage clandestin réussi remet l’exposition à zéro et conserve l’arme. Le profil bas réduit l’exposition de 35 et rend 10 énergie ; le repos en planque rend 30 énergie et retire 15 exposition. Les risques habituels du clandestin reviendront en campagne.',next:'La prochaine piste passe par les communications de Filigrane.'},
 {id:'digital',number:'08',title:'Couper le réseau',place:'Ankara / QG de Paris',duration:'5–8 min',agents:3,skills:'Drone · Hack d’un pays · Intrusion · Vérification',brief:'Filigrane coordonne ses opérations depuis Ankara. LEI lance un drone, APÉRO prépare le hack du pays au QG et BISHOP établit une planque. Une première preuve est déjà disponible : vérifiez-la pendant l’intrusion qui fournira la seconde.',goals:['Drone et soutien numérique en parallèle','Intrusion et première vérification','Préparation et seconde vérification','Arrestation'],lesson:'Le drone ouvre l’accès et localise, sans donner de preuve, avec un emplacement de module pendant sa mission. Le hack d’un pays part du QG, sans emplacement, et soutient les ordres suivants. Entre deux vérifications, APÉRO le renouvelle : chaque réussite ajoute trois tours, mais le bonus reste à +10. L’intrusion se fait sur place : une preuve, un tour de hack et un point de Recherche.',next:'Tout est prêt pour l’opération finale sur deux fronts.'},
 {id:'finale',number:'09',title:'Deux fronts',place:'Berlin / Ankara / Paris',duration:'6–9 min',agents:4,skills:'Protection · Enquête · Délais · Coordination',brief:'Filigrane prépare une attaque à Berlin à la fin du T4 ; Vesper quittera Ankara à la fin du T6. IRIS est à Berlin, BISHOP et LEI à Ankara, APÉRO au QG. Une preuve attend sa vérification. Menez protection et enquête en parallèle.',goals:['Protéger Berlin pour T4','Collecter et vérifier ensemble','Préparer, mandater et localiser','Arrêter Vesper avant le départ T6'],lesson:'Une mission de protection et une enquête peuvent avancer au même tour. Réservez un agent à chaque front, vérifiez les dates de couverture et de localisation, et utilisez les temps d’attente pour récupérer.',next:'La suite demande de choisir les moyens et d’adapter le plan.'},
 {id:'resources',number:'10',title:'Des moyens limités',place:'Paris → Tokyo',duration:'7–10 min',agents:4,skills:'Budget · Choix de modules · Soutien gouvernemental',brief:'La branche de Tokyo dispose d’une courte avance. Vous avez 3 crédits : assez pour la logistique ou le relais, mais pas les deux. BISHOP collecte sur place pendant qu’APÉRO vérifie au QG ; IRIS et LEI doivent rejoindre l’équipe. Choisissez vos dépenses et menez l’arrestation.',goals:['Comparer coût et utilité des modules','Répartir les quatre agents','Collecter et vérifier en parallèle','Arrêter Vesper à Tokyo'],lesson:'Un module doit servir le plan du tour. La logistique accélère les nouveaux voyages, le relais prolonge les positions. Les deux ne sont pas obligatoires. Un financement échange de la confiance contre des crédits ; vous pouvez aussi conserver cette confiance et voyager sans accélération.',next:'Filigrane a repéré la surveillance : préparez-vous à réaffecter l’équipe.'},
 {id:'reroute',number:'11',title:'Changement de plan',place:'Ankara → Tokyo / Paris',duration:'8–12 min',agents:4,skills:'Départ d’une cible · Réaffectation · Deux dossiers',brief:'Vesper et Cobalt sont à Ankara. Les preuves et la préparation de Vesper sont acquises ; le dossier de Cobalt reste à compléter. Commencez les deux interventions en parallèle. Un mouvement du réseau vous obligera à revoir la répartition des agents.',goals:['Lire l’avis de départ','Réaffecter des agents vers Tokyo','Poursuivre Cobalt à Ankara','Arrêter les deux cibles'],lesson:'Un départ invalide la localisation, mais conserve les preuves et le dossier préparé. Le mandat concerne le pays : il faut en obtenir un à destination. Ne déplacez pas toute l’équipe si une autre enquête peut continuer sur place.',next:'Vous êtes prêt à choisir vous-même les priorités.'},
 {id:'autonomy',number:'12',title:'À vous de jouer',place:'Berlin / Ankara / Tokyo / Paris',duration:'10–15 min',agents:4,skills:'Priorités · Deux enquêtes · Protection · Autonomie',brief:'Une attaque vise Berlin à la fin du T6. Vesper se trouve à Ankara et Cobalt à Tokyo : arrêtez les deux avant leur départ à la fin du T12. Chaque dossier possède une pièce brute. Vous disposez de quatre agents et de 6 crédits. Organisez vos tours ; les suggestions sont disponibles dans Instructions.',goals:['Couvrir Berlin au T6','Mener les deux enquêtes','Vérifier pendant les collectes','Arrêter Vesper et Cobalt avant le départ T12'],lesson:'Commencez par les échéances et les prérequis. Les opérations indépendantes avancent ensemble. Consultez les rapports et les dates réelles ; les rôles suggérés dans Instructions sont facultatifs. Cette mission conclut l’entraînement sans joueurs PNJ.',next:'Poursuivez avec le chapitre 13 : le service britannique rejoint la formation.'},
 ...NPC_MISSIONS
]);
export const tutorialMission=id=>TUTORIAL_MISSIONS.find(m=>m.id===id);
export function createTutorialGame(id){
 if(!TUTORIAL_IDS.includes(id))throw Error('Mission de formation inconnue.');
 const npc=NPC_MISSIONS.some(m=>m.id===id);
 const s=E.createConfiguredGame('FR',['p0','p12','p14','p15'],tutorialSeed(id),npc?'bb1':'normal',npc?{participants:['FR','GB','US','CN']}:{});
 if(npc){setupNpcTutorial(s,id);E.log(s,tutorialMission(id).brief,'brief','FR');return s;}
 s.tutorial={version:1,mission:id,revision:2};
 // Only the player's service participates; the world map keeps all twelve countries.
 s.factions={FR:s.factions.FR};s.humanFactions=['FR'];
 const agents=id==='contact'?['p0']:id==='evidence'?['p12','p15']:id==='countdown'?['p12','p0','p15']:['hostile','finale','stealth','resources','reroute','autonomy'].includes(id)?['p12','p0','p14','p15']:id==='digital'?['p12','p14','p15']:['p12','p0','p14'];
 s.agents=s.agents.filter(a=>a.faction==='FR'&&agents.includes(a.id));
 for(const a of s.agents){a.country=id==='contact'||a.id==='p15'?'FR':'DE';a.chief=a.id===agents[0];a.weapon=a.country==='FR';}
 s.suspects=SUSPECTS.map(t=>({...t,arrested:false}));
 s.proofs=s.suspects.flatMap(t=>[0,1,2].map(source=>({id:`${t.id}-e${source}`,suspect:t.id,source,authentic:!(t.id==='s0'&&source===1),foundBy:null})));
 s.plots=[];s.threatReports=[];s.attackReports=[];s.turnActivities=[];s.logs=[];s.logId=0;s.crisis=0;
 s.campaignStats={partial:false,detailsPartial:false,factions:{},agents:{},support:{}};
 for(const f of Object.values(s.factions)){f.known={};f.evidence=[];f.budget=6;f.cooperation.DE=2;}
 const f=s.factions.FR;
 f.known.s0={identified:id!=='contact',country:'DE',locationUntil:0,prepared:false,discovery:{turn:1,source:'Briefing de formation · Filigrane'}};
 if(id!=='contact')f.access.DE=true;
 s.fracture={version:1,cells:Array.from({length:3},()=>({pressure:0,resources:0,cooldown:0})),flights:[],moved:[],defenses:{}};
 if(id==='arrest'){
  f.evidence=['s0-e0','s0-e2'].map(id=>({id,verified:true,contested:false,collectedBy:'FR',verifiedBy:'FR'}));
  s.fracture.flights=[{id:'s0',to:'TR',turn:6}];f.known.s0.flightUntil=6;
 }
 if(['countdown','longrange','hostile'].includes(id)){
  // The following exercises reuse the case as independent training snapshots.
  s.proofs.forEach(p=>{p.authentic=true;});
  const country=id==='longrange'?'JP':id==='hostile'?'TR':'DE';
  s.suspects.find(t=>t.id==='s0').country=country;f.known.s0.country=country;
  f.cooperation[country]=id==='hostile'?0:2;f.access[country]=id!=='hostile';
  for(const a of s.agents){a.country=a.id==='p15'||id==='countdown'&&a.id==='p0'||id==='longrange'&&a.id!=='p12'?'FR':country;a.weapon=a.country==='FR';}
  f.evidence=[{id:'s0-e0',verified:id==='longrange',contested:false,collectedBy:'FR',verifiedBy:id==='longrange'?'FR':null}];
  if(id==='longrange')f.evidence.push({id:'s0-e2',verified:true,contested:false,collectedBy:'FR',verifiedBy:'FR'});
  if(id==='countdown'){
   s.plots=[{id:'filigrane-berlin',turn:4,country:'DE',cell:0,kind:'Sabotage des communications',resolved:false,announced:true}];
   f.defense.DE=1;f.defenseBase.DE=1;
  }
  if(id==='hostile'){f.budget=1;f.confidence=40;for(const a of s.agents)a.fatigue=a.id==='p0'?30:a.id==='p15'?40:55;}
 }
 if(['stealth','digital','finale'].includes(id)){
  s.proofs.forEach(p=>{p.authentic=true;});
  s.suspects.find(t=>t.id==='s0').country='TR';f.known.s0.country='TR';
  f.cooperation.TR=2;f.access.TR=id!=='digital';
  for(const a of s.agents){a.country=a.id==='p15'||id==='stealth'&&a.id==='p14'?'FR':id==='finale'&&a.id==='p0'?'DE':'TR';a.weapon=a.country==='FR';}
  f.evidence=[{id:'s0-e0',verified:id==='stealth',contested:false,collectedBy:'FR',verifiedBy:id==='stealth'?'FR':null}];
  if(id==='stealth'){
   f.evidence.push({id:'s0-e2',verified:true,contested:false,collectedBy:'FR',verifiedBy:'FR'});f.known.s0.prepared=true;
   f.known.s1={identified:true,country:'TR',locationUntil:0,prepared:false,discovery:{turn:1,source:'Briefing de formation · Cobalt'}};
   f.evidence.push({id:'s1-e0',verified:false,contested:false,collectedBy:'FR',verifiedBy:null});
   s.agents.find(a=>a.id==='p14').exposure=70;const bishop=s.agents.find(a=>a.id==='p12');bishop.exposure=65;bishop.fatigue=55;
  }
  if(id==='finale'){
   s.plots=[{id:'filigrane-final',turn:4,country:'DE',cell:1,kind:'Sabotage du réseau électrique',resolved:false,announced:true}];
   s.fracture.flights=[{id:'s0',to:'JP',turn:6}];f.known.s0.flightUntil=6;
  }
 }
 if(['resources','reroute','autonomy'].includes(id)){
  s.proofs.forEach(p=>{p.authentic=true;});
  const country=id==='resources'?'JP':'TR';
  s.suspects.find(t=>t.id==='s0').country=country;f.known.s0.country=country;
  for(const c of ['TR','JP','DE']){f.access[c]=true;f.cooperation[c]=2;}
  for(const a of s.agents){a.country=a.id==='p15'?'FR':id==='resources'?(a.id==='p12'?'JP':'FR'):id==='autonomy'?(a.id==='p0'?'DE':a.id==='p14'?'JP':'TR'):'TR';a.weapon=a.country==='FR';}
  f.budget=id==='resources'?3:6;f.confidence=20;
  f.evidence=[{id:'s0-e0',verified:id==='reroute',contested:false,collectedBy:'FR',verifiedBy:id==='reroute'?'FR':null}];
  if(id!=='resources'){
   const c=id==='autonomy'?'JP':'TR';s.suspects.find(t=>t.id==='s1').country=c;
   f.known.s1={identified:true,country:c,locationUntil:0,prepared:false,discovery:{turn:1,source:'Briefing de formation · Cobalt'}};
   f.evidence.push({id:'s1-e0',verified:false,contested:false,collectedBy:'FR',verifiedBy:null});
  }
  if(id==='reroute'){
   f.evidence.push({id:'s0-e2',verified:true,contested:false,collectedBy:'FR',verifiedBy:'FR'});f.known.s0.prepared=true;
   // Unannounced departure: the player learns of it through the real end-turn report.
   s.fracture.flights=[{id:'s0',to:'JP',turn:1}];
  }
  if(id==='autonomy'){
   s.plots=[{id:'filigrane-autonomy',turn:6,country:'DE',cell:2,kind:'Sabotage des communications',resolved:false,announced:true}];
   s.fracture.flights=[{id:'s0',to:'BR',turn:12},{id:'s1',to:'CA',turn:12}];f.known.s0.flightUntil=12;f.known.s1.flightUntil=12;
  }
 }
 E.log(s,tutorialMission(id).brief,'brief','FR');
 return s;
}
export function validateTutorialGame(value){
 const s=structuredClone(value);
 if(!isTutorial(s)||s.player!=='FR'||s.seed!==tutorialSeed(s.tutorial.mission))throw Error('Exercice incompatible.');
 const expected=createTutorialGame(s.tutorial.mission);
 if(isNpcTutorial(s)){
  const participants=tutorialParticipants(s.tutorial.mission);
  if(JSON.stringify(Object.keys(s.factions||{}).sort())!==JSON.stringify([...participants].sort())||s.humanFactions!==undefined&&(s.humanFactions.length!==1||s.humanFactions[0]!=='FR')||s.aiDifficulty!=='bb1'||s.participantRules!==1||s.gameMode!=='regular'||s.plots?.length!==expected.plots.length||s.plots.some(p=>!expected.plots.some(q=>q.id===p.id&&q.cell===p.cell&&q.kind===p.kind)))throw Error('Exercice incompatible.');
  // Normal validation handles recruits, deaths, captures and genuine threat movements.
  E.validateSave(s,{allowTutorial:true});return s;
 }
 // Upgrade the three-agent mission 7 without discarding existing orders or progress.
 if(s.tutorial.mission==='stealth'&&(s.tutorial.revision||1)<2&&s.agents?.length===3&&['p0','p12','p14'].every(id=>s.agents.some(a=>a.id===id&&a.faction==='FR'))){
  s.agents.push(structuredClone(expected.agents.find(a=>a.id==='p15')));
  s.factions.FR.known.s1??=structuredClone(expected.factions.FR.known.s1);
  if(!s.factions.FR.evidence.some(e=>e.id==='s1-e0'))s.factions.FR.evidence.push(structuredClone(expected.factions.FR.evidence.find(e=>e.id==='s1-e0')));
  s.tutorial.revision=2;
 }
 if(s.agents?.length!==expected.agents.length||s.agents.some(a=>a.faction!=='FR'||!expected.agents.some(b=>b.id===a.id))||s.plots?.length!==expected.plots.length||s.plots.some((p,i)=>p.id!==expected.plots[i].id||p.country!==expected.plots[i].country||p.turn!==expected.plots[i].turn)||s.recruitments?.length||s.humanFactions?.length!==Object.keys(s.factions||{}).length||s.humanFactions.some(f=>!s.factions[f])||Object.values(s.factions).some(f=>f.tech?.some(t=>!tutorialTechAllowed(s,t.type))))throw Error('Exercice incompatible.');
 // Build 197 stored inert foreign records. Discard them without changing the exercise.
 s.factions={FR:s.factions.FR};s.humanFactions=['FR'];
 E.validateSave(s,{allowTutorial:true});
 return s;
}
export function readTutorialProgress(storage){
 const empty={version:1,completed:[],sessions:{},warning:false};
 try{
  const raw=storage?.getItem(TUTORIAL_KEY);if(!raw)return empty;
  const p=JSON.parse(raw);if(p.version!==1||!Array.isArray(p.completed)||!p.sessions||typeof p.sessions!=='object')throw Error();
  const result={...empty,completed:TUTORIAL_IDS.filter(id=>p.completed.includes(id)),sessions:{}};
  for(const id of TUTORIAL_IDS)if(p.sessions[id]){try{const s=validateTutorialGame(p.sessions[id]);if(s.tutorial.mission!==id)throw Error();result.sessions[id]=s;if(tutorialObjective(s).done&&!result.completed.includes(id))result.completed.push(id);}catch{result.warning=true;}}
  return result;
 }catch{return {...empty,warning:true};}
}
export function saveTutorialProgress(storage,s,progress){
 if(!isTutorial(s))throw Error('Aucun exercice en cours.');
 const p={version:1,completed:[...new Set(progress.completed)],sessions:{...progress.sessions,[s.tutorial.mission]:s}};
 if(tutorialObjective(s).done&&!p.completed.includes(s.tutorial.mission))p.completed.push(s.tutorial.mission);
 storage.setItem(TUTORIAL_KEY,JSON.stringify(p));
 return {...p,warning:false};
}

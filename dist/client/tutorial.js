import * as E from './engine.js?v=201';
import {SUSPECTS} from './data.js?v=201';
import {isTutorial,TUTORIAL_IDS,tutorialObjective} from './tutorial-rules.js?v=201';
export {isTutorial,tutorialObjective};
export const TUTORIAL_KEY='sigma2040-filigrane-v1';
export const TUTORIAL_MISSIONS=Object.freeze([
 {id:'contact',number:'01',title:'Premier contact',place:'Paris → Berlin',duration:'3–5 min',agents:1,skills:'Choisir un agent · Voyager · Ouvrir un accès',brief:'Une archiviste de Berlin a repéré des transferts sous le nom de « Filigrane ». Elle ne parlera qu’à IRIS. Rejoignez-la et activez le contact.',goals:['Rejoindre Berlin','Activer le contact'],lesson:'Un ordre confirmé est planifié. Il ne commence qu’à la fin du tour. L’accès local permet ensuite la collecte de preuves.',next:'Les archives sont ouvertes. Deux documents nous attendent.'},
 {id:'evidence',number:'02',title:'La pièce suspecte',place:'Berlin / QG de Paris',duration:'6–9 min',agents:2,skills:'Collecter · Vérifier au QG · Écarter un faux',brief:'Les archives lient Vesper au réseau Filigrane, mais deux documents se contredisent. BISHOP poursuit l’enquête à Berlin pendant qu’APÉRO vérifie les pièces au QG.',goals:['Première collecte','Collecte et vérification en parallèle','Planque et seconde vérification','Remplacement et récupération','Dernière vérification'],lesson:'Les preuves sont partagées par votre équipe. Vérifiez la première pendant la deuxième collecte. Pendant les autres attentes, préparez une planque et récupérez l’énergie dépensée. Un faux écarté doit être remplacé.',next:'Vesper prépare son départ. Il reste une courte fenêtre pour intervenir.'},
 {id:'arrest',number:'03',title:'La fenêtre d’intervention',place:'Berlin · Départ à la fin de T6',duration:'5–7 min',agents:3,skills:'Préparer · Obtenir un mandat · Localiser · Arrêter',brief:'Le dossier est prêt à être exploité : deux preuves vérifiées, trois agents à Berlin. Vesper quittera la ville à la fin du tour 6. Coordonnez BISHOP, IRIS et LEI pour l’arrêter légalement.',goals:['Préparer le dossier','Obtenir le mandat','Confirmer la position','Arrêter Vesper'],lesson:'Préparation, mandat et localisation peuvent avancer au même tour avec trois agents différents. La position, elle, expire : localisez près du moment de l’arrestation et vérifiez toujours sa date de validité.',next:'Vesper révèle une attaque imminente contre Berlin.'},
 {id:'countdown',number:'04',title:'Compte à rebours',place:'Berlin · Attaque à la fin de T4',duration:'5–8 min',agents:3,skills:'Déployer · Protéger à temps · Poursuivre l’enquête',brief:'Les aveux de Vesper révèlent une attaque contre Berlin au tour 4. La couverture actuelle expire ce soir. IRIS doit rejoindre Berlin et préparer une protection pendant que BISHOP et APÉRO exploitent deux documents.',goals:['Comparer couverture actuelle et future','Voyager puis protéger Berlin','Collecter et vérifier en parallèle','Intercepter l’attaque'],lesson:'Protéger demande deux tours sur place. La protection dure le tour de résolution et trois tours supplémentaires. Une couverture active maintenant peut expirer avant l’attaque. Une interception rapporte 4 points.',next:'Le dossier révèle une branche de Filigrane à Tokyo.'},
 {id:'longrange',number:'05',title:'Opération longue portée',place:'Paris → Tokyo',duration:'5–8 min',agents:3,skills:'Logistique · Relais satellite · Deux emplacements',brief:'Une nouvelle piste de Vesper mène à Tokyo. BISHOP est sur place ; IRIS et LEI attendent à Paris. Le dossier contient deux preuves vérifiées. Utilisez les modules pour réduire le voyage et prolonger la localisation, puis coordonnez l’intervention.',goals:['Activer la logistique et le relais','Voyager et localiser au même tour','Préparer et mandater en parallèle','Intervenir à Tokyo'],lesson:'Logistique prioritaire coûte 3 crédits et retire un tour aux nouveaux voyages sous passeport, minimum un. Le relais coûte 2 crédits et prolonge les localisations de deux tours. Chaque module est actif deux tours ; une position prolongée reste valide après son expiration naturelle. Deux emplacements seulement.',next:'La dernière piste de Filigrane se trouve en Turquie, en terrain hostile.'},
 {id:'hostile',number:'06',title:'Terrain hostile',place:'Turquie / QG de Paris',duration:'5–8 min',agents:4,skills:'Coopération · Gouvernement · Récupération · Autonomie',brief:'Dernier exercice : la piste de Vesper mène à Ankara. Les autorités sont hostiles, vos agents fatigués et la réserve presque vide. Une première preuve attend au QG. Choisissez votre soutien, ouvrez l’accès et répartissez librement les rôles pour mener l’arrestation.',goals:['Améliorer la coopération','Choisir financement ou soutien médical','Récupérer pendant l’enquête','Obtenir deux preuves vérifiées et arrêter Vesper'],lesson:'Les faveurs sont immédiates et ne mobilisent aucun agent, mais consomment de la confiance et partagent un délai de deux tours. Le chantage diplomatique ouvre l’accès et améliore la coopération. Une planque permet de récupérer sans rentrer. Les suggestions ne sont pas obligatoires : plusieurs répartitions fonctionnent.',next:'Filigrane est démantelé. Vous êtes prêt pour la campagne.'}
]);
export const tutorialMission=id=>TUTORIAL_MISSIONS.find(m=>m.id===id);
export function createTutorialGame(id){
 if(!TUTORIAL_IDS.includes(id))throw Error('Mission de formation inconnue.');
 const s=E.createConfiguredGame('FR',['p0','p12','p14','p15'],197,'normal');
 s.tutorial={version:1,mission:id};
 // Only the player's service participates; the world map keeps all twelve countries.
 s.factions={FR:s.factions.FR};s.humanFactions=['FR'];
 const agents=id==='contact'?['p0']:id==='evidence'?['p12','p15']:id==='countdown'?['p12','p0','p15']:id==='hostile'?['p12','p0','p14','p15']:['p12','p0','p14'];
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
 E.log(s,tutorialMission(id).brief,'brief','FR');
 return s;
}
export function validateTutorialGame(value){
 const s=structuredClone(value);
 if(!isTutorial(s)||s.player!=='FR'||s.seed!==197)throw Error('Exercice incompatible.');
 const expected=createTutorialGame(s.tutorial.mission);
 if(s.agents?.length!==expected.agents.length||s.agents.some(a=>a.faction!=='FR'||!expected.agents.some(b=>b.id===a.id))||s.plots?.length!==expected.plots.length||s.plots.some((p,i)=>p.id!==expected.plots[i].id||p.country!==expected.plots[i].country||p.turn!==expected.plots[i].turn)||s.recruitments?.length||s.humanFactions?.length!==Object.keys(s.factions||{}).length||s.humanFactions.some(f=>!s.factions[f])||Object.values(s.factions).some(f=>f.tech?.some(t=>s.tutorial.mission!=='longrange'||!['relay','logistics'].includes(t.type))))throw Error('Exercice incompatible.');
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
  for(const id of TUTORIAL_IDS)if(p.sessions[id]){try{const s=validateTutorialGame(p.sessions[id]);if(s.tutorial.mission!==id)throw Error();result.sessions[id]=s;}catch{result.warning=true;}}
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

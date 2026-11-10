import {incidentRates,incidentDescription} from './incident-rules.js?v=238';
import {isNpcTutorial,tutorialGuaranteed,tutorialRecruitment,tutorialParticipants} from './tutorial-mode.js?v=238';
import {tutorialTechAllowed,tutorialGovernmentAllowed,tutorialCanWait} from './tutorial-advanced.js?v=238';
import {isTutorial,tutorialOrderError,tutorialObjective} from './tutorial-rules.js?v=238';
import {normalizePrestige} from './score-rules.js?v=238';
import {protectionShare} from './balance-rules.js?v=238';
import {planBB2Faction} from './bot-brillant-2.js?v=238';
import {planBB1Faction} from './bot-brillant-1.js?v=238';
import {operationIds,operationCountries,mapCountries,countryOnMap,validOperationMap,selectOperationMap,travelTurns} from './operation-map.js?v=238';
export {travelTurns};
import {isCooperative,usesSharedCoop,bindCooperativeIntel} from './cooperative.js?v=238';
import {GAME_MODES,selectParticipants,usesDraft,participantCount} from './game-setup.js?v=238';
import {CRIMINAL_POOL,selectCriminals} from './criminal-roster.js?v=238';
import {balanceThreatCountries} from './threat-placement.js?v=238';
import {AI_LEVELS,aiLevel,normalizeAI} from './ai-difficulty.js?v=238';
import {exposurePenalty} from './exposure.js?v=238';
export {exposurePenalty,exposureLabel,activeSightings} from './exposure.js?v=238';
import {selectCells,variantPlots,plotDamage,activeCaptives,rescueTargets,captureLiaison,captivityTick,validateCellVariants} from './cell-variants.js?v=238';
export {rescueTargets} from './cell-variants.js?v=238';
import {cellName,namedCells,campaignSuspects,regularCells,architectEvidenceThreshold,PLAN_B_BONUS} from './data.js?v=238';
import {campaignRules} from './campaign-rules.js?v=238';
import {stopClock} from './campaign-clock.js?v=238';
import {recordOperation,recordSupport,recordAgentCondition,validateCampaignDetails} from './campaign-stats.js?v=238';
import {COOPERATION,initialCooperation,randomizedCooperation,legacyCooperation,cooperationInfo} from './cooperation.js?v=238';
import {placeSuspects,restoreSecondaryCountries} from './placement.js?v=238';
import {initFracture,observeFracture,observeProtection,tickFracture,validateFracture,threatAnnounced} from './fracture.js?v=238';
import {caseFor,proofTitle,OUTCOMES} from './intelligence.js?v=238';
import {STAT_NAMES,COUNTRIES,COUNTRY,ROSTER,DISPLAY_ROSTER,ACTIONS,SUSPECTS,TECH,TALENTS,LEGACY_TALENTS,DOCTRINE_ACTIONS,NATIONAL_BONUSES_ENABLED} from './data.js?v=238';
export const VERSION=1;
export const ECONOMY=Object.freeze({initial:6,income:2,cap:18,boostCost:6,boostPoints:10});
export const funding=f=>({income:f.confidence<10?0:f.confidence>=50?3:ECONOMY.income,cap:ECONOMY.cap});
const boostedChance=(raw,boost)=>Math.min(90,clamp(raw,10,90)+(boost?ECONOMY.boostPoints:0));

export function evidenceQueue(s,f){return s.factions[f].evidence.filter(e=>!e.verified&&!e.contested&&!s.suspects.find(t=>t.id===s.proofs.find(p=>p.id===e.id)?.suspect)?.arrested);}
export function analysisAgent(s,f,id){return s.agents.find(a=>(a.faction===f||isCooperative(s))&&a.task?.type==='analyze'&&a.task.target===id);}
export const GOVERNMENT_FAVORS=Object.freeze({funding:{name:'Financement exceptionnel',cost:15},diplomacy:{name:'Démarche diplomatique',cost:null},medical:{name:'Soutien médical',cost:25}});
export const medicalUses=(s,f=s.player)=>s.factions[f].medicalUses??Math.min(3,Math.max(0,s.campaignStats?.support?.[f]?.government?.medical?.count||0,s.factions[f].lastFavor?.type==='medical'?1:0));
export const medicalCarePending=(s,f=s.player)=>s.factions[f].lastFavor?.care===true&&s.factions[f].lastFavor.turn===s.turn;
export function governmentOptions(s,type,country=null,f=s.player){
 const x=s.factions[f],d=Object.hasOwn(GOVERNMENT_FAVORS,type)?GOVERNMENT_FAVORS[type]:null,nextTurn=x.lastFavor?x.lastFavor.turn+2:1;
 const members=team(s,f),agents=members.filter(a=>a.fatigue>0),wounded=type==='medical'?members.filter(a=>a.status==='injured').map(a=>a.id):[],gain=Math.max(0,Math.min(5,ECONOMY.cap-x.budget));
 const cost=type==='diplomacy'?([15,15,10,5][x.cooperation[country]]??null):d?.cost;
 const error=type==='diplomacy'&&COUNTRY[country]&&!operationIds(s).includes(country)&&!COUNTRY[country].power?'Ce pays ne fait pas partie de cette campagne.':isTutorial(s)&&(!tutorialGovernmentAllowed(s,type,country)||tutorialObjective(s).done||tutorialObjective(s).failed)?(s.tutorial.mission==='hostile'&&type==='diplomacy'&&country==='TR'?'Conservez au moins 15 confiance pour choisir le financement ou le soutien médical.':'Les faveurs gouvernementales sont hors de cet exercice.'):!d?'Faveur inconnue.':s.ended?'Campagne terminée.':type==='medical'&&medicalUses(s,f)>=3?'Les 3 soutiens médicaux de cette partie ont été utilisés.':s.turn<nextTurn?`Disponible au tour ${nextTurn}.`:cost!==null&&x.confidence<cost?`Il faut ${cost} confiance.`:type==='funding'&&!gain?'Réserve pleine.':type==='diplomacy'&&(!COUNTRY[country]||COUNTRY[country].power)?'Choisissez un pays secondaire.':type==='diplomacy'&&x.cooperation[country]>=4?'Coopération déjà maximale.':type==='medical'&&!agents.length&&!wounded.length?'Aucun agent à revigorer ou à soigner.':null;
 return {cost,nextTurn,error,gain,energy:type==='medical'?12:0,medicalRemaining:Math.max(0,3-medicalUses(s,f)),agents:agents.map(a=>a.id),wounded};
}
export function requestGovernmentFavor(s,type,country=null,f=s.player){
 const o=governmentOptions(s,type,country,f);if(o.error)throw Error(o.error);const x=s.factions[f],d=GOVERNMENT_FAVORS[type];
 x.confidence-=o.cost;
 if(type==='funding')x.budget+=o.gain;
 if(type==='diplomacy')shiftCooperation(s,f,country,1,'démarche diplomatique');
 if(type==='medical')x.medicalUses=medicalUses(s,f)+1;
 if(type==='medical')for(const a of s.agents.filter(a=>o.agents.includes(a.id)))a.fatigue=Math.max(0,a.fatigue-o.energy);
 recordSupport(s,f,'government',type,{cost:o.cost,currency:'confidence'});
 x.lastFavor={type,turn:s.turn,...(type==='diplomacy'?{country}:{}),...(type==='funding'?{gain:o.gain}:{}),...(type==='medical'?{care:true}:{})};
 log(s,`${COUNTRY[f].name} : ${d.name}, −${o.cost} confiance${type==='funding'?`, +${o.gain} crédits`:type==='medical'?`, +${o.energy} énergie au maximum pour ${o.agents.length} agent(s) de votre équipe ; soins des blessés en fin de tour`:`, ${COUNTRY[country].name}`} ; prochaine faveur T${s.turn+2}.`,'success',f);
}

function intelSnapshot(s,from,to){s.factions[to].foreignIntel[from]={turn:s.turn,source:'exchange',cases:knownTargets(s,from).map(t=>({id:t.id,country:t.country,identified:!!t.identified,raw:evidenceFor(s,from,t.id).filter(e=>!e.verified).length,verified:evidenceFor(s,from,t.id).filter(e=>e.verified).length,prepared:!!t.prepared,locationUntil:t.locationUntil,arrested:!!t.arrested}))};}
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
const pick=(s,a)=>a[Math.floor(random(s)*a.length)];
export const fatigueName=n=>n<25?'Reposé':n<50?'Sollicité':n<75?'Fatigué':'Épuisé';
export const team=(s,id=s.player)=>s.agents.filter(a=>a.faction===id&&a.status!=='dead'&&a.status!=='retired');
export const coordinationChief=(s,a)=>s.agents.find(b=>b.chief&&b.id!==a.id&&b.faction===a.faction&&b.country===a.country&&!['captured','dead','retired'].includes(b.status)&&!travelInProgress(b));
export const travelInProgress=a=>!!a?.task&&!a.task.queued&&['travel','sneak'].includes(a.task.type);
export function cyberStatus(s,f,c){
 const sources=(usesSharedCoop(s)?Object.values(s.factions):[s.factions[f]]).map(x=>x?.cyberSupport?.[c]).filter(v=>v&&v.until>=s.turn);
 const active=sources.some(v=>v.from<=s.turn),until=Math.max(0,...sources.map(v=>v.until));
 return {active,remaining:until?Math.max(0,until-Math.max(s.turn,Math.min(...sources.map(v=>v.from)))+1):0,until};
}
export const attackDamage=(s,p)=>s.cellVariantRules===1?plotDamage(s,p):campaignRules(s).attackDamage??30;
export const coopCellGoal=s=>usesSharedCoop(s)?3:2;
export const hasSafehouse=(s,f,c)=>usesSharedCoop(s)?(Object.values(s.factions).some(x=>x.safehouses?.includes(c))||s.agents.some(a=>a.safehouses?.includes(c))):!!s.factions[f]?.safehouses?.includes(c)||s.agents.some(a=>a.faction===f&&a.safehouses?.includes(c));
export function log(s,text,type='info',faction=null){s.logs.unshift({turn:s.turn,text:namedCells(text),type,faction,id:++s.logId});s.logs=s.logs.slice(0,400);}
export const visibleLogs=s=>s.logs.filter(l=>!l.faction||l.faction===s.player||isCooperative(s));
export const dossier=(s,f,id)=>s.factions[f].known[id];
const baseAgent=(a,f)=>({...structuredClone(a),nationalities:[...new Set([...(a.nationalities||[]),f])],faction:f,country:f,fatigue:0,exposure:0,status:'ready',weapon:true,safehouses:[],task:null,aidUsed:false});
function reveal(s,f,id,source="Origine non consignée"){if(!id)return;const k=s.factions[f].known;k[id]??={identified:false,country:s.suspects.find(t=>t.id===id).country,locationUntil:0,prepared:false,discovery:{turn:s.turn,source}};}
export const leadResearch=(s,f=s.player)=>s.factions[f].leadResearch||{progress:0,lastTurn:0};
function discover(s,f,country,source,direct=false,points=1){
 const candidates=s.suspects.filter(t=>!t.arrested&&t.id!=='s6'&&!dossier(s,f,t.id));if(!candidates.length){log(s,'Recherche : tous les dossiers accessibles sont déjà connus. Les autres effets de l’opération restent actifs.','info',f);return;}
 if(!direct){const research=s.factions[f].leadResearch??={progress:0,lastTurn:0};research.lastTurn=s.turn;delete research.turnGain;research.progress+=points;log(s,`Recherche : +${points} point(s). Tous les gains se cumulent.`,'clue',f);if(research.progress<3)return;research.progress-=3;source='Trois points de Recherche recoupés. Dernière confirmation : '+source;}

 const local=candidates.filter(t=>t.country===country),t=pick(s,local.length?local:candidates);if(t){reveal(s,f,t.id,source);log(s,`Recherche : dossier découvert — ${t.name}, ${COUNTRY[t.country].name}.`,'clue',f);}return t;
}
const npcId=a=>/^[A-Z]{2}-(?:[0-3]|R[0-9]+)$/.test(a.id);
function npcProfile(s,f,slot=0){
 const current=s.agents.filter(a=>a.faction===f&&!['dead','retired'].includes(a.status)),used=new Set(current.map(a=>a.templateId));
 const pool=DISPLAY_ROSTER.filter(a=>!used.has(a.id));
 // Random selection weighted toward filling the team's weakest capability.
 const totals=[0,1,2].map(i=>current.reduce((n,a)=>n+a.stats[i],0)),weak=totals.indexOf(Math.min(...totals));
 const weights=pool.map(a=>1+(current.length?Math.max(0,a.stats[weak]-5)*2:0));
 let roll=random(s)*weights.reduce((n,v)=>n+v,0);return pool.find((a,i)=>(roll-=weights[i])<0)||pool.at(-1);
}
export function refreshNpcProfiles(s){
 if(usesDraft(s.gameMode))return;
 const changed=new Set();
 for(const a of s.agents.filter(npcId)){if(DISPLAY_ROSTER.some(t=>t.id===a.templateId))continue;const t=npcProfile(s,a.faction);changed.add(a.id);Object.assign(a,{templateId:t.id,name:t.name,role:t.role,bio:t.bio,stats:[...t.stats],talents:[...t.talents],portrait:t.portrait,nationalities:[...new Set([...t.nationalities,a.faction])]});}
 for(const f of Object.values(s.factions))for(const [id,seen] of Object.entries(f.publicAgents||{})){const a=s.agents.find(a=>a.id===id&&npcId(a));if(a&&changed.has(id))Object.assign(seen,{name:a.name,templateId:a.templateId,portrait:a.portrait});}
}
// Four-argument calls retain the historical six-country simulation for old saves and fixtures.
// Every new game in the interface uses createConfiguredGame below.
export function createGame(home,ids,seed=Date.now(),aiDifficulty='bb2',settings=null){
 if(!COUNTRY[home]?.power||ids.length!==4||new Set(ids).size!==4||ids.some(id=>!ROSTER.some(a=>a.id===id)))throw Error('Choisissez un pays et quatre agents distincts.');
 const participants=settings?.participants||COUNTRIES.filter(c=>c.power).map(c=>c.id),mode=settings?.gameMode||'regular',teams=settings?.teams||{};
 if(settings&&(!Object.hasOwn(GAME_MODES,mode)||!Array.isArray(participants)||participants.length!==participantCount(mode)||new Set(participants).size!==participantCount(mode)||!participants.includes(home)||participants.some(id=>!COUNTRY[id]?.power)||Object.entries(teams).some(([c,team])=>!participants.includes(c)||!Array.isArray(team)||team.length!==4||new Set(team).size!==4||team.some(id=>!ROSTER.some(a=>a.id===id)))))throw Error('Configuration de partie invalide.');
 if(settings&&usesDraft(mode)){const all=participants.flatMap(c=>teams[c]||[]);if(Object.keys(teams).length!==participantCount(mode)||all.length!==participantCount(mode)*4||new Set(all).size!==participantCount(mode)*4||all.some(id=>!DISPLAY_ROSTER.some(a=>a.id===id))||ids.join(',')!==teams[home].join(','))throw Error('Terminez le repêchage de tous les agents.');}
 const s={pressureRules:1,campaignStats:{partial:false,detailsPartial:false,factions:{},agents:{},support:{}},turnActivities:[],cooperationRules:1,version:VERSION,agentRules:1,operationsRules:3,economyRules:1,equipmentRules:2,seed:seed>>>0,rng:seed>>>0,turn:1,player:home,crisis:12,ended:null,factions:{},agents:[],suspects:SUSPECTS.map(t=>({...t,arrested:false})),proofs:[],plots:[],logs:[],logId:0,prestigeLedger:[],credited:{},event:null,eventsSeen:[],recruitments:[],nextAgent:1};
 if(settings){s.participantRules=1;s.gameMode=mode;}
 if(settings?.operationMap===true){s.operationCountries=selectOperationMap(participants,settings.mapSeed??seed,mode);}
 const fields=operationCountries(s);
 if(isCooperative(s)){s.coopNetworkRules=1;s.coopCampaignRules=2;s.suspects=campaignSuspects(s).map(t=>({...t,arrested:false}));}
 if(settings?.cellVariants){s.cellVariantRules=1;s.activeCells=isCooperative(s)?[0,1,2,4]:selectCells(s.seed);s.captives=[];s.suspects=campaignSuspects(s).map(t=>({...t,arrested:false}));}
 selectCriminals(s,random);
 placeSuspects(s,random);
 for(const c of COUNTRIES.filter(c=>participants.includes(c.id))){
  s.factions[c.id]={id:c.id,budget:ECONOMY.initial,score:0,confidence:20,medicalUses:0,lastFavor:null,internalInfluenceUses:0,internalInfluenceLastTurn:0,cyberSupport:{},foreignIntel:{},safehouses:[],leadResearch:{progress:0,lastTurn:0},known:{},evidence:[],access:{[c.id]:true},authorized:{[c.id]:true},cooperation:randomizedCooperation(c.id,mapCountries(s),s.seed),cooperationRaised:{},defense:{},defenseBase:{},techSerial:0,tech:[],publicAgents:{},replacementUsed:[]};
  if(c.id===home)s.agents.push(...ids.map(id=>baseAgent(ROSTER.find(a=>a.id===id),home)));
  else for(let i=0;i<4;i++){const a=teams[c.id]?ROSTER.find(a=>a.id===teams[c.id][i]):npcProfile(s,c.id,i);s.agents.push(baseAgent({...a,templateId:a.id,id:`${c.id}-${i}`},c.id));}
  s.agents.find(a=>a.faction===c.id).chief=true;
  const leads=s.suspects.filter(t=>t.cell!==3),pick=list=>list[Math.floor(random(s)*list.length)];
  const first=pick(leads.filter(t=>travelTurns(c.id,t.country,s)===1));
  const distant=leads.filter(t=>t.country!==first.country&&travelTurns(c.id,t.country,s)===2);
  const second=pick(distant.length?distant:leads.filter(t=>t.country!==first.country));
  for(const t of [first,second])reveal(s,c.id,t.id,"Briefing initial transmis par votre service de renseignement.");
 }
 // Independent seeded stream: evidence selection cannot change placements or other campaign rolls.
 const evidenceRng={rng:(s.seed^0x9e3779b9)>>>0},candidates=s.suspects.map(t=>t.id),forgeries=new Map();
 for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random(evidenceRng)*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 for(const id of candidates.slice(0,isCooperative(s)?4:3))forgeries.set(id,Math.floor(random(evidenceRng)*2));
 for(const t of s.suspects)for(let i=0;i<3;i++)s.proofs.push({id:`${t.id}-e${i}`,suspect:t.id,...(t.templateId?{templateId:t.templateId}:{}),source:i,authentic:forgeries.get(t.id)!==i,foundBy:null});
 for(let i=0;i<campaignRules(s).attackCount;i++){const target=pick(s,fields);s.plots.push({id:'plot'+i,turn:campaignRules(s).firstAttack+i*campaignRules(s).attackInterval,country:target.id,cell:i%3,kind:i%2?'Sabotage par drones':'Attaque d’infrastructure',resolved:false});}
 for(const [i,turn] of [16,22,28].entries())s.plots.push({id:'architect'+i,turn,country:fields[((s.seed>>>0)+i*5)%fields.length].id,cell:3,kind:['Effondrement des réseaux financiers','Black-out des communications mondiales','Sabotage des centres de commandement'][i],resolved:false});
 if(s.coopNetworkRules===1)for(const [i,turn] of [6,12,18,24,30].entries())s.plots.push({id:'coop'+i,turn,country:'DE',cell:4,kind:i%2?'Sabotage par drones':'Attaque d’infrastructure',resolved:false});
 if(s.cellVariantRules===1)s.plots=[...variantPlots(s),...s.plots.filter(p=>p.cell===3)];
 balanceThreatCountries(s,random);
 log(s,'Opération LIGNE DE FAILLE. Fracture prépare une campagne de déstabilisation. Identifiez son réseau et arrêtez ses dirigeants.','brief');
 log(s,'Deux pistes initiales sont disponibles. Envoyez vos agents, activez un contact local, puis collectez et vérifiez les preuves.','clue',home);
 bindCooperativeIntel(s);
 if(!normalizeAI(aiDifficulty))throw Error('Niveau IA invalide.');s.aiDifficulty=normalizeAI(aiDifficulty)||'bb2';recordAgentCondition(s,0);initFracture(s);collectTurnAlerts(s,new Set());for(const p of visiblePlots(s))log(s,`Menace détectée : ${p.kind} en ${COUNTRY[p.country].name}, prévue à la fin du tour ${p.turn}. Protégez le pays ou démantelez la ${cellName(p.cell)}.`,'warning');return s;
}
export function createConfiguredGame(home,ids,seed=Date.now(),aiDifficulty='bb2',settings={}){const s=createGame(home,ids,seed,aiDifficulty,{cellVariants:settings.gameMode!=='cooperative',operationMap:true,...settings,participants:settings.participants||selectParticipants([home],seed,settings.gameMode)});prepareCooperativeTurn(s);return s;}
export function locationExpiry(s,f,id){return dossier(s,f,id)?.locationUntil||0;}
export function knownTargets(s,f=s.player){return s.suspects.filter(t=>dossier(s,f,t.id)).map(t=>({...t,...dossier(s,f,t.id),locationUntil:locationExpiry(s,f,t.id)}));}
export function evidenceFor(s,f,id){return s.factions[f].evidence.filter(e=>s.proofs.find(p=>p.id===e.id)?.suspect===id&&!e.contested);}
const countProofs=(s,f,id)=>evidenceFor(s,f,id).length;
export function cellsDone(s){return regularCells(s).filter(c=>s.suspects.filter(t=>t.cell===c).every(t=>t.arrested));}
export function requiresModule(type,agent){return !!ACTIONS[type]?.tech&&(type!=='drone'||!agent?.talents.includes('drones'));}
export function getTechSlots(s,f){return s.factions[f].tech.filter(t=>t.until>=s.turn).length+team(s,f).filter(a=>requiresModule(a.task?.type,a)).length;}
export function territoryError(a,type,target,s){
 const moving=['travel','sneak'].includes(type),country=moving?target:a.country;
 if(COUNTRY[country]&&!countryOnMap(s,country))return 'Ce pays ne fait pas partie de cette campagne.';
 return COUNTRY[country]?.power&&country!==a.faction?'Superpuissance étrangère : déplacements et opérations interdits.':null;
}
export function options(s,agentId,type,target,useCredits=false){
 const a=s.agents.find(a=>a.id===agentId),d=ACTIONS[type];if(!a||!d)return {error:'Action inconnue.'};
 const f=s.factions[a.faction],t=s.suspects.find(t=>t.id===target),k=t&&dossier(s,a.faction,t.id);
 let error=null;
 if(d.disabled)error='Action retirée des opérations.';
 else if(s.ended)error='La campagne est terminée.';
 else if(a.task)error='Cet agent a déjà une opération.';
 else if(['captured','dead','retired'].includes(a.status))error='Cet agent est indisponible.';
 else if(a.fatigue>=100&&!['rest','hide','heal','travel','findSafehouse','fieldRest'].includes(type))error='Agent épuisé : repos ou retour au QG nécessaire.';
 else if(d.home&&a.country!==a.faction)error='Cette action se prépare au QG, dans votre pays.';
 if(['travel','sneak'].includes(type)&&(!COUNTRY[target]||target===a.country))error='Sélectionnez un autre pays.';
 if(['collect','surveil','hack','prepare','arrest','blackmail','intimidate'].includes(type)){
  if(!t||!k)error='Sélectionnez une cible connue.';
  else if(t.arrested)error='Cette cible est déjà arrêtée.';
  else if(a.country!==k.country)error='L’agent doit se trouver dans le pays de la piste.';
 }
 if(type==='collect'&&k&&countProofs(s,a.faction,target)>=2)error='Deux preuves recevables sont déjà réunies pour cette cible. Vérifiez les pièces brutes au QG, puis préparez l’arrestation.';
 if(type==='collect'&&t&&k&&!s.proofs.some(p=>p.suspect===t.id&&!f.evidence.some(e=>e.id===p.id)))error='Toutes les pièces disponibles pour cette cible ont déjà été recueillies.';
 if(['collect','hack'].includes(type)&&k&&!f.access[k.country])error='Un contact, un chantage diplomatique ou un drone doit ouvrir un accès dans ce pays.';
 if(type==='hack'&&(a.country===a.faction||a.country!==k?.country))error='L’intrusion exige une cible connue dans le pays étranger où se trouve l’agent.';
 if(type==='analyze'&&!evidenceQueue(s,a.faction).some(e=>(!target||e.id===target)&&!analysisAgent(s,a.faction,e.id)))error='Aucune pièce en attente disponible pour cette vérification.';
 if(type==='cyberSupport'&&!operationIds(s).includes(target))error='Choisissez un pays secondaire actif pour le Hack.';
 if(type==='drone'&&target&&(!t||!k||t.arrested||a.country!==k.country))error='Sélectionnez une cible locale ou une reconnaissance libre.';
 if(['contacts','authorize','hide','influence','drone','rescue'].includes(type)&&a.country===a.faction)error='Cette action se fait à l’étranger.';
 if(type==='intimidate'&&k?.intimidated)error='Votre équipe a déjà réussi une intimidation sur cette cible.';
 if(type==='influence'&&f.access[a.country]&&(f.cooperation[a.country]===4||f.cooperationRaised?.[a.country]===s.turn))error='Accès déjà ouvert ; progression diplomatique indisponible ce tour ou soutien maximal atteint.';
 if(type==='contacts'&&f.access[a.country])error='Contact établi : accès déjà ouvert dans ce pays. Action terminée.';
 if(type==='authorize'&&f.authorized[a.country])error='Mandat déjà obtenu dans ce pays. Action terminée.';
 if(useCredits&&d.safe&&!error)error='Cette action est automatique : aucun renfort nécessaire.';
 if(type==='heal'&&a.status!=='injured')error='Cet agent n’a pas besoin de soins.';
 if(d.field&&a.country===a.faction)error='Cette action se fait à l’étranger.';
 if(type==='findSafehouse'&&hasSafehouse(s,a.faction,a.country))error='Planque déjà trouvée dans ce pays. Action terminée.';
 if(type==='fieldRest'&&!hasSafehouse(s,a.faction,a.country))error='Trouvez d’abord une planque dans ce pays.';
 if(type==='equip'&&a.weapon)error='Cet agent possède déjà une arme.';
 if(type==='prepare'&&k?.prepared)error='Arrestation déjà préparée pour cette cible. Action terminée.';
 if(type==='prepare'&&k&&!k.prepared&&(countProofs(s,a.faction,target)<2||!evidenceFor(s,a.faction,target).some(e=>e.verified)))error='Deux preuves, dont une vérifiée, nécessaires.';
 if(type==='arrest'&&k&&(!k.prepared||locationExpiry(s,a.faction,target)<s.turn||countProofs(s,a.faction,target)<2||!evidenceFor(s,a.faction,target).some(e=>e.verified)))error='Dossier préparé, deux preuves dont une vérifiée, et localisation fraîche nécessaires.';
 if(['prepare','arrest'].includes(type)&&k&&countProofs(s,a.faction,target)<2&&f.evidence.some(e=>e.contested&&s.proofs.find(p=>p.id===e.id)?.suspect===target))error='Preuve falsifiée écartée : recueillez une nouvelle pièce avant de préparer ou de procéder à une arrestation.';
 if(type==='blackmail'&&k&&!evidenceFor(s,a.faction,target).some(e=>e.verified))error='Une preuve vérifiée sur cette cible est nécessaire.';
 if(type==='rescue'){const victim=rescueTargets(s,a.faction).find(b=>b.id===target);if(!victim||victim.country!==a.country)error='Rejoignez le pays où cet agent est détenu.';}
 if(requiresModule(type,a)&&getTechSlots(s,a.faction)>=2)error='Les deux Modules d’opération sont occupés.';
 let duration=d.duration;if(['travel','sneak'].includes(type)&&COUNTRY[target]){duration=travelTurns(a.country,target,s);}
 if(type==='travel'&&f.tech.some(t=>t.type==='logistics'&&t.until>=s.turn))duration=Math.max(1,duration-1);
 const cost=useCredits?ECONOMY.boostCost:0;if(f.budget<cost&&!error)error='Budget insuffisant.';
 const used=d.talents.filter(t=>a.talents.includes(t)&&(t!=='langues'||a.country!==a.faction));
 const languageBonus=used.includes('langues')?5:0,talentBonus=(used.some(t=>t!=='langues')?10:0)+languageBonus;
 let bonus=talentBonus,penalty=(a.fatigue>=75?20:a.fatigue>=50?10:0)+(a.status==='injured'?10:0);
 const explanations=[];const support=cyberStatus(s,a.faction,a.country);if(!d.safe&&a.country!==a.faction&&support.active&&!['travel','sneak'].includes(type)){bonus+=10;explanations.push('Hack d’un pays +10');}if(a.fatigue>=50)explanations.push('Fatigue −'+(a.fatigue>=75?20:10));if(a.status==='injured')explanations.push('Blessure −10');if(exposurePenalty(a,type)){const risk=exposurePenalty(a,type);penalty+=risk;explanations.push('Exposition −'+risk);}if(used.some(t=>t!=='langues'))explanations.push('Talents +10');if(languageBonus)explanations.push('Langues étrangères +5 (cumulable)');
 if(NATIONAL_BONUSES_ENABLED&&DOCTRINE_ACTIONS[a.faction]?.includes(type)){bonus+=10;explanations.push('Doctrine nationale +10');}
 if(type==='analyze'&&f.tech.some(t=>t.type==='ai'&&t.until>=s.turn)){bonus+=10;explanations.push('IA +10');}
 if(a.weapon&&d.stat===2&&!d.safe&&!d.disabled&&type!=='equip'){bonus+=10;explanations.push('Arme +10');}
 if(type==='arrest'&&!f.authorized[a.country]){penalty+=15;explanations.push('Sans mandat −15');}
 const coop=cooperationInfo(s,a.faction,a.country),coopBonus=type==='authorize'?coop.mandate:type==='surveil'||type==='arrest'&&f.authorized[a.country]?coop.field:0;if(coopBonus){bonus+=coopBonus;explanations.push('Coopération des autorités · '+coop.name+' '+(coopBonus>0?'+':'')+coopBonus);}
 const operationCountry=['travel','sneak'].includes(type)?target:a.country;
 if(!d.safe&&ROSTER.find(r=>r.id===(a.templateId||a.id))?.nationalities.includes(operationCountry)){bonus+=5;explanations.push('Nationalité locale +5');}
 const tactical=type==='arrest'&&k?.tacticalArrestBonus&&!s.agents.some(b=>b.faction===a.faction&&b.task?.type==='arrest'&&b.task.target===target&&b.task.tacticalBonus===5);if(tactical){bonus+=5;explanations.push('Planification tactique +5 · prochaine tentative');}
 const chief=!d.safe&&coordinationChief(s,a);if(chief){bonus+=5;explanations.push(`Coordination · ${chief.name} +5`);}
 const statChance=50+7*(a.stats[d.stat]-5);
 const planBonus=(!d.safe&&a.talents.includes('planB')&&a.planBExpires>=s.turn)?PLAN_B_BONUS:0;
 if(planBonus)explanations.push(`Plan B +${planBonus}`);
 const rawChance=statChance+bonus-penalty+planBonus;
 if(!d.safe){explanations.unshift(`Base · ${STAT_NAMES[d.stat]} ${a.stats[d.stat]} : 50 + 7 × (${a.stats[d.stat]} − 5) = ${statChance} %`);if(rawChance<10||rawChance>90)explanations.push(`Total avant limites : ${rawChance} % · ${rawChance<10?'minimum 10':'plafond 90'} %`);}
 const baseChance=d.safe?100:clamp(rawChance,10,90),boostGain=d.safe?0:Math.min(ECONOMY.boostPoints,90-baseChance);
 if(useCredits&&!d.safe&&boostGain===0&&!error)error='Chances déjà au plafond : aucun renfort nécessaire.';
 const chance=d.safe?100:boostedChance(rawChance,useCredits),aiApplied=explanations.includes('IA +10'),cyberApplied=explanations.includes('Hack d’un pays +10'),aiBonus=aiApplied?chance-boostedChance(rawChance-10,useCredits):0,cyberBonus=cyberApplied?chance-boostedChance(rawChance-10,useCredits):0;
 if(useCredits&&!d.safe)explanations.push(`Renfort de l’opération · ${ECONOMY.boostCost} crédits : +${boostGain} points${boostGain<10?' (plafond 90 %)':''}`);
 error=territoryError(a,type,target,s)||error;
 if(isTutorial(s)&&!tutorialGuaranteed(s,a.faction))error=error||tutorialOrderError(s,agentId,type,target,useCredits);
 if(isTutorial(s)&&tutorialGuaranteed(s,a.faction)){error=error||tutorialOrderError(s,agentId,type,target,useCredits);return {error,duration,cost:0,chance:100,tacticalBonus:tactical?5:0,coordination:chief?5:0,coordinationChief:chief?.id||null,baseChance:100,boostGain:0,rawChance,aiApplied:false,cyberApplied:false,aiBonus:0,cyberBonus:0,stat:d.stat,talents:used,explanations:[...explanations,`Formation scénarisée : réussite garantie (campagne : ${baseChance} % dans ces conditions).`],fatigue:missionFatigue(a,type),clandestine:false};}
 return {error,duration,cost,chance,planBonus,tacticalBonus:tactical?5:0,coordination:chief?5:0,coordinationChief:chief?.id||null,baseChance,boostGain,rawChance,aiApplied,cyberApplied,aiBonus,cyberBonus,stat:d.stat,talents:used,explanations,fatigue:missionFatigue(a,type),clandestine:type==='arrest'&&!f.authorized[a.country]};
}
export function assign(s,id,type,target=null,useCredits=false){const o=options(s,id,type,target,useCredits);if(o.error)throw Error(o.error);const a=s.agents.find(a=>a.id===id);if(type==='analyze'&&!target)target=evidenceQueue(s,a.faction).find(e=>!analysisAgent(s,a.faction,e.id))?.id;s.factions[a.faction].budget-=o.cost;for(const t of s.factions[a.faction].tech.filter(t=>t.until>=s.turn)){if(type==='travel'&&t.type==='logistics'&&o.duration<travelTurns(a.country,target,s)||type==='analyze'&&t.type==='ai'&&o.aiBonus>0)t.used=true;}const distance=['travel','sneak'].includes(type)?travelTurns(a.country,target,s):null,logistics=type==='travel'&&o.duration<distance?s.factions[a.faction].tech.find(t=>t.type==='logistics'&&t.until>=s.turn):null;a.task={...(distance?{travelDistance:distance,logisticsApplied:!!logistics,logisticsModuleId:logistics?.id||null}:{}),nationalityRules:1,type,target,remaining:o.duration,total:o.duration,cost:o.cost,chance:o.chance,tacticalBonus:o.tacticalBonus,energyRules:2,coordination:o.coordination,coordinationChief:o.coordinationChief,aiBonus:o.aiBonus||0,cyberBonus:o.cyberBonus||0,fatigue:o.fatigue,queued:true,...(o.planBonus?{planBonus:o.planBonus}:{}),clandestine:o.clandestine,origin:a.country,bonusCredits:useCredits?ECONOMY.boostCost:0,...(!ACTIONS[type].safe?{chanceInputs:{raw:o.rawChance,boost:!!useCredits,ai:o.aiApplied,cyber:o.cyberApplied}}:{})};return a.task;}
export function cancel(s,id){if(s.ended)throw Error('La campagne est terminée.');const a=s.agents.find(a=>a.id===id);if(!a?.task)return;if(travelInProgress(a))throw Error('Un déplacement commencé ne peut pas être annulé.');const refund=a.task.queued?Math.max(0,Math.min(a.task.cost,a.task.bonusCredits||0)):0;s.factions[a.faction].budget+=refund;log(s,`${a.name} : opération annulée. L’agent est disponible.${refund?` Renfort non commencé remboursé : ${refund} crédits.`:''}`,'info',a.faction);a.task=null;}
export function ensurePrestigeLedger(s){if(!s.prestigeLedger)s.prestigeLedger=Object.values(s.factions).filter(f=>f.score>0).map(f=>({key:'legacy:'+f.id,faction:f.id,turn:null,points:f.score,reason:'Points acquis avant le suivi détaillé'}));return s.prestigeLedger;}
function award(s,key,f,n,reason){if(s.credited[key])return;ensurePrestigeLedger(s).push({key,faction:f,turn:s.turn,points:n,reason});s.credited[key]=f;s.factions[f].score+=n;const gain=Math.min(2,100-s.factions[f].confidence);s.factions[f].confidence+=gain;log(s,`${COUNTRY[f].name} · +${n} prestige · +${gain} confiance : ${reason.split(' : ')[0]}.`,'score');}
function shiftCooperation(s,f,c,delta,reason){const faction=s.factions[f],before=faction.cooperation[c],after=clamp(before+delta,0,4);faction.cooperation[c]=after;if(after!==before)log(s,`Coopération des autorités en ${COUNTRY[c].name} : ${COOPERATION[before].name} → ${COOPERATION[after].name} (${reason}).`,delta>0?'success':'warning',f);}
function locate(s,a,t,duration=4){const relay=s.factions[a.faction].tech.find(x=>x.type==='relay'&&x.until>=s.turn);if(relay){duration+=2;relay.used=true;}const k=dossier(s,a.faction,t.id);k.droneArrestBonus=false;k.country=t.country;if(!k.identified)k.identityBy=a.faction;k.identified=true;k.locationUntil=s.turn+duration;if(relay)(relay.targets??={})[t.id]={country:t.country,until:k.locationUntil-2,extendedUntil:k.locationUntil};k.locBy=a.faction;log(s,`${a.name} a localisé ${t.name} à ${COUNTRY[t.country].city}. Position valable jusqu’au tour ${k.locationUntil}.`,'clue',a.faction);}
function extendCountryHack(s,a,country,turns,cost=0){const f=s.factions[a.faction],previous=f.cyberSupport[country],extended=previous&&previous.until>=s.turn;const support=f.cyberSupport[country]={from:extended?previous.from:s.turn+1,until:Math.max(s.turn,previous?.until||0)+turns,cost:cost+(extended?cyberSupportRefund(previous):0)};log(s,`${a.name} : Hack d’un pays — ${COUNTRY[country].name}, +${turns} tour(s), jusqu’à T${support.until} inclus. Bonus non cumulable : +10 points.`,'success',a.faction);}
function collect(s,a,t){const f=s.factions[a.faction];const p=s.proofs.find(p=>p.suspect===t.id&&!f.evidence.some(e=>e.id===p.id));if(!p){log(s,`${a.name} : aucune nouvelle pièce à recueillir sur ${t.name}.`,'info',a.faction);return;}p.foundBy??=a.faction;f.evidence.push({id:p.id,verified:false,contested:false,collectedBy:a.faction,verifiedBy:null});const k=dossier(s,a.faction,t.id);if(!k.identified)k.identityBy=a.faction;k.identified=true;log(s,`${a.name} : « ${proofTitle(p)} » recueillie sur ${t.name}. Pièce brute ; vérification au QG requise.`,'clue',a.faction);}
export const missionFatigue=(a,type)=>Math.ceil(ACTIONS[type].fatigue*(a.talents.includes('endurance')?.75:1));
export const exposureGain=(a,task,n)=>n>0?Math.ceil(n*(a.talents.includes('infiltration')?.8:1)):n;
export function missionExposure(a,type,success=true){const base=success?({travel:10,sneak:-a.exposure,intimidate:20,drone:10,equip:10,blackmail:30,rest:-20,fieldRest:-15,hide:-35}[type]||0):type==='sneak'?10:type==='intimidate'?20:18;return exposureGain(a,{type},base);}

function incident(s,a,task){
 a.exposure=clamp(a.exposure+missionExposure(a,task.type,false),0,100);
 const rates=incidentRates(task.type,task.clandestine);if(!rates)return;
 const r=random(s),{safe,capture}=rates;
 if(r<safe){log(s,`${a.name} : opération abandonnée, sans nouvelle blessure ni capture.`,'info',a.faction);}
 else if(r<1-capture){a.status='injured';log(s,`${a.name} est blessé. Des soins sont disponibles au QG ou auprès d’un secouriste sur place.`,'warning',a.faction);}
 else {a.status='captured';if(task.type==='sneak')a.country=task.target;log(s,`${a.name} est détenu en ${COUNTRY[a.country].name}. Une extraction est possible.`,'danger',a.faction);}
}

function resolve(s,a,task){
 const f=s.factions[a.faction],type=task.type,t=s.suspects.find(t=>t.id===task.target);
 if(type==='analyze'&&!f.evidence.some(e=>(!task.target||e.id===task.target)&&!e.verified&&!e.contested)){log(s,`${a.name} : mission close, les pièces ont déjà été traitées par un autre analyste.`,'info',a.faction);return;}
 if(type==='rescue'&&!rescueTargets(s,a.faction).some(b=>b.id===task.target)){task.withoutObject=true;f.budget+=task.bonusCredits||0;log(s,`${a.name} : mission close, l’agent n’est plus détenu.`,'info',a.faction);return;}
 if(t?.arrested&&type==='arrest'){const refund=task.bonusCredits||0;f.budget+=refund;task.withoutObject=true;log(s,`${a.name} : mission close, arrestation sans objet — ${t.name} est déjà en détention.${refund?` Boost inutilisé remboursé : ${refund} crédits.`:''}`,'info',a.faction);return;}
 if(t?.arrested&&type!=='drone'){log(s,`${a.name} : mission close, ${t.name} est déjà en détention.`,'info',a.faction);return;}
 if(type==='arrest'&&locationExpiry(s,a.faction,t.id)<s.turn){log(s,`${a.name} : position périmée, intervention suspendue.`,'warning',a.faction);return;}
 if(t&&!t.arrested&&['collect','surveil','hack','prepare','arrest','intimidate'].includes(type)&&t.country!==a.country){log(s,`${a.name} : mission close, la cible a quitté le pays. Suivre la nouvelle piste.`,'warning',a.faction);return;}
 if(type==='collect'&&t&&countProofs(s,a.faction,t.id)>=2){log(s,`${a.name} : mission close, deux preuves recevables sont déjà réunies sur ${t.name}.`,'info',a.faction);return;}
 if(type==='prepare'&&dossier(s,a.faction,t.id)?.prepared){log(s,`${a.name} : mission close, l’arrestation de cette cible est déjà préparée.`,'info',a.faction);return;}
 if(type==='intimidate'&&dossier(s,a.faction,t.id)?.intimidated){log(s,`${a.name} : mission close, cette cible a déjà été intimidée par votre équipe.`,'info',a.faction);return;}
 normalizePassportBonus(a,task);
 if(type==='arrest'&&task.chanceInputs?.drone)removeAssignedSupport(task,'drone');
 if(type==='arrest'&&task.clandestine)shiftCooperation(s,a.faction,a.country,-1,'arrestation sans mandat');
 if(type==='arrest'&&task.tacticalBonus===5){dossier(s,a.faction,t.id).tacticalArrestBonus=false;log(s,`${a.name} : Planification tactique +5 consommée pour cette tentative.`,'info',a.faction);}
 if(task.planBonus)delete a.planBExpires;
 if(random(s)*100>=task.chance){
  if(!ACTIONS[type].safe&&a.talents.includes('planB')){
   a.planBExpires=s.turn+2;
   log(s,`Plan B · ${a.name} : +${PLAN_B_BONUS} points à la prochaine mission avec jet lancée d’ici le tour ${a.planBExpires} inclus.`,'info',a.faction);
  }
  log(s,`${a.name} : ${ACTIONS[type].name.toLowerCase()}, échec. Aucune progression.`,'warning',a.faction);incident(s,a,task);if(t&&['collect','surveil','hack','prepare','arrest','drone','intimidate'].includes(type))observeFracture(s,t.cell,1);return;}
 const pressureTarget=t,exposedAtResolution=a.exposure>=80;
 if(exposedAtResolution&&pressureTarget&&['collect','surveil','hack','prepare','intimidate'].includes(type)){observeFracture(s,t.cell,1);log(s,`${a.name} : forte exposition, pression +1 sur ${cellName(t.cell)}.`,'warning',a.faction);}
 if(!ACTIONS[type].safe){const gain=Math.min(3,100-f.confidence);f.confidence+=gain;if(gain)log(s,`${a.name} : +${gain} confiance · opération réussie.`,'success',a.faction);}
 if(['travel','sneak'].includes(type)){
  const carriedWeapon=type==='sneak'&&a.weapon;a.country=task.target;a.weapon=a.country===a.faction?true:!!carriedWeapon;a.exposure=clamp(a.exposure+missionExposure(a,type,true),0,100);
  log(s,`${a.name} : ${a.country===a.faction?'arme de service récupérée au QG':a.weapon?'arme conservée en passage clandestin':'sans arme à l’arrivée ; acquisition locale possible'}.`,'info',a.faction);
  if(type==='travel')for(const ff of Object.values(s.factions))if(ff.id!==a.faction)ff.publicAgents[a.id]={name:a.name,faction:a.faction,country:a.country,turn:s.turn};
  log(s,`${a.name} est arrivé à ${COUNTRY[a.country].city}${type==='sneak'?' par passage clandestin':''}.`,'move',a.faction);
 }else if(type==='contacts'){f.access[a.country]=true;discover(s,a.faction,a.country,`${a.name} — ${ACTIONS[type].name}, à ${COUNTRY[a.country].city}. Une piste a été transmise à votre service.`);}
 else if(type==='intimidate'){collect(s,a,t);locate(s,a,t,1);dossier(s,a.faction,t.id).intimidated=true;a.exposure=clamp(a.exposure+missionExposure(a,type,true),0,100);}
 else if(type==='collect')collect(s,a,t);
 else if(type==='hack'){if(countProofs(s,a.faction,t.id)<2)collect(s,a,t);else log(s,`${a.name} : deux preuves recevables déjà réunies ; hack et recherche maintenus.`,'info',a.faction);extendCountryHack(s,a,a.country,1);discover(s,a.faction,a.country,`${a.name} — Intrusion numérique.`,false,1);}
 else if(type==='surveil')locate(s,a,t,cooperationInfo(s,a.faction,a.country).location);
 else if(type==='drone'){f.access[a.country]=true;const local=s.suspects.filter(x=>x.country===a.country&&!x.arrested&&(x.id!=='s6'||f.known.s6));if(exposedAtResolution)for(const cell of new Set(local.map(x=>x.cell))){observeFracture(s,cell,1);log(s,`${a.name} : forte exposition, pression +1 sur ${cellName(cell)}.`,'warning',a.faction);}for(const candidate of local){reveal(s,a.faction,candidate.id,`${a.name} — Reconnaissance par drone à ${COUNTRY[a.country].city}. Suspect repéré lors du balayage du pays.`);locate(s,a,candidate);}log(s,`${a.name} : accès ouvert ; ${local.length} suspect(s) localisé(s) dans le pays. Aucune preuve recueillie.`,'clue',a.faction);a.exposure=clamp(a.exposure+missionExposure(a,type,true),0,100);}
 else if(type==='analyze'){
  const e=f.evidence.find(e=>(!task.target||e.id===task.target)&&!e.verified&&!e.contested);if(e){const p=s.proofs.find(p=>p.id===e.id),ss=s.suspects.find(t=>t.id===p.suspect);e.verified=p.authentic;e.contested=!p.authentic;e.verifiedBy=a.faction;
   award(s,'proof:'+p.id+':'+a.faction,a.faction,2,(p.authentic?'preuve vérifiée : ':'preuve falsifiée détectée : ')+ss.name+' — '+proofTitle(p));
   if(p.authentic){log(s,`${a.name} a vérifié « ${proofTitle(p)} » contre ${ss.name}.`,'clue',a.faction);const distinct=new Set(f.evidence.filter(e=>e.verified).map(e=>s.proofs.find(p=>p.id===e.id).suspect));if(distinct.size>=architectEvidenceThreshold(s)&&!f.known.s6){reveal(s,a.faction,'s6',`${a.name} — Vérification et recoupement de preuves sur ${isCooperative(s)?'quatre':'trois'} suspects distincts.`);log(s,'Les preuves convergent vers L’Architecte. Nouvelle piste de direction.','clue',a.faction);}}
   else log(s,`${a.name} : « ${proofTitle(p)} » contredit les sources indépendantes. Falsification par IA écartée ; recueillir une autre pièce avant toute nouvelle préparation ou arrestation. Les missions déjà engagées continuent.`,'warning',a.faction);
   deduce(s,a.faction,a.name);
  }
 }else if(type==='authorize')f.authorized[a.country]=true;
 else if(type==='prepare'){dossier(s,a.faction,t.id).prepared=true;dossier(s,a.faction,t.id).prepBy=a.faction;if(a.talents.includes('tactique')){dossier(s,a.faction,t.id).tacticalArrestBonus=true;log(s,'Planification tactique : +5 points réservables pour la prochaine arrestation de votre équipe sur '+t.name+'.','success',a.faction);}}
 else if(type==='arrest'){
  t.arrested=true;t.arrestedBy=a.faction;if(isCooperative(s))t.arrestedTurn=s.turn;observeFracture(s,t.cell,3);const k=dossier(s,a.faction,t.id);award(s,'loc:'+t.id,k.locBy||a.faction,2,'localisation décisive : '+t.name);award(s,'prep:'+t.id,k.prepBy||a.faction,2,'préparation de l’arrestation : '+t.name);award(s,'arrest:'+t.id,a.faction,2,'interpellation : '+t.name);
  for(const ff of Object.values(s.factions)){const before=ff.evidence.length;ff.evidence.splice(0,ff.evidence.length,...ff.evidence.filter(e=>e.verified||s.proofs.find(p=>p.id===e.id)?.suspect!==t.id));const removed=before-ff.evidence.length;if(removed)log(s,`Dossier clos — ${t.name} : ${removed} pièce(s) non vérifiée(s) retirée(s) de ce dossier uniquement. Les pièces des autres cibles sont conservées.`,'info',ff.id);}
  for(const ff of Object.values(s.factions))reveal(s,ff.id,t.id,`Arrestation de ${t.name} par ${COUNTRY[a.faction].name}. Avis partagé entre les puissances.`);
  s.crisis=Math.max(0,s.crisis-4);log(s,`${t.name} arrêté en ${COUNTRY[t.country].name} par ${COUNTRY[a.faction].name}.`,'success');
  if(cellsDone(s).length>=coopCellGoal(s))for(const ff of Object.values(s.factions)){if(!ff.known.s6){reveal(s,ff.id,'s6',usesSharedCoop(s)?`Déposition obtenue après le démantèlement de ${coopCellGoal(s)} cellules. Information partagée entre les puissances.`:"Déposition obtenue après le démantèlement de deux cellules. Information partagée entre les puissances.");log(s,usesSharedCoop(s)?`${coopCellGoal(s)} cellules démantelées. Une déposition révèle L’Architecte.`:'Deux cellules démantelées. Une déposition révèle L’Architecte en Turquie.','clue',ff.id);}}
 }else if(type==='findSafehouse'){if(!hasSafehouse(s,a.faction,a.country)){(f.safehouses??=[]).push(a.country);(a.safehouses??=[]).push(a.country);}log(s,`Votre équipe dispose maintenant d’une planque en ${COUNTRY[a.country].name}. Repos sur place disponible : −30 fatigue par tour.`,'success',a.faction);}
 else if(type==='fieldRest'){a.fatigue=Math.max(0,a.fatigue-30);a.exposure=Math.max(0,a.exposure-15);}
 else if(type==='hide'){a.fatigue=Math.max(0,a.fatigue-10);a.exposure=Math.max(0,a.exposure-35);}
 else if(type==='rest'){a.fatigue=Math.max(0,a.fatigue-50);a.exposure=Math.max(0,a.exposure-20);}
 else if(type==='heal'){a.status='ready';a.fatigue=Math.max(0,a.fatigue-40);a.aidUsed=false;}
 else if(type==='protect'){setDefense(s,f,a.country,s.turn+3);observeProtection(s,a.country,s.turn+3);}
 else if(type==='counter'){discover(s,a.faction,a.country,`${a.name} — Contre-espionnage.`,false,2);let detected=0;for(const foreign of s.agents.filter(b=>b.faction!==a.faction&&b.exposure>=20&&!travelInProgress(b)&&!['dead','retired','captured'].includes(b.status))){detected++;f.publicAgents[foreign.id]={name:foreign.name,faction:foreign.faction,country:foreign.country,turn:s.turn,until:s.turn+1,source:'counter',templateId:foreign.templateId||foreign.id,portrait:foreign.portrait??null};log(s,`${a.name} a repéré ${foreign.name} · équipe ${COUNTRY[foreign.faction].name} · dernière position : ${COUNTRY[foreign.country].name} · T${s.turn}, renseignement valable jusqu’à la fin de T${s.turn+1}. mission inconnue.`,'clue',a.faction);log(s,`${foreign.name} a été repéré par le contre-espionnage de ${COUNTRY[a.faction].name} en ${COUNTRY[foreign.country].name}, au tour ${s.turn}.`,'warning',foreign.faction);}if(!detected)log(s,`${a.name} : balayage mondial terminé, aucun agent adverse repérable.`,'info',a.faction);}

 else if(type==='equip'){a.weapon=true;a.exposure=clamp(a.exposure+missionExposure(a,type,true),0,100);}
 else if(type==='cyberSupport')extendCountryHack(s,a,task.target,3,task.chanceInputs?0:task.cost);
 else if(type==='influence'){f.access[a.country]=true;f.cooperationRaised??={};if(f.cooperationRaised[a.country]!==s.turn&&f.cooperation[a.country]<4){shiftCooperation(s,a.faction,a.country,1,'chantage diplomatique');f.cooperationRaised[a.country]=s.turn;}else log(s,`${a.name} : accès ouvert ; aucune montée supplémentaire de coopération ce tour ou niveau maximal atteint.`,'info',a.faction);}
 else if(type==='blackmail'){f.access[a.country]=true;f.authorized[a.country]=true;a.exposure=clamp(a.exposure+missionExposure(a,type,true),0,100);}
 else if(type==='rescue'){const external=activeCaptives(s).find(c=>c.id===task.target);if(external){external.status='released';external.releasedTurn=s.turn;external.releasedBy=a.faction;s.crisis=Math.max(0,s.crisis-10);award(s,'rescue:'+external.id,a.faction,2,'libération : '+external.name);log(s,`${a.name} a libéré ${external.name} en ${COUNTRY[external.country].name} : crise −10. Fin de la hausse liée à ce captif.`,'success');}const v=s.agents.find(v=>v.id===task.target);if(v?.status==='captured'){v.status='injured';v.exposure=20;log(s,`${a.name} a libéré ${v.name}. Retour au QG conseillé.`,'success',a.faction);}}
 if(!['travel','sneak','analyze','arrest','collect','hack','surveil','rescue'].includes(type))log(s,`${a.name} : ${ACTIONS[type].name}, opération réussie.`,'success',a.faction);
}
export function share(){throw Error('Les échanges de dossiers sont désactivés.');}

// Keep independently earned protection separate from cancellable technology.
function syncDefense(s,f){
 for(const country of new Set([...Object.keys(f.defenseBase),...Object.keys(f.defense),...f.tech.filter(t=>t.type==='guard').map(t=>t.country)])){
  const until=Math.max(f.defenseBase[country]||0,...f.tech.filter(t=>t.type==='guard'&&t.country===country&&t.until>=s.turn).map(t=>t.until));
  if(until)f.defense[country]=until;else delete f.defense[country];
 }
}
function ensureTechnology(s){
 for(const f of Object.values(s.factions)){
  if(!f.defenseBase){
   f.defenseBase={...f.defense};
   // Old saves stored the latest sentry in the aggregate protection map.
   for(const t of f.tech.filter(t=>t.type==='guard'))if(f.defenseBase[t.country]===t.until){
    const reports=(s.operationReports||[]).filter(r=>r.faction===f.id&&r.country===t.country&&r.status==='RÉUSSITE'&&['protect','counter'].includes(r.type));
    const requests=Object.values(s.requestsByFaction||{}).flat().concat(s.requests||[]).filter(r=>r.from===f.id&&r.country===t.country&&r.status==='accepted');
    f.defenseBase[t.country]=Math.max(0,...reports.map(r=>r.turn+3),...requests.map(r=>r.deadline||0));
   }
  }
  for(const [country,until] of Object.entries(f.defense)){
   const tracked=Math.max(f.defenseBase[country]||0,...f.tech.filter(t=>t.type==='guard'&&t.country===country).map(t=>t.until));
   if(until>tracked)f.defenseBase[country]=until;
  }
  f.techSerial??=0;
  for(const t of f.tech){if(t.refundRules!==1){t.used=true;t.refundRules=1;}}
  for(const t of f.tech)if(!t.id)t.id=`${f.id}-tech-${++f.techSerial}`;
  syncDefense(s,f);
 }
}
function setDefense(s,f,country,until){ensureTechnology(s);f.defenseBase[country]=Math.max(f.defenseBase[country]||0,until);syncDefense(s,f);}
export function activateTech(s,type,country=s.player){
 if(!countryOnMap(s,country))throw Error('Ce pays ne fait pas partie de cette campagne.');
 if(isTutorial(s)&&(!tutorialTechAllowed(s,type)||tutorialObjective(s).done||tutorialObjective(s).failed))throw Error('Les modules sont hors de cet exercice.');
 const f=s.factions[s.player],d=Object.hasOwn(TECH,type)&&TECH[type];
 if(!d||!Object.hasOwn(COUNTRY,country)||s.ended)throw Error('Soutien indisponible.');
 if(type!=='guard'&&f.tech.some(t=>t.type===type&&t.until>=s.turn))throw Error('Ce module est déjà actif.');
 if(getTechSlots(s,s.player)>=2)throw Error('Deux modules déjà occupés.');if(f.budget<d.cost)throw Error('Budget insuffisant.');
 ensureTechnology(s);f.budget-=d.cost;
 const t={id:`${f.id}-tech-${++f.techSerial}`,type,country,cost:d.cost,activatedTurn:s.turn,until:s.turn+d.duration-1,used:false,refundRules:1,pendingLead:type==='ai',pendingObservation:type==='guard'};

 if(type==='relay')for(const [id,k] of Object.entries(f.known)){if(k.locationUntil>=s.turn&&!s.suspects.find(x=>x.id===id)?.arrested){(t.targets??={})[id]={country:k.country,until:k.locationUntil,extendedUntil:k.locationUntil+2};k.locationUntil+=2;t.used=true;}}
 f.tech.push(t);syncDefense(s,f);recordSupport(s,s.player,'operations',type,{cost:d.cost,currency:'credits',id:t.id});
 log(s,`${d.name} activée${type==='guard'?' en '+COUNTRY[country].name:''}. Annulation ce tour : coût remboursé et effets retirés.`,'info',s.player);
 return t;
}
export function techRefund(s,t){
 if((t.activatedTurn??t.until-TECH[t.type].duration+1)!==s.turn)return 0;
 if(Number.isFinite(t.cost))return t.cost;
 const audit=t.type==='ai'&&(s.logs||[]).some(l=>l.faction===s.player&&l.text.includes('Financer l’audit')&&l.text.includes(`T${t.until} inclus`));
 return audit?(t.refundRules===1?2:3):t.type==='relay'?3:TECH[t.type].cost;
}
export function cyberSupportRefund(support){return support.cost??Math.max(0,Math.round((support.until-support.from+1)/3))*2;}
function normalizePassportBonus(a,task){
 if(!task||task.nationalityRules===1)return;
 const country=['travel','sneak'].includes(task.type)?task.target:task.origin;
 if(!ACTIONS[task.type].safe&&a.nationalities?.includes(country)&&!ROSTER.find(r=>r.id===(a.templateId||a.id))?.nationalities.includes(country)){
  if(task.chanceInputs){task.chanceInputs.raw-=5;task.chance=boostedChance(task.chanceInputs.raw,task.chanceInputs.boost);}
  else task.chance=Math.max(10,task.chance-5);
  task.nationalityRules=1;
 }
}
function removeAssignedSupport(task,kind){
 const c=task.chanceInputs;if(!c[kind])return;c.raw-=10;c[kind]=false;task.chance=boostedChance(c.raw,c.boost);
 task.aiBonus=c.ai?task.chance-boostedChance(c.raw-10,c.boost):0;
 task.cyberBonus=c.cyber?task.chance-boostedChance(c.raw-10,c.boost):0;
}
export function cancelCyberSupport(s,country){
 if(s.ended)throw Error('La campagne est terminée.');const f=s.factions[s.player],support=f.cyberSupport[country];
 if(!Object.hasOwn(COUNTRY,country)||!support||support.until<s.turn)throw Error('Ce hack d’un pays n’est plus actif.');
 const refund=cyberSupportRefund(support);f.budget+=refund;delete f.cyberSupport[country];
 for(const a of (usesSharedCoop(s)?s.agents:team(s)))if(!cyberStatus(s,a.faction,country).active&&a.task&&a.country===country&&!ACTIONS[a.task.type].safe&&!['travel','sneak'].includes(a.task.type)){
  if(a.task.chanceInputs){removeAssignedSupport(a.task,'cyber');continue;}
  const bonus=a.task.cyberBonus??Math.max(0,Math.min(10,a.task.chance-options(s,a.id,a.task.type,a.task.target,!!a.task.bonusCredits).chance));
  a.task.chance=Math.max(10,a.task.chance-bonus);a.task.cyberBonus=0;
 }
 log(s,`Hack d’un pays en ${COUNTRY[country].name} annulé, ${refund} crédit(s) remboursé(s). Les missions indépendantes continuent sans ce bonus.`,'info',s.player);
}

export function logisticsCancellationAgents(s,t){
 if(t?.type!=='logistics')return [];
 return team(s).filter(a=>a.task?.type==='travel'&&a.task.queued&&(a.task.logisticsModuleId===t.id||!a.task.logisticsModuleId&&a.task.total<travelTurns(a.task.origin,a.task.target,s)));
}
export function cancelTech(s,id){
 if(s.ended)throw Error('La campagne est terminée.');ensureTechnology(s);
 const f=s.factions[s.player],t=f.tech.find(t=>t.id===id&&t.until>=s.turn);
 if(!t)throw Error('Ce module n’est plus actif ou ne vous appartient pas.');
 const affected=logisticsCancellationAgents(s,t);
 const refund=techRefund(s,t);recordSupport(s,s.player,'operations',t.type,{cancel:true,refund});f.budget+=refund;f.tech=f.tech.filter(x=>x!==t);syncDefense(s,f);
 for(const a of affected)cancel(s,a.id);
 if(t.type==='logistics')for(const a of team(s))if(a.task?.type==='travel'&&!a.task.queued&&a.task.logisticsModuleId===t.id){const extra=Math.max(0,travelTurns(a.task.origin,a.task.target,s)-a.task.total);a.task.total+=extra;a.task.remaining+=extra;a.task.logisticsApplied=false;a.task.logisticsModuleId=null;}
 if(t.type==='relay')for(const [target,grant] of Object.entries(t.targets||{})){const k=f.known[target];if(k&&k.country===grant.country&&k.locationUntil===(grant.extendedUntil??grant.until+2))k.locationUntil=grant.until;}
 if(t.type==='ai'&&!f.tech.some(x=>x.type==='ai'&&x.until>=s.turn)){
  for(const a of team(s))if(a.task?.type==='analyze'){if(a.task.chanceInputs){removeAssignedSupport(a.task,'ai');continue;}const bonus=a.task.aiBonus??Math.max(0,Math.min(10,a.task.chance-options(s,a.id,'analyze',a.task.target).chance));a.task.chance=Math.max(10,a.task.chance-bonus);a.task.aiBonus=0;}
 }
 // The threat's protection awareness must not retain a cancelled sentry.
 if(t.type==='guard'&&s.fracture){const until=Math.max(0,...Object.values(s.factions).map(x=>x.defense[t.country]||0));if(until>=s.turn)s.fracture.defenses[t.country]=until;else delete s.fracture.defenses[t.country];}
 log(s,`${TECH[t.type].name} annulée, ${refund} crédit(s) remboursé(s). Module libéré ; effet interrompu.`,'info',s.player);
}

function reservePool(s){const advanced=usesDraft(s.gameMode);return ROSTER.filter(a=>(!advanced||!DISPLAY_ROSTER.some(b=>b.id===a.id))&&!s.agents.some(b=>(advanced||!npcId(b))&&(b.templateId||b.id)===a.id)&&!s.recruitments.some(r=>(r.templateId||r.id)===a.id)&&!(s.unavailableRecruits||[]).includes(a.id));}
export function recruitmentCandidates(s,faction=s.player){const f=s.factions[faction],available=reservePool(s);return f.recruitOffer?f.recruitOffer.map(id=>available.find(a=>a.id===id)).filter(Boolean):available.slice(0,3);}
function replacementOffer(s,faction){const pool=reservePool(s);for(let i=pool.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}s.factions[faction].recruitOffer=pool.slice(0,3).map(a=>a.id);}
export function queueNpcRecruitment(s,faction){if(!usesDraft(s.gameMode)){s.recruitments.push({id:`${faction}-R${s.nextAgent++}`,remaining:2,faction});return;}const pool=reservePool(s);if(!pool.length)return;const candidate=pick(s,pool);s.recruitments.push({id:`${faction}-R${s.nextAgent++}`,templateId:candidate.id,remaining:2,faction});}
function collectTurnAlerts(s,knownThreats){s.threatReports=visiblePlots(s).filter(p=>!knownThreats.has(p.id)).map(p=>({type:'threat',plotId:p.id,turn:s.turn,country:p.country,cell:p.cell,kind:p.kind,attackTurn:p.turn}));for(const faction of new Set((s.turnActivities||[]).filter(r=>r.condition==='dead').map(r=>r.faction)))replacementOffer(s,faction);}
export function recruit(s,id,replaceId=null){if(isTutorial(s)&&(!tutorialRecruitment(s)||tutorialObjective(s).done||tutorialObjective(s).failed))throw Error('L’équipe de cet exercice est déjà constituée.');const f=s.factions[s.player],candidate=ROSTER.find(a=>a.id===id);if(s.ended||!candidate||!reservePool(s).some(a=>a.id===id))throw Error('Recrue indisponible.');if(f.recruitOffer&&!recruitmentCandidates(s).some(a=>a.id===id))throw Error('Choisissez une des recrues proposées.');const current=team(s);if(current.length+s.recruitments.filter(r=>r.faction===s.player).length>=4){const a=current.find(a=>a.id===replaceId);if(!a||a.task||a.country!==s.player||a.status==='captured')throw Error('Libérez un poste ou relevez un agent disponible au QG.');a.status='retired';}s.recruitments.push({id,remaining:2,faction:s.player});if(f.recruitOffer){if(team(s).length+s.recruitments.filter(r=>r.faction===s.player).length<4)replacementOffer(s,s.player);else delete f.recruitOffer;}log(s,`${candidate.name} rejoindra le QG dans deux tours.`,'info',s.player);}
export const visiblePlots=s=>s.plots.filter(p=>!p.resolved&&!p.cancelled&&!(p.cell===3&&s.suspects.find(t=>t.id==='s6').arrested)&&threatAnnounced(s,p)&&!cellsDone(s).includes(p.cell));
export function planFaction(s,f){
 const planner=aiLevel(s)==='bb2'?planBB2Faction:planBB1Faction;
 return planner(s,f,{attackDamage,cyberStatus,team,knownTargets,visiblePlots,evidenceQueue,evidenceFor,travelTurns:(from,to)=>travelTurns(from,to,s),getTechSlots,activateTech,governmentOptions,requestGovernmentFavor,medicalCarePending,options,assign,hasSafehouse,analysisAgent,cellsDone,coopCellGoal,funding,missionExposure,queueNpcRecruitment});
}
function reportDismantledCells(s,previous){
 for(const cell of cellsDone(s)){
  const attacks=s.plots.filter(p=>p.cell===cell&&!p.cancelled&&!p.resolved&&threatAnnounced(s,p)).map(p=>({plotId:p.id,country:p.country,turn:p.turn,kind:p.kind})).sort((a,b)=>a.turn-b.turn);
  if(previous.has(cell)&&!s.plots.some(p=>p.cell===cell&&!p.resolved))continue;
  for(const p of s.plots.filter(p=>p.cell===cell&&!p.resolved)){p.resolved=true;p.cancelled=true;}
  s.cellReports.push({type:'cell',cell,turn:s.turn,suspects:s.suspects.filter(t=>t.cell===cell).map(t=>t.id),attacks});
  log(s,`${cellName(cell)} démantelée : ${attacks.length} attaque(s) annulée(s). Aucun prestige de défense supplémentaire.`,'success');
  for(const p of attacks)log(s,`Attaque annulée : ${p.kind} en ${COUNTRY[p.country].name}, initialement prévue au tour ${p.turn} (${cellName(cell)} démantelée).`,'success');
 }
}
function plotResolution(s){for(const p of s.plots.filter(p=>!p.resolved&&!p.cancelled&&p.turn<=s.turn)){
 p.resolved=true;if(cellsDone(s).includes(p.cell)||p.cell===3&&s.suspects.find(t=>t.id==='s6').arrested){log(s,`Projet d’attaque abandonné : ${cellName(p.cell)} démantelée.`,'success');continue;}
 const defenders=Object.values(s.factions).filter(f=>f.defense[p.country]>=s.turn);
 const crisisBefore=s.crisis;
 if(defenders.length){const sharePoints=protectionShare(defenders.length);for(const f of defenders){award(s,p.id+':'+f.id,f.id,sharePoints,'attentat déjoué : '+COUNTRY[p.country].name);shiftCooperation(s,f.id,p.country,1,'attaque déjouée');}s.crisis=Math.max(0,s.crisis-5);log(s,`Attaque déjouée à ${COUNTRY[p.country].city}. La coopération a protégé l’infrastructure.`,'success');}
 else{s.crisis=clamp(s.crisis+attackDamage(s,p),0,100);if(s.cellVariantRules===1&&p.cell===4){const captive=captureLiaison(s,p);if(captive)log(s,`${captive.name} enlevé en ${COUNTRY[p.country].name}. Extraction ouverte à toutes les équipes; +3 crise par fin de tour tant qu’il reste captif.`,'danger');}log(s,`Fracture frappe ${COUNTRY[p.country].city} : ${p.kind.toLowerCase()}. Crise mondiale +${attackDamage(s,p)}.`,'danger');}
 if(isCooperative(s))(s.enemyAttacks??=[]).push({plotId:p.id,turn:s.turn,cell:p.cell,country:p.country,status:defenders.length?'INTERCEPTÉE':'RÉUSSIE',crisisDelta:s.crisis-crisisBefore});
 s.attackReports.push({type:'attack',plotId:p.id,turn:s.turn,country:p.country,cell:p.cell,kind:p.kind,status:defenders.length?'INTERCEPTÉE':'RÉUSSIE',participants:defenders.map(f=>f.id),prestigeTotal:protectionShare(defenders.length)*defenders.length,crisisDelta:s.crisis-crisisBefore});
 }}
export const EVENTS=[
 {id:'witness',turn:4,title:'Une voix dans le silence',speaker:'Contact anonyme',text:'« J’ai vu leurs livraisons. Je parlerai si vous garantissez ma protection. »',choices:[{label:'Organiser la protection',detail:'3 crédits · nouvelle piste si disponible et déposition brute à vérifier au QG. Une déposition peut être falsifiée. Aucun agent ni module mobilisé ; aucun renseignement si les sources sont épuisées, mais les 3 crédits restent dépensés.',effect:'witness'},{label:'Conserver le contact',detail:'Gratuit · aucun renseignement reçu, aucune protection ni récompense différée.',effect:'none'}]},
 {id:'cipher',turn:9,title:'Un modèle trop parfait',speaker:'Cellule d’analyse',text:'« Une partie du trafic semble générée par une IA. Un audit nous aiderait à distinguer les vraies traces. »',choices:[{label:'Financer l’audit',detail:'2 crédits · 1 module pendant 3 tours, tour actuel inclus. +10 points aux vérifications affectées après activation ; aucune analyse automatique ni remontée de piste. Le temps passe même sans analyse ; bonus non cumulable.',effect:'audit'},{label:'Vérifier manuellement',detail:'Gratuit · aucune analyse lancée. Affectez vous-même un agent au QG pour vérifier les pièces.',effect:'none'}]},
 {id:'mandate',turn:15,title:'Une fenêtre diplomatique',speaker:'Conseil de liaison',text:'« Plusieurs autorités proposent un mandat conjoint, à condition de partager nos preuves vérifiées. »',choices:[{label:'Accepter le mandat',detail:'Gratuit · mandats permanents dans les pays de vos pistes actuelles. Transmet vos preuves vérifiées, préparations, positions valides et progression à tous ; preuves reçues des PNJ, sans accès automatique aux dossiers des joueurs humains.',effect:'mandate'},{label:'Garder nos dossiers',detail:'Aucun effet · vos dossiers restent privés, sans nouveau mandat.',effect:'none'}]},
 {id:'burnout',turn:22,title:'Le prix de la vigilance',speaker:'Médecin de l’unité',text:'« L’équipe tient, mais elle tire sur ses réserves. Je peux organiser une relève logistique immédiate. »',choices:[{label:'Soutenir l’équipe',detail:'4 crédits · +20 énergie immédiatement à chacun de vos agents vivants, détenus compris (maximum 100). Aucun soin, libération ou remplacement ; les missions continuent.',effect:'relief'},{label:'Maintenir le rythme',detail:'Aucun changement',effect:'none'}]},
 {id:'emergency',turn:30,title:'Mobilisation internationale',speaker:'Conseil de sécurité',text:'« La fenêtre se referme. Des fonds d’urgence sont débloqués pour l’opération. »',choices:[{label:'Renforcer les moyens',detail:'+6 crédits immédiatement, dans la limite de votre plafond de financement. Aucun surplus conservé.',effect:'funds'},{label:'Priorité à la stabilité',detail:'−5 crise mondiale immédiatement (minimum 0), pour tous les pays. En multijoueur, chaque joueur peut contribuer à cette réduction.',effect:'calm'}]}
];
export function eventChoiceUnavailable(s,index){return 'Événements à choix désactivés.';}
export function answerEvent(){throw Error('Événements à choix désactivés.');}
function applyMedicalCare(s){
 for(const a of s.agents){
  if(a.status!=='injured'||!medicalCarePending(s,a.faction))continue;
  a.status='ready';
  const note=`Soutien médical : ${a.name} est soigné en fin de tour.`;
  log(s,note,'success',a.faction);
  const activity=s.turnActivities.find(row=>row.agentId===a.id);
  if(activity)activity.notes.push(note);
 }
}
export function prepareCooperativeTurn(s){
 if(!isCooperative(s)||s.ended||s.coopPlannedTurn===s.turn)return;
 for(const f of Object.keys(s.factions))if(!(s.humanFactions||[s.player]).includes(f))planFaction(s,f);
 s.coopPlannedTurn=s.turn;
}
export function advance(s){
 if(isTutorial(s)){const objective=tutorialObjective(s);if(objective.done||objective.failed)throw Error('Exercice terminé.');if(!tutorialCanWait(s)&&!s.agents.some(a=>a.task))throw Error('Affectez l’ordre indiqué avant de terminer le tour.');}
 if(s.ended)throw Error('Campagne terminée.');recordAgentCondition(s,s.turn-1,true);clearDisabledDecisions(s);
 const completedCells=new Set(cellsDone(s)),knownThreats=new Set(visiblePlots(s).map(p=>p.id));s.threatReports=[];s.cellReports=[];s.flightReports=[];s.attackDelayReports=[];
 ensureTechnology(s);
 for(const f of Object.values(s.factions))for(const t of f.tech.filter(t=>t.until>=s.turn)){
  if(t.pendingLead){t.used=true;t.pendingLead=false;discover(s,f.id,t.country,"Assistance IA : recoupement des renseignements disponibles.");}
  if(t.pendingObservation){t.used=true;t.pendingObservation=false;observeProtection(s,t.country,t.until);}
 }
 prepareCooperativeTurn(s);
 for(const f of Object.keys(s.factions))if(!isCooperative(s)&&(!isTutorial(s)||isNpcTutorial(s))&&!(s.humanFactions||[s.player]).includes(f))planFaction(s,f);
 const resolutionAgents=s.humanFactions?[...s.agents].sort((a,b)=>a.id.localeCompare(b.id)):[...s.agents];
 if(s.humanFactions)for(let i=resolutionAgents.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[resolutionAgents[i],resolutionAgents[j]]=[resolutionAgents[j],resolutionAgents[i]];}
 // Freeze final arrest chances before resolving any operation. Reorder only
 // the slots occupied by arrests of the same target, preserving other actions.
 const arrestGroups=new Map();
 for(let i=0;i<resolutionAgents.length;i++){const a=resolutionAgents[i],task=a.task;if(!task||task.remaining!==1||!(task.type==='arrest'||task.type==='rescue'&&activeCaptives(s).some(c=>c.id===task.target)))continue;normalizePassportBonus(a,task);if(task.chanceInputs?.drone)removeAssignedSupport(task,'drone');const group=arrestGroups.get(task.target)||[];group.push({index:i,agent:a,chance:task.chance,cool:a.stats[2]});arrestGroups.set(task.target,group);}
 for(const group of arrestGroups.values()){if(group.length<2)continue;const slots=group.map(x=>x.index);group.sort((a,b)=>a.agent.id.localeCompare(b.agent.id));for(let i=group.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[group[i],group[j]]=[group[j],group[i]];}group.sort((a,b)=>b.chance-a.chance||b.cool-a.cool);slots.forEach((slot,i)=>{resolutionAgents[slot]=group[i].agent;});}
 s.attackReports=[];s.turnActivities=[];for(const a of s.agents.filter(a=>(s.humanFactions||[s.player]).includes(a.faction)&&!['dead','retired'].includes(a.status)))s.turnActivities.push({faction:a.faction,agentId:a.id,agent:a.name,turn:s.turn,country:a.country,type:a.task?.type||null,status:a.task?'EN COURS':a.status==='captured'?'EN DÉTENTION':'SANS ORDRE',notes:[a.task?`Mission en cours : ${Math.max(0,a.task.remaining-1)} tour(s) après cette résolution.`:a.status==='captured'?'Cet agent attend une extraction.':'Aucune opération affectée pour ce tour.']});
 interruptDepartedEvidenceOrders(s);
 for(const a of resolutionAgents){if(!a.task)continue;const task=a.task;if(territoryError(a,task.type,task.target,s)){if(task.queued)s.factions[a.faction].budget+=Math.min(task.cost,task.bonusCredits||0);a.task=null;log(s,`${a.name} : ordre annulé, superpuissance étrangère inaccessible.`,'info',a.faction);continue;}if(task.queued&&task.type==='travel'){a.weapon=false;log(s,`${a.name} voyage sous passeport : départ sans arme.`,'info',a.faction);}task.queued=false;const previousFatigue=a.fatigue;a.fatigue=clamp(a.fatigue+task.fatigue,0,100);task.fatigueSpent=(task.fatigueSpent||0)+a.fatigue-previousFatigue;task.remaining--;if(task.remaining<=0){a.task=null;resolveReported(s,a,task);}}
 for(const r of s.recruitments){r.remaining--;if(r.remaining<=0){const candidate=r.templateId?{...ROSTER.find(a=>a.id===r.templateId),templateId:r.templateId,id:r.id}:ROSTER.find(a=>a.id===r.id)||(()=>{const t=npcProfile(s,r.faction);return {...t,templateId:t.id,id:r.id};})();s.agents.push(baseAgent(candidate,r.faction));log(s,`${candidate.name} est opérationnel au QG.`,'success',r.faction);}}
 s.recruitments=s.recruitments.filter(r=>r.remaining>0);if(s.suspects.find(t=>t.id==='s6').arrested)for(const p of s.plots.filter(p=>p.cell===3&&!p.resolved)){p.cancelled=true;p.resolved=true;log(s,`Menace de l’Architecte annulée : ${p.kind} en ${COUNTRY[p.country].name}, prévue T${p.turn}.`,'success');}reportDismantledCells(s,completedCells);tickFracture(s,random,(...args)=>{log(...args);s.logs[0].fracture=true;});interruptDepartedEvidenceOrders(s);plotResolution(s);if(s.cellVariantRules===1)captivityTick(s,log);
 for(const f of Object.values(s.factions)){f.budget=Math.max(f.budget,Math.min(funding(f).cap,f.budget+funding(f).income));f.tech=f.tech.filter(t=>t.until>s.turn);}
 s.crisis=clamp(s.crisis+campaignRules(s).crisisPerTurn,0,100);log(s,`Tensions mondiales : crise +${campaignRules(s).crisisPerTurn}.`,'warning');
 if(!(isTutorial(s)&&s.tutorial.mission==='simulation')){if(s.suspects.find(t=>t.id==='s6').arrested&&cellsDone(s).length>=coopCellGoal(s))s.ended='victory';else if(s.crisis>=100||s.turn>=campaignRules(s).maxTurns)s.ended='defeat';}
 applyMedicalCare(s);
 recordAgentCondition(s,s.turn);
 if(s.ended){collectTurnAlerts(s,knownThreats);stopClock(s);log(s,s.ended==='victory'?'Fracture démantelée. Victoire collective : le classement national est établi.':'L’opération a échoué. Fracture remporte la confrontation. Aucun pays vainqueur.',s.ended==='victory'?'success':'danger');return s;}
 s.turn++;for(const f of Object.values(s.factions))syncDefense(s,f);collectTurnAlerts(s,knownThreats);prepareCooperativeTurn(s);return s;
}
export function publicState(s){return {turn:s.turn,country:s.player,crisis:s.crisis,budget:s.factions[s.player].budget,confidence:s.factions[s.player].confidence,government:{lastFavor:s.factions[s.player].lastFavor||null,nextTurn:governmentOptions(s,'funding').nextTurn},funding:funding(s.factions[s.player]),foreignIntel:s.factions[s.player].foreignIntel,agents:team(s).map(a=>({id:a.id,name:a.name,country:a.country,nationalities:a.nationalities||[],status:a.status,fatigue:fatigueName(a.fatigue),energy:100-a.fatigue,exposure:a.exposure,task:a.task,weapon:a.weapon,safehouse:!!hasSafehouse(s,a.faction,a.country)})),targets:knownTargets(s).map(({id,name,country,arrested,identified,locationUntil,prepared})=>({id,name,country,arrested,identified,locationUntil,prepared})),evidence:s.factions[s.player].evidence,ended:s.ended};}
export function validateSave(s,{allowTutorial=false}={}){
 const bad=()=>{throw Error('Sauvegarde incompatible ou endommagée.');},number=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 if(s?.coopCampaignRules!==undefined&&(![1,2].includes(s.coopCampaignRules)||!isCooperative(s)||s.coopNetworkRules!==1))bad();
 validateCellVariants(s,bad);
 const slots=campaignSuspects(s),cellIds=s.cellVariantRules===1?[...s.activeCells,3]:[0,1,2,3,...(s?.coopNetworkRules===1?[4]:[])];
 if(s?.coopNetworkRules!==undefined&&(s.coopNetworkRules!==1||!isCooperative(s)))bad();
 if(s?.tutorial&&(!allowTutorial||!isTutorial(s)))bad();
 if(!s||s.version!==VERSION||!COUNTRY[s.player]?.power||!Number.isInteger(s.turn)||!number(s.turn,1,40)||!number(s.rng,0,4294967295)||!number(s.crisis,0,100)||!['victory','defeat',null].includes(s.ended))bad();
 if(isCooperative(s)){
  if(s.coopPlannedTurn!==undefined&&(!Number.isInteger(s.coopPlannedTurn)||!number(s.coopPlannedTurn,1,s.turn)))bad();
  for(const key of ['enemyAttacks','enemyFlights','enemyMoves'])if(s[key]!==undefined&&(!Array.isArray(s[key])||s[key].length>100||s[key].some(e=>!e||!Number.isInteger(e.turn)||!number(e.turn,1,s.turn))))bad();
  if((s.enemyAttacks||[]).some(e=>!s.plots.some(p=>p.id===e.plotId&&p.cell===e.cell)||!COUNTRY[e.country]||!['INTERCEPTÉE','RÉUSSIE'].includes(e.status)||!number(e.crisisDelta,-5,s.cellVariantRules===1?38:30))||new Set((s.enemyAttacks||[]).map(e=>e.plotId)).size!==(s.enemyAttacks||[]).length)bad();
  if((s.enemyFlights||[]).some(e=>!s.suspects.some(t=>t.id===e.id)||!['EMPÊCHÉE','RÉUSSIE'].includes(e.status)))bad();
  if((s.enemyMoves||[]).some(e=>!Number.isInteger(e.cell)||!cellIds.includes(e.cell)||!['flight','delay','relocation'].includes(e.type)))bad();
  if(s.suspects.some(t=>t.arrestedTurn!==undefined&&(!t.arrested||!Number.isInteger(t.arrestedTurn)||!number(t.arrestedTurn,1,s.turn))))bad();
 }
 if(!normalizeAI(s.aiDifficulty))bad();s.aiDifficulty=normalizeAI(s.aiDifficulty);
 if(s.pressureRules!==undefined&&s.pressureRules!==1)bad();
 if(!Array.isArray(s.agents)||s.agents.length>150||!Array.isArray(s.suspects)||s.suspects.length!==slots.length||!Array.isArray(s.proofs)||s.proofs.length!==slots.length*3||!Array.isArray(s.plots)||!Array.isArray(s.logs)||!Array.isArray(s.recruitments)||!Array.isArray(s.eventsSeen)||!s.credited||!number(s.logId,0,100000)||!number(s.nextAgent,1,10000))bad();
 const allPowers=COUNTRIES.filter(c=>c.power).map(c=>c.id),powers=s.participantRules===1?Object.keys(s.factions||{}):allPowers,suspectIds=slots.map(t=>t.id),proofIds=new Set(slots.flatMap(t=>[0,1,2].map(i=>`${t.id}-e${i}`)));
 if(s.participantRules!==undefined&&s.participantRules!==1)bad();
 if(!s.factions||Object.keys(s.factions).length!==(isTutorial(s)?tutorialParticipants(s.tutorial.mission).length:s.participantRules===1?participantCount(s.gameMode):6)||powers.some(id=>!allPowers.includes(id))||!powers.includes(s.player))bad();
 if(s.gameMode!==undefined&&!Object.hasOwn(GAME_MODES,s.gameMode)||usesDraft(s.gameMode)&&s.participantRules!==1)bad();
 if(s.operationCountries!==undefined){
  if(s.participantRules!==1||isTutorial(s)||!validOperationMap(powers,s.operationCountries,s.gameMode))bad();
  const active=s.operationCountries;
  if([...s.suspects,...s.plots].some(x=>!active.includes(x.country))||(s.fracture?.flights||[]).some(f=>!active.includes(f.to))||s.agents.some(a=>a.country!==a.faction&&!active.includes(a.country)))bad();
 }
 if(s.humanFactions!==undefined&&(!Array.isArray(s.humanFactions)||new Set(s.humanFactions).size!==s.humanFactions.length||s.humanFactions.some(f=>!powers.includes(f))))bad();
 if(s.economyRules!==undefined&&s.economyRules!==1)bad();
 if(s.cooperationRules!==undefined&&s.cooperationRules!==1)bad();
 if(s.cooperationRules===undefined){for(const f of Object.values(s.factions)){if(!f?.cooperation||mapCountries(s).some(c=>!number(f.cooperation[c.id],0,100)))bad();}for(const f of Object.values(s.factions)){for(const c of mapCountries(s))f.cooperation[c.id]=legacyCooperation(f.cooperation[c.id]);f.cooperationRaised={};}s.cooperationRules=1;}
 for(const f of Object.values(s.factions)){f.cooperationRaised??={};if(typeof f.cooperationRaised!=='object'||Array.isArray(f.cooperationRaised)||Object.entries(f.cooperationRaised).some(([c,t])=>!COUNTRY[c]||!Number.isInteger(t)||!number(t,1,40)))bad();}
 for(const id of powers){const f=s.factions[id];if(!f||f.id!==id||!number(f.budget,0,1000000)||!number(f.score,0,1000)||!f.known||!Array.isArray(f.evidence)||!Array.isArray(f.tech)||!f.publicAgents)bad();for(const key of ['access','authorized','cooperation','defense'])if(!f[key]||Object.keys(f[key]).some(c=>!COUNTRY[c]))bad();for(const c of mapCountries(s))if(!Number.isInteger(f.cooperation[c.id])||!number(f.cooperation[c.id],0,4))bad();for(const [id,k] of Object.entries(f.known))if((k.tacticalArrestBonus!==undefined&&typeof k.tacticalArrestBonus!=='boolean')||(k.droneArrestBonus!==undefined&&typeof k.droneArrestBonus!=='boolean')||(k.intimidated!==undefined&&typeof k.intimidated!=='boolean')||!suspectIds.includes(id)||!COUNTRY[k.country]||!number(k.locationUntil,0,50)||(k.locBy&&!powers.includes(k.locBy))||(k.prepBy&&!powers.includes(k.prepBy)))bad();if(new Set(f.evidence.map(e=>e.id)).size!==f.evidence.length||f.evidence.some(e=>!proofIds.has(e.id)||typeof e.verified!=='boolean'||typeof e.contested!=='boolean'))bad();if(f.tech.some(t=>!TECH[t.type]||!COUNTRY[t.country]||!number(t.until,0,50)))bad();}
 if(!s.campaignStats){s.campaignStats={partial:true,factions:{}};for(const r of s.operationReports||[])recordOperation(s,{...r,faction:r.faction||s.player});}
 if(s.campaignStats.highlights!==undefined&&(!Array.isArray(s.campaignStats.highlights)||s.campaignStats.highlights.length>10000||s.campaignStats.highlights.some(e=>!e||!powers.includes(e.faction)||!ACTIONS[e.type]||!number(e.turn,1,40)||!number(e.chance,0,100)||typeof e.agent!=='string'||e.agent.length>200)))bad();
 if(!s.campaignStats.factions||typeof s.campaignStats.factions!=='object'||Object.entries(s.campaignStats.factions).some(([f,rows])=>!powers.includes(f)||!rows||Object.entries(rows).some(([k,v])=>!ACTIONS[k]||!v||['count','success','failed','stopped','cost','fatigue','exposure','chance','rolls'].some(key=>!number(v[key],-1000000,1000000)))))bad();
 if(s.turnActivities!==undefined&&(!Array.isArray(s.turnActivities)||s.turnActivities.length>150||s.turnActivities.some(r=>!powers.includes(r.faction)||typeof r.agent!=='string'||!number(r.turn,1,40)||r.type&&!ACTIONS[r.type]||typeof r.status!=='string'||!Array.isArray(r.notes)||r.notes.some(n=>typeof n!=='string'))))bad();
 if(s.campaignClock){const c=s.campaignClock;if(!number(c.startedAt,0,1e15)||(c.endedAt!==null&&!number(c.endedAt,c.startedAt,1e15))||typeof c.partial!=='boolean')bad();}
 validateCampaignDetails(s,bad);
 ensurePrestigeLedger(s);if(!Array.isArray(s.prestigeLedger)||s.prestigeLedger.length>500||s.prestigeLedger.some(e=>!powers.includes(e.faction)||!number(e.points,0,1000)||(e.turn!==null&&!number(e.turn,1,40))||typeof e.key!=='string'||typeof e.reason!=='string'||e.reason.length>500))bad();
 const textSafe=v=>typeof v==='string'&&v.length<500&&!/[<>"]/.test(v);
 for(const f of Object.values(s.factions))for(const t of f.tech){if(t.activatedTurn!==undefined&&(!Number.isInteger(t.activatedTurn)||!number(t.activatedTurn,1,40)))bad();if(t.targets!==undefined&&(t.type!=='relay'||!t.targets||Array.isArray(t.targets)||Object.entries(t.targets).some(([id,v])=>!suspectIds.includes(id)||!v||!COUNTRY[v.country]||!number(v.until,1,50)||v.extendedUntil!==undefined&&!number(v.extendedUntil,v.until,50))))bad();}
 for(const f of Object.values(s.factions))if(f.recruitOffer!==undefined&&(!Array.isArray(f.recruitOffer)||f.recruitOffer.length>3||new Set(f.recruitOffer).size!==f.recruitOffer.length||f.recruitOffer.some(id=>!ROSTER.some(a=>a.id===id))))bad();
 if(s.cellReports!==undefined&&(!Array.isArray(s.cellReports)||s.cellReports.length>Math.floor(slots.length/2)||s.cellReports.some(r=>!r||r.type!=='cell'||!Number.isInteger(r.cell)||!cellIds.filter(c=>c!==3).includes(r.cell)||!number(r.turn,1,40)||!Array.isArray(r.suspects)||r.suspects.length!==2||new Set(r.suspects).size!==2||r.suspects.some(id=>!s.suspects.some(t=>t.id===id&&t.cell===r.cell&&t.arrested))||!Array.isArray(r.attacks)||r.attacks.length>s.plots.length||r.attacks.some(p=>!p||!s.plots.some(t=>t.id===p.plotId&&t.cell===r.cell&&t.resolved)||!COUNTRY[p.country]||!number(p.turn,1,40)||!textSafe(p.kind)))))bad();
 if(s.flightReports!==undefined&&(!Array.isArray(s.flightReports)||s.flightReports.length>42||s.flightReports.some(r=>!r||r.type!=='flight'||!powers.includes(r.faction)||!suspectIds.includes(r.suspectId)||!s.factions[r.faction].known[r.suspectId]||!COUNTRY[r.origin]||!COUNTRY[r.country]||r.origin===r.country||!Number.isInteger(r.turn)||!number(r.turn,1,40))))bad();
 if(s.attackDelayReports!==undefined&&(!Array.isArray(s.attackDelayReports)||s.attackDelayReports.length>s.plots.length*2||s.attackDelayReports.some(r=>!r||r.type!=='postponement'||!s.plots.some(p=>p.id===r.plotId&&p.cell===r.cell&&p.kind===r.kind)||!COUNTRY[r.origin]||!COUNTRY[r.country]||!['flight','protection','relocation'].includes(r.reason)||(r.reason==='relocation')!==(r.origin!==r.country)||!Number.isInteger(r.turn)||!number(r.turn,1,40)||!Number.isInteger(r.oldTurn)||!number(r.oldTurn,r.turn+1,39)||!Number.isInteger(r.attackTurn)||!number(r.attackTurn,r.oldTurn+1,Math.min(40,r.oldTurn+2)))))bad();
 if(s.threatReports!==undefined&&(!Array.isArray(s.threatReports)||s.threatReports.length>s.plots.length||s.threatReports.some(r=>r.type!=='threat'||!s.plots.some(p=>p.id===r.plotId)||!COUNTRY[r.country]||!number(r.turn,1,40)||!number(r.attackTurn,1,40)||!cellIds.includes(r.cell)||!textSafe(r.kind))))bad();
 if(s.attackReports!==undefined&&(!Array.isArray(s.attackReports)||s.attackReports.length>s.plots.length||s.attackReports.some(r=>r.type!=='attack'||!textSafe(r.plotId)||!number(r.turn,1,40)||!COUNTRY[r.country]||!cellIds.includes(r.cell)||!textSafe(r.kind)||!['INTERCEPTÉE','RÉUSSIE'].includes(r.status)||!Array.isArray(r.participants)||r.participants.length>6||r.participants.some(f=>!powers.includes(f))||(r.prestigeTotal!==undefined&&![0,1,2,3,4,6].includes(r.prestigeTotal))||!number(r.crisisDelta,-5,s.cellVariantRules===1?38:30))))bad();
 for(const a of s.agents){if(!powers.includes(a.faction)||!COUNTRY[a.country]||!textSafe(a.id)||!textSafe(a.name)||!textSafe(a.role)||!textSafe(a.bio)||!Array.isArray(a.stats)||a.stats.length!==3||a.stats.some(n=>!number(n,1,10))||!Array.isArray(a.talents)||a.talents.some(t=>!TALENTS_FOR_SAVE.has(t))||!number(a.fatigue,0,100)||!number(a.exposure,0,150)||!['ready','injured','captured','dead','retired'].includes(a.status)||(a.portrait!==null&&!number(a.portrait,0,11)))bad();if(a.task){const t=a.task;if(t.travelDistance!==undefined&&(!['travel','sneak'].includes(t.type)||![1,2].includes(t.travelDistance)))bad();if(t.logisticsApplied!==undefined&&typeof t.logisticsApplied!=='boolean')bad();if(t.logisticsModuleId!==undefined&&t.logisticsModuleId!==null&&!textSafe(t.logisticsModuleId))bad();if(t.tacticalBonus!==undefined&&(![0,5].includes(t.tacticalBonus)||t.tacticalBonus===5&&t.type!=='arrest'))bad();if(!ACTIONS[t.type]||!number(t.remaining,1,4)||!number(t.total,1,4)||!number(t.cost,0,12)||!number(t.chance,10,100)||!number(t.fatigue,0,18)||!COUNTRY[t.origin])bad();if(['travel','sneak'].includes(t.type)&&!COUNTRY[t.target])bad();if(['collect','surveil','hack','prepare','arrest','blackmail','intimidate'].includes(t.type)&&!suspectIds.includes(t.target))bad();if(t.type==='drone'&&t.target!==null&&!suspectIds.includes(t.target))bad();if(t.type==='cyberSupport'&&!COUNTRY[t.target])bad();if(t.type==='analyze'&&t.target!==null&&!proofIds.has(t.target))bad();if(t.bonusCredits!==undefined&&(![0,2,6].includes(t.bonusCredits)||t.bonusCredits===2&&(!['authorize','influence'].includes(t.type)||t.cost<2)))bad();if(t.bonusCredits===6&&(ACTIONS[t.type].safe||t.cost!==6))bad();if(t.chanceInputs){const c=t.chanceInputs;if((c.drone!==undefined&&typeof c.drone!=='boolean')||!number(c.raw,-200,300)||['boost','ai','cyber'].some(k=>typeof c[k]!=='boolean')||ACTIONS[t.type].safe||c.boost!==(t.bonusCredits===6))bad();}if(t.influenceSpent!==undefined){if(![0,1].includes(t.influenceSpent))bad();delete t.influenceSpent;}}}
 if(new Set(s.agents.map(a=>a.id)).size!==s.agents.length)bad();
 const drawn=s.suspects.filter(t=>t.templateId!==undefined);
 if(drawn.length&& (drawn.length!==slots.length-1||drawn.some(t=>t.id==='s6'||!CRIMINAL_POOL.some(p=>p.id===t.templateId))||new Set(drawn.map(t=>t.templateId)).size!==slots.length-1))bad();
 for(const t of s.suspects){const slot=slots.find(o=>o.id===t.id),original=t.templateId===undefined?slot:CRIMINAL_POOL.find(o=>o.id===t.templateId);if(!slot||!original||!COUNTRY[t.country]||(t.arrestedBy&&!powers.includes(t.arrestedBy)))bad();t.name=original.name;t.role=original.role;t.cell=slot.cell;}
 if(new Set(s.suspects.map(t=>t.id)).size!==slots.length||new Set(s.proofs.map(p=>p.id)).size!==slots.length*3)bad();
 for(const p of s.proofs){if(!proofIds.has(p.id)||!suspectIds.includes(p.suspect)||!Number.isInteger(p.source)||!number(p.source,0,2)||p.id!==`${p.suspect}-e${p.source}`||(p.foundBy&&!powers.includes(p.foundBy)))bad();const t=s.suspects.find(t=>t.id===p.suspect);if(t.templateId)p.templateId=t.templateId;else delete p.templateId;}
 for(const f of Object.values(s.factions)){for(const a of Object.values(f.publicAgents))if(!textSafe(a.name)||!COUNTRY[a.country]||!powers.includes(a.faction)||!number(a.turn,1,40)||(a.source!==undefined&&a.source!=='counter')||(a.until!==undefined&&!number(a.until,a.turn,a.turn+1))||(a.source==='counter'&&a.until!==a.turn+1)||(a.templateId!==undefined&&!textSafe(a.templateId))||(a.portrait!==undefined&&a.portrait!==null&&!number(a.portrait,0,11)))bad();if(team(s,f.id).length+s.recruitments.filter(r=>r.faction===f.id).length>4)bad();}
 if(s.recruitments.some(r=>!textSafe(r.id)||!number(r.remaining,1,2)||!powers.includes(r.faction)||(r.templateId!==undefined&&!ROSTER.some(a=>a.id===r.templateId))))bad();
 if(usesDraft(s.gameMode)){const templates=s.agents.map(a=>a.templateId||a.id),reserved=s.recruitments.map(r=>r.templateId||r.id);if(templates.some(id=>!ROSTER.some(a=>a.id===id))||new Set([...templates,...reserved]).size!==templates.length+reserved.length||reserved.some(id=>DISPLAY_ROSTER.some(a=>a.id===id))||s.recruitments.some(r=>npcId(r)&&!r.templateId))bad();}
 if(s.plots.some(p=>!textSafe(p.id)||!textSafe(p.kind)||!COUNTRY[p.country]||!cellIds.includes(p.cell)||!number(p.turn,1,40)))bad();
 if(s.logs.some(l=>typeof l.text!=='string'||!['info','brief','clue','score','move','danger','warning','success'].includes(l.type)||(l.faction&&!powers.includes(l.faction))||!number(l.turn,1,40)))bad();
 if(s.requests!==undefined&&(!Array.isArray(s.requests)||s.requests.length>s.plots.length||new Set(s.requests.map(r=>r.plot)).size!==s.requests.length||s.requests.some(r=>!s.plots.some(p=>p.id===r.plot)||!powers.includes(r.from)||r.from===s.player||!['pending','accepted','declined','expired'].includes(r.status))))bad();
 if(s.operationReports!==undefined&&(!Array.isArray(s.operationReports)||s.operationReports.length>(s.humanFactions?480:80)||s.operationReports.some(r=>!textSafe(r.agent)||!ACTIONS[r.type]||!['RÉUSSITE','ÉCHEC','INTERROMPUE'].includes(r.status)||!number(r.turn,1,40)||!number(r.cost,0,12)||!number(r.duration,1,4)||!number(r.fatigue,-100,100)||!number(r.exposure,-100,100)||!number(r.prestige,0,100)||!number(r.crisis,-100,100)||typeof r.next!=='string'||!Array.isArray(r.notes)||r.notes.some(n=>typeof n!=='string'))))bad();
 if(s.equipmentRules!==undefined&&s.equipmentRules!==2)bad();for(const a of s.agents){if(a.safehouses!==undefined&&(!Array.isArray(a.safehouses)||a.safehouses.length>12||new Set(a.safehouses).size!==a.safehouses.length||a.safehouses.some(c=>!COUNTRY[c]||c===a.faction)))bad();if(typeof a.weapon!=='boolean')bad();a.safehouses??=[];if(!s.equipmentRules&&a.country===a.faction)a.weapon=true;}s.equipmentRules=2;
 if(s.operationsRules!==undefined&&s.operationsRules!==3)bad();
 s.economyRules=1;
 for(const f of Object.values(s.factions)){
  if(f.safehouses!==undefined&&(!Array.isArray(f.safehouses)||f.safehouses.length>COUNTRIES.length||new Set(f.safehouses).size!==f.safehouses.length||f.safehouses.some(c=>!COUNTRY[c]||c===f.id)))bad();f.safehouses=[...new Set([...(f.safehouses||[]),...s.agents.filter(a=>a.faction===f.id).flatMap(a=>a.safehouses||[])])];
  f.medicalUses??=medicalUses(s,f.id);if(!Number.isInteger(f.medicalUses)||!number(f.medicalUses,0,3))bad();
  f.lastFavor??=null;if(f.lastFavor!==null){const v=f.lastFavor;if(typeof v!=='object'||!Object.hasOwn(GOVERNMENT_FAVORS,v.type)||!Number.isInteger(v.turn)||!number(v.turn,1,s.turn)||(v.type==='diplomacy'&&(!COUNTRY[v.country]||COUNTRY[v.country].power))||(v.type==='funding'&&(!Number.isInteger(v.gain)||!number(v.gain,1,5)))||(v.care!==undefined&&(v.type!=='medical'||v.care!==true)))bad();}
  f.confidence??=20;f.internalInfluenceUses??=0;f.internalInfluenceLastTurn??=0;delete f.influence;delete f.lobbiedTurn;f.cyberSupport??={};f.foreignIntel??={};
  if(!number(f.confidence,0,100)||!Number.isInteger(f.internalInfluenceUses)||!number(f.internalInfluenceUses,0,3)||!Number.isInteger(f.internalInfluenceLastTurn)||!number(f.internalInfluenceLastTurn,0,s.turn)||(f.internalInfluenceUses===0)!==(f.internalInfluenceLastTurn===0)||(f.internalInfluenceUses>0&&f.internalInfluenceLastTurn<3)||typeof f.cyberSupport!=='object'||Array.isArray(f.cyberSupport)||typeof f.foreignIntel!=='object'||Array.isArray(f.foreignIntel))bad();
  for(const [c,v] of Object.entries(f.cyberSupport))if(!COUNTRY[c]||!v||!number(v.from,1,43)||!number(v.until,v.from,523)||(v.cost!==undefined&&(!Number.isInteger(v.cost)||v.cost<0||v.cost>1000)))bad();
  for(const [c,v] of Object.entries(f.foreignIntel)){if(!powers.includes(c)||!v||v.source!=='exchange'||!number(v.turn,1,40)||!Array.isArray(v.cases)||v.cases.length>7)bad();for(const k of v.cases)if(!suspectIds.includes(k.id)||!COUNTRY[k.country]||!number(k.raw,0,3)||!number(k.verified,0,3)||!number(k.locationUntil,0,50)||['identified','prepared','arrested'].some(n=>typeof k[n]!=='boolean'))bad();}
  for(const k of Object.values(f.known))if(k.identityBy&&!powers.includes(k.identityBy))bad();
  for(const e of f.evidence)for(const key of ['collectedBy','verifiedBy'])if(e[key]&&!powers.includes(e[key]))bad();
 }
 if(s.operationsRules!==3){for(const a of s.agents){if(a.task&&(a.task.type==='blackmail'||a.task.type==='hack'&&a.country===a.faction)){s.factions[a.faction].budget+=a.task.cost;log(s,`${a.name} : ancien ordre ${ACTIONS[a.task.type].name} annulé et remboursé lors de la mise à jour.`,'info',a.faction);a.task=null;}if(a.task?.type==='analyze'&&!a.task.target){a.task.target=evidenceQueue(s,a.faction).find(e=>!analysisAgent(s,a.faction,e.id))?.id||null;} }s.operationsRules=3;}
 for(const f of powers)if(s.agents.filter(a=>a.faction===f&&a.chief).length>1)bad();
 if(s.agents.some(a=>a.chief!==undefined&&typeof a.chief!=='boolean'))bad();
 if(s.agentRules!==undefined&&s.agentRules!==1)bad();
 for(const a of s.agents){
  if(a.nationalities!==undefined&&(!Array.isArray(a.nationalities)||a.nationalities.length>COUNTRIES.length||new Set(a.nationalities).size!==a.nationalities.length||a.nationalities.some(c=>!COUNTRY[c])))bad();
  if(s.agentRules!==1){
   let original=ROSTER.find(r=>r.id===a.id);
   if(!original&&/^([A-Z]{2})-[0-3]$/.test(a.id)){const [f,i]=a.id.split('-');original=ROSTER[(Number(i)*3+COUNTRIES.findIndex(c=>c.id===f))%12];}
   if(original){a.talents=[...original.talents];if(a.id==='p0'){a.stats=[...original.stats];a.role=original.role;a.nationalities=[...new Set(['GB',...(a.nationalities||[])])];}}
  }
  if((a.templateId||a.id)==='p0'&&a.stats.join(',')==='7,4,9')a.stats=[9,4,7];
  if((a.templateId||a.id)==='p13'&&a.stats.join(',')==='5,7,8')a.stats=[5,8,7];
  if((a.templateId||a.id)==='p18'&&a.stats.join(',')==='7,6,7')a.stats=[6,6,8];
  if((a.templateId||a.id)==='p14'&&a.stats.join(',')==='4,9,7')a.stats=[4,7,9];
  if((a.templateId||a.id)==='p16'&&a.stats.join(',')==='8,6,7')a.stats=[6,7,7];
  if((a.templateId||a.id)==='p16'&&a.stats.join(',')==='6,7,7')a.stats=[6,8,6];
  // Build 225: migrate only the previously published talent sets; keep confirmed orders intact.
  if((a.templateId||a.id)==='p17'&&a.talents.length===3&&['drones','tactique','surveillance'].every(t=>a.talents.includes(t)))a.talents=a.talents.map(t=>t==='surveillance'?'enquete':t);
  if((a.templateId||a.id)==='p28'&&a.talents.length===3&&['drones','enquete','langues'].every(t=>a.talents.includes(t)))a.talents=a.talents.map(t=>t==='enquete'?'surveillance':t);
  if((a.templateId||a.id)==='p23'&&a.stats.join(',')==='6,8,6')a.stats=[7,8,5];
  if((a.templateId||a.id)==='p25'&&a.stats.join(',')==='7,7,6')a.stats=[8,6,6];
  if((a.templateId||a.id)==='p20'&&a.stats.join(',')==='4,8,8')a.stats=[7,9,4];
  if(a.task&&a.task.energyRules!==2){a.task.fatigue=missionFatigue(a,a.task.type);a.task.energyRules=2;}
  normalizePassportBonus(a,a.task);
  delete a.cover; // Retire le champ des anciennes sauvegardes.
  a.nationalities=[...new Set([...(a.nationalities||[]),...((a.templateId||a.id)==='p21'?['DE','US']:[]),a.faction])];
  if(a.talents.includes('secours'))a.talents=a.talents.map(t=>t==='secours'?'planB':t);
  if(a.planBExpires!==undefined&&(!a.talents.includes('planB')||!Number.isInteger(a.planBExpires)||!number(a.planBExpires,3,s.turn+2)))bad();
  if(a.task?.planBonus!==undefined&&(![5,PLAN_B_BONUS].includes(a.task.planBonus)||!a.talents.includes('planB')||!Number.isInteger(a.planBExpires)||!a.task.chanceInputs))bad();
  if(a.talents.length!==3||new Set(a.talents).size!==3||a.talents.some(t=>!TALENTS[t]))bad();
 }
 for(const f of Object.values(s.factions))for(const k of Object.values(f.known))if(k.discovery&&(!number(k.discovery.turn,1,40)||!textSafe(k.discovery.source)))bad();
 for(const f of Object.values(s.factions)){f.leadResearch??={progress:0,lastTurn:0};if(!number(f.leadResearch.progress,0,2)||!number(f.leadResearch.lastTurn,0,40)||f.leadResearch.lastTurn>s.turn||(f.leadResearch.turnGain!==undefined&&!number(f.leadResearch.turnGain,1,2)))bad();delete f.leadResearch.turnGain;}
 // Preserve committed missions; updated rules apply to subsequent orders.
 s.agentRules=1;refreshNpcProfiles(s);
 clearDisabledDecisions(s);validateFracture(s);restoreSecondaryCountries(s,log);
 const closed=new Set(s.suspects.filter(t=>t.arrested).map(t=>t.id));
 for(const f of Object.values(s.factions))f.evidence=f.evidence.filter(e=>e.verified||!closed.has(s.proofs.find(p=>p.id===e.id)?.suspect));
 for(const f of Object.values(s.factions)){
  if(f.defenseBase!==undefined&&(!f.defenseBase||typeof f.defenseBase!=='object'||Array.isArray(f.defenseBase)||Object.entries(f.defenseBase).some(([c,n])=>!Object.hasOwn(COUNTRY,c)||!Number.isInteger(n)||n<0||n>50)))bad();
  if(f.techSerial!==undefined&&(!Number.isSafeInteger(f.techSerial)||f.techSerial<0))bad();
  if(f.tech.some(t=>(t.cost!==undefined&&(!Number.isInteger(t.cost)||![TECH[t.type].cost,...(t.type==='ai'?[3,4]:t.type==='relay'?[3]:[])].includes(t.cost)))||(t.id!==undefined&&(typeof t.id!=='string'||!/^([A-Z]{2})-tech-[1-9][0-9]*$/.test(t.id)||!t.id.startsWith(f.id+'-tech-')))||['pendingLead','pendingObservation','used'].some(k=>t[k]!==undefined&&typeof t[k]!=='boolean')))bad();
  if(new Set(f.tech.filter(t=>t.id).map(t=>t.id)).size!==f.tech.filter(t=>t.id).length)bad();
  if(f.tech.some(t=>t.id&&Number(t.id.split('-').at(-1))>(f.techSerial||0)))bad();
 }
 for(const a of s.agents)for(const key of ['aiBonus','cyberBonus'])if(a.task?.[key]!==undefined&&(!Number.isFinite(a.task[key])||a.task[key]<0||a.task[key]>10))bad();
 for(const l of s.logs)l.text=namedCells(l.text);
 for(const r of [...(s.turnActivities||[]),...(s.operationReports||[])]){if(Array.isArray(r.notes))r.notes=r.notes.map(namedCells);if(r.next)r.next=namedCells(r.next);}
 for(const e of s.prestigeLedger||[])e.reason=namedCells(e.reason);
 ensureTechnology(s);
 normalizePrestige(s);
 bindCooperativeIntel(s);return s;
}
const TALENTS_FOR_SAVE=new Set([...Object.keys(TALENTS),...LEGACY_TALENTS]);

export function deduce(s,f,analyst='Cellule d’analyse'){
 const faction=s.factions[f];
 for(const [id,k] of Object.entries(faction.known)){
  const e=evidenceFor(s,f,id),content=caseFor(s,s.suspects.find(t=>t.id===id));
  if(e.filter(x=>x.verified).length>=2&&!k.deduced){k.deduced=true;if(content.link)reveal(s,f,content.link,`${analyst} — Deux preuves vérifiées dans le dossier « ${content.title} » ont révélé ce lien.`);log(s,`${analyst} — Déduction : ${content.deduction}`,'clue',f);}
 }
 const distinct=new Set(faction.evidence.filter(e=>e.verified).map(e=>s.proofs.find(p=>p.id===e.id).suspect));
 if(distinct.size>=architectEvidenceThreshold(s)&&!faction.known.s6){reveal(s,f,'s6',`Recoupement par les analystes de preuves vérifiées sur ${isCooperative(s)?'quatre':'trois'} suspects distincts.`);log(s,isCooperative(s)?'Cellule d’analyse — Quatre dossiers recoupés : une piste mène à L’Architecte.':'Cellule d’analyse — Trois dossiers recoupés : une piste mène à L’Architecte.','clue',f);}
}
export function nextOperation(s,t){
 if(t.arrested)return {text:'Cible en détention. Exploitez les autres pistes.',type:null};
 const f=s.factions[s.player],e=evidenceFor(s,s.player,t.id);
 if(e.length<2&&!f.access[t.country])return {text:'Ouvrir un accès local avec un contact.',type:'contacts'};
 if(e.length<2)return {text:'Recueillir une autre preuve indépendante sur le terrain.',type:'collect'};
 if(!e.some(e=>e.verified))return {text:'Faire vérifier une pièce brute au QG.',type:'analyze'};
 if(!t.prepared)return {text:'Préparer le dossier et l’intervention sur le terrain.',type:'prepare'};
 if(t.locationUntil<s.turn)return {text:'Actualiser la position avant d’intervenir.',type:'surveil'};
 return {text:'Intervenir maintenant, ou surveiller pour prolonger la validité de la position.',type:'arrest'};
}
export function operationForecast(s,id,type,target){const a=s.agents.find(a=>a.id===id),o=options(s,id,type,target),end=s.turn+o.duration-1,t=knownTargets(s,a.faction).find(t=>t.id===target);
 const dangerous=!!incidentRates(type,o.clandestine);
 const incidentExposure=missionExposure(a,type,false);
 const risk=isTutorial(s)&&tutorialGuaranteed(s,a.faction)?'Exercice scénarisé : réussite garantie. La position doit rester valide et la cible présente à la résolution.':ACTIONS[type].safe?'Aucun jet d’échec.':dangerous?`En cas d’échec : aucune progression, exposition +${incidentExposure}. ${incidentDescription(type,o.clandestine)}${type==='sneak'?' Capture à destination ; sinon, l’agent reste au départ.':''}`:`En cas d’échec : aucune progression et exposition +${incidentExposure}.`;
 const warnings=[];if(o.tacticalBonus)warnings.push('Planification tactique : +5 réservé à cet ordre à sa confirmation, consommé seulement lors du jet. Annulation ou interruption avant le jet : bonus conservé.');
 if(type==='surveil'){const relation=cooperationInfo(s,a.faction,a.country),relay=s.factions[a.faction].tech.some(x=>x.type==='relay'&&x.until>=end),duration=relation.location+(relay?2:0);warnings.push(`Position valide ${duration} tours après résolution, jusqu’à fin T${end+duration} : ${relation.name} (${relation.location})${relay?' + relais satellite (2)':''}. Prévision si la coopération reste identique à la réussite ; une fuite invalide la position.`);}
 if(type==='arrest'&&o.clandestine)warnings.push('Tentative sans mandat : coopération des autorités −1 niveau, réussite ou échec.');
 if(t&&type==='arrest'&&t.locationUntil<end)warnings.push('La position expirera avant la résolution. Actualisez-la d’abord.');
 if(type==='analyze'){const e=s.factions[a.faction].evidence.find(e=>(!target||e.id===target)&&!e.verified&&!e.contested);if(e)warnings.push('Pièce examinée : '+proofTitle(s.proofs.find(p=>p.id===e.id))+'.');}
 if(t&&['arrest','prepare','collect','surveil','hack','intimidate'].includes(type))warnings.push('Mission interrompue sans jet si la cible est arrêtée par votre équipe ou un autre pays, ou quitte le pays avant la résolution.');
 return {end,risk,outcome:OUTCOMES[type],warnings,fatigue:o.fatigue*o.duration};
}
function interruptDepartedEvidenceOrders(s){
 for(const a of s.agents){const task=a.task;if(!task||!['collect','hack'].includes(task.type))continue;const t=s.suspects.find(t=>t.id===task.target);if(!t||t.arrested||t.country===a.country)continue;task.fatigueSpent??=task.queued?0:task.fatigue*(task.total-task.remaining);a.task=null;resolveReported(s,a,task);}
}
function resolveReported(s,a,task){
 const examined=task.type==='analyze'?evidenceQueue(s,a.faction).find(e=>!task.target||e.id===task.target):null;
 const before={condition:a.status,fatigue:a.fatigue,exposure:a.exposure,crisis:s.crisis,score:s.factions[a.faction].score,log:s.logId,access:!!s.factions[a.faction].access[a.country],authorized:!!s.factions[a.faction].authorized[a.country],defense:s.factions[a.faction].defense[a.country]||0,coop:s.factions[a.faction].cooperation[a.country],weapon:a.weapon};
 resolve(s,a,task);
 const reportPlayer=s.player;s.player=a.faction;
 const notes=visibleLogs(s).filter(l=>l.id>before.log).reverse().map(l=>l.text),failure=notes.some(n=>n.includes('échec.')),stopped=notes.some(n=>n.includes('mission close')||n.includes('intervention suspendue')),t=knownTargets(s).find(t=>t.id===task.target);
 const ff=s.factions[a.faction];if(!failure&&!stopped){if(!before.access&&ff.access[a.country])notes.push('Accès local ouvert : collecte et intrusion disponibles.');if(!before.authorized&&ff.authorized[a.country])notes.push('Mandat obtenu : arrestation autorisée dans ce pays.');if((ff.defense[a.country]||0)>before.defense)notes.push('Protection active dans ce pays jusqu’à la fin du tour '+ff.defense[a.country]+' inclus : une attaque résolue ce tour-là est interceptée. Expire au début du tour '+(ff.defense[a.country]+1)+'. Un report ou un changement de pays de l’attaque exige de vérifier la couverture.');if(!before.weapon&&a.weapon)notes.push('Arme équipée : +10 aux chances d’arrestation.');if(task.type==='prepare')notes.push('Dossier préparé. Votre pays conserve le crédit de cette préparation.');}
 const report={...(['travel','sneak'].includes(task.type)?{travelDistance:task.travelDistance??travelTurns(task.origin,task.target,s),logisticsApplied:task.logisticsApplied??(task.type==='travel'&&task.total<travelTurns(task.origin,task.target,s))}:{}),coordinationChief:task.coordination>0&&!stopped?task.coordinationChief:null,targetName:t?.name||(s.captives||[]).find(c=>c.id===task.target)?.name||null,templateId:a.templateId||a.id,chance:task.chance,faction:a.faction,turn:s.turn,agentId:a.id,role:a.role,country:task.type==='cyberSupport'?task.target:a.country,origin:task.origin,agent:a.name,type:task.type,status:failure?'ÉCHEC':stopped?'INTERROMPUE':'RÉUSSITE',withoutObject:!!task.withoutObject,cost:task.withoutObject?Math.max(0,task.cost-(task.bonusCredits||0)):task.cost,duration:task.total,fatigue:(task.fatigueSpent??task.fatigue*task.total)+a.fatigue-before.fatigue,exposure:a.exposure-before.exposure,condition:a.status,newCapture:a.status==='captured'&&before.condition!=='captured',newInjury:a.status==='injured'&&before.condition!=='injured',crisis:s.crisis-before.crisis,prestige:Math.round(s.factions[a.faction].score-before.score),notes,next:a.status==='captured'?'Organiser une extraction.':a.status==='dead'?'Un poste est vacant : recruter un remplaçant.':a.status==='injured'?'Retour au QG et soins recommandés.':t?nextOperation(s,t).text:['travel','sneak'].includes(task.type)?a.country===a.faction?'Repos, analyse ou nouvelle affectation disponibles au QG.':'Ouvrir un accès local puis recueillir les preuves.':failure?'Réduire la fatigue ou choisir un agent mieux adapté avant de réessayer.':'Consulter les dossiers et affecter la prochaine opération.'};
 if(examined?.contested&&!failure&&!stopped){const p=s.proofs.find(p=>p.id===examined.id),suspect=s.suspects.find(t=>t.id===p.suspect);report.proofRejection={proofName:proofTitle(p),suspectName:suspect.name,country:dossier(s,a.faction,suspect.id)?.country||null};}
 recordOperation(s,report);if(!(s.humanFactions||[reportPlayer]).includes(a.faction)){s.player=reportPlayer;return;}
 const index=(s.turnActivities||[]).findIndex(r=>r.agentId===a.id);if(index>=0)s.turnActivities[index]=report;
 (s.operationReports??=[]).unshift(report);s.operationReports=s.operationReports.slice(0,s.humanFactions?480:80);s.player=reportPlayer;
}
export function clearDisabledDecisions(s){s.event=null;if(s.eventsByFaction)for(const f of Object.keys(s.eventsByFaction))s.eventsByFaction[f]=null;for(const list of [s.requests,...Object.values(s.requestsByFaction||{})])for(const r of list||[])if(r.status==='pending')r.status='expired';}
export function updateRequests(s){clearDisabledDecisions(s);}
export function requestOptions(s,r){const p=s.plots.find(p=>p.id===r?.plot),other=s.factions[r?.from];
 const evidence=p?s.factions[s.player].evidence.filter(e=>e.verified&&!e.contested&&s.suspects.find(t=>t.id===s.proofs.find(p=>p.id===e.id).suspect).cell===p.cell):[];
 const error=s.ended?'Campagne terminée.':!p||r.status!=='pending'||p.resolved||p.turn<s.turn||cellsDone(s).includes(p.cell)?'Demande expirée.':other.budget<3?'Le partenaire ne dispose plus des 3 crédits nécessaires.':!evidence.length?'Une preuve vérifiée sur cette cellule est nécessaire.':null;
 return {p,evidence,error};
}
export function answerRequest(s,plot,accept){throw Error('Demandes de coopération désactivées.');}

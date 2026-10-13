import {threatAnnounced} from './fracture.js?v=193';
import {AI_LEVELS} from './ai-difficulty.js?v=193';
import {GAME_MODES,selectParticipants,createDraft,validateDraft,publicDraft,draftCountry,pickDraftAgent,advanceNpcDraft,sameTeam} from './game-setup.js?v=193';
import {recordAgentCondition} from './campaign-stats.js?v=193';
import {assignDeployment} from './deployment.js?v=193';
import {startClock} from './campaign-clock.js?v=193';
import * as E from './engine.js?v=193';
import {COUNTRIES, DEFAULT_TEAM_IDS, ROSTER, ACTIONS, TECH} from './data.js?v=193';
export const PROTOCOL=18;
export const playingMembers=room=>room.members.filter(m=>!m.observer);
const powers=COUNTRIES.filter(c=>c.power).map(c=>c.id);
const copy=x=>structuredClone(x);
const fail=message=>{throw Error(message);};
export function newRoom(id,invite,token,name,country='FR'){
 if(!powers.includes(country))fail('Pays invalide.');
 return {protocol:PROTOCOL,id,invite,revision:0,phase:'lobby',participantRules:1,gameMode:'regular',draft:null,aiDifficulty:'normal',members:[{token,name:cleanName(name),country,host:true,connected:true,ready:false,confirmed:false,countryConfirmed:false,lastSeq:0,agents:[]}],game:null,offers:[]};
}
export function cleanName(name){return String(name||'Joueur').trim().slice(0,30)||'Joueur';}
export function joinRoom(room,{invite,token,name}){
 if(invite!==room.invite||typeof token!=='string'||!/^[a-zA-Z0-9-]{20,80}$/.test(token))fail('Invitation invalide.');
 let member=room.members.find(m=>m.token===token);
 if(member?.host)fail('Identité réservée à l’hôte.');
 if(!member){if(room.phase!=='lobby')fail('La sélection est commencée. Revenez avec le navigateur utilisé pour rejoindre le salon.');if(playingMembers(room).length>=(room.participantRules===1?4:6))fail('Les quatre places sont occupées.');const country=powers.find(f=>!room.members.some(m=>m.country===f));if(!country)fail('Aucun pays disponible.');member={token,name:cleanName(name),country,host:false,connected:true,ready:false,confirmed:false,countryConfirmed:false,lastSeq:0,agents:[]};room.members.push(member);}
 member.connected=true;member.ready=false;room.revision++;return member;
}
export function disconnect(room,token){const m=room.members.find(m=>m.token===token);if(m){m.connected=false;m.ready=false;room.revision++;}}
function asFaction(game,country,action){const owner=game.player;game.player=country;game.event=game.eventsByFaction?.[country]||null;game.requests=game.requestsByFaction?.[country]||[];try{return action();}finally{game.eventsByFaction??={};game.eventsByFaction[country]=game.event;game.requestsByFaction??={};game.requestsByFaction[country]=game.requests;game.player=owner;game.event=game.eventsByFaction[owner]||null;game.requests=game.requestsByFaction[owner]||[];}}
export function startRoom(room,seed=Date.now()){
 const advanced=room.gameMode==='advanced';
 if(room.phase!==(advanced?'teams':'lobby')||playingMembers(room).length<(advanced?1:2)||room.members.some(m=>!m.connected))fail('Tous les joueurs doivent être connectés avant le lancement.');
 if(playingMembers(room).some(m=>!m.confirmed||m.agents.length!==4))fail('Tous les joueurs doivent confirmer leur équipe avant le lancement.');
 const players=playingMembers(room),host=players.find(m=>m.host)||players[0];
 if(advanced){validateDraft(room.draft);if(room.draft.picks.length!==16||players.some(m=>!sameTeam(m.agents,room.draft.teams[m.country])))fail('Le repêchage doit être terminé.');}
 const settings=room.participantRules===1?{participants:advanced?room.draft.countries:selectParticipants(players.map(m=>m.country),seed),gameMode:room.gameMode||'regular',teams:{...(advanced?room.draft.teams:{}),...Object.fromEntries(players.map(m=>[m.country,m.agents]))}}:null;
 const game=E.createGame(host.country,host.agents,seed,room.aiDifficulty||'normal',settings);
 for(const m of players){if(!settings){const template=E.createGame(m.country,m.agents,seed);game.agents=game.agents.filter(a=>a.faction!==m.country);game.agents.push(...E.team(template));}for(const a of game.agents.filter(a=>a.faction===m.country)){a.templateId=a.templateId||a.id;a.id=`${m.country}:${a.templateId}`;}m.ready=false;}
 game.campaignStats.agents={};recordAgentCondition(game,0);
 game.humanFactions=playingMembers(room).map(m=>m.country);game.eventsByFaction=Object.fromEntries(game.humanFactions.map(f=>[f,null]));game.requestsByFaction=Object.fromEntries(game.humanFactions.map(f=>[f,[]]));room.game=game;startClock(room.game);room.phase='playing';room.revision++;
}
function finishDraft(room){if(draftCountry(room.draft))return;room.phase='teams';for(const m of playingMembers(room)){m.agents=[...room.draft.teams[m.country]];m.confirmed=false;}}
export function execute(room,token,message){
 const m=room.members.find(m=>m.token===token);if(!m||!m.connected)fail('Joueur déconnecté.');
 if(!message||message.protocol!==PROTOCOL||!Number.isSafeInteger(message.seq)||message.seq<1||typeof message.kind!=='string')fail('Commande incompatible.');
 if(message.seq<=m.lastSeq)return {duplicate:true};
 const {kind,payload:p={}}=message;if(!p||typeof p!=='object'||Array.isArray(p))fail('Commande invalide.');
 if(kind==='game-mode'){if(!m.host||room.phase!=='lobby'||room.participantRules!==1||!Object.hasOwn(GAME_MODES,p.mode))fail('Seul l’hôte peut choisir le mode avant la confirmation des pays.');room.gameMode=p.mode;room.draft=null;for(const x of room.members){x.agents=[];x.confirmed=false;x.countryConfirmed=false;}
 }else if(kind==='confirm-country'){if(m.observer||room.phase!=='lobby'||room.gameMode!=='advanced')fail('Confirmation du pays indisponible.');m.countryConfirmed=true;
 }else if(kind==='begin-draft'){const players=playingMembers(room);if(!m.host||room.phase!=='lobby'||room.gameMode!=='advanced'||players.length<2||players.some(x=>!x.connected||!x.countryConfirmed)||room.members.some(x=>!x.connected))fail('Tous les joueurs doivent confirmer leur pays et être connectés.');room.draft=advanceNpcDraft(createDraft(players.map(x=>x.country)));room.phase='draft';finishDraft(room);
 }else if(kind==='draft-pick'){if(m.observer||room.phase!=='draft'||room.gameMode!=='advanced')fail('Aucun repêchage en cours.');const draft=copy(room.draft);pickDraftAgent(draft,m.country,p.id);advanceNpcDraft(draft);room.draft=draft;finishDraft(room);
 }else if(kind==='ai-difficulty'){if(!m.host||room.phase!=='lobby'||!Object.hasOwn(AI_LEVELS,p.level))fail('Seul l’hôte peut choisir un niveau IA valide avant le lancement.');room.aiDifficulty=p.level;
 }else if(kind==='observer'){
  if(!m.host||room.phase!=='lobby'||typeof p.observer!=='boolean')fail('Le rôle est réservé à l’hôte avant le lancement.');
  const country=p.observer?null:powers.find(f=>!room.members.some(x=>x!==m&&x.country===f));if(!p.observer&&(!country||room.participantRules===1&&m.observer&&playingMembers(room).length>=4))fail('Les quatre places sont occupées.');
  m.observer=p.observer;m.country=country;m.agents=[];m.confirmed=false;m.countryConfirmed=false;m.ready=false;
 }else if(kind==='country'||kind==='team'||kind==='unconfirm'){
  if(m.observer)fail('L’observateur ne compose pas d’équipe.');
  if(room.phase!==(room.gameMode==='advanced'&&kind!=='country'?'teams':'lobby'))fail('Cette étape est verrouillée.');
  if(kind==='country'){if(!powers.includes(p.country)||room.members.some(x=>x!==m&&x.country===p.country))fail('Ce pays est déjà pris.');m.country=p.country;m.confirmed=false;m.countryConfirmed=false;}
  else if(kind==='unconfirm'){m.confirmed=false;}
  else{if(!Array.isArray(p.agents)||p.agents.length!==4||new Set(p.agents).size!==4||p.agents.some(id=>!ROSTER.some(a=>a.id===id)))fail('Choisissez quatre agents distincts.');if(room.gameMode==='advanced'&&!sameTeam(p.agents,room.draft.teams[m.country]))fail('Réorganisez uniquement les agents de votre pays.');m.agents=[...p.agents];m.confirmed=true;}
 }else if(kind==='start'){if(!m.host)fail('Seul l’hôte peut lancer la partie.');startRoom(room);}
 else if(kind==='replace'){
  if(!m.host||p.country===m.country)fail('Remplacement interdit.');const target=room.members.find(x=>x.country===p.country);if(!target||target.host)fail('Joueur introuvable.');if(room.phase==='playing'&&playingMembers(room).length<=1)fail('Conservez au moins un joueur humain.');
  if(room.draft&&playingMembers(room).length<=1)fail('Conservez au moins un joueur humain.');
  room.members=room.members.filter(x=>x!==target);if(room.draft){room.draft.humans=playingMembers(room).map(x=>x.country);if(room.phase==='draft'){advanceNpcDraft(room.draft);finishDraft(room);}}if(room.game){room.game.humanFactions=playingMembers(room).map(x=>x.country);delete room.game.eventsByFaction[target.country];delete room.game.requestsByFaction[target.country];room.offers=room.offers.filter(o=>o.from!==target.country&&o.to!==target.country);}
  for(const member of room.members)member.ready=false;
 }else{
  if(m.observer)fail('Observateur : consultation uniquement.');
  if(room.phase!=='playing'||!room.game||room.game.ended)fail('Aucune journée à préparer.');
  if(message.turn!==room.game.turn)fail('Le jour a changé. Vérifiez votre nouveau rapport.');
  if(kind==='ready'){if(typeof p.ready!=='boolean')fail('État invalide.');E.clearDisabledDecisions(room.game);m.ready=p.ready;}
  else{
   if(m.ready)fail('Cliquez sur « Modifier mes ordres » avant de jouer.');
   const g=copy(room.game);const offers=copy(room.offers);
   asFaction(g,m.country,()=>{
    if(['assign','cancel'].includes(kind)&&!g.agents.some(a=>a.id===p.id&&a.faction===m.country))fail('Cet agent ne vous appartient pas.');
    switch(kind){
     case 'assign':if(typeof p.type!=='string'||!Object.hasOwn(ACTIONS,p.type)||(p.target!=null&&typeof p.target!=='string')||(p.useCredits!==undefined&&typeof p.useCredits!=='boolean'))fail('Ordre invalide.');E.assign(g,p.id,p.type,p.target||null,!!p.useCredits);break;
     case 'deploy':assignDeployment(g,p.ids,p.type,p.target);break;
     case 'cancel':E.cancel(g,p.id);break;
     case 'cancel-cyber':if(typeof p.country!=='string')fail('Soutien invalide.');E.cancelCyberSupport(g,p.country);break;
     case 'cancel-tech':if(typeof p.id!=='string')fail('Soutien invalide.');E.cancelTech(g,p.id);break;
     case 'government-favor':if(typeof p.type!=='string'||(p.country!=null&&typeof p.country!=='string'))fail('Faveur invalide.');E.requestGovernmentFavor(g,p.type,p.country);break;
     case 'tech':if(typeof p.type!=='string'||!Object.hasOwn(TECH,p.type)||!COUNTRIES.some(c=>c.id===p.country))fail('Soutien invalide.');E.activateTech(g,p.type,p.country);break;
     case 'hire':E.recruit(g,p.id,p.replaceId||null);break;
     case 'event':if(!Number.isInteger(p.index))fail('Choix invalide.');E.answerEvent(g,p.index);break;
     case 'request':if(typeof p.accept!=='boolean')fail('Réponse invalide.');E.answerRequest(g,p.plot,p.accept);break;
     case 'share':case 'share-answer':fail('Les échanges de dossiers sont désactivés.');break;
     default:fail('Commande inconnue.');
    }
   });room.game=g;room.offers=offers;
   if(kind==='share-answer'&&p.accept){const other=room.members.find(x=>x.country===p.from);if(other)other.ready=false;}
  }
 }
 m.lastSeq=message.seq;room.revision++;
 let advanced=false;
 if(room.phase==='playing'&&!room.game.ended&&playingMembers(room).length>0&&playingMembers(room).every(x=>x.connected&&x.ready)){
  const g=copy(room.game);E.advance(g);room.game=g;room.offers=[];for(const x of room.members)x.ready=false;room.revision++;advanced=true;
 }
 return {advanced};
}
// Explicit whitelist: the authoritative world, RNG, authenticity and other countries' dossiers never leave the host.
export function playerView(room,country){
 const s=room.game;if(!s)return null;const f=s.factions[country];if(!f)fail('Pays invalide.');
 const ownIds=new Set(s.agents.filter(a=>a.faction===country).map(a=>a.id));
 return {...(s.participantRules===1?{participantRules:1,gameMode:s.gameMode||'regular'}:{}),...(s.pressureRules===1?{pressureRules:1}:{}),flightReports:copy((s.flightReports||[]).filter(r=>r.faction===country)),attackDelayReports:copy(s.attackDelayReports||[]),cellReports:copy(s.cellReports||[]),threatReports:copy(s.threatReports||[]),attackReports:copy(s.attackReports||[]),campaignClock:copy(s.campaignClock||null),campaignStats:{events:copy((s.campaignStats?.events||[]).filter(e=>s.ended||e.faction===country)),detailsPartial:!!s.campaignStats?.detailsPartial,agents:copy(Object.fromEntries(Object.entries(s.campaignStats?.agents||{}).filter(([f])=>s.ended||f===country))),support:copy(Object.fromEntries(Object.entries(s.campaignStats?.support||{}).filter(([f])=>s.ended||f===country))),highlights:copy((s.campaignStats?.highlights||[]).filter(e=>s.ended||e.faction===country)),partial:!!s.campaignStats?.partial,factions:s.ended?copy(s.campaignStats?.factions||{}):{[country]:copy(s.campaignStats?.factions?.[country]||{})}},turnActivities:copy((s.turnActivities||[]).filter(r=>r.faction===country)),aiDifficulty:s.aiDifficulty||'normal',version:s.version,turn:s.turn,player:country,crisis:s.crisis,ended:s.ended,logId:s.logId,
  factions:Object.fromEntries(Object.values(s.factions).map(x=>[x.id,(s.ended||x.id===country)?copy(x):{id:x.id,score:x.score,defense:copy(x.defense),budget:(s.requestsByFaction?.[country]||[]).some(r=>r.from===x.id&&r.status==='pending')?Math.min(x.budget,3):0,known:{},evidence:[],tech:[],publicAgents:{},access:{},authorized:{},cooperation:{},foreignIntel:{}}])),
  agents:copy([...s.agents.filter(a=>a.faction===country),...(s.ended?s.agents.filter(a=>a.faction!==country):[])]),
  suspects:s.suspects.map(t=>{const k=f.known[t.id];return {id:t.id,...(t.templateId?{templateId:t.templateId}:{}),cell:t.cell,name:t.name,role:t.role,arrested:t.arrested,arrestedBy:t.arrestedBy||null,country:k?.country||null};}),
  proofs:s.proofs.map(p=>({id:p.id,suspect:p.suspect,...(p.templateId?{templateId:p.templateId}:{}),source:p.source,...(f.evidence.some(e=>e.id===p.id)?{foundBy:p.foundBy}: {})})),
  prestigeLedger:copy((s.prestigeLedger||[]).filter(e=>s.ended||e.faction===country)),plots:copy(s.plots.filter(p=>p.resolved||threatAnnounced(s,p))),logs:copy(s.logs.filter(l=>!l.faction||l.faction===country)),
  event:copy(s.eventsByFaction?.[country]||null),requests:copy(s.requestsByFaction?.[country]||[]),
  recruitments:copy(s.recruitments.filter(r=>r.faction===country)),operationReports:copy((s.operationReports||[]).filter(r=>r.faction===country||!r.faction&&ownIds.has(r.agentId))),
  multiplayer:{offers:[],players:(room.members||[]).filter(m=>!m.observer).map(({country,name})=>({country,name}))},
  unavailableRecruits:[...s.agents.filter(a=>s.gameMode==='advanced'||!/^([A-Z]{2})-(?:[0-3]|R[0-9]+)$/.test(a.id)).map(a=>a.templateId||a.id),...s.recruitments.map(r=>r.templateId||r.id)]
 };
}
// Observer projections stay on the host; guests still receive only playerView.
export function observerView(room,country){
 if(!room.game)return null;
 const players=playingMembers(room),selected=players.some(m=>m.country===country)?country:players[0]?.country;
 if(!selected)fail('Aucun joueur à observer.');
 const view=playerView(room,selected);
 view.agents=copy(room.game.agents.filter(a=>players.some(m=>m.country===a.faction)));
 view.multiplayer={...view.multiplayer,observer:true,humanFactions:players.map(m=>m.country),offers:[]};
 return view;
}
export function roomView(room,token,observedCountry=null){const m=room.members.find(x=>x.token===token);if(!m)fail('Place non réservée.');return {protocol:PROTOCOL,id:room.id,revision:room.revision,phase:room.phase,participantRules:room.participantRules,gameMode:room.gameMode||'regular',draft:publicDraft(room.draft),aiDifficulty:room.aiDifficulty||'normal',country:m.country,observer:!!m.observer,lastSeq:m.lastSeq,members:room.members.map(({country,name,host,observer,connected,ready,confirmed,countryConfirmed,agents})=>({country,name,host,observer:!!observer,connected,ready,confirmed:!!confirmed,countryConfirmed:!!countryConfirmed,agents:copy(agents)})),game:m.host&&m.observer?observerView(room,observedCountry):playerView(room,m.country)};}
export function restoreRoom(raw){
 if(!raw||![1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,PROTOCOL].includes(raw.protocol)||!['lobby','draft','teams','playing'].includes(raw.phase)||!Array.isArray(raw.members)||raw.members.length<1||raw.members.length>7||raw.members.filter(m=>m.observer).length>1||raw.members.some(m=>m.observer&&(!m.host||m.country!==null||m.agents?.length))||raw.members.filter(m=>m.host).length!==1||new Set(raw.members.map(m=>m.country)).size!==raw.members.length||new Set(raw.members.map(m=>m.token)).size!==raw.members.length)fail('Sauvegarde multijoueur incompatible.');
 for(const key of ['id','invite'])if(typeof raw[key]!=='string'||!/^[a-zA-Z0-9-]{20,80}$/.test(raw[key]))fail('Identifiant de partie invalide.');
 if(raw.participantRules!==undefined&&raw.participantRules!==1||raw.participantRules===1&&playingMembers(raw).length>4||raw.gameMode!==undefined&&!Object.hasOwn(GAME_MODES,raw.gameMode))fail('Configuration de salon invalide.');
 if(raw.aiDifficulty!==undefined&&!Object.hasOwn(AI_LEVELS,raw.aiDifficulty))fail('Niveau IA invalide.');const room=copy(raw);room.aiDifficulty??='normal';room.gameMode??='regular';room.protocol=PROTOCOL;room.revision=Number.isSafeInteger(room.revision)?room.revision+1:1;room.offers=[];
 for(const m of room.members){if((m.observer?(!m.host||m.country!==null):!powers.includes(m.country))||typeof m.token!=='string'||!/^[a-zA-Z0-9-]{20,80}$/.test(m.token)||!Number.isSafeInteger(m.lastSeq)||m.lastSeq<0||!Array.isArray(m.agents)||(m.observer?m.agents.length!==0:['playing','teams'].includes(room.phase)?m.agents.length!==4:m.agents.length>4)||new Set(m.agents).size!==m.agents.length||m.agents.some(id=>!ROSTER.some(a=>a.id===id)))fail('Place de joueur invalide.');m.countryConfirmed=!!m.countryConfirmed;m.name=cleanName(m.name);m.connected=!!m.host;m.ready=false;if(room.phase==='lobby')m.confirmed=false;}
 if(room.gameMode==='advanced'){if(room.participantRules!==1)fail('Mode Avancé incompatible.');if(room.phase!=='lobby'){validateDraft(room.draft);if(room.draft.humans.length!==playingMembers(room).length||playingMembers(room).some(m=>!room.draft.humans.includes(m.country))||(room.phase==='draft')!==(room.draft.picks.length<16)||room.phase==='draft'&&playingMembers(room).some(m=>m.agents.length)||['teams','playing'].includes(room.phase)&&playingMembers(room).some(m=>!sameTeam(m.agents,room.draft.teams[m.country])))fail('Repêchage incompatible.');}else if(room.draft||playingMembers(room).some(m=>m.agents.length))fail('Confirmation des pays incompatible.');}else if(['draft','teams'].includes(room.phase)||room.draft)fail('Étape de salon incompatible.');
 if(room.phase==='playing'){
  if(!room.game||!powers.includes(room.game.player)||!playingMembers(room).length||(!room.members.find(m=>m.host).observer&&room.game.player!==room.members.find(m=>m.host).country))fail('Hôte invalide.');
  if(room.participantRules===1&&(room.game.participantRules!==1||room.game.gameMode!==room.gameMode||playingMembers(room).some(m=>!room.game.factions[m.country])))fail('Participants incompatibles.');
  room.game.humanFactions=playingMembers(room).map(m=>m.country);room.game=E.validateSave(room.game);startClock(room.game,Date.now(),true);
  for(const f of room.game.humanFactions){const g=copy(room.game);g.player=f;g.event=room.game.eventsByFaction?.[f]||null;g.requests=room.game.requestsByFaction?.[f]||[];E.validateSave(g);room.game.eventsByFaction??={};room.game.eventsByFaction[f]=g.event;room.game.requestsByFaction??={};room.game.requestsByFaction[f]=g.requests;}
 }
 return room;
}

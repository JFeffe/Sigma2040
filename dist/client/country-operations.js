import {agentProfileCard} from './personnel-ui.js?v=246';
import * as E from './engine.js?v=246';
import {COUNTRY,ACTIONS} from './data.js?v=246';
import {actionResources} from './presentation.js?v=246';
import {button,esc,icon,portrait,countryOption,countrySelect} from './ui.js?v=246';
import {countryTargetButtons} from './country-inquiry.js?v=246';
import {operationReadingsMarkup,operationSuccessMarkup,operationIncidentMarkup,missionTimingMarkup,missionBoostLabel} from './operations-ui.js?v=246';
import {countryArtHeader} from './country-signals.js?v=246';
import {proofTitle} from './intelligence.js?v=246';
import {countryOnMap,operationCountries} from './operation-map.js?v=246';
import {agentTravelDestinations,deploymentOptions} from './deployment.js?v=246';

const headquartersActions=['rest','cyberSupport','counter','analyze','heal'];
const fieldActions=['cyberSupport','equip','findSafehouse','fieldRest','hide'];
const accessActions=['contacts','influence','drone','authorize'];

export function countryOperationTypes(s,country,group){
 if(!countryOnMap(s,country))return [];
 if(country===s.player)return group==='access'?[]:headquartersActions;
 if(COUNTRY[country].power)return [];
 return group==='access'?accessActions:fieldActions;
}

export function countryOperationTargets(s,country,type){
 if(type==='analyze'&&country===s.player){
  return E.evidenceQueue(s,s.player).filter(e=>!E.analysisAgent(s,s.player,e.id)).map(e=>{
   const proof=s.proofs.find(p=>p.id===e.id),suspect=s.suspects.find(t=>t.id===proof?.suspect);
   return [e.id,proof?proofTitle(proof):'Pièce de renseignement',suspect?.name||'Cible inconnue'];
  });
 }
 if(type==='cyberSupport'){
  return operationCountries(s).filter(c=>country===s.player||c.id===country).map(c=>[c.id,c.name]);
 }
 return [];
}

function operationLocation(s,country,type){
 return type==='cyberSupport'?s.player:country;
}

function availableAgents(agents,country){
 return agents.filter(a=>a.country===country&&!a.task&&a.status!=='captured');
}

function actionAvailability(s,country,types,locked='',agentId=null){
 const team=E.team(s);
 const actor=agentId&&team.find(a=>a.id===agentId);
 if(agentId&&(!actor||actor.task||actor.status==='captured'))locked=locked||'Agent indisponible.';
 return new Map(types.map(type=>{
  if(locked)return [type,locked];
  if(type==='deploy'){
   const available=agentId?agentTravelDestinations(s,agentId).some(row=>!row.travel.error||!row.sneak.error):['travel','sneak'].some(mode=>deploymentOptions(s,mode,country).some(row=>!row.error));
   return [type,available?'':agentId?'Aucun déplacement disponible pour cet agent.':'Aucun agent disponible pour cette destination.'];
  }
  const location=operationLocation(s,country,type);
  const ready=availableAgents(team,location);
  if(!ready.length)return [type,location===s.player?'Aucun agent disponible au QG.':'Aucun agent disponible sur place.'];
  const targets=countryOperationTargets(s,country,type);
  const choices=targets.length?targets.map(([id])=>id):[null];
  const errors=choices.flatMap(target=>ready.map(a=>E.options(s,a.id,type,target).error));
  return [type,errors.every(Boolean)?errors[0]:''];
 }));
}

function actionName(s,country,type,agentId){
 return type==='deploy'?(agentId?'Voyager':'Déployer un agent'):type==='cyberSupport'?(country===s.player?'Hacker un pays':'Hack du pays'):ACTIONS[type].name;
}

function countryActionButtons(s,country,types,availability,selection=null,agentId=null){
 return types.map(type=>{
  const deploy=type==='deploy',action=ACTIONS[type],reason=availability.get(type);
  const cmd=deploy?(agentId?'workspace-travel':'workspace-deploy'):selection?'workspace-action':'workspace-country';
  const actor=agentId?` data-agent="${esc(agentId)}"`:'';
  const attrs=selection&&!deploy?`data-id="${type}" aria-pressed="${selection.type===type}"`:`data-id="${deploy&&agentId?esc(agentId):country}"${deploy?'':` data-type="${type}"${actor}`}`;
  const help=agentId?'Choisir la destination et le mode de déplacement.':'Choisir les agents à déployer.';
  return button(icon(deploy?'plane':action.icon)+esc(actionName(s,country,type,agentId)),cmd,'small country-operation-button',`${attrs} title="${esc(reason||action?.desc||help)}" ${reason?'disabled':''}`);
 }).join('');
}

export function countrySidebarActions(s,country,locked='',agent=null){
 const actions=countryOperationTypes(s,country),agentId=agent?.id;
 const actor=agentId?` data-agent="${esc(agentId)}"`:'';
 const access=actions.length&&country!==s.player?button(icon('file')+' Actions du pays','workspace-country','small country-operation-button',`data-id="${country}" data-group="access"${actor}`):'';
 const context=agent&&E.travelInProgress(agent)?'':countryTargetButtons(s,country,{empty:access,emptyLast:!!agent,agentId:agent?.faction===s.player?agentId:null});
 if(!actions.length)return agent?context:'';
 const types=['deploy',...actions],availability=actionAvailability(s,country,types,locked,agentId);
 return context+`<div class="country-sidebar-actions" aria-label="Actions du pays">${countryActionButtons(s,country,types,availability,null,agentId)}</div>`;
}

export function countryOperationModel(s,country,{type,agent,target,boost=false,group}={}){
 const types=countryOperationTypes(s,country,group);
 if(!types.includes(type)){
  const availability=actionAvailability(s,country,types);
  type=types.find(id=>!availability.get(id))??types[0];
 }
 const targets=countryOperationTargets(s,country,type);
 const location=operationLocation(s,country,type);
 const local=E.team(s).filter(a=>a.country===location&&!E.travelInProgress(a)),ready=availableAgents(local,location);
 if(!targets.some(([id])=>id===target)){
  target=targets.find(([id])=>ready.some(a=>!E.options(s,a.id,type,id).error))?.[0]??targets[0]?.[0]??null;
 }
 const rows=type?ready.map(a=>{const normal=E.options(s,a.id,type,target),reinforced=E.options(s,a.id,type,target,true),o=boost?reinforced:normal;return {a,normal,reinforced,o,target,reason:o.error||''};}).sort((a,b)=>Number(!!a.reason)-Number(!!b.reason)||b.o.chance-a.o.chance):[];
 return {type,types,targets,target,local,rows,selected:rows.find(r=>r.a.id===agent)||rows.find(r=>!r.reason)||null};
}

function proofChoices(targets,target,locked){
 return `<fieldset class="country-proof-choices"><legend>Pièce à vérifier</legend>${targets.map(([id,name,suspect])=>button(`<strong>${esc(suspect)}</strong><small>${esc(name)}</small>`,'workspace-proof','small country-proof-choice',`data-id="${esc(id)}" aria-pressed="${id===target}" ${locked?'disabled':''}`)).join('')}</fieldset>`;
}
export function countryOperationsMarkup(s,country,selection={},locked=''){
 let m=countryOperationModel(s,country,selection);
 if(selection.boost&&(!m.selected||m.selected.normal.boostGain===0||m.selected.reinforced.error)){selection.boost=false;m=countryOperationModel(s,country,selection);}
 const {type,types,targets,target,local,rows,selected}=m;selection.type=type;selection.agent=selected?.a.id;selection.target=target;
 const menuTypes=selection.group==='access'?types:types.length?['deploy',...types]:types;
 const availability=actionAvailability(s,country,menuTypes,locked);
 const d=ACTIONS[type];
 const blocked=locked||selected?.reason||availability.get(type)||(!selected?'Aucun agent disponible pour cette action.':'');
 const boostReason=locked||(!selected?'Choisissez un agent disponible.':selected.normal.boostGain===0?'Chances déjà au plafond.':selected.reinforced.error)||'';
 const boost=d&&selected&&!d.safe&&selected.normal.chance<100?`<div class="mission-boost-control">
  ${button(icon('boost')+missionBoostLabel(selected.normal,selected.reinforced,s.factions[s.player].budget),'workspace-boost','mission-boost-toggle',`aria-pressed="${!!selection.boost}" ${locked||!selection.boost&&boostReason?'disabled':''}`)}
  ${boostReason&&boostReason!==blocked?`<small class="mission-boost-reason">${esc(boostReason)}</small>`:''}
 </div>`:'';
 const showDestination=type==='cyberSupport'&&country===s.player;
 const targetPicker=type==='analyze'&&targets.length?proofChoices(targets,target,locked):showDestination?`<label>Pays à hacker${countrySelect(
  targets.map(([id,name])=>countryOption(id,name,{selected:id===target})).join(''),`data-country-target ${locked?'disabled':''}`
 )}</label>`:'';
 const agentsLabel=operationLocation(s,country,type)===s.player?'Agents disponibles au QG':'Agents disponibles sur place';
 const details=d?actionResources(type,selected?.a)+operationIncidentMarkup(s,type,selected):'';
 return `<section class="workspace-body country-operations">
 <header class="country-operations-heading dossier-sheet">${countryArtHeader(s,country,{compact:true})}</header>
 ${d?`<section class="country-operation-detail operation-card">
  <h3 class="inquiry-single-action" tabindex="-1">${esc(actionName(s,country,type))}</h3>
  <div class="country-operation-types" role="group" aria-label="Autres actions">${countryActionButtons(s,country,menuTypes.filter(key=>key!==type),availability,selection)}</div>
  ${operationSuccessMarkup(type)}${targetPicker}
  ${rows.length>1?`<div class="mission-compare-heading"><strong>Comparer les agents</strong><small>${agentsLabel}</small></div>`:''}
  <div class="country-operation-agents" role="group" aria-label="${agentsLabel}">${rows.length?rows.map(r=>`<div class="country-operation-agent">
   ${button(portrait(r.a),'agent','agent-photo',`data-id="${r.a.id}" aria-label="Consulter ${esc(r.a.name)}"`)}
   ${button(`<span><strong>${esc(r.a.name)}</strong>${r.reason?`<small>${esc(r.reason)}</small>`:''}</span><span class="mission-candidate-readings"><b aria-label="Chances de réussite : ${r.o.chance} %">${r.o.chance} %</b>${rows.length>1?missionTimingMarkup(r.a,type,r.o):'<small>de réussite</small>'}</span>`,'workspace-agent','country-operation-choice',`data-id="${r.a.id}" aria-pressed="${selected?.a.id===r.a.id}" ${r.reason||locked?'disabled':''}`)}
  </div>`).join(''):`<p class="muted">${operationLocation(s,country,type)===s.player?'Aucun agent disponible au QG.':'Aucun agent disponible sur place.'}</p>`}</div>
  ${operationReadingsMarkup(s,type,selected)}
  <footer class="country-order-footer"><p class="workspace-message" role="status">${esc(selection.message||blocked)}</p>${boost}
   <div class="mission-confirm-control">${button(icon('check')+' '+(selected?'Confirmer avec '+esc(selected.a.name):'Confirmer'),'workspace-confirm','primary wide',blocked?'disabled':'')}</div>
  </footer>
 </section>`:''}
 ${details?`<details class="mission-briefing case-details"><summary>Détails</summary><div class="mission-briefing-content">${details}</div></details>`:''}
 ${local.some(a=>a.task||a.status==='captured')?`<details class="country-local-missions"><summary>Agents occupés ou capturés</summary>${local.filter(a=>a.task||a.status==='captured').map(a=>button(`${esc(a.name)} · ${esc(a.task?ACTIONS[a.task.type].name:'En détention')}`,'agent','small',`data-id="${a.id}"`)).join('')}</details>`:''}</section>`;
}
export function floatingAgentMarkup(s,id,{locked=''}={}){
 const a=s.agents.find(a=>a.id===id);if(!a)return '<section class="workspace-body">Agent indisponible.</section>';
 const task=a.task,target=COUNTRY[task?.target]?.name||s.suspects.find(t=>t.id===task?.target)?.name||COUNTRY[a.country].name,own=a.faction===s.player;
 const localActions=countrySidebarActions(s,a.country,own?locked:'Partenaire : consultation uniquement.',a);
 return `<article class="workspace-body floating-agent ${own?'':'coop-ally'}">
 ${agentProfileCard(s,a)}
 ${task||a.status==='captured'?`<section class="floating-agent-mission"><h3>${task?esc(ACTIONS[task.type].name):'Extraction nécessaire'}</h3>${task?`<p>${esc(target)} · ${task.remaining} tour(s) · ${task.chance} % de réussite</p>${own?button('Annuler la mission','cancel','small',`data-id="${id}" ${E.travelInProgress(a)||s.ended?'disabled':''}`):''}`:''}</section>`:''}
 ${localActions}</article>`;
}

import {agentProfileCard} from './personnel-ui.js?v=243';
import * as E from './engine.js?v=243';
import {COUNTRY,ACTIONS} from './data.js?v=243';
import {actionResources} from './presentation.js?v=243';
import {button,esc,icon,portrait,flag} from './ui.js?v=243';
import {countryTargetButtons} from './country-inquiry.js?v=243';
import {forecastMarkup,missionCostsMarkup,missionTimingMarkup,missionBoostLabel} from './operations-ui.js?v=243';
import {countryArtHeader} from './country-signals.js?v=243';
import {proofTitle} from './intelligence.js?v=243';
import {countryOnMap,operationCountries} from './operation-map.js?v=243';
import {agentTravelDestinations,deploymentOptions} from './deployment.js?v=243';

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

function operationTeam(s,country,agentId){
 return E.team(s).filter(a=>!agentId||a.id===agentId&&a.country===country);
}

function actionAvailability(s,country,types,locked='',agentId=null){
 const team=operationTeam(s,country,agentId);
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
  const attrs=selection&&!deploy?`data-id="${type}"${agentId?'':` aria-pressed="${selection.type===type}"`}`:`data-id="${deploy&&agentId?esc(agentId):country}"${deploy?'':` data-type="${type}"${actor}`}`;
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

export function countryOperationModel(s,country,{type,agent,target,boost=false,group,agentId}={}){
 const types=countryOperationTypes(s,country,group);
 if(!types.includes(type)){
  const availability=actionAvailability(s,country,types,'',agentId);
  type=types.find(id=>!availability.get(id))??types[0];
 }
 const targets=countryOperationTargets(s,country,type);
 const location=operationLocation(s,country,type);
 const local=operationTeam(s,country,agentId).filter(a=>a.country===location&&!E.travelInProgress(a)),ready=availableAgents(local,location);
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
 const availability=actionAvailability(s,country,menuTypes,locked,selection.agentId);
 const d=ACTIONS[type],compare=d&&!selection.agentId;
 const blocked=locked||selected?.reason||availability.get(type)||(!selected?'Aucun agent disponible pour cette action.':'');
 const boostReason=locked||(!selected?'Choisissez un agent disponible.':selected.normal.boostGain===0?'Chances déjà au plafond.':selected.reinforced.error)||'';
 const boost=compare&&selected&&!d.safe&&selected.normal.chance<100?`<div class="mission-boost-control">
  ${button(icon('boost')+missionBoostLabel(selected.normal,selected.reinforced,s.factions[s.player].budget),'workspace-boost','mission-boost-toggle',`aria-pressed="${!!selection.boost}" ${locked||!selection.boost&&boostReason?'disabled':''}`)}
  ${boostReason&&boostReason!==blocked?`<small class="mission-boost-reason">${esc(boostReason)}</small>`:''}
 </div>`:'';
 const showDestination=type==='cyberSupport'&&country===s.player;
 const targetPicker=type==='analyze'&&targets.length?proofChoices(targets,target,locked):showDestination?`<label>Pays à hacker<select data-country-target ${locked?'disabled':''}>${targets.map(([id,name])=>`<option value="${id}" ${id===target?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`:'';
 return `<section class="workspace-body country-operations"><header class="country-operations-heading"><h2>${flag(country)} ${esc(COUNTRY[country].name)}</h2>${countryArtHeader(s,country)}</header>
 <h3>${selection.group==='access'?'Actions du pays':'Actions disponibles'}</h3><div class="country-operation-types">${countryActionButtons(s,country,menuTypes,availability,selection,selection.agentId)}</div>
 ${compare?`<section class="country-operation-detail">
  <h3>${icon(d.icon)} ${esc(actionName(s,country,type))}</h3>${actionResources(type,selected?.a)}${targetPicker}
  <div class="mission-compare-heading"><strong>Comparer les agents</strong><small>${operationLocation(s,country,type)===s.player?'Agents disponibles au QG':'Agents disponibles sur place'}</small></div>
  <div class="country-operation-agents" role="group" aria-label="Comparer les agents">${rows.length?rows.map(r=>`<div class="country-operation-agent">${button(portrait(r.a),'agent','agent-photo',`data-id="${r.a.id}" aria-label="Consulter ${esc(r.a.name)}"`)}${button(`<span><strong>${esc(r.a.name)}</strong><small>${esc(r.reason||'Disponible')}</small></span><span class="mission-candidate-readings"><b aria-label="Chances de réussite : ${r.o.chance} %">${r.o.chance} %</b>${missionTimingMarkup(r.a,type,r.o)}</span>`,'workspace-agent','country-operation-choice',`data-id="${r.a.id}" aria-pressed="${selected?.a.id===r.a.id}" ${r.reason||locked?'disabled':''}`)}</div>`).join(''):`<p class="muted">${operationLocation(s,country,type)===s.player?'Aucun agent disponible au QG.':'Aucun agent disponible sur place.'}</p>`}</div>
  ${selected?`<div class="mission-quick-metrics">${missionCostsMarkup(s,selected.a.id,type,target)}</div>`:''}
  <details class="mission-briefing">
   <summary>Détails</summary>
   <div class="mission-briefing-content">
    ${selected?`${selected.o.explanations.map(x=>`<p class="modifier">${esc(x)}</p>`).join('')}${forecastMarkup(s,selected.a.id,type,target)}`:''}
    <p class="action-description">${esc(d.desc)}</p>
   </div>
  </details>
 </section>`:''}
 ${local.some(a=>a.task||a.status==='captured')?`<details class="country-local-missions"><summary>Agents occupés ou capturés</summary>${local.filter(a=>a.task||a.status==='captured').map(a=>button(`${esc(a.name)} · ${esc(a.task?ACTIONS[a.task.type].name:'En détention')}`,'agent','small',`data-id="${a.id}"`)).join('')}</details>`:''}</section>
 ${compare?`<footer class="country-order-footer"><p class="workspace-message" role="status">${esc(selection.message||blocked)}</p>${boost}
  <div class="mission-confirm-control">${selected?.o.cost?`<small class="mission-credit-cost">${selected.o.cost} crédits</small>`:''}${button(icon('check')+' Confirmer'+(selected?' · '+esc(selected.a.name):''),'workspace-confirm','primary wide',blocked?'disabled':'')}</div>
 </footer>`:''}`;
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

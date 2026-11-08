import {agentLocation} from './agent-location.js?v=236';
import * as E from './engine.js?v=236';
import {COUNTRY,ACTIONS,STAT_NAMES} from './data.js?v=236';
import {availability} from './presentation.js?v=236';
import {button,esc,icon,portrait,flag,nationalityFlags,talents} from './ui.js?v=236';
import {countryTargetButtons,inquiryActionCosts} from './country-inquiry.js?v=236';
import {countryArtHeader} from './country-signals.js?v=236';
import {proofTitle} from './intelligence.js?v=236';
import {fullBody} from './visuals.js?v=236';
import {countryOnMap,operationCountries} from './operation-map.js?v=236';
import {agentTravelDestinations,deploymentOptions} from './deployment.js?v=236';
import {exposureLevel} from './exposure.js?v=236';

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
  const attrs=selection&&!deploy?`data-id="${type}" aria-pressed="${selection.type===type}"`:`data-id="${deploy&&agentId?esc(agentId):country}"${deploy?'':` data-type="${type}"${actor}`}`;
  const help=agentId?'Choisir la destination et le mode de déplacement.':'Choisir les agents à déployer.';
  return button(icon(deploy?'plane':action.icon)+esc(actionName(s,country,type,agentId)),cmd,'small country-operation-button',`${attrs} title="${esc(reason||action?.desc||help)}" ${reason?'disabled':''}`);
 }).join('');
}

export function countrySidebarActions(s,country,locked='',agent=null){
 const actions=countryOperationTypes(s,country),agentId=agent?.id;
 const actor=agentId?` data-agent="${esc(agentId)}"`:'';
 const access=actions.length&&country!==s.player?button(icon('file')+' Actions du pays','workspace-country','small country-operation-button',`data-id="${country}" data-group="access"${actor}`):'';
 const context=agent&&E.travelInProgress(agent)?'':countryTargetButtons(s,country,{empty:access,emptyLast:!!agent});
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
 const d=ACTIONS[type],boostReason=locked||!selected||selected.normal.boostGain===0||selected.reinforced.error,blocked=locked||selected?.reason||availability.get(type)||(!selected?'Aucun agent disponible pour cette action.':'');
 const showDestination=type==='cyberSupport'&&country===s.player;
 const targetPicker=type==='analyze'&&targets.length?proofChoices(targets,target,locked):showDestination?`<label>Pays à hacker<select data-country-target ${locked?'disabled':''}>${targets.map(([id,name])=>`<option value="${id}" ${id===target?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`:'';
 return `<section class="workspace-body country-operations"><header class="country-operations-heading"><h2>${flag(country)} ${esc(COUNTRY[country].name)}</h2>${countryArtHeader(s,country)}</header>
 <h3>${selection.group==='access'?'Actions du pays':'Actions disponibles'}</h3><div class="country-operation-types">${countryActionButtons(s,country,menuTypes,availability,selection,selection.agentId)}</div>
 ${d?`<section class="country-operation-detail"><h3><span class="info-word" tabindex="0" title="${esc(d.desc)}">${icon(d.icon)} ${esc(actionName(s,country,type))} ${icon('help')}</span></h3>${targetPicker}
 <div class="country-operations-boost"><strong>${operationLocation(s,country,type)===s.player?'Agents disponibles au QG':'Agents disponibles sur place'}</strong>${button(icon('boost')+` +10 % · −${E.ECONOMY.boostCost} cr`,'workspace-boost','small',`aria-pressed="${!!selection.boost}" ${!selection.boost&&boostReason?'disabled':''}`)}</div>
 <div class="country-operation-agents">${rows.length?rows.map(r=>`<div class="country-operation-agent">${button(portrait(r.a),'agent','agent-photo',`data-id="${r.a.id}" aria-label="Consulter ${esc(r.a.name)}"`)}${button(`<span><strong>${esc(r.a.name)}</strong><small>${esc(r.reason||'Disponible')}</small></span><span><b>${r.o.chance} %</b><small>${r.o.duration} tour(s)</small></span>`,'workspace-agent','country-operation-choice',`data-id="${r.a.id}" aria-pressed="${selected?.a.id===r.a.id}" ${r.reason||locked?'disabled':''}`)}</div>`).join(''):`<p class="muted">${operationLocation(s,country,type)===s.player?'Aucun agent disponible au QG.':'Aucun agent disponible sur place.'}</p>`}</div>
 ${selected?`<details class="country-chance-details"><summary title="Formule, talents, bonus et malus de cette action">Chances · ${selected.o.chance} % ⓘ</summary>${selected.o.explanations.map(x=>`<p>${esc(x)}</p>`).join('')||'<p>Réussite automatique.</p>'}</details>${inquiryActionCosts(type,selected)}`:''}
 <p class="workspace-message" role="status">${esc(selection.message||blocked)}</p>${button(icon('check')+' Confirmer'+(selected?' · '+esc(selected.a.name):''),'workspace-confirm','primary wide',blocked?'disabled':'')}</section>`:''}
 ${local.some(a=>a.task||a.status==='captured')?`<details class="country-local-missions"><summary>Agents occupés ou capturés</summary>${local.filter(a=>a.task||a.status==='captured').map(a=>button(`${esc(a.name)} · ${esc(a.task?ACTIONS[a.task.type].name:'En détention')}`,'agent','small',`data-id="${a.id}"`)).join('')}</details>`:''}</section>`;
}
export function floatingAgentMarkup(s,id,{sidebar=false,locked=''}={}){
 const a=s.agents.find(a=>a.id===id);if(!a)return '<section class="workspace-body">Agent indisponible.</section>';
 const status=availability(a),task=a.task,target=COUNTRY[task?.target]?.name||s.suspects.find(t=>t.id===task?.target)?.name||COUNTRY[a.country].name,own=a.faction===s.player;
 const energy=100-a.fatigue,energyTone=energy>50?'green':energy>25?'yellow':'red';
 const exposure=exposureLevel(a),exposureTone=['green','blue','yellow','orange','red'][exposure],discretion=E.exposureLabel(a);
 const readings=[['bolt','Énergie',energy,energyTone],['eye','Exposition',a.exposure,exposureTone]];
 const weapon=a.weapon?'Avec':'Sans';
 const stats=a.stats.map((n,i)=>`<span title="${STAT_NAMES[i]}">${icon(['scan','target','shield'][i])}<span class="sr-only">${STAT_NAMES[i]}</span> <strong>${n}</strong></span>`).join('');
 const localActions=countrySidebarActions(s,a.country,own?locked:'Partenaire : consultation uniquement.',a);
 return `<article class="workspace-body floating-agent ${own?'':'coop-ally'}">${sidebar?'':`<header><h2>${esc(a.name)} <span class="agent-nationality">${nationalityFlags(a)}</span></h2></header>`}
 <div class="floating-agent-overview"><div class="floating-agent-portrait">${fullBody(a,{alignTop:true})}</div><div class="floating-agent-facts">${agentLocation(a,{compact:true,pin:true})}${own?'':'<small>Partenaire : consultation uniquement</small>'}<span class="availability ${status.kind}">${esc(status.label)}</span>
 <div class="floating-agent-readings">${readings.map(([symbol,label,value,tone])=>`<span title="${label}">${icon(symbol)}<span class="sr-only">${label}</span><strong class="reading-${tone}">${value}/100</strong></span>`).join('')}</div>
 <div class="floating-agent-stats" aria-label="Statistiques">${stats}</div>
 <div class="floating-agent-gear"><span title="${weapon} arme">${icon('rifle')}<span class="sr-only">Arme</span>${weapon}</span><span title="Niveau de discrétion"><span class="sr-only">Discrétion</span><svg class="icon discretion-meter reading-${exposureTone}" viewBox="0 0 18 14" aria-hidden="true">${Array.from({length:5},(_,i)=>`<rect x="${i*4}" y="${10-i*2}" width="2" height="${4+i*2}" rx=".5" opacity="${i<=exposure?1:.25}"/>`).join('')}</svg>${esc(discretion)}</span></div>
 ${talents(a)}</div></div>
 ${task||a.status==='captured'?`<section class="floating-agent-mission"><h3>${task?esc(ACTIONS[task.type].name):'Extraction nécessaire'}</h3>${task?`<p>${esc(target)} · ${task.remaining} tour(s) · ${task.chance} % de réussite</p>${own?button('Annuler la mission','cancel','small',`data-id="${id}" ${E.travelInProgress(a)||s.ended?'disabled':''}`):''}`:''}</section>`:''}
 ${localActions}</article>`;
}

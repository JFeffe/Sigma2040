import {quickActionMarkup} from './quick-actions.js?v=215';
import {countrySignals} from './country-signals.js?v=215';
import {cooperationInfo} from './cooperation.js?v=215';
import * as E from './engine.js?v=215';
import {COUNTRY,COUNTRIES,ACTIONS} from './data.js?v=215';
import {agentMenuActions,ACTION_GROUPS,availability} from './presentation.js?v=215';
import {button,esc,icon,portrait,flag,nationalityFlags,statlines,talents} from './ui.js?v=215';
import {countryTargetButtons,inquiryActionCosts} from './country-inquiry.js?v=215';
import {fullBody} from './visuals.js?v=215';

const dossierActions=new Set(['analyze','collect','surveil','prepare','arrest','hack','intimidate']);
export function countryOperationTypes(s,country){
 if(COUNTRY[country]?.power&&country!==s.player)return [];
 const sample={...(E.team(s)[0]||{}),faction:s.player,country,safehouses:[]};
 const allowed=new Set(agentMenuActions(sample,s).map(([id])=>id));allowed.add('cyberSupport');allowed.add('protect');
 return ACTION_GROUPS.flatMap(([,ids])=>ids).filter(id=>allowed.has(id)&&!dossierActions.has(id)&&!['travel','sneak'].includes(id));
}
export function countryOperationTargets(s,country,type){
 if(type==='rescue')return E.team(s).filter(a=>a.status==='captured'&&a.country===country).map(a=>[a.id,a.name]);
 if(type==='cyberSupport')return COUNTRIES.filter(c=>!c.power&&(country===s.player||c.id===country)).map(c=>[c.id,c.name]);
 return [];
}
export function countryOperationModel(s,country,{type,agent,target,boost=false}={}){
 const types=countryOperationTypes(s,country);if(!types.includes(type))type=types[0];
 const targets=countryOperationTargets(s,country,type);target=targets.length?(targets.some(([id])=>id===target)?target:targets[0][0]):null;
 const local=E.team(s).filter(a=>a.country===(type==='cyberSupport'?s.player:country)&&!E.travelInProgress(a)),ready=local.filter(a=>!a.task&&!['captured','dead','retired'].includes(a.status));
 const rows=type?ready.map(a=>{const normal=E.options(s,a.id,type,target),reinforced=E.options(s,a.id,type,target,true),o=boost?reinforced:normal;return {a,normal,reinforced,o,target,reason:o.error||''};}).sort((a,b)=>Number(!!a.reason)-Number(!!b.reason)||b.o.chance-a.o.chance):[];
 return {type,types,targets,target,local,rows,selected:rows.find(r=>r.a.id===agent)||rows.find(r=>!r.reason)||null};
}
export function countryOperationsMarkup(s,country,selection={},locked=''){
 let m=countryOperationModel(s,country,selection);
 if(selection.boost&&(!m.selected||m.selected.normal.boostGain===0||m.selected.reinforced.error)){selection.boost=false;m=countryOperationModel(s,country,selection);}
 const {type,types,targets,target,local,rows,selected}=m;selection.type=type;selection.agent=selected?.a.id;selection.target=target;
 const d=ACTIONS[type],boostReason=locked||!selected||selected.normal.boostGain===0||selected.reinforced.error,blocked=locked||selected?.reason||(!selected?'Aucun agent disponible pour cette action.':'');
 return `<section class="workspace-body country-operations"><header class="country-operations-heading"><h2>${flag(country)} ${esc(COUNTRY[country].name)}</h2><p>${esc(COUNTRY[country].city)} · ${local.length} agent(s) de votre équipe sur place</p>${button(icon('plane')+' Déployer un agent','workspace-deploy','small',`data-id="${country}"`)}</header>
 <div class="country-title-signals">${countrySignals(s,country,true)}</div><p class="country-authorities">Autorités · ${esc(cooperationInfo(s,s.player,country).name)} · Crédits : ${s.factions[s.player].budget}</p>
 <details class="country-operations-cases"><summary>Dossiers et menaces du pays</summary>${countryTargetButtons(s,country)}</details>
 <h3>Actions générales</h3><div class="country-operation-types">${types.map(id=>button(icon(ACTIONS[id].icon)+esc(ACTIONS[id].name),'workspace-action','small',`data-id="${id}" aria-pressed="${id===type}" title="${esc(ACTIONS[id].desc)}"`)).join('')}</div>
 ${d?`<section class="country-operation-detail"><h3><span class="info-word" tabindex="0" title="${esc(d.desc)}">${icon(d.icon)} ${esc(d.name)} ⓘ</span></h3>${targets.length?`<label>Cible<select data-country-target>${targets.map(([id,name])=>`<option value="${id}" ${id===target?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`:''}
 <div class="country-operations-boost"><strong>${type==='cyberSupport'?'Agents disponibles au QG':'Agents disponibles sur place'}</strong>${button(icon('boost')+` +10 % · −${E.ECONOMY.boostCost} cr`,'workspace-boost','small',`aria-pressed="${!!selection.boost}" ${!selection.boost&&boostReason?'disabled':''}`)}</div>
 <div class="country-operation-agents">${rows.length?rows.map(r=>`<div class="country-operation-agent">${button(portrait(r.a),'agent','agent-photo',`data-id="${r.a.id}" aria-label="Consulter ${esc(r.a.name)}"`)}${button(`<span><strong>${esc(r.a.name)}</strong><small>${esc(r.reason||'Disponible')}</small></span><span><b>${r.o.chance} %</b><small>${r.o.duration} tour(s)</small></span>`,'workspace-agent','country-operation-choice',`data-id="${r.a.id}" aria-pressed="${selected?.a.id===r.a.id}" ${r.reason||locked?'disabled':''}`)}</div>`).join(''):'<p class="muted">Aucun agent disponible sur place.</p>'}</div>
 ${selected?`<details class="country-chance-details"><summary title="Formule, talents, bonus et malus de cette action">Chances · ${selected.o.chance} % ⓘ</summary>${selected.o.explanations.map(x=>`<p>${esc(x)}</p>`).join('')||'<p>Réussite automatique.</p>'}</details>${inquiryActionCosts(type,selected)}`:''}
 <p class="workspace-message" role="status">${esc(selection.message||blocked)}</p>${button(icon('check')+' Confirmer'+(selected?' · '+esc(selected.a.name):''),'workspace-confirm','primary wide',blocked?'disabled':'')}</section>`:''}
 ${local.some(a=>a.task||a.status==='captured')?`<details class="country-local-missions"><summary>Agents occupés ou capturés</summary>${local.filter(a=>a.task||a.status==='captured').map(a=>button(`${esc(a.name)} · ${esc(a.task?ACTIONS[a.task.type].name:'En détention')}`,'agent','small',`data-id="${a.id}"`)).join('')}</details>`:''}</section>`;
}
export function floatingAgentMarkup(s,id){
 const a=s.agents.find(a=>a.id===id);if(!a)return '<section class="workspace-body">Agent indisponible.</section>';
 const status=availability(a),task=a.task,target=COUNTRY[task?.target]?.name||s.suspects.find(t=>t.id===task?.target)?.name||COUNTRY[a.country].name,own=a.faction===s.player;
 return `<article class="workspace-body floating-agent ${own?'':'coop-ally'}"><header><h2>${esc(a.name)} ${nationalityFlags(a)}</h2><p>${esc(a.role)}${own?'':' · Partenaire — consultation uniquement'}</p></header><div class="floating-agent-overview">${fullBody(a)}<div><p class="availability ${status.kind}">${esc(status.label)}</p><p>${esc(COUNTRY[a.country].city)} · ${esc(a.cover)}</p><p>Énergie <strong>${100-a.fatigue}/100</strong><br>Exposition <strong>${a.exposure}/100</strong></p><p>${a.weapon?'Arme équipée':'Sans arme'}<br>${a.country===a.faction?'Au QG':E.hasSafehouse(s,a.faction,a.country)?'Planque disponible':'Sans planque'}</p>${statlines(a)}</div></div>${talents(a)}
 <section class="floating-agent-mission"><h3>${task?esc(ACTIONS[task.type].name):a.status==='captured'?'Extraction nécessaire':'Aucune mission en cours'}</h3>${task?`<p>${esc(target)} · ${task.remaining} tour(s) · ${task.chance} % de réussite</p>${own?button('Annuler la mission','cancel','small',`data-id="${id}" ${E.travelInProgress(a)||s.ended?'disabled':''}`):''}`:''}</section>
 ${button(icon('file')+' Ouvrir l’enquête du territoire','workspace-inquiry','wide',`data-id="${a.country}"`)}${own?quickActionMarkup(s,a):''}${button(icon('world')+' Ouvrir le pays','workspace-country','wide',`data-id="${a.country}"`)}${button(icon('clock')+' Journal','agent-journal','small',`data-id="${id}"`)}<details><summary>Parcours</summary><p>${esc(a.bio)}</p></details></article>`;
}

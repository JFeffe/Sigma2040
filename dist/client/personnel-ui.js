import * as E from './engine.js?v=194';
import {ACTIONS,COUNTRY,ROSTER,STAT_NAMES,TALENTS} from './data.js?v=194';
import {fullBody} from './visuals.js?v=194';
import {availability} from './presentation.js?v=194';
import {quickActionMarkup} from './quick-actions.js?v=194';
import {statActions} from './recruit-selection.js?v=194';
import {proofTitle} from './intelligence.js?v=194';
import {heading,esc,icon,button,portrait,nationalityFlags,talentIcon,sortedTalents} from './ui.js?v=194';

const statSymbols=['scan','target','shield'],statShort=['A','H','SF'];

function capabilities(a,className){
 return `<div class="${className}" aria-label="Capacités de ${esc(a.name)}">${a.stats.map((n,i)=>`<span class="personnel-stat stat-${i}" data-rich-tooltip aria-label="${STAT_NAMES[i]} : ${n} sur 10"><span class="personnel-stat-label">${icon(statSymbols[i])}<span class="personnel-stat-name">${STAT_NAMES[i]}</span><abbr title="${STAT_NAMES[i]}">${statShort[i]}</abbr></span><strong>${n}<small>/10</small></strong><template><strong>${STAT_NAMES[i]}</strong><ul>${statActions(i).map(name=>`<li>${esc(name)}</li>`).join('')}</ul></template></span>`).join('')}</div>`;
}

function member(a){
 const state=availability(a),task=a.task,travel=task&&['travel','sneak'].includes(task.type);
 const location=COUNTRY[a.country].city+(travel?' → '+COUNTRY[task.target].city:'');
 const assignment=task?`${ACTIONS[task.type].name} · ${task.remaining} tour(s) restant(s)` :state.label;
 return {state,location,assignment};
}

function readings(a){
 const energy=100-a.fatigue,exposure=a.exposure,energyColor=energy>=51?'green':energy>=26?'yellow':'red',exposureColor=exposure<20?'green':exposure<40?'blue':exposure<60?'yellow':exposure<80?'orange':'red';
 const fatiguePenalty=a.fatigue>=75?20:a.fatigue>=50?10:0,sensitive=E.exposurePenalty(a),inquiry=E.exposurePenalty(a,'collect');
 return `<div class="personnel-condition" aria-label="État de l’agent"><span data-rich-tooltip aria-label="Énergie : ${energy} sur 100"><span>${icon('bolt')} Énergie</span><strong class="reading-${energyColor}">${energy}/100</strong><template><strong>Énergie · ${energy}/100</strong><p>${fatiguePenalty?`Fatigue : −${fatiguePenalty} points de réussite sur les actions avec jet.`:'Aucun malus de fatigue.'}</p><p>51–100 : aucun malus · 26–50 : −10 points · 0–25 : −20 points.</p></template></span><span data-rich-tooltip aria-label="Exposition : ${exposure} sur 100"><span>${icon('eye')} Exposition</span><strong class="reading-${exposureColor}">${exposure}/100</strong><template><strong>Exposition · ${E.exposureLabel(a)}</strong><p>${sensitive?`Actions sensibles : −${sensitive} points de réussite.`:'Aucun malus sur les actions sensibles.'}</p><p>${inquiry?`Collecte, localisation, préparation et intrusion : −${inquiry} points.`:'Aucun malus sur les actions d’enquête.'}</p></template></span></div>`;
}

function fact(symbol,label,value,title='',className=''){
 return `<div class="${className}"${title?` title="${esc(title)}"`:''}><dt>${icon(symbol)}${label}</dt><dd>${esc(value)}</dd></div>`;
}

export function personnelPanel(s,selectedId){
 const agents=E.team(s),pending=s.recruitments.filter(r=>r.faction===s.player),a=agents.find(a=>a.id===selectedId)||agents[0],free=agents.filter(a=>!a.task&&a.status!=='captured').length;
 const roster=`<nav class="personnel-roster" aria-label="Choisir un agent"><div class="personnel-roster-heading"><span>VOTRE UNITÉ</span><strong>${agents.length}<small> / 4</small></strong></div>${agents.map(b=>{const {state,location,assignment}=member(b);return `<button class="personnel-member ${b.id===a?.id?'selected':''}" data-cmd="select-agent" data-id="${esc(b.id)}" aria-pressed="${b.id===a?.id}">${portrait(b)}<span class="personnel-member-copy"><strong>${esc(b.name)}${b.chief?`<span class="personnel-chief" data-rich-tooltip aria-label="Chef — Coordination">${icon('crown')}<template><strong>${esc(TALENTS.chef[0])}</strong><p>${esc(TALENTS.chef[1])}</p></template></span>`:''}</strong><span class="personnel-member-role">${esc(b.role)} ${nationalityFlags(b)}</span><span class="personnel-member-state ${state.kind}" title="${esc(location)} · ${esc(assignment)}">${icon(state.icon)}${state.label}${b.task?` · ${b.task.remaining} t`:''}</span></span>${capabilities(b,'personnel-member-stats')}<span class="personnel-member-talents" aria-label="Talents">${sortedTalents(b).filter(t=>t!=='chef').map(t=>`<span data-rich-tooltip>${talentIcon(t)}<span>${esc(TALENTS[t][0])}</span><template><strong>${esc(TALENTS[t][0])}</strong><p>${esc(TALENTS[t][1])}</p></template></span>`).join('')}</span></button>`;}).join('')}${pending.map(r=>`<div class="personnel-pending">${icon('clock')}<strong>${esc(ROSTER.find(a=>a.id===(r.templateId||r.id))?.name||r.id)}</strong><small>Arrivée dans ${r.remaining} tour(s)</small></div>`).join('')}${agents.length+pending.length<4?button(icon('plus')+' Recruter','recruit','wide personnel-recruit'):''}</nav>`;
 if(!a)return `${heading('PERSONNEL / SIGMA','Votre unité','Aucun agent actif.',pending.length?'':button('Recruter','recruit','primary'))}${roster}`;

 const status=availability(a),task=a.task,target=COUNTRY[task?.target]?.name||s.suspects.find(t=>t.id===task?.target)?.name||s.agents.find(b=>b.id===task?.target)?.name||(s.proofs.some(p=>p.id===task?.target)?proofTitle(s.proofs.find(p=>p.id===task.target)):null)||COUNTRY[a.country].name,locked=E.travelInProgress(a),detained=a.status==='captured';
 const refuge=a.country===a.faction?'Au QG':E.hasSafehouse(s,a.faction,a.country)?'Planque disponible':'Sans planque';
 const health=detained?'En détention':a.status==='injured'?'Blessé · −10 pts':'Opérationnel';
 const facts=`<dl class="personnel-facts" aria-label="Situation opérationnelle">${fact('world','Position',COUNTRY[a.country].city,COUNTRY[a.country].name)}${fact(a.cover==='Clandestine'?'ghost':'file','Couverture',a.cover)}${fact('target','Armement',a.weapon?'Arme équipée':'Sans arme')}${fact('shield','Refuge',refuge)}${fact(detained?'lock':'plus','État',health,a.status==='injured'?'Blessure : −10 points de réussite sur les actions avec jet.':'',a.status==='injured'||detained?'condition-warning':'')}</dl>`;

 const mission=`<section class="personnel-mission ${task?'engaged':''}"><div class="personnel-mission-heading"><span>${detained?'AGENT CAPTURÉ':task?task.queued?'ORDRE PLANIFIÉ':'MISSION EN COURS':'PROCHAINE AFFECTATION'}</span>${task?`<strong>Fin T${s.turn+task.remaining-1}</strong>`:''}</div><h3>${detained?'Extraction nécessaire':task?esc(ACTIONS[task.type].name):'Prêt à intervenir'}</h3>${detained?`<p>Détenu en ${esc(COUNTRY[a.country].name)}.</p>`:task?`<p>${esc(target)} · ${task.remaining} tour(s) restant(s)</p>`:''}${task?`<progress max="${task.total}" value="${task.total-task.remaining}" aria-label="Progression de la mission"></progress>`:''}<div class="personnel-mission-actions">${button(icon('target')+(detained?' Consulter la détention':' Affecter une opération'),'agent','primary',`data-id="${esc(a.id)}" ${task||s.ended?'disabled title="Agent déjà en mission ou campagne terminée"':''}`)}${task?button(icon('close')+' Annuler','cancel','small',`data-id="${esc(a.id)}" ${locked||s.ended?'disabled title="Déplacement commencé ou campagne terminée"':''}`):!detained?button(icon('moon')+' Repos','agent-rest','small',`data-id="${esc(a.id)}" ${s.ended?'disabled':''}`):''}</div></section>`;

 return `<section class="personnel-command">${heading('PERSONNEL / SIGMA','Votre unité',`${free} agent(s) disponible(s) · ${agents.filter(a=>a.task).length} mission(s) engagée(s)`)}<div class="personnel-workspace">${roster}<section class="personnel-dossier" aria-label="Dossier de ${esc(a.name)}"><header class="personnel-identity"><div><h2>${esc(a.name)}</h2><p>${esc(a.role)} ${nationalityFlags(a)}</p></div>${readings(a)}</header><div class="personnel-dossier-layout"><figure class="personnel-portrait-stage">${fullBody(a)}<figcaption>${esc(COUNTRY[a.country].name)}</figcaption></figure><div class="personnel-dossier-content"><span class="personnel-status ${status.kind}">${icon(status.icon)}${status.label}</span>${capabilities(a,'personnel-capabilities')}${facts}${mission}${!task&&!detained?quickActionMarkup(s,a):''}<section class="personnel-talents"><h3>Talents</h3><div>${sortedTalents(a).map(t=>`<details><summary>${talentIcon(t)}<strong>${esc(TALENTS[t][0])}</strong>${icon('chevron')}</summary><p>${esc(TALENTS[t][1])}</p></details>`).join('')}</div></section><details class="personnel-lore"><summary>${icon('file')} Parcours ${icon('chevron')}</summary><p class="personnel-biography">${esc(a.bio)}</p></details></div></div><footer class="personnel-footer"><div>${button(icon('clock')+' Journal','agent-journal','small',`data-id="${esc(a.id)}"`)}${button(icon('world')+' Voir le pays','map-country','small',`data-id="${a.country}"`)}</div></footer></section></div></section>`;
}

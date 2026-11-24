import {isCooperative,visibleTeam} from './cooperative.js?v=243';
import * as E from './engine.js?v=243';
import {ACTIONS,COUNTRY,ROSTER,STAT_NAMES,TALENTS} from './data.js?v=243';
import {agentLocation} from './agent-location.js?v=243';
import {exposureLevel} from './exposure.js?v=243';
import {fullBody} from './visuals.js?v=243';
import {availability} from './presentation.js?v=243';
import {statActions} from './recruit-selection.js?v=243';
import {proofTitle} from './intelligence.js?v=243';
import {campaignHeading,esc,icon,button,portrait,nationalityFlags,talentIcon,sortedTalents} from './ui.js?v=243';

const statIcons=['scan','target','shield'];

function capabilities(a,className){
 return `<span class="${className}" role="group" aria-label="Capacités de ${esc(a.name)}">
  ${a.stats.map((value,index)=>`<span class="personnel-stat stat-${index}" data-rich-tooltip aria-label="${STAT_NAMES[index]} : ${value} sur 10">
   ${icon(statIcons[index])}<strong>${value}</strong>
   <template><strong>${STAT_NAMES[index]}</strong><ul>${statActions(index).map(name=>`<li>${esc(name)}</li>`).join('')}</ul></template>
  </span>`).join('')}
 </span>`;
}

function readings(a,exposureTone){
 const energy=100-a.fatigue,energyTone=energy>=51?'green':energy>=26?'yellow':'red';
 const fatiguePenalty=a.fatigue>=75?20:a.fatigue>=50?10:0,sensitive=E.exposurePenalty(a),inquiry=E.exposurePenalty(a,'collect');
 return `<div class="floating-agent-readings" aria-label="État de l’agent">
  <span data-rich-tooltip aria-label="Énergie : ${energy} sur 100">
   <span class="agent-reading-label">${icon('bolt')} Énergie</span><strong class="reading-${energyTone}">${energy}/100</strong>
   <template><strong>Énergie · ${energy}/100</strong><p>${fatiguePenalty?`Fatigue : −${fatiguePenalty} points de réussite sur les actions avec jet.`:'Aucun malus de fatigue.'}</p><p>51–100 : aucun malus · 26–50 : −10 points · 0–25 : −20 points.</p></template>
  </span>
  <span data-rich-tooltip aria-label="Exposition : ${a.exposure} sur 100">
   <span class="agent-reading-label">${icon('eye')} Exposition</span><strong class="reading-${exposureTone}">${a.exposure}/100</strong>
   <template><strong>Exposition · ${E.exposureLabel(a)}</strong><p>${sensitive?`Actions sensibles : −${sensitive} points de réussite.`:'Aucun malus sur les actions sensibles.'}</p><p>${inquiry?`Collecte, localisation, préparation et intrusion : −${inquiry} points.`:'Aucun malus sur les actions d’enquête.'}</p></template>
  </span>
 </div>`;
}

export function agentProfileCard(s,a){
 const status=availability(a),allied=a.faction!==s.player;
 const exposure=exposureLevel(a),exposureTone=['green','blue','yellow','orange','red'][exposure];
 const discretionBars=Array.from({length:5},(_,i)=>`<rect x="${i*4}" y="${10-i*2}" width="2" height="${4+i*2}" rx=".5" opacity="${i<=exposure?1:.25}"/>`).join('');
 const talents=sortedTalents(a).map(t=>`<span tabindex="0" data-rich-tooltip>
  ${talentIcon(t)}${esc(TALENTS[t][0])}
  <template><strong>${esc(TALENTS[t][0])}</strong><p>${esc(TALENTS[t][1])}</p></template>
 </span>`).join('');
 return `<div class="agent-profile-card">
  <figure class="personnel-portrait-stage"><div class="agent-profile-portrait">${fullBody(a,{profile:true})}</div></figure>
  <div class="floating-agent-facts agent-profile-facts">
   <header class="agent-profile-heading">
    <h2>${esc(a.name)} <span class="agent-nationality">${nationalityFlags(a)}</span></h2>
    <p>${esc(a.role)}</p>
   </header>
   ${agentLocation(a,{compact:true,pin:true})}
   <div class="floating-agent-status">
    <span class="availability ${status.kind}">${esc(status.label)}</span>
    ${allied?'<span class="floating-agent-partner" title="Partenaire : consultation uniquement"><span aria-hidden="true">Partenaire</span><span class="sr-only">Partenaire : consultation uniquement</span></span>':''}
   </div>
   ${readings(a,exposureTone)}
   ${capabilities(a,'floating-agent-stats')}
   <div class="floating-agent-gear">
    <span title="${a.weapon?'Arme équipée':'Sans arme'}">${icon('pistol')}<span class="sr-only">Arme</span>${a.weapon?'Avec':'Sans'}</span>
    <span title="Niveau de discrétion"><span class="sr-only">Discrétion</span><svg class="icon discretion-meter reading-${exposureTone}" viewBox="0 0 18 14" aria-hidden="true">${discretionBars}</svg>${esc(E.exposureLabel(a))}</span>
   </div>
   <div class="talents" role="group" aria-label="Talents">${talents}</div>
  </div>
 </div>`;
}

function rosterMember(s,a,selected){
 const allied=a.faction!==s.player,status=availability(a),task=a.task;
 const destination=task&&['travel','sneak'].includes(task.type)?COUNTRY[task.target]?.city:null;
 const position=COUNTRY[a.country].city+(destination?' → '+destination:'');
 const assignment=task?`${ACTIONS[task.type].name} · ${task.remaining} tour(s) restant(s)`:status.label;
 return `<button class="personnel-member ${allied?'coop-ally':''} ${selected?'selected':''}" data-cmd="select-agent" data-id="${esc(a.id)}" aria-pressed="${selected}">
  ${portrait(a)}
  <span class="personnel-member-copy">
   <strong>${esc(a.name)} ${nationalityFlags(a)}${a.chief?`<span class="personnel-chief" title="Chef" aria-label="Chef">${icon('crown')}</span>`:''}</strong>
   <span class="personnel-member-role">${esc(a.role)}${allied?' · '+esc(COUNTRY[a.faction].name):''}</span>
   <span class="personnel-member-state ${status.kind}" title="${esc(position+' · '+assignment)}">${icon(status.icon)}${esc(status.label)}${task?` · ${task.remaining} t`:''}</span>
  </span>
  ${capabilities(a,'personnel-member-stats')}
 </button>`;
}

function fact(symbol,label,value,title='',className=''){
 return `<div class="${className}"${title?` title="${esc(title)}"`:''}><dt>${icon(symbol)}${label}</dt><dd>${esc(value)}</dd></div>`;
}

function missionMarkup(s,a){
 const {task}=a,allied=a.faction!==s.player,detained=a.status==='captured';
 const proof=s.proofs.find(p=>p.id===task?.target);
 const target=COUNTRY[task?.target]?.name||s.suspects.find(t=>t.id===task?.target)?.name
  ||s.agents.find(b=>b.id===task?.target)?.name||(proof?proofTitle(proof):COUNTRY[a.country].name);
 return `<section class="personnel-mission ${task?'engaged':''}">
  <div class="personnel-mission-heading">
   <span>${detained?'AGENT CAPTURÉ':task?task.queued?'ORDRE PLANIFIÉ':'MISSION EN COURS':'PROCHAINE AFFECTATION'}</span>
   ${task?`<strong>Fin T${s.turn+task.remaining-1}</strong>`:''}
  </div>
  <h3>${detained?'Extraction nécessaire':task?esc(ACTIONS[task.type].name):'Prêt à intervenir'}</h3>
  ${detained?`<p>Détenu en ${esc(COUNTRY[a.country].name)}.</p>`:task?`<p>${esc(target)} · ${task.remaining} tour(s) restant(s)</p>`:''}
  ${task?`<progress max="${task.total}" value="${task.total-task.remaining}" aria-label="Progression de la mission"></progress>`:''}
  <div class="personnel-mission-actions">
   ${button(icon('world')+' Ouvrir le pays','workspace-country','small',`data-id="${a.country}"`)}
   ${task?button(icon('close')+' Annuler','cancel','small',`data-id="${esc(a.id)}" ${allied||E.travelInProgress(a)||s.ended?'disabled title="Déplacement commencé ou campagne terminée"':''}`):''}
  </div>
 </section>`;
}

export function personnelPanel(s,selectedId){
 const cooperative=isCooperative(s),agents=visibleTeam(s),pending=s.recruitments.filter(r=>r.faction===s.player);
 const a=agents.find(agent=>agent.id===selectedId)||agents[0];
 const free=agents.filter(agent=>!agent.task&&agent.status!=='captured').length,missions=agents.filter(agent=>agent.task).length;
 const counts=`<div class="campaign-status-group">
  <span class="campaign-status">${icon('check')} <strong>${free}</strong> <small>${free===1?'Disponible':'Disponibles'}</small></span>
  <span class="campaign-status">${icon('clock')} <strong>${missions}</strong> <small>En mission</small></span>
 </div>`;
 const header=campaignHeading('personnelTitle','people',cooperative?'Unités alliées':'Votre unité',counts);
 const roster=`<nav class="personnel-roster" aria-label="Choisir un agent">
  <div class="personnel-roster-heading">
   <span>${cooperative?'UNITÉS ALLIÉES · contour violet : partenaire':'Effectif'}</span>
   <strong>${agents.length}<small> / ${cooperative?8:4}</small></strong>
  </div>
  <div class="personnel-members">${agents.map(agent=>rosterMember(s,agent,agent.id===a?.id)).join('')}</div>
  ${pending.map(r=>`<div class="personnel-pending">${icon('clock')}<strong>${esc(ROSTER.find(agent=>agent.id===(r.templateId||r.id))?.name||r.id)}</strong><small>Arrivée dans ${r.remaining} tour(s)</small></div>`).join('')}
  ${E.team(s).length+pending.length<4?button(icon('plus')+' Recruter','recruit','wide personnel-recruit'):''}
 </nav>`;
 if(!a)return `<section class="campaign-panel personnel-command" aria-labelledby="personnelTitle">${header}<div class="campaign-card personnel-empty"><p>Aucun agent actif.</p>${roster}</div></section>`;

 const detained=a.status==='captured',injured=a.status==='injured';
 const refuge=a.country===a.faction?'Au QG':E.hasSafehouse(s,a.faction,a.country)?'Planque disponible':'Sans planque';
 const health=detained?'En détention':injured?'Blessé · −10 pts':'Opérationnel';
 return `<section class="campaign-panel personnel-command" aria-labelledby="personnelTitle">
  ${header}
  <div class="personnel-workspace">
   ${roster}
   <section class="campaign-card personnel-dossier" aria-label="Dossier de ${esc(a.name)}">
    ${agentProfileCard(s,a)}
    <dl class="personnel-facts" aria-label="Situation opérationnelle">
     ${fact('pin','Position',COUNTRY[a.country].city,COUNTRY[a.country].name)}
     ${fact('shield','Refuge',refuge)}
     ${fact(detained?'lock':'plus','État',health,injured?'Blessure : −10 points de réussite sur les actions avec jet.':'',injured||detained?'condition-warning':'')}
    </dl>
    ${missionMarkup(s,a)}
    <footer class="personnel-footer">
     ${a.faction===s.player||s.ended?button(icon('clock')+' Journal','agent-journal','small',`data-id="${esc(a.id)}"`):''}
     ${button(icon('world')+' Voir le pays','map-country','small',`data-id="${a.country}"`)}
    </footer>
   </section>
  </div>
 </section>`;
}

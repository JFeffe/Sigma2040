import {tutorialHint,isTutorial} from './tutorial-rules.js?v=198';
import {TUTORIAL_MISSIONS,tutorialMission,tutorialObjective} from './tutorial.js?v=198';
import {button,brand,esc,icon} from './ui.js?v=198';
const header=controls=>`<header class="training-header">${brand()}<span class="training-label">ACADÉMIE / SIGMA</span><nav aria-label="Navigation de la formation">${controls}</nav></header>`;
export function tutorialMenu(progress){return `<div class="training-page">${header(button('Menu principal','main-menu'))}<main class="training-menu"><span class="eyebrow">DOSSIER D’INITIATION / 2040</span><h1>Opération <em>Filigrane</em></h1><p class="training-intro">Un contact. Deux documents suspects. Une arrestation à préparer.<br>Apprenez les bases en trois petites missions reliées par une histoire.</p><div class="training-promises"><span>${icon('people')} Aucun joueur PNJ</span><span>${icon('check')} Réussites scénarisées</span><span>${icon('file')} Campagne conservée</span></div>${progress.warning?'<p class="notice warning">Une sauvegarde d’exercice n’a pas pu être reprise. Vous pouvez relancer cette mission ; les autres progrès sont conservés.</p>':''}<div class="training-missions">${TUTORIAL_MISSIONS.map(m=>{const saved=progress.sessions[m.id],status=saved&&tutorialObjective(saved),resume=saved&&!status.done&&!status.failed;return `<article class="training-mission"><span class="training-number">${m.number}</span><div class="training-mission-meta">${m.duration} · ${m.agents} agent${m.agents>1?'s':''}</div><h2>${m.title}</h2><p>${m.brief}</p><p class="training-skills">${m.skills}</p><div class="training-mission-bottom">${button(resume?'Reprendre · tour '+saved.turn:progress.completed.includes(m.id)?'Rejouer la mission':'Commencer','tutorial-start','primary',`data-id="${m.id}"`)}<small>${progress.completed.includes(m.id)?'✓ Mission accomplie':status?.failed?'À réessayer':'Mission indépendante'}</small></div></article>`;}).join('')}</div><p class="training-footnote">Toutes les missions sont accessibles et rejouables séparément. Vos progrès sont enregistrés dans ce navigateur, à part de la campagne. Les durées, prérequis et coûts d’énergie sont ceux du jeu ; les actions autorisées réussissent à 100 % pendant cette formation.</p></main></div>`;}
export function tutorialGuide(s,collapsed=false){
 if(!isTutorial(s))return '';
 const m=tutorialMission(s.tutorial.mission),o=tutorialObjective(s),finished=o.done||o.failed,next=TUTORIAL_MISSIONS[TUTORIAL_MISSIONS.indexOf(m)+1];
 return `<section class="tutorial-guide ${collapsed&&!finished?'is-collapsed':''} ${finished?'is-finished':''}" aria-label="Guide de la mission" tabindex="-1"><div class="tutorial-guide-heading"><span class="eyebrow">FILIGRANE ${m.number}</span><strong>${esc(o.title)}</strong><span class="tutorial-mode-note">Sans PNJ · Réussite 100 %</span><div class="tutorial-guide-controls">${button(collapsed?'Afficher l’aide':'Réduire l’aide','tutorial-guide-toggle','small',`aria-expanded="${!collapsed}" aria-controls="tutorialDirections"`)}${button('Briefing','tutorial-help','small')}${button('Missions','tutorial-menu','small')}</div></div><div id="tutorialDirections" ${collapsed&&!finished?'hidden':''}><p>${esc(finished?o.text:tutorialHint(s))}</p>${finished?`<div class="tutorial-guide-outcome"><strong>${o.done?'Mission accomplie':'Mission à réessayer'}</strong>${o.done&&next?button('Mission suivante · '+next.number,'tutorial-start','primary small',`data-id="${next.id}"`):button(o.failed?'Réessayer cette mission':'Retour aux missions',o.failed?'tutorial-restart-confirm':'tutorial-menu','primary small')}${button('Rejouer','tutorial-restart','small')}</div>`:''}</div></section>`;
}
// Highlight existing controls only. This helper never issues an order or navigates.
export function markTutorialControls(root,s,{selectedCountry=null}={}){
 if(!isTutorial(s))return;
 root.querySelectorAll('.tutorial-target').forEach(el=>el.classList.remove('tutorial-target'));
 const objective=tutorialObjective(s);
 const free=objective.orders.filter(o=>!s.agents.find(a=>a.id===o.agentId)?.task);
 const selectors=[];
 if(s.agents.some(a=>a.task))selectors.push('[data-cmd="advance"]');
 for(const o of free){
  selectors.push(`[data-cmd="map-agent"][data-id="${o.agentId}"]`);
  if(o.type==='travel'){selectors.push('[data-cmd="map-country"][data-id="DE"]');if(selectedCountry==='DE')selectors.push('[data-cmd="deploy"]');}
  else selectors.push('[data-cmd="country-inquiry"][data-id="s0"]','[data-cmd="nav"][data-id="inquiry"]');
 }
 for(const selector of selectors)root.querySelectorAll(selector).forEach(el=>{if(!el.disabled)el.classList.add('tutorial-target');});
 for(const el of root.querySelectorAll('[data-cmd="tech"],[data-cmd="recruit"],[data-cmd="hire"],[data-cmd="government-favor"]')){el.disabled=true;el.title='Cette action sera disponible en campagne ; suivez l’objectif de formation.';}
 const advance=root.querySelector('[data-cmd="advance"]');if(advance){advance.disabled=objective.done||objective.failed||s.tutorial.mission!=='arrest'&&!s.agents.some(a=>a.task);}
}

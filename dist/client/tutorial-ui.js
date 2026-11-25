import {isNpcTutorial,tutorialRecruitment} from './tutorial-mode.js?v=246';
import {tutorialTechAllowed,tutorialGovernmentAllowed,tutorialCanWait} from './tutorial-advanced.js?v=246';
import {tutorialHint,isTutorial,tutorialAgentPlan} from './tutorial-rules.js?v=246';
import {TUTORIAL_MISSIONS,tutorialMission,tutorialObjective} from './tutorial.js?v=246';
import {ACTIONS,COUNTRY} from './data.js?v=246';
import {button,brand,esc,icon} from './ui.js?v=246';
const header=()=>`<header class="training-header">${brand()}<span class="training-label">ACADÉMIE / SHADOW MANDATE</span></header>`;
const tutorialSummaries={
 basics:'Repérez les menaces, puis donnez votre premier ordre à IRIS.',
 inquiry:'Faites collecter une preuve par BISHOP pendant qu’APÉRO vérifie la première au QG.',
 intervention:'Préparez le dossier, obtenez le mandat et localisez Vesper avant de l’arrêter.',
 shield:'Protégez Berlin avant le tour 3, avec le soutien numérique d’APÉRO au QG.',
 recovery:'Faites récupérer vos agents, réduisez leur exposition et demandez un financement.',
 simulation:'Menez une enquête et protégez votre réseau pendant dix tours avec un allié.'
};

export function tutorialMenu(progress){
 const missions=TUTORIAL_MISSIONS.map(m=>{
  const saved=progress.sessions[m.id],status=saved&&tutorialObjective(saved),completed=progress.completed.includes(m.id);
  const resume=saved&&!status.done&&!status.failed;
  const action=resume?'Reprendre · tour '+saved.turn:completed?'Rejouer la mission':'Commencer';
  const result=completed?(m.npcs?'✓ Chapitre terminé':'✓ Mission accomplie'):status?.failed?'À réessayer':'';
  return `<article class="training-mission">
   <div class="training-mission-top">
    <span class="training-number">${m.number}</span>
    <p class="training-mission-meta"><span translate="no">${m.duration}</span> · ${m.agents} agent${m.agents>1?'s':''}${m.npcs?' · '+m.npcs+' PNJ allié':''}</p>
   </div>
   <h2>${m.title}</h2>
   <p class="training-mission-summary">${tutorialSummaries[m.id]}</p>
   <div class="training-mission-bottom">
    ${button(action,'tutorial-start','primary',`data-id="${m.id}"`)}
    ${result?`<small>${result}</small>`:''}
   </div>
  </article>`;
 });
 return `<div class="training-page">${header()}
  <main class="training-menu">
   <h1>Opération Filigrane</h1>
   <p class="training-intro">Six modules · environ 19 minutes.</p>
   <p class="training-note">Réussite garantie pour vos actions. Progression séparée de la campagne.</p>
   ${progress.warning?'<p class="notice warning">Une sauvegarde d’exercice n’a pas pu être reprise. Vous pouvez relancer cette mission ; les autres progrès sont conservés.</p>':''}
   <div class="training-missions">${missions.join('')}</div>
  </main>
 </div>`;
}
function targetLabel(s,o){const id=o.type==='analyze'?s.proofs.find(p=>p.id===o.target)?.suspect:o.target;const name=s.suspects.find(t=>t.id===id)?.name;return name?' · '+esc(name):COUNTRY[o.target]?' · '+esc(COUNTRY[o.target].name):'';}
export function tutorialGuide(s,collapsed=false){
 if(!isTutorial(s))return '';
 const m=tutorialMission(s.tutorial.mission),o=tutorialObjective(s),finished=o.done||o.failed,next=TUTORIAL_MISSIONS.includes(m)?TUTORIAL_MISSIONS[TUTORIAL_MISSIONS.indexOf(m)+1]:null,plan=tutorialAgentPlan(s);
 if(finished&&TUTORIAL_MISSIONS.includes(m))collapsed=false;
 const free=plan.filter(p=>p.order&&!p.agent.task).length;
 const support=s.campaignStats?.support?.FR?.government||{};
 const reminder=['basics','inquiry','intervention','shield','recovery','simulation'].includes(s.tutorial.mission)?o.text:o.unguided?o.text:o.tech?.length?(o.freeChoice?'Module suggéré : ':'Module : ')+o.tech.map(t=>t==='relay'?'Relais satellite · 2 cr':'Logistique prioritaire · 3 cr').join(' + '):s.tutorial.mission==='hostile'&&!(support.funding?.count||support.medical?.count)?'Gouvernement : choisissez financement ou soutien médical.':free?`${free} agent${free>1?'s':''} disponible${free>1?'s':''} à coordonner ce tour.`:s.agents.some(a=>a.task)?'Ordres affectés : terminez le tour.':'Consultez les instructions pour le prochain objectif.';
 return `<section class="tutorial-guide ${collapsed?'is-collapsed':''} ${finished?'is-finished':''}" aria-label="Guide de la mission" tabindex="-1"><div class="tutorial-guide-heading"><span class="eyebrow">TUTO ${m.number}</span><strong title="${esc(o.title)}">${esc(o.title)}</strong><div class="tutorial-guide-controls">${button(collapsed?'＋ Agrandir':'− Minimiser','tutorial-guide-toggle','small',`aria-label="${collapsed?'Agrandir':'Minimiser'} le guide" aria-expanded="${!collapsed}" aria-controls="tutorialDirections"`)}${button('Instructions','tutorial-help','small')}${button('Missions','tutorial-menu','small')}</div></div><div id="tutorialDirections" ${collapsed?'hidden':''}>${!finished?`<p class="tutorial-reminder">${esc(reminder)}</p>${o.unguided?'':`<ul class="tutorial-agent-plan" aria-label="Ordres à coordonner ce tour">${plan.map(({agent:a,order,status,text})=>`<li title="${esc(a.task?status:order?status:text)}"><strong>${esc(a.name)}</strong><span>${a.task?(a.task.queued?'✓ ':'↻ ')+esc(ACTIONS[a.task.type].name)+' · '+a.task.remaining+' t'+targetLabel(s,a.task):order?esc(ACTIONS[order.type].name)+targetLabel(s,order):'En attente'}</span></li>`).join('')}</ul>`}`:`<p>${esc(o.text)}</p><div class="tutorial-guide-outcome"><strong>${o.done?isNpcTutorial(s)?'Chapitre terminé':'Mission accomplie':'Mission à réessayer'}</strong>${o.done&&next?button('Mission suivante · '+next.number,'tutorial-start','primary small',`data-id="${next.id}"`):button(o.failed?'Réessayer cette mission':'Retour aux missions',o.failed?'tutorial-restart-confirm':'tutorial-menu','primary small')}${button('Rejouer','tutorial-restart','small')}</div>`}</div></section>`;
}
// Highlight existing controls only. This helper never issues an order or navigates.
export function markTutorialControls(root,s,{selectedCountry=null}={}){
 if(!isTutorial(s))return;
 root.querySelectorAll('.tutorial-target').forEach(el=>el.classList.remove('tutorial-target'));
 const objective=tutorialObjective(s);
 const free=(objective.unguided?[]:objective.orders).filter(o=>!s.agents.find(a=>a.id===o.agentId)?.task);
 const selectors=[];
 if(s.agents.some(a=>a.task))selectors.push('[data-cmd="advance"]');
 for(const o of free){
  selectors.push(`[data-cmd="map-agent"][data-id="${o.agentId}"]`);
  if(o.type==='travel'){selectors.push(`[data-cmd="map-country"][data-id="${o.target}"]`);if(selectedCountry===o.target)selectors.push('[data-cmd="deploy"]');}
  else if(['rest','fieldRest','findSafehouse','equip','hide','sneak','cyberSupport'].includes(o.type))selectors.push('[data-cmd="nav"][data-id="agents"]');
  else if(o.type==='protect')selectors.push('[data-cmd="country-threat"]','[data-cmd="nav"][data-id="threats"]');
  else {const target=o.type==='analyze'?s.proofs.find(p=>p.id===o.target)?.suspect:o.target;selectors.push(`[data-cmd="country-inquiry"][data-id="${s.suspects.some(t=>t.id===target)?target:'s0'}"]`,'[data-cmd="nav"][data-id="inquiry"]');}
 }
 if(objective.tech?.length)selectors.push('[data-cmd="nav"][data-id="operations"]',...objective.tech.map(t=>`[data-cmd="tech"][data-id="${t}"]`));
 if(['hostile','recovery'].includes(s.tutorial.mission))selectors.push('[data-cmd="nav"][data-id="government"]');
 for(const selector of selectors)root.querySelectorAll(selector).forEach(el=>{if(!el.disabled)el.classList.add('tutorial-target');});
 for(const el of root.querySelectorAll('[data-cmd="tech"],[data-cmd="recruit"],[data-cmd="hire"],[data-cmd="government-favor"]')){if(['recruit','hire'].includes(el.dataset.cmd)&&tutorialRecruitment(s)||el.dataset.cmd==='tech'&&tutorialTechAllowed(s,el.dataset.id)||el.dataset.cmd==='government-favor'&&tutorialGovernmentAllowed(s,el.dataset.id,root.querySelector('#governmentCountry')?.value))continue;el.disabled=true;el.title='Cette action sera disponible en campagne ; suivez l’objectif de formation.';}
 const advance=root.querySelector('[data-cmd="advance"]');if(advance){advance.disabled=!s.ended&&(objective.done||objective.failed||!tutorialCanWait(s)&&!s.agents.some(a=>a.task));}
}

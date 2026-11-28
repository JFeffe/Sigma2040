import {coopCellGoal,cellsDone} from './engine.js?v=247';
import {isNpcTutorial} from './tutorial-mode.js?v=247';
import {campaignRules} from './campaign-rules.js?v=247';
import {COUNTRY} from './data.js?v=247';
import {icon,button,esc,flag,formatScore} from './ui.js?v=247';
import {campaignSummary,prestigeChart,contributionBreakdown} from './campaign-stats.js?v=247';
import {clockMarkup} from './campaign-clock.js?v=247';
export function endingScreen(s,options={}){
 const win=s.ended==='victory';
 const factions=Object.values(s.factions).sort((a,b)=>b.score-a.score);
 const best=s.gameMode==='cooperative'?factions:factions.filter(f=>f.score===factions[0].score);
 const max=Math.max(1,...factions.map(f=>f.score));
 const title=win?'Fracture est démantelée.':'Le monde a basculé.';
 const verdict=s.gameMode==='cooperative'?'ÉQUIPES ALLIÉES':best.length>1?'VICTOIRE NATIONALE PARTAGÉE':'PAYS VAINQUEUR';
 const reason=win
  ?`L’Architecte est arrêté et au moins ${coopCellGoal(s)} cellules sont démantelées. Victoire collective.`
  :s.crisis>=100
   ?'Crise mondiale à 100 : défaite collective. Aucun pays vainqueur.'
   :`Le délai de ${campaignRules(s).maxTurns} tours est écoulé : défaite collective. Aucun pays vainqueur.`;
 const tutorial=isNpcTutorial(s),cells=cellsDone(s).length;
 const totalCells=new Set(s.suspects.filter(t=>t.cell!==3).map(t=>t.cell)).size;
 const scores=factions.map(f=>{
  const protection=contributionBreakdown(s,f.id),rank=1+factions.filter(other=>other.score>f.score).length;
  return `<article class="ending-score-row ${win&&best.includes(f)?'is-winner':''}">
   <span class="ending-rank">${rank}</span>${flag(f.id)}
   <div class="ending-country">
    <strong>${esc(COUNTRY[f.id].name)}${f.id===s.player?' <small>VOUS</small>':''}</strong>
    <span class="ending-protection-points">Protection : ${formatScore(protection.protection)} pts · ${protection.defended} attaque(s) déjouée(s)</span>
    <div class="ending-score-track" aria-hidden="true"><i style="--score-width:${Math.max(0,f.score/max*100)}%"></i></div>
   </div>
   <strong class="ending-score" aria-label="${formatScore(f.score)} points"><span data-ending-score="${f.score}" aria-hidden="true">${formatScore(f.score)}</span><small>PTS</small></strong>
  </article>`;
 }).join('');
 return `<main class="ending-page"><div class="ending-layout">
  ${tutorial?`<section class="tutorial-ending-summary">
   <strong>Chapitre ${s.tutorial.mission==='allies'?'13':s.tutorial.mission==='network'?'14':'15'} terminé · ${win?'Victoire collective':'Défaite collective'}</strong>
   <p>La formation valide votre parcours jusqu’au bilan, pas une victoire automatique. Comparez le prestige, les points de protection et les opérations ci-dessous.</p>
   <div>${s.tutorial.mission!=='command'?button('Chapitre suivant','tutorial-start','primary',`data-id="${s.tutorial.mission==='allies'?'network':'command'}"`):''}${button('Rejouer ce chapitre','tutorial-restart')}${button('Tous les chapitres','tutorial-menu')}</div>
  </section>`:''}
  <section class="ending-ceremony ${win?'is-victory':'is-defeat'}" aria-labelledby="ending-title">
   <header class="ending-verdict">
    <div class="ending-emblem" aria-hidden="true">${icon(win?'shield':'world')}</div>
    <div>
     <span class="eyebrow">SHADOW MANDATE 2040 · FIN DE CAMPAGNE · TOUR ${s.turn}</span>
     <p class="ending-outcome">${win?'VICTOIRE COLLECTIVE':'DÉFAITE COLLECTIVE'}</p>
     <h1 id="ending-title" tabindex="-1">${title}</h1>
     <p class="ending-reason">${reason}</p>
    </div>
    ${win?`<div class="ending-winners"><span>${verdict}</span><ul>${best.map(f=>`<li>${flag(f.id)} ${esc(COUNTRY[f.id].name)}</li>`).join('')}</ul></div>`:''}
   </header>
   <div class="ending-overview">
    ${clockMarkup(s)}
    <div><span>ARRESTATIONS</span><strong>${s.suspects.filter(t=>t.arrested).length} / ${s.suspects.length}</strong></div>
    <div><span>CELLULES DÉMANTELÉES</span><strong>${cells} / ${totalCells}</strong></div>
    <div><span>CRISE MONDIALE</span><strong>${s.crisis} / 100</strong></div>
   </div>
   <div class="ending-results">
    <section class="ending-ranking" aria-labelledby="ending-ranking-title">
     <h2 id="ending-ranking-title">Prestige final par pays</h2>${scores}
    </section>
    <div class="ending-progression">${prestigeChart(s,factions)}</div>
   </div>
   <div class="ending-actions">
    ${button('Menu principal','main-menu')}
    ${button('Derniers événements','reveal-replay')}
    ${button('Explorer le bilan','ending-report','primary')}
   </div>
  </section>
  <section aria-label="BILAN / ARCHIVES DE CAMPAGNE">
   <header class="campaign-panel-heading ending-header">
    <h2>${icon('file')} Bilan des opérations</h2>
    <div class="ending-actions">
     ${button('Archives · statistiques des agents','campaign-archives')}
     ${tutorial?button('Choisir un chapitre','tutorial-menu','primary'):button('Nouvelle campagne','new','primary')}
    </div>
   </header>
   <div id="campaign-report" tabindex="-1">${campaignSummary(s,options)}</div>
  </section>
 </div></main>`;
}
export function mountEnding(root,{reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false}={}){
 const counters=[...root.querySelectorAll('[data-ending-score]')];let frame=0,start=null;
 root.querySelector('#ending-title')?.focus({preventScroll:true});
 if(reducedMotion||globalThis.document?.documentElement.classList.contains('reduce-feedback'))return ()=>{};
 const tick=now=>{start??=now;const progress=Math.min(1,(now-start)/1800),eased=1-(1-progress)**3;for(const el of counters)el.textContent=formatScore(Number(el.dataset.endingScore)*eased);if(progress<1)frame=requestAnimationFrame(tick);};
 for(const el of counters)el.textContent='0';frame=requestAnimationFrame(tick);
 return ()=>cancelAnimationFrame(frame);
}

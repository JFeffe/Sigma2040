import {tutorialGuaranteed} from './tutorial-mode.js?v=245';
import {prestigeHint} from './prestige.js?v=245';
import {transmission} from './experience.js?v=245';
import {contributors} from './command-ui.js?v=245';
import * as E from './engine.js?v=245';
import {caseFor,proofTitle,OUTCOMES} from './intelligence.js?v=245';
import {incidentDescription} from './incident-rules.js?v=245';
import {COUNTRY,ACTIONS} from './data.js?v=245';
import {esc,button,flag,portrait,icon,formatScore} from './ui.js?v=245';
const delta=n=>(n>0?'+':'')+n;
const energyRecovery={rest:50,fieldRest:30,hide:10,heal:40};
const missionEnergyChange=(a,type,o)=>energyRecovery[type]?Math.min(a.fatigue,energyRecovery[type]):-o.fatigue*o.duration;
export function missionTimingMarkup(a,type,o,{showEnergy=true}={}){
 const energy=missionEnergyChange(a,type,o);
 const signed=energy<0?'−'+Math.abs(energy):delta(energy);
 return `<small class="mission-timing">${o.duration} ${o.duration===1?'tour':'tours'}${showEnergy?` · ${signed} énergie`:''}</small>`;
}
export function operationReadingsMarkup(s,type,candidate){
 if(!candidate)return '';
 const {a,o}=candidate,signed=n=>n<0?'−'+Math.abs(n):delta(n);
 const success=E.missionExposure(a,type,true),failure=E.missionExposure(a,type,false);
 const exposure=ACTIONS[type].safe||tutorialGuaranteed(s,a.faction)||success===failure?`<b>${signed(success)}</b>`:
  success===0?`<span class="on-failure"><b>${signed(failure)}</b> <small>en cas d’échec</small></span>`:
  `<span class="on-success">Réussite <b>${signed(success)}</b></span><span class="on-failure">Échec <b>${signed(failure)}</b></span>`;
 return `<div class="inquiry-costs" aria-label="Durée, énergie et exposition pour ${esc(a.name)}">
  <div><strong>${icon('clock')} Durée</strong>${missionTimingMarkup(a,type,o,{showEnergy:false})}</div>
  <div><strong>${icon('bolt')} Énergie</strong><b>${signed(missionEnergyChange(a,type,o))}</b></div>
  <div><strong>${icon('eye')} Exposition</strong><span class="inquiry-outcomes">${exposure}</span></div>
 </div>`;
}
const compactOutcomes={
 collect:'Une preuve brute est transmise au QG.',
 analyze:'La pièce choisie est vérifiée ou écartée si elle est fausse. +2 prestige par pièce et par pays.',
 surveil:'La position de la cible est confirmée. Sa durée dépend de la coopération et du relais satellite.',
 hack:'Une preuve brute si le dossier en compte moins de deux, +1 tour de hack et +1 point de Recherche.',
 drone:'Accès local ouvert. Les suspects présents sont localisés, sauf l’Architecte encore inconnu.',
 intimidate:'Une preuve brute et une position valide jusqu’à la fin du tour suivant la réussite.',
 arrest:'Cible arrêtée, crise −4 et +2 prestige pour le pays qui intervient.',
 protect:'Le pays est protégé au tour de résolution et pendant les trois tours suivants.',
 counter:'Recherche +2 et repérage pendant deux tours des agents adverses à 20 d’exposition ou plus.',
 cyberSupport:'Pendant les trois tours suivant la résolution, les nouveaux ordres de vos agents sur place gagnent +10 points de réussite.'
};
export function operationSuccessMarkup(type,id=''){
 return `<div class="operation-success"><strong>${icon('check')} En cas de réussite</strong><p${id?` id="${esc(id)}"`:''}>${esc(compactOutcomes[type]||OUTCOMES[type])}</p></div>`;
}
export function operationIncidentMarkup(s,type,candidate){
 if(!candidate||ACTIONS[type].safe||tutorialGuaranteed(s,candidate.a.faction))return '';
 const incident=incidentDescription(type,candidate.o.clandestine);
 return incident?`<p><strong>En cas d’échec</strong> — ${esc(incident)}</p>`:'';
}
export function missionBoostLabel(normal,reinforced,budget){
 const odds=normal?.boostGain?` · ${normal.chance} % → ${reinforced.chance} %`:'';
 return `<span class="mission-boost-copy"><strong>Renforcer l’opération</strong><small>${E.ECONOMY.boostCost} crédits${odds}</small></span><small class="mission-boost-balance${budget<E.ECONOMY.boostCost?' is-insufficient':''}"><span>Solde</span> <b>${budget}</b></small>`;
}
export function missionCostsMarkup(s,id,type,target){
 const a=s.agents.find(a=>a.id===id),o=E.options(s,id,type,target),d=ACTIONS[type];
 const recovery=energyRecovery[type]||0;
 const fatigue=recovery?`−${recovery} · récupération`:`+${o.fatigue*o.duration} au total${o.duration>1?` (${o.fatigue}/tour)`:''}`;
 const success=E.missionExposure(a,type,true),failure=E.missionExposure(a,type,false);
 const exposure=d.safe||tutorialGuaranteed(s,a.faction)?delta(success):success===failure?`${delta(success)} · réussite ou échec`:`${delta(success)} si réussite · +${failure} si échec`;
 const energy=missionEnergyChange(a,type,o);
 const exposureValue=d.safe||tutorialGuaranteed(s,a.faction)||success===failure?delta(success):`${delta(success)} / +${failure}`;
 return `<div class="briefing-metric metric-energy ${recovery?'recovery':''}" title="${esc('Fatigue : '+fatigue)}" aria-label="${esc('Énergie : '+(energy>0?'+':'')+energy+' au total')}"><span class="metric-symbol">${icon('bolt')}</span><div class="metric-value"><strong>${delta(energy)}</strong><small>énergie</small></div></div><div class="briefing-metric metric-exposure" title="${esc('Exposition : '+exposure)}" aria-label="${esc('Exposition : '+exposure)}"><span class="metric-symbol">${icon('eye')}</span><div class="metric-value"><strong>${esc(exposureValue)}</strong><small>${d.safe||tutorialGuaranteed(s,a.faction)?'exposition':success===failure?'exposition · tout résultat':`${icon('check')} réussite / ${icon('close')} échec`}</small></div></div>`;
}
export function forecastMarkup(s,id,type,target,outcomeId=''){const v=E.operationForecast(s,id,type,target);return `<section class="decision-box"><h3>À la résolution · fin du tour ${v.end}</h3><p${outcomeId?` id="${esc(outcomeId)}"`:''}>${esc(v.outcome)}</p>${prestigeHint(type)?`<p class="prestige-hint"><strong>Prestige</strong> — ${esc(prestigeHint(type))}</p>`:''}<p><strong>Risques</strong> — ${v.risk.split(/(?<=\.)\s+/u).map(sentence=>`<span>${esc(sentence)}</span>`).join(' ')} <span>Le coût engagé reste dépensé.</span></p>${v.warnings.map(w=>`<p class="decision-warning">${esc(w)}</p>`).join('')}<small>Chances fixées à l’affectation. Les prérequis peuvent évoluer pendant la mission.</small></section>`;}
export function caseBrief(s,t){const c=caseFor(s,t),f=s.factions[s.player],entries=f.evidence.filter(e=>s.proofs.find(p=>p.id===e.id)?.suspect===t.id),next=E.nextOperation(s,t),linked=t.deduced&&c.link&&f.known[c.link];return `<section class="decision-box case-brief"><h3>${c.title}</h3>${t.flightUntil&&!t.arrested?`<p class="decision-warning">Départ signalé à la fin du tour ${t.flightUntil}. Une arrestation résolue ce tour peut empêcher la fuite. Les preuves resteront acquises.</p>`:''}<p>${c.brief}</p><div class="analyst-conclusion"><strong>Conclusion des analystes</strong><p>${t.deduced?c.deduction:entries.some(e=>e.contested)?'Une falsification a été isolée. Seules les pièces recevables comptent ; une nouvelle collecte peut compléter le dossier.':entries.filter(e=>e.verified).length===1?'Une source est vérifiée. Vérifier une seconde pièce permettra de recouper les liens avec le réseau.':'Les pièces brutes doivent être examinées au QG avant de tirer une conclusion.'}</p>${linked?button('Dossier lié : '+s.suspects.find(x=>x.id===c.link).name,'suspect','small','data-id="'+c.link+'"'):''}</div>${entries.length?`<ul class="case-evidence">${entries.map(e=>{const p=s.proofs.find(p=>p.id===e.id);return `<li><strong>${esc(proofTitle(p))}</strong><span class="tag ${e.contested?'danger':e.verified?'good':''}">${e.contested?'ÉCARTÉE · FAUSSE':e.verified?'VÉRIFIÉE':E.analysisAgent(s,s.player,e.id)?'EN VÉRIFICATION':'EN ATTENTE AU QG'}</span></li>`;}).join('')}</ul>`:'<p class="muted">Aucune pièce recueillie dans ce dossier.</p>'}${contributors(s,t)}${t.tacticalArrestBonus?'<p class="notice">Planification tactique : +5 à la prochaine tentative d’arrestation de votre équipe.</p>':''}<p><strong>Recommandation</strong> — ${next.text}</p>${!t.arrested&&t.prepared&&t.locationUntil>=s.turn?'<p class="decision-warning">Intervenir consomme la fenêtre actuelle. Surveiller prolonge la position, mais laisse du temps aux autres puissances.</p>':''}</section>`;}
export function reportCards(s,turn=null,compact=false){
 const reports=(s.operationReports||[]).filter(r=>(turn===null||r.turn===turn)&&(r.faction?r.faction===s.player:s.agents.some(a=>a.faction===s.player&&(a.id===r.agentId||a.name===r.agent)))).slice(0,turn===null?8:undefined);
 return reports.length?`<div class="mission-reports${compact?' compact-mission-reports':''}">${reports.map(r=>{
  const agent=s.agents.find(a=>a.id===r.agentId)||s.agents.find(a=>a.name===r.agent);
  const tone=r.status==='RÉUSSITE'?'good':r.status==='INTERROMPUE'?'neutral':'danger',country=COUNTRY[r.country];
  const effects=[['Énergie',-r.fatigue,true],['Exposition',r.exposure,false],['Prestige',r.prestige,true],['Crise',r.crisis,false]].filter(([,v])=>Number.isFinite(v)&&v!==0);
  const duration=Number.isFinite(r.duration)?`${r.duration} ${r.duration===1?'tour':'tours'}`:'',
   cost=Number.isFinite(r.cost)?`${r.cost} ${r.cost===1?'crédit':'crédits'}`:'';
  const condition=({captured:'Agent capturé',dead:'Agent décédé',injured:'Agent blessé'})[r.condition];
  const quote=transmission(r);
  return `<article class="decision-box result-card ${tone}">
   <header>${agent&&!compact?portrait(agent):''}<div class="result-heading"><strong>${esc(r.agent)}</strong><span>${esc(ACTIONS[r.type]?.name||'')}</span>
    ${compact&&country?`<span class="debrief-location">${icon('world')} <span>${esc(country.name)}</span></span>`:''}${compact&&condition?`<span class="report-condition">${condition}</span>`:''}
    </div><span class="tag ${tone}">${esc(r.status)}</span></header>
   ${compact?'':`<small>Tour ${r.turn}${country?' · '+esc(country.city):''} · ${duration} · ${cost}</small>`}
   ${r.prestige?`<p class="prestige-gain">+${formatScore(r.prestige)} prestige</p>`:''}
   <details class="mission-detail${compact?' campaign-disclosure':''}"><summary>${compact?'Détails':'Voir les détails'}</summary>
    ${compact&&(duration||cost)?`<p class="report-order-meta">${[duration,cost].filter(Boolean).map(text=>`<span>${text}</span>`).join('')}</p>`:''}
    <div class="result-effects">${effects.map(([label,v,positive])=>`<span class="effect ${(v>0)===positive?'good':'danger'}"><strong>${delta(label==='Prestige'?formatScore(v):v)}</strong> ${label}</span>`).join('')||'<span class="effect neutral">Ressources inchangées</span>'}</div>
    ${!compact&&condition?`<p class="result-condition">${condition}</p>`:''}
    ${quote?`<blockquote class="agent-transmission"><span>TRANSMISSION · ${esc(r.agent)}</span><p>${esc(quote)}</p></blockquote>`:''}
    <div class="result-notes">${(r.notes||[]).map(n=>`<p>${esc(n)}</p>`).join('')}</div>
    ${r.next?`<p class="report-next"><strong>Suite conseillée</strong> <span>${esc(r.next)}</span></p>`:''}
    ${country?button('Voir le lieu','map-country','small',`data-id="${country.id}"`):''}
   </details>
  </article>`;
 }).join('')}</div>`:'';
}
export function cooperationPanel(s){return '';}

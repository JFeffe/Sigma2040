import {tutorialGuaranteed} from './tutorial-mode.js?v=242';
import {prestigeHint} from './prestige.js?v=242';
import {transmission} from './experience.js?v=242';
import {contributors} from './command-ui.js?v=242';
import * as E from './engine.js?v=242';
import {caseFor,proofTitle} from './intelligence.js?v=242';
import {COUNTRY,ACTIONS} from './data.js?v=242';
import {esc,button,flag,portrait,icon,formatScore} from './ui.js?v=242';
const delta=n=>(n>0?'+':'')+n;
const energyRecovery={rest:50,fieldRest:30,hide:10,heal:40};
const missionEnergyChange=(a,type,o)=>energyRecovery[type]?Math.min(a.fatigue,energyRecovery[type]):-o.fatigue*o.duration;
export function missionTimingMarkup(a,type,o,{showEnergy=true}={}){
 const energy=missionEnergyChange(a,type,o);
 const signed=energy<0?'−'+Math.abs(energy):delta(energy);
 return `<small class="mission-timing">${o.duration} ${o.duration===1?'tour':'tours'}${showEnergy?` · ${signed} énergie`:''}</small>`;
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

export function internationalActivity(s){const sightings=Object.values(s.factions[s.player].publicAgents).filter(a=>a.source!=='counter'||a.until>=s.turn).sort((a,b)=>b.turn-a.turn).slice(0,8);const entries=s.logs.filter(l=>!l.faction&&['success','info','score'].includes(l.type)).slice(0,6);return `<details class="campaign-disclosure cooperation-panel"><summary>Activité internationale · annonces et mouvements connus</summary>${sightings.length?`<h3>Dernières présences signalées</h3><p class="muted">Informations datées ; la position actuelle et les ordres restent inconnus.</p>${sightings.map(a=>`<p>${flag(a.faction)} ${esc(a.name)} · Équipe ${COUNTRY[a.faction].name} · Position : ${COUNTRY[a.country].name} · Observé T${a.turn}</p>`).join('')}`:''}${entries.length?entries.map(l=>`<p><strong>T${l.turn}</strong> · ${esc(l.text)}</p>`).join(''):'<p>Les annonces apparaîtront après les opérations des puissances.</p>'}</details>`;}

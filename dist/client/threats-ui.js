import {cellInfoBadge,captiveMarkup} from './cell-info.js?v=243';
import {attackDamage} from './engine.js?v=243';
import {activeAttackDelays,attackDelayNotice} from './attack-delay-ui.js?v=243';
import {threatCoverage,threatStatus,threatProtectionText} from './threat-status.js?v=243';
import {COUNTRY} from './data.js?v=243';
import {cityArt} from './visuals.js?v=243';
import {campaignHeading,esc,flag,button,icon} from './ui.js?v=243';
export function threatPanel(s){
 const status=threatStatus(s);
 const uncovered=new Set(status.uncovered.map(p=>p.id)),delays=activeAttackDelays(s);
 const totals=`<div class="threat-totals" aria-label="État des protections">
  <span class="campaign-status threat-total-open"><strong>${uncovered.size}</strong> <small>${uncovered.size===1?'Non couverte':'Non couvertes'}</small></span>
  <span class="campaign-status threat-total-covered"><strong>${status.covered}</strong> <small>${status.covered===1?'Couverte':'Couvertes'}</small></span>
 </div>`;
 const cards=status.plots.map(p=>{
  const c=COUNTRY[p.country],own=threatCoverage(s,p).covered,covered=!uncovered.has(p.id);
  const others=Object.values(s.factions).filter(f=>f.id!==s.player&&threatCoverage(s,p,f.id).covered);
  const protection=threatProtectionText(s,p),remaining=Math.max(0,p.turn-s.turn+1);
  const postponed=delays.filter(r=>r.plotId===p.id);
  const coverageLabel=own?'Protégée par votre pays':covered?'Couverte par une autre équipe':'Menace non couverte';
  return `<article class="campaign-card threat-record ${covered?'threat-covered':'threat-uncovered'} ${!covered&&p.turn===s.turn?'threat-imminent':''}">
   <div class="campaign-card-art threat-art">
    <div class="campaign-city-image" aria-hidden="true">${cityArt(p.country)}</div>
    <header class="campaign-place">${flag(p.country)} <div><h2>${esc(c.name)}</h2><span>${esc(c.city)}</span></div>
     ${button('Voir le pays','map-country','small threat-map-action',`data-id="${p.country}"`)}
    </header>
   </div>
   <div class="threat-record-body">
    <div class="threat-record-meta">${cellInfoBadge(s,p.cell)} <div class="threat-date"><strong>Attaque à la fin du tour ${p.turn}</strong><small>${remaining} tour${remaining>1?'s':''} pour agir</small></div></div>
    <div class="threat-impact"><h3>${esc(p.kind)}</h3>
     <p>Sans protection · +${attackDamage(s,p)} de crise</p>${s.cellVariantRules===1&&p.cell===4?'<small>Puis +3 par fin de tour tant que l’agent reste captif.</small>':''}
    </div>
    ${postponed.length||p.adapted?`<div class="threat-adapted">${postponed.length?'<span>Attaque reportée</span>':''}${p.adapted?'<span>Plan modifié par Fracture</span>':''}</div>`:''}
    <div class="threat-record-controls">
     <details class="campaign-disclosure threat-coverage">
      <summary>${coverageLabel}</summary>
      <p>${esc(protection.current)}</p>${protection.planned?`<p>${esc(protection.planned)}</p>`:''}
      <p class="threat-attack-coverage">${esc(protection.attack)}</p>
      ${postponed.map(attackDelayNotice).join('')}
      ${others.length?`<p class="other-coverage">${icon('shield')} Déjà couverte par ${others.map(f=>`${esc(COUNTRY[f.id].name)} · jusqu’à T${f.defense[p.country]}`).join(', ')}.</p>`:''}
     </details>
     ${!covered&&!s.ended?`<div class="threat-actions">${button(icon('shield')+' Préparer la protection','country-threat','primary small',`data-id="${esc(p.id)}"`)}</div>`:''}
    </div>
   </div>
  </article>`;
 }).join('');
 const captives=captiveMarkup(s);
 return `<section class="campaign-panel threat-overview" aria-labelledby="threatTitle">
  ${campaignHeading('threatTitle','shield','Menaces terroristes',totals)}
  <div class="campaign-grid threat-records">${cards||`<section class="campaign-card threat-empty">${icon('shield')}<div><h2>Aucune menace annoncée</h2><p>Les prochaines alertes apparaîtront ici dès leur détection.</p></div></section>`}</div>
  ${captives?`<div class="campaign-grid threat-captives">${captives}</div>`:''}
 </section>`;
}

import {activeAttackDelays,attackDelayNotice} from './attack-delay-ui.js?v=220';
import {threatCoverage,threatStatus,threatProtectionText} from './threat-status.js?v=220';
import {COUNTRY,CELLS,cellName} from './data.js?v=220';
import {heading,esc,flag,button,icon} from './ui.js?v=220';
export function threatPanel(s){
 const status=threatStatus(s);
 return `${heading('SURVEILLANCE / FRACTURE','Menaces terroristes','Vos protections sont comparées au lieu et au tour prévus de chaque attaque.',`<span class="objective-chip">${icon('shield')} ${status.uncovered.length} menace(s) · ${status.covered} couverte(s)</span>`)}<div class="threat-grid compact-threat-grid">${status.plots.map(p=>{
 const others=Object.values(s.factions).filter(f=>f.id!==s.player&&threatCoverage(s,p,f.id).covered);
 const protection=threatProtectionText(s,p);
 const remaining=Math.max(0,p.turn-s.turn+1),c=COUNTRY[p.country],coverage=threatCoverage(s,p);
 return `<article class="panel threat-card compact-threat-card ${coverage.covered||s.gameMode==='cooperative'&&others.length?'threat-covered':'threat-uncovered'}"><header>${flag(p.country)}<div><span class="eyebrow">${esc(cellName(p.cell))}</span><h2>${esc(c.name)}</h2><p>${esc(c.city)}</p></div><span class="threat-state">${icon(coverage.covered?'shield':'target')}</span></header>${activeAttackDelays(s).filter(r=>r.plotId===p.id).map(attackDelayNotice).join('')}<div class="threat-date"><strong>Attaque à la fin du tour ${p.turn}</strong><small>${remaining} tour${remaining>1?'s':''} pour agir</small></div><h3 title="${esc(p.kind)}">${esc(p.kind)}</h3><div class="threat-coverage"><strong class="${!coverage.covered&&others.length?'other-coverage':''}">${coverage.covered?'Protégée par votre pays':others.length?'Couverte par une autre équipe':'Menace non couverte'}</strong><p>${esc(protection.current)}</p>${protection.planned?`<p>${esc(protection.planned)}</p>`:''}<p class="threat-attack-coverage">${esc(protection.attack)}</p>${others.length?`<p class="other-coverage">${icon('shield')} Déjà couverte par ${others.map(f=>`${esc(COUNTRY[f.id].name)} · jusqu’à T${f.defense[p.country]}`).join(' ; ')}.</p>`:''}</div><footer>${p.adapted?'<small>Plan modifié par Fracture</small>':''}${button('Voir le pays','map-country','small','data-id="'+p.country+'"')}</footer></article>`;
 }).join('')||`<section class="panel empty-state">${icon('shield')}<h2>Aucune menace annoncée</h2><p>Les prochaines alertes apparaîtront ici dès leur détection.</p></section>`}</div>`;
}

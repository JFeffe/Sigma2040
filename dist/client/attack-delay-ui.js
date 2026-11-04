import {COUNTRY,cellName} from './data.js?v=218';
import {visiblePlots} from './engine.js?v=218';
import {esc,flag,button} from './ui.js?v=218';
export function activeAttackDelays(s){const visible=new Set(visiblePlots(s).map(p=>p.id));return (s.attackDelayReports||[]).filter(r=>visible.has(r.plotId)&&s.plots.some(p=>p.id===r.plotId&&!p.resolved&&!p.cancelled));}
export function attackDelayNotice(r){return `<div class="attack-delay-notice"><strong>${r.reason==='protection'?'ATTAQUE REPORTÉE PAR LA PROTECTION ACTIVE':'ATTAQUE REPORTÉE'}</strong><span>${flag(r.country)} ${esc(COUNTRY[r.country].name)} · ${esc(cellName(r.cell))}</span><b>Fin T${r.oldTurn} → fin T${r.attackTurn}</b><p>${r.reason==='relocation'?'Le pays ciblé a changé. La protection ne suit pas la menace.':'La menace reste active. Vérifiez la couverture à la nouvelle échéance.'}</p></div>`;}
export function attackDelayBanner(s){const reports=activeAttackDelays(s);return reports.length?`<section class="attack-delay-banner" role="status" aria-label="Attaques reportées">${reports.map(attackDelayNotice).join('')}${button('Vérifier les menaces','nav','small','data-id="threats"')}</section>`:'';}

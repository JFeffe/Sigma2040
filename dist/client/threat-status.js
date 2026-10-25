import {visiblePlots} from './engine.js?v=201';
export function threatCoverage(s,p,f=s.player){const until=s.factions[f]?.defense?.[p.country]||0;return {covered:until>=p.turn&&until>=s.turn,until};}
export function threatProtection(s,p,f=s.player){
 const current=threatCoverage(s,p,f),active=current.until>=s.turn;
 const planned=(s.agents||[]).filter(a=>a.faction===f&&a.country===p.country&&a.task?.type==='protect'&&!['dead','retired','captured'].includes(a.status)).map(a=>{const start=s.turn+a.task.remaining-1;return {agentId:a.id,agent:a.name,start,until:start+3,chance:a.task.chance,covers:start<=p.turn&&start+3>=p.turn};});
 return {...current,active,planned,projected:current.covered||planned.some(x=>x.covers)};
}
export function threatProtectionText(s,p,f=s.player){
 const c=threatProtection(s,p,f);
 return {current:c.active?`Votre région : protégée jusqu’à fin T${c.until} inclus.`:'Votre région : aucune protection active.',planned:c.planned.map(x=>`${x.agent} : protection prévue de T${x.start} à T${x.until}, si réussite (${x.chance} %).`).join(' '),attack:c.covered?`À l’attaque T${p.turn} : couverte par votre pays.`:c.projected?`À l’attaque T${p.turn} : couverture prévue si la mission réussit.`:`À l’attaque T${p.turn} : non couverte par votre pays.`};
}
export const coveringFactions=(s,p)=>Object.values(s.factions).filter(f=>threatCoverage(s,p,f.id).covered);
export function threatStatus(s,f=s.player){const plots=visiblePlots(s).slice().sort((a,b)=>a.turn-b.turn||a.id.localeCompare(b.id)),uncovered=plots.filter(p=>!threatCoverage(s,p,f).covered);return {plots,uncovered,covered:plots.length-uncovered.length,next:uncovered[0]||null};}

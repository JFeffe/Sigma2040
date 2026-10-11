import {visiblePlots} from './engine.js?v=188';
export function threatCoverage(s,p,f=s.player){const until=s.factions[f]?.defense?.[p.country]||0;return {covered:until>=p.turn&&until>=s.turn,until};}
export function threatStatus(s,f=s.player){const plots=visiblePlots(s).slice().sort((a,b)=>a.turn-b.turn||a.id.localeCompare(b.id)),uncovered=plots.filter(p=>!threatCoverage(s,p,f).covered);return {plots,uncovered,covered:plots.length-uncovered.length,next:uncovered[0]||null};}

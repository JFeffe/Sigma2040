import {COUNTRY} from './data.js?v=203';
import {cyberStatus,hasSafehouse} from './engine.js?v=203';
import {icon} from './ui.js?v=203';
export function countrySignals(s,id){const f=s.factions[s.player],protection=Math.max(0,...Object.values(s.factions).map(x=>x.defense[id]||0)),hack=cyberStatus(s,s.player,id);return [
 ['Accès','eye',!!f.access[id],''],['Mandat','seal',!!f.authorized[id],''],['Planque','moon',hasSafehouse(s,s.player,id),''],['Hack','terminal',hack.active,hack.active?' · '+hack.remaining+' tour(s)':''],['Protection','shield',protection>=s.turn,protection>=s.turn?' · '+(protection-s.turn+1)+' tour(s) · fin T'+protection+' incluse':'']
 ].filter(([name])=>!COUNTRY[id].power||name==='Protection').map(([name,glyph,active,suffix])=>`<span class="${name==='Protection'?'protection-status ':''}${active?'is-active':'is-inactive'}" title="${name} : ${active?'actif':'inactif'}${suffix}">${icon(glyph)} ${name}${suffix} <b>${active?'✓':'—'}</b></span>`).join('');}

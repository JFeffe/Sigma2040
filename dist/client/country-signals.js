import {COUNTRY} from './data.js?v=219';
import {cyberStatus,hasSafehouse} from './engine.js?v=219';
import {icon} from './ui.js?v=219';
export function countrySignals(s,id,compact=false){const f=s.factions[s.player],protection=Math.max(0,...Object.values(s.factions).map(x=>x.defense[id]||0)),hack=cyberStatus(s,s.player,id);return [
 ['Accès','eye',!!f.access[id],''],['Mandat','seal',!!f.authorized[id],''],['Planque','moon',hasSafehouse(s,s.player,id),''],['Hack','terminal',hack.active,hack.active?' · '+hack.remaining+' tour(s)':''],['Protection','shield',protection>=s.turn,protection>=s.turn?' · '+(protection-s.turn+1)+' tour(s) · fin T'+protection+' incluse':'']
 ].filter(([name])=>!COUNTRY[id].power||name==='Protection').map(([name,glyph,active,suffix])=>`<span class="${compact?'compact-country-signal ':''}${name==='Protection'?'protection-status ':''}${active?'is-active':'is-inactive'}" title="${name} : ${active?'actif':'inactif'}${suffix}">${icon(glyph)} ${name}${compact?'':suffix} <b>${active?'✓':'—'}</b></span>`).join('');}

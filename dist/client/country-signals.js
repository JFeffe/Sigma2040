import {COUNTRY} from './data.js?v=237';
import {cyberStatus,hasSafehouse} from './engine.js?v=237';
import {COOPERATION,cooperationTable} from './cooperation.js?v=237';
import {cityArt} from './visuals.js?v=237';
import {icon} from './ui.js?v=237';
export function countrySignals(s,id,compact=false){const f=s.factions[s.player],protection=Math.max(0,...Object.values(s.factions).map(x=>x.defense[id]||0)),hack=cyberStatus(s,s.player,id);return [
 ['Accès','eye',!!f.access[id],''],['Mandat','seal',!!f.authorized[id],''],['Planque','moon',hasSafehouse(s,s.player,id),''],['Hack','terminal',hack.active,hack.active?' · '+hack.remaining+' tour(s)':''],['Protection','shield',protection>=s.turn,protection>=s.turn?' · '+(protection-s.turn+1)+' tour(s) · fin T'+protection+' incluse':'']
 ].filter(([name])=>!COUNTRY[id].power||name==='Protection').map(([name,glyph,active,suffix])=>`<span class="${compact?'compact-country-signal ':''}${name==='Protection'?'protection-status ':''}${active?'is-active':'is-inactive'}" title="${name} : ${active?'actif':'inactif'}${suffix}">${icon(glyph)} ${name}${compact?'':suffix} <b>${active?'✓':'—'}</b></span>`).join('');}

export function countryArtHeader(s,id){
 const {power}=COUNTRY[id],signals=power&&id!==s.player?'':countrySignals(s,id,true);
 const level=s.factions[s.player].cooperation[id],current=COOPERATION[level];
 const cooperation=!power&&current?`<span class="compact-country-signal country-cooperation" tabindex="0" data-rich-tooltip aria-label="Coopération : ${current.name}">${icon('seal')} ${current.name}<template><div class="cooperation-tooltip"><strong>Coopération des autorités · ${current.name}</strong>${cooperationTable(level)}<p>Bonus et malus en points de réussite. La durée de position correspond à l’action Localiser une cible, après sa résolution.</p></div></template></span>`:'';
 return `<div class="country-art-header ${power?'is-power':'is-secondary'}">${cityArt(id,power?'power-sidebar-art':'country-compact-art')}${signals?`<div class="compact-country-signals">${signals}${cooperation}</div>`:''}</div>`;
}

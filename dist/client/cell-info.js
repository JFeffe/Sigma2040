import {CELL_RULES,cellKnown,activeCaptives} from './cell-variants.js?v=229';
import {cellName,COUNTRY} from './data.js?v=229';
import {esc,button,flag} from './ui.js?v=229';
export function cellInfoButton(s,cell){return button(cellKnown(s,cell)?esc(cellName(cell))+' ⓘ':'Cellule inconnue','cell-info','small',`data-id="${cell}" ${cellKnown(s,cell)?'':'disabled'}`);}
export function cellInfoMarkup(s,cell){
 if(!cellKnown(s,cell))return '<div class="simple-modal"><h2>Cellule inconnue</h2><p>Découvrez un dossier ou une menace pour identifier cette cellule.</p></div>';
 const r=s.cellVariantRules===1?CELL_RULES[cell]:null;
 return `<div class="simple-modal"><h2>${esc(cellName(cell))}</h2>${r?`<p>${esc(r.theme)}</p><p><strong>${r.count} attaques · +${r.damage} crise par attaque non protégée.</strong></p><p>${esc(r.effect)}</p>`:'<p>Deux arrestations démantèlent une cellule et annulent ses attaques restantes.</p>'}${button('Fermer','close')}</div>`;
}
export function captiveMarkup(s,country=null){return activeCaptives(s).filter(c=>!country||c.country===country).map(c=>`<article class="panel captive-card"><strong>${flag(c.country)} ${esc(c.name)} · ${esc(COUNTRY[c.country].name)}</strong><p>Captif · +3 crise à chaque fin de tour. Libération : −10 crise et +2 prestige.</p>${button('Extraire un agent','rescue-captive','small',`data-id="${c.id}"`)} ${button('Voir le pays','map-country','small',`data-id="${c.country}"`)}</article>`).join('');}

import {CELL_RULES,cellKnown,activeCaptives} from './cell-variants.js?v=247';
import {cellName,COUNTRY} from './data.js?v=247';
import {esc,button,flag} from './ui.js?v=247';
export function cellInfoBadge(s,cell){
 const known=cellKnown(s,cell),name=known?cellName(cell):'Cellule inconnue';
 const rules=known&&s.cellVariantRules===1?CELL_RULES[cell]:null;
 const description=rules?`<p>${esc(rules.theme)}</p><p><b>${rules.count} attaques · +${rules.damage} crise par attaque non protégée.</b></p><p>${esc(rules.effect)}</p>`
  :known?'<p>Deux arrestations démantèlent une cellule et annulent ses attaques restantes.</p>'
  :'<p>Découvrez un dossier ou une menace pour identifier cette cellule.</p>';
 return `<span class="cell-info" tabindex="0" data-rich-tooltip>
  <span>${esc(name)}</span><span class="cell-info-symbol" aria-hidden="true">ⓘ</span>
  <template><div class="cell-tooltip-copy"><strong>${esc(name)}</strong>${description}</div></template>
 </span>`;
}
export function captiveMarkup(s,country=null){return activeCaptives(s).filter(c=>!country||c.country===country).map(c=>`<article class="panel captive-card"><strong>${flag(c.country)} ${esc(c.name)} · ${esc(COUNTRY[c.country].name)}</strong><p>Captif · +3 crise à chaque fin de tour. Libération : −10 crise et +2 prestige.</p>${button('Extraire un agent','rescue-captive','small',`data-id="${c.id}"`)} ${button('Voir le pays','map-country','small',`data-id="${c.country}"`)}</article>`).join('');}

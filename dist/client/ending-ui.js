import {campaignRules} from './campaign-rules.js?v=191';
import {COUNTRY} from './data.js?v=191';
import {icon,button,esc} from './ui.js?v=191';
import {campaignSummary} from './campaign-stats.js?v=191';
import {clockMarkup} from './campaign-clock.js?v=191';
export function endingScreen(s,options={}){const win=s.ended==='victory',factions=Object.values(s.factions).sort((a,b)=>b.score-a.score),best=factions.filter(f=>f.score===factions[0].score),cells=[0,1,2].filter(cell=>s.suspects.filter(t=>t.cell===cell).every(t=>t.arrested)).length;
 return `<main class="ending-page"><header class="ending-header"><div><span class="eyebrow">BILAN / TOUR ${s.turn}</span><h1>${win?'Fracture est démantelée.':'Fracture a pris l’avantage.'}</h1><p>${win?'Victoire collective. '+(best.length>1?'Victoire nationale partagée : ':'Pays vainqueur : ')+best.map(f=>COUNTRY[f.id].name).join(', ')+'.':s.crisis>=100?'Crise mondiale à 100 : défaite collective.':`Le délai de ${campaignRules(s).maxTurns} tours est écoulé : défaite collective.`}</p></div><div class="ending-actions">${button('Archives','nav','','data-id="journal"')}${button('Nouvelle campagne','new','primary')}${button('Menu','main-menu')}</div></header><div class="ending-overview">${clockMarkup(s)}<div><span>ARRESTATIONS</span><strong>${s.suspects.filter(t=>t.arrested).length} / 7</strong></div><div><span>CELLULES DÉMANTELÉES</span><strong>${cells} / 3</strong></div><div><span>CRISE MONDIALE</span><strong>${s.crisis} / 100</strong></div></div><div id="campaign-report">${campaignSummary(s,options)}</div></main>`;
}

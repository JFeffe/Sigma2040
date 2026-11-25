import {visiblePlots,visibleLogs} from './engine.js?v=246';
import {COUNTRY} from './data.js?v=246';
import {formatText,translateText} from './localization.js?v=246';
import {esc} from './ui.js?v=246';

function alertItem(plot,turn){
 const turns=Math.max(0,plot.turn-turn+1);
 const badge=translateText('ALERTE')+' · '+translateText(COUNTRY[plot.country].name);
 const deadline=formatText('attaque à la fin du tour {0}',plot.turn);
 const countdown=formatText(turns===1?'{0} tour pour agir':'{0} tours pour agir',turns);
 const text=[translateText(plot.kind),deadline,countdown,plot.adapted?translateText('Plan modifié'):''].filter(Boolean).join(' · ');
 return `<button class="news-item news-alert" data-cmd="nav" data-id="threats"><b>${esc(badge)}</b> ${esc(text)}</button>`;
}

export function newsTicker(s){
 const alerts=visiblePlots(s).map(p=>alertItem(p,s.turn));
 const logs=visibleLogs(s).slice(0,10).map(l=>`<button class="news-item ${l.type==='score'?'news-score':''}" data-cmd="nav" data-id="journal"><b>T${l.turn}</b> ${esc(l.text)}</button>`);
 const items=[...alerts,...logs];
 if(!items.length)items.push('<span class="news-item">Aucune alerte. Surveillance du réseau en cours.</span>');
 const content=items.join(''),duration=Math.max(35,content.replace(/<[^>]*>/g,'').length/9);
 return `<section class="news-ticker" aria-label="Bulletin de renseignements et alertes"><span class="news-brand"><b>Info</b></span><div class="news-window" tabindex="0" aria-label="Actualités défilantes. Survoler ou sélectionner pour suspendre."><div class="news-track" style="--news-duration:${duration}s"><div class="news-group">${content}</div><div class="news-group" aria-hidden="true" inert>${content}</div></div></div><button class="news-journal" data-cmd="nav" data-id="journal" title="Lire toutes les actualités">Journal</button></section>`;
}


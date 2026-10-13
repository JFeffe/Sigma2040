import {bureauEnabled} from './mod-settings.js?v=193';
import {inquiryIndicator} from './inquiry-notifications.js?v=193';
import {threatStatus} from './threat-status.js?v=193';
import {campaignRules} from './campaign-rules.js?v=193';
import {clockMarkup} from './campaign-clock.js?v=193';
import {newsTicker} from './news.js?v=193';
import {funding,getTechSlots,governmentOptions,visiblePlots} from './engine.js?v=193';
import {COUNTRY,COUNTRIES} from './data.js?v=193';
import {icon,button,flag,brand,formatScore,esc} from './ui.js?v=193';
export function navigationAvailability(state,unreadInquiry=false,dismissed={}){
 if(state.ended)return {};
 const count=threatStatus(state).uncovered.length;
 const free=Math.max(0,2-getTechSlots(state,state.player));
 const government=!governmentOptions(state,'funding').error||!governmentOptions(state,'medical').error||COUNTRIES.some(c=>!c.power&&!governmentOptions(state,'diplomacy',c.id).error);
 const alerts={inquiry:inquiryIndicator(state,unreadInquiry),threats:count?{badge:String(count),label:`${count} menace${count>1?'s':''} non couverte${count>1?'s':''} par votre pays`,tone:'threats'}:null,operations:free?{badge:String(free),label:`${free} emplacement${free>1?'s':''} de module disponible${free>1?'s':''}`,tone:'modules'}:null,government:government?{badge:'!',label:'Au moins une faveur gouvernementale disponible',tone:'favors'}:null};
 for(const id of Object.keys(alerts))if(dismissed[id]){if(id==='threats'&&alerts[id])alerts[id]={...alerts[id],quiet:true};else alerts[id]=null;};return alerts;
}
export function gameShell(state,view,content,saveWarning,background='',unreadInquiry=false,dismissed={}){
 const danger=crisisAlert(state);
 const availability=navigationAvailability(state,unreadInquiry,dismissed),f=state.factions[state.player],tabs=[['world','world','Monde'],...(bureauEnabled()?[['bureau','file','Bureau des enquêtes']]:[]),['inquiry','file','Enquête'],['operations','module','Module'],['threats','shield','Menaces'],['government','shield','Gouvernement'],['diplomacy','seal','Diplomatie'],['agents','people','Agents'],['journal','clock','Journal']];
 return `<div class="command-deck obsidian-deck immersive-deck ${danger?'crisis-emergency':''} ${view==='world'?'world-active':'menu-active'}">${background?`<div class="world-backdrop">${background}</div>`:''}
  <header class="deck-header">
   <div class="deck-brand">${brand()}<span class="division-flag" title="${COUNTRY[state.player].name}">${flag(state.player)}</span></div>
   <div class="deck-status" aria-label="Situation de la campagne">
    <div class="resource" data-resource="budget"><span>BUDGET · +${funding(f).income}/TOUR</span><strong>${f.budget}<small> crédits</small></strong></div>
    <button class="resource government-button" data-resource="confidence" data-cmd="nav" data-id="government" title="Confiance du gouvernement"><span>CONFIANCE</span><strong>${f.confidence}<small>/100</small></strong></button>
    <div class="resource prestige-resource" data-resource="score"><span>PRESTIGE</span><strong>${formatScore(f.score)}<small> pts</small></strong></div>
    <div class="crisis-block ${danger?'crisis-critical':''}" data-resource="crisis"><span>CRISE MONDIALE · +${campaignRules(state).crisisPerTurn}/TOUR <strong>${state.crisis}%</strong></span><i><b style="width:${state.crisis}%"></b></i></div>
    <div class="turn-block"><span>TOUR</span><strong>${String(state.turn).padStart(2,'0')}<small> / ${campaignRules(state).maxTurns}</small></strong></div>
   </div>
   ${clockMarkup(state)}<div class="deck-system">${button(state.ended?'Voir le bilan':state.event?'Communication':`Terminer le tour ${icon('arrow')}`,'advance','primary')}${button(icon('help'),'open-wiki','system-button','aria-label="Wiki opérationnel" title="Wiki opérationnel · Ctrl + Espace"')}${button(icon('settings'),'settings','system-button','aria-label="Paramètres" title="Paramètres"')}${button('Menu','main-menu','new-game-button','aria-label="Menu principal"')}</div>
   ${newsTicker(state)}${danger?`<section class="crisis-alert" role="alert"><span>${icon('shield')} <strong>ALERTE ROUGE · ${state.crisis} %</strong><span>${danger}</span></span>${button('Voir les menaces','nav','small','data-id="threats"')}</section>`:''}
  </header>
  <div class="deck-workspace">
   <nav class="deck-nav" aria-label="Sections du jeu">${tabs.map(([id,ico,name])=>`<button class="deck-tab ${view===id?'active':''} ${availability[id]&&!availability[id].quiet?'nav-available nav-'+availability[id].tone:''}" ${availability[id]?`title="${esc(availability[id].label)}" aria-label="${esc(name+' · '+availability[id].label)}"`:''} data-cmd="${id==='bureau'?'bureau':'nav'}" data-id="${id}" ${view===id?'aria-current="page"':''}>${availability[id]?`<b class="nav-availability-badge" aria-hidden="true">${availability[id].badge}</b>`:''}${icon(ico)}<span>${id==='bureau'?'Bureau des<br>enquêtes':name}${id==='diplomacy'&&!dismissed.diplomacy&&(state.requests||[]).some(r=>r.status==='pending')?' · '+state.requests.filter(r=>r.status==='pending').length:''}</span></button>`).join('')}</nav>
   <div class="deck-content">
    ${state.event?`<div class="pending-communication"><span>${icon('people')}<strong>Communication en attente</strong><span>${esc(state.event.title)}</span></span>${button('Reprendre la communication','communication','primary small')}</div>`:''}
    <main class="deck-main view-${view}">
     ${state.ended?`<div class="campaign-banner ${state.ended}">${icon(state.ended==='victory'?'seal':'shield')} Campagne terminée · ${state.ended==='victory'?'Victoire collective':'Fracture l’emporte'} ${button('Consulter le bilan','ending','small')}</div>`:''}
     ${saveWarning?'<div class="notice warning">Sauvegarde locale indisponible. Exportez votre campagne dans Règles & sauvegarde.</div>':''}
     ${view==='agents'?`<div class="personnel-toolbar">${button(icon('close')+' Retour à la carte','nav','overlay-return','data-id="world"')}</div>`:view!=='world'?button(icon('close')+' Retour à la carte','nav','overlay-return','data-id="world"'):''}${content}
    </main>
   </div>
  </div>
  <footer><span>${icon('lock')} ${saveWarning?'SAUVEGARDE INDISPONIBLE':'CANAL SÉCURISÉ · SAUVEGARDE LOCALE'}</span><span>DIVISION ${state.player} / ${state.agents.filter(a=>a.faction===state.player&&a.status==='dead').length} PERTE(S)</span><span>SIGMA NETWORK / 2040</span></footer>
 </div>`;
}

export function crisisAlert(s){if(s.ended)return '';const passive=campaignRules(s).crisisPerTurn,uncovered=visiblePlots(s).filter(p=>p.turn===s.turn&&!Object.values(s.factions).some(f=>(f.defense[p.country]||0)>=p.turn));if(s.crisis+passive+uncovered.length*30>=100)return 'Défaite possible à cette fin de tour. Interceptez les attaques ou réduisez la crise par une arrestation.';if(s.crisis>=80)return 'La crise approche de 100 %. Protégez les pays menacés et accélérez les arrestations.';return '';}

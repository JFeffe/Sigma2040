import * as E from './engine.js?v=245';
import {COUNTRY,TECH} from './data.js?v=245';
import {icon,button,esc,portrait,campaignHeading} from './ui.js?v=245';
let selected=null,scope='';
export function selectTechnology(type){selected=['ai','guard','drone'].includes(type)?type:null;}
const modules={...TECH,protect:{name:'Protection d’infrastructure',icon:'shield',duration:2},drone:{name:'Reconnaissance par drone',icon:'drone',duration:1}};
const ticks=(left,total)=>`<div class="console-ticks" aria-label="${left} tour(s) restant(s)">${Array.from({length:Math.min(6,total)},(_,i)=>`<span class="${i<left?'remaining':''}"></span>`).join('')}</div>`;
function moduleSlot(s,occupant,index){
 const heading=`<span>${icon('module')} <span>Emplacement ${index+1}</span></span>`;
 if(!occupant)return `<article class="console-slot free" data-tech-drop>
  <div class="console-slot-heading">${heading}<strong>${icon('plus')} Disponible</strong></div>
 </article>`;
 const {a,kind}=occupant,t=a?.task||occupant.t,d=modules[kind];
 const remaining=a?t.remaining:t.until-s.turn+1,until=a?s.turn+remaining-1:t.until;
 const status=a?t.queued?'Réservé':'En mission':kind==='guard'?'Protection active':'Module actif';
 return `<article class="console-slot occupied">
  <div class="console-slot-heading">${heading}<strong>${status}</strong></div>
  <div class="console-slot-main">
   <div class="console-occupant">${a?portrait(a):''}<div>
    <h2 class="module-occupant-name">${icon(d.icon)} ${d.name}</h2>
    <p>${a?`<b>${esc(a.name)}</b> · ${COUNTRY[a.country].name}`:kind==='guard'?COUNTRY[t.country].name:'Toute votre équipe'}</p>
   </div></div>
   <div class="console-actions">${a?button('Voir la mission','agent','small',`data-id="${a.id}"`):''}${button('Annuler',a?'cancel':'cancel-tech','small',`data-id="${a?a.id:t.id}" ${s.ended?'disabled':''}`)}</div>
  </div>
  <div class="console-slot-duration">
   <b>${remaining} ${remaining===1?'tour restant':'tours restants'}</b><small>Libre après T${until} inclus</small>
   ${ticks(remaining,a?t.total:d.duration)}
  </div>
 </article>`;
}

export function technologyPanel(s){
 const key=`${s.seed}:${s.player}`;if(scope!==key){scope=key;selected=null;}
 const f=s.factions[s.player],missions=E.team(s).filter(a=>E.requiresModule(a.task?.type,a));
 const supports=f.tech.filter(t=>t.until>=s.turn),used=E.getTechSlots(s,s.player);
 const occupants=[...missions.map(a=>({kind:a.task.type,a})),...supports.map(t=>({kind:t.type,t}))];
 const slots=Array.from({length:Math.max(2,occupants.length)},(_,i)=>moduleSlot(s,occupants[i],i)).join('');
 const cards=['ai','relay','logistics'].map(id=>{
  const d=TECH[id],error=s.ended?'Campagne terminée.':used>=2?'Les deux places sont occupées.':supports.some(t=>t.type===id)?'Ce module est déjà actif.':f.budget<d.cost?'Crédits insuffisants.':'';
  return `<article class="console-tech-card campaign-card module-card" data-tech-drag="${id}" draggable="${!error}">
   <div class="campaign-card-art">
    <img src="./assets/missions/${d.art}.webp" alt="" loading="lazy">
    <h2>${icon(d.icon)} <span>${d.name}</span></h2>
   </div>
   <div class="module-card-body">
    <p class="console-effect">${d.effect}</p>
    <div class="module-meta"><span>${icon('clock')} ${d.duration} tours</span><span>${icon('module')} <span>1 emplacement</span></span></div>
    <details class="campaign-disclosure module-details"><summary>Effets du module</summary><p>${d.desc}</p></details>
    <div class="module-activation">${button('Activer · '+d.cost+' crédits','tech','primary',`data-id="${id}" ${error?'disabled':''} ${!s.ended&&used>=2?'aria-describedby="moduleCapacity"':error?`aria-describedby="module-${id}-status"`:''}`)}
     ${error&&(s.ended||used<2)?`<p class="console-warning" id="module-${id}-status" role="status">${error}</p>`:''}
    </div>
   </div>
  </article>`;
 }).join('');
 const room=Math.max(0,2-used);
 const capacity=`<span id="moduleCapacity" class="console-capacity ${room?'is-available':'is-full'}" role="status" aria-label="Capacité des Modules : ${used} / 2">${room?`${room} place${room===1?'':'s'} disponible${room===1?'':'s'}.`:'Les deux places sont occupées.'}</span>`;
 return `<section class="campaign-panel technology-hub operation-console${occupants.length?' has-occupied-slots':''}" aria-labelledby="moduleTitle">
  ${campaignHeading('moduleTitle','module','Modules d’opération',capacity)}
  <div class="console-slots">${slots}</div>
  <div class="campaign-grid module-catalog">${cards}</div>
 </section>`;
}

export function technologyCancellationMarkup(s,t){
 const affected=E.logisticsCancellationAgents(s,t),sameTurn=(t.activatedTurn??t.until-TECH[t.type].duration+1)===s.turn;
 const effect=t.type==='logistics'?`${affected.length?`<p>La désactivation annulera le voyage accéléré de ${affected.length} agent(s) :</p><ul class="cancel-travel-list">${affected.map(a=>`<li><strong>${esc(a.name)}</strong> · ${esc(COUNTRY[a.task.origin].name)} → ${esc(COUNTRY[a.task.target].name)}</li>`).join('')}</ul><p>Ces agents resteront dans leur pays de départ et seront disponibles pour un nouvel ordre.</p>`:'<p>Aucun voyage planifié ne dépend de ce module.</p>'}<p>Les nouveaux voyages ne recevront plus le bonus. Un voyage accéléré encore en cours retrouve sa durée normale.</p>`:t.type==='relay'?'<p>Les prolongations de position accordées par ce relais seront retirées. Localiser une cible reste une action de 1 tour.</p>':t.type==='guard'?'<p>La protection de cette sentinelle sera retirée. Les autres sources de protection resteront actives.</p>':'<p>Le bonus IA sera retiré des vérifications encore en cours, qui continueront sans ce bonus. La recherche non encore résolue est annulée.</p>';
 return `<div class="simple-modal"><span class="eyebrow">ANNULER LE MODULE</span><h2>Arrêter ${esc(TECH[t.type].name)} ?</h2>${effect}<p><b>${E.techRefund(s,t)} crédit(s) seront remboursés.</b> ${sameTurn?'Annulation le tour d’activation.':'Le tour d’activation est passé.'} Le module sera immédiatement libéré.</p><div class="suspect-actions">${button('Conserver le module','close')}${button(affected.length?'Confirmer et annuler les voyages':'Arrêter le module','confirm-cancel-tech','primary','data-id="'+esc(t.id)+'"')}</div></div>`;
}

import * as E from './engine.js?v=193';
import {esc,icon,button} from './ui.js?v=193';
export const INVESTIGATION_STEPS=[
 {id:'access',short:'Accès local',label:'Établir un accès local',actions:['contacts','influence','drone']},
 {id:'proofs',short:'2 preuves',label:'Recueillir deux preuves',actions:['collect','intimidate','hack']},
 {id:'validation',short:'Validation',label:'Valider une preuve',actions:['analyze']},
 {id:'intervention',short:'Intervention',label:'Préparer l’intervention',actions:['prepare','surveil','intimidate','drone','authorize']},
 {id:'arrest',short:'Arrestation',label:'Procéder à l’arrestation',actions:['arrest']}
];
export const INTERVENTION_ACTIONS={prepare:['prepare'],locate:['surveil','intimidate','drone'],mandate:['authorize']};
export function investigationSteps(s,t){
 const f=s.factions[s.player],e=E.evidenceFor(s,s.player,t.id),verified=e.filter(p=>p.verified).length,closed=!!t.arrested,access=!!f.access[t.country],located=t.locationUntil>=s.turn,proofs=e.length,ready=proofs>=2&&verified>=1;
 const unfinished=E.evidenceQueue(s,s.player).filter(p=>s.proofs.find(x=>x.id===p.id)?.suspect===t.id);
 const done=[access,proofs>=2,verified>=1,!!t.prepared&&located,closed];
 const available=[!closed&&t.country!==s.player,!closed&&(access||!t.intimidated),!closed&&unfinished.length>0,!closed,!closed&&ready&&t.prepared&&located];
 const details=[access?'Accès ouvert pour le pays':'Contact, chantage ou drone',`${proofs}/2 preuves recevables`,`${verified} vérifiée(s) · ${unfinished.length} à vérifier`,`${t.prepared?'Préparée':'À préparer'} · ${located?'localisée':'à localiser'}`,closed?'Cible en détention':'Intervention finale'];
 const steps=INVESTIGATION_STEPS.map((x,i)=>({...x,done:closed||done[i],available:available[i],detail:closed?'Terminé':details[i]}));
 const next=steps.findIndex(x=>!x.done);
 return {steps,next,done:steps.filter(x=>x.done).length,label:closed?'Affaire résolue':'Prochaine étape : '+steps[next].label.toLowerCase(),proofs,verified,unfinished,access,ready,located,mandate:!!f.authorized[t.country],prepared:!!t.prepared};
}
export function stepForAction(type,current=null){return INVESTIGATION_STEPS.find(x=>x.id===current&&x.actions.includes(type))?.id||INVESTIGATION_STEPS.find(x=>x.actions.includes(type))?.id||'access';}
export function interventionForAction(type){return type==='authorize'?'mandate':type==='prepare'?'prepare':'locate';}
export function interventionMarkup(s,t,interactive=false,selected='prepare'){
 const p=investigationSteps(s,t);
 return `<div class="case-parallel">${[
  ['prepare','Préparer une arrestation',p.prepared,p.ready,p.prepared?'Préparation terminée':'Deux preuves, dont une vérifiée'],
  ['locate','Localiser la cible',p.located,true,p.located?'Valide jusqu’à fin T'+t.locationUntil:'Position à actualiser'],
  ['mandate','Obtenir un mandat',p.mandate,t.country!==s.player,'Optionnel · une fois par pays']
 ].map(([id,label,done,available,detail])=>{const cls=`case-parallel-task ${id==='mandate'?'optional':''} ${done||t.arrested?'complete':available?'available':'pending'}`;const content=`<strong>${done||t.arrested?icon('check'):icon(id==='mandate'?'seal':id==='locate'?'eye':'target')}${label}</strong><small>${esc(detail)}</small>`;return interactive?button(content,'inquiry-substep',cls,`data-id="${id}" aria-pressed="${selected===id}"`):`<div class="${cls}">${content}</div>`;}).join('')}</div>`;
}
export function investigationProgressMarkup(s,t){const p=investigationSteps(s,t);return `<div class="case-progress investigation-progress"><div class="case-progress-heading"><strong>${p.done}/5 étapes</strong><span>${t.arrested?'DOSSIER CLOS':'ENQUÊTE EN COURS'}</span></div><ol class="case-steps investigation-steps">${p.steps.map((x,i)=>`<li class="${x.done?'complete':i===p.next?'current':x.available?'available':'pending'}" ${i===p.next?'aria-current="step"':''}><span class="step-number">${x.done?icon('check'):i+1}</span><span class="case-step-copy"><strong>${x.label}</strong>${x.id==='intervention'?interventionMarkup(s,t):`<small>${esc(x.detail)}</small>`}</span></li>`).join('')}</ol><p class="case-next">${icon(t.arrested?'seal':'arrow')}${esc(p.label)}</p></div>`;}
export function investigationRail(s,t,selected){const p=investigationSteps(s,t);return `<nav class="inquiry-step-rail" aria-label="Étapes de l’enquête">${p.steps.map(x=>button(`<span>${icon(x.done?'check':x.available?'unlock':'lock')}</span><strong>${x.short}</strong>`,'inquiry-step',`inquiry-step ${x.done?'complete':x.available?'available':'pending'}`,`data-id="${x.id}" aria-pressed="${x.id===selected}" title="${esc(x.label+' · '+x.detail)}"`)).join('')}</nav>`;}

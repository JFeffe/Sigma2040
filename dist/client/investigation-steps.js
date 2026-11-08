import * as E from './engine.js?v=237';
import {esc,icon,button} from './ui.js?v=237';

export const INVESTIGATION_SUBSTEPS={
 access:{open:['contacts','influence','drone'],mandate:['authorize']},
 intervention:{prepare:['prepare'],locate:['surveil','intimidate','drone']}
};
export const INVESTIGATION_STEPS=[
 {id:'access',short:'Accès local',label:'Établir un accès local',actions:Object.values(INVESTIGATION_SUBSTEPS.access).flat()},
 {id:'proofs',short:'2 preuves',label:'Recueillir deux preuves',actions:['collect','intimidate','hack']},
 {id:'validation',short:'Validation',label:'Valider une preuve',actions:['analyze']},
 {id:'intervention',short:'Intervention',label:'Préparer l’intervention',actions:Object.values(INVESTIGATION_SUBSTEPS.intervention).flat()},
 {id:'arrest',short:'Arrestation',label:'Procéder à l’arrestation',actions:['arrest']}
];

export function investigationSteps(s,t){
 const f=s.factions[s.player],e=E.evidenceFor(s,s.player,t.id),verified=e.filter(p=>p.verified).length,closed=!!t.arrested,access=!!f.access[t.country],mandate=!!f.authorized[t.country],prepared=!!t.prepared,located=t.locationUntil>=s.turn,proofs=e.length,ready=proofs>=2&&verified>=1;
 const unfinished=E.evidenceQueue(s,s.player).filter(p=>s.proofs.find(x=>x.id===p.id)?.suspect===t.id);
 const done=[access,proofs>=2,verified>=1,prepared&&located,closed];
 const partial=[access&&!mandate,false,false,prepared!==located,false];
 const available=[!closed&&t.country!==s.player,!closed&&(access||!t.intimidated),!closed&&unfinished.length>0,!closed,!closed&&ready&&prepared&&located];
 const details=[access?'Accès ouvert pour le pays':'Contact, chantage ou drone',`${proofs}/2 preuves recevables`,`${verified} vérifiée(s) · ${unfinished.length} à vérifier`,`${prepared?'Préparée':'À préparer'} · ${located?'localisée':'à localiser'}`,closed?'Cible en détention':'Intervention finale'];
 const steps=INVESTIGATION_STEPS.map((x,i)=>({...x,done:closed||done[i],partial:!closed&&partial[i],available:available[i],detail:closed?'Terminé':details[i]}));
 const next=steps.findIndex(x=>!x.done);
 return {steps,next,done:steps.filter(x=>x.done).length,label:closed?'Affaire résolue':'Prochaine étape : '+steps[next].label.toLowerCase(),proofs,verified,unfinished,access,ready,located,mandate,prepared};
}

export function stepForAction(type,current=null){return INVESTIGATION_STEPS.find(x=>x.id===current&&x.actions.includes(type))?.id||INVESTIGATION_STEPS.find(x=>x.actions.includes(type))?.id||'access';}
export function substepForAction(stage,type){return Object.entries(INVESTIGATION_SUBSTEPS[stage]||{}).find(([,actions])=>actions.includes(type))?.[0];}

export function investigationSubsteps(s,t,stage,interactive=false,selected=null){
 const p=investigationSteps(s,t),field=t.country!==s.player;
 const tasks=stage==='access'?
  [['open','Établir un accès local','unlock',p.access,field,p.access?'Accès ouvert':'Contact, chantage ou drone'],
   ['mandate','Obtenir un mandat','seal',p.mandate,field,'Optionnel · une fois par pays']]:
  [['prepare','Préparer une arrestation','target',p.prepared,p.ready,p.prepared?'Préparation terminée':'Deux preuves, dont une vérifiée'],
   ['locate','Localiser la cible','eye',p.located,true,p.located?'Valide jusqu’à fin T'+t.locationUntil:'Position à actualiser']];
 return `<div class="case-parallel">${tasks.map(([id,label,glyph,done,available,detail])=>{
  const complete=done||t.arrested,cls=`case-parallel-task ${id==='mandate'?'optional ':''}${complete?'complete':available?'available':'pending'}`;
  const content=`<strong>${icon(complete?'check':glyph)}${label}</strong><small>${esc(detail)}</small>`;
  return interactive?button(content,'inquiry-substep',cls,`data-id="${id}" aria-pressed="${selected===id}"`):`<div class="${cls}">${content}</div>`;
 }).join('')}</div>`;
}
export function investigationProgressMarkup(s,t){
 const p=investigationSteps(s,t);
 return `<div class="case-progress investigation-progress"><div class="case-progress-heading"><strong>${p.done}/5 étapes</strong><span>${t.arrested?'DOSSIER CLOS':'ENQUÊTE EN COURS'}</span></div><ol class="case-steps investigation-steps">${p.steps.map((x,i)=>`<li class="${x.partial?'partial':x.done?'complete':i===p.next?'current':x.available?'available':'pending'}" ${i===p.next?'aria-current="step"':''}><span class="step-number">${x.done?icon('check'):i+1}</span><div class="case-step-copy"><strong>${x.label}</strong>${INVESTIGATION_SUBSTEPS[x.id]?investigationSubsteps(s,t,x.id):`<small>${esc(x.detail)}</small>`}</div></li>`).join('')}</ol><p class="case-next">${icon(t.arrested?'seal':'arrow')}${esc(p.label)}</p></div>`;
}
export function investigationRail(s,t,selected){
 const p=investigationSteps(s,t);
 return `<nav class="inquiry-step-rail" aria-label="Étapes de l’enquête">${p.steps.map(x=>button(`<span>${icon(x.done?'check':x.available?'unlock':'lock')}</span><strong>${x.short}</strong>`,'inquiry-step',`inquiry-step ${x.partial?'partial':x.done?'complete':x.available?'available':'pending'}`,`data-id="${x.id}" aria-pressed="${x.id===selected}" title="${esc(x.label+' · '+x.detail)}"`)).join('')}</nav>`;
}

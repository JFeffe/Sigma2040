import {INVESTIGATION_STEPS,INTERVENTION_ACTIONS,investigationSteps,investigationRail,interventionMarkup,stepForAction,interventionForAction} from './investigation-steps.js?v=175';
import {threatCoverage} from './threat-status.js?v=175';
import {ACTIONS,COUNTRY,CELLS} from './data.js?v=175';
import * as E from './engine.js?v=175';
import {ACTION_GROUPS} from './presentation.js?v=175';
import {esc,icon,button,flag,portrait} from './ui.js?v=175';
import {suspectPortrait} from './fracture-profiles.js?v=175';
import {countrySignals} from './country-signals.js?v=175';
import {proofTitle} from './intelligence.js?v=175';

const relevant=new Set(['contacts','collect','analyze','surveil','authorize','prepare','arrest','influence','intimidate','hack','drone']);
// The dropdown owns the ordering. Never maintain a second ordered action list.
export const INQUIRY_ACTIONS=ACTION_GROUPS.flatMap(([,ids])=>ids).filter(id=>relevant.has(id)&&!ACTIONS[id].disabled);
export function countryTargetButtons(s,country){
 const targets=E.knownTargets(s).filter(t=>t.country===country&&!t.arrested),threats=countryThreatButtons(s,country);
 return `<div class="country-case-buttons" aria-label="Cibles connues dans ce pays">${targets.length?targets.map(t=>button(`${suspectPortrait(t)}<span><strong>${esc(t.name)}</strong><small>${t.locationUntil>=s.turn?'Localisé · fin T'+t.locationUntil:'Position à confirmer'}</small></span>`,'country-inquiry','country-case-button',`data-id="${t.id}"`)).join(''):'<p class="muted">Aucune cible connue dans ce pays.</p>'}${threats}</div>`;
}
export function countryThreatButtons(s,country){return E.visiblePlots(s).filter(p=>p.country===country).sort((a,b)=>a.turn-b.turn).map(p=>button(`${icon('shield')}<span><strong>Menace · ${esc(CELLS[p.cell]||'Direction')}</strong><small>Attaque · fin du tour ${p.turn}</small></span>`,'country-threat','country-case-button country-threat-button',`data-id="${p.id}"`)).join('');}
export function localInquiryAgents(s,country){return E.team(s).filter(a=>a.country===country&&!E.travelInProgress(a));}
export function threatInquiryModel(s,id,agentId=null,useCredits=false){
 const plot=E.visiblePlots(s).find(p=>p.id===id);if(!plot)return null;
 const t={id:plot.id,country:plot.country,cell:plot.cell,name:CELLS[plot.cell]||'Direction',threat:true};
 const rows=localInquiryAgents(s,t.country).map(a=>inquiryCandidate(s,t,'protect',a,null,useCredits)).sort((a,b)=>Number(!!a.reason)-Number(!!b.reason)||b.o.chance-a.o.chance);
 return {t,plot,type:'protect',rows,selected:rows.find(r=>r.a.id===agentId)||rows.find(r=>!r.reason)||null,proofs:[],requirements:[]};
}
export function inquiryProofs(s,id){return E.evidenceQueue(s,s.player).filter(e=>s.proofs.find(p=>p.id===e.id)?.suspect===id&&!E.analysisAgent(s,s.player,e.id));}
export function inquiryTarget(s,t,type,proof){return type==='analyze'?(inquiryProofs(s,t.id).find(e=>e.id===proof)?.id||inquiryProofs(s,t.id)[0]?.id||null):['contacts','authorize','influence','protect'].includes(type)?t.country:t.id;}
export function inquiryCompleted(s,t,type){const f=s.factions[s.player];return t.arrested?'Cible déjà arrêtée':type==='contacts'&&f.access[t.country]?'Contact activé':type==='authorize'&&f.authorized[t.country]?'Mandat obtenu':type==='prepare'&&t.prepared?'Arrestation préparée':type==='intimidate'&&t.intimidated?'Intimidation effectuée':'';}
export function inquiryRequirements(s,t,type){
 const evidence=E.evidenceFor(s,s.player,t.id),f=s.factions[s.player],r=[];
 if(['collect','hack'].includes(type))r.push({done:!!f.access[t.country],label:'Accès local ouvert',action:'contacts'});
 if(['prepare','arrest'].includes(type))r.push({done:evidence.length>=2,label:'Deux preuves recevables',action:'collect'},{done:evidence.some(e=>e.verified),label:'Au moins une preuve vérifiée',action:'analyze'});
 if(type==='arrest')r.push({done:!!t.prepared,label:'Arrestation préparée',action:'prepare'},{done:t.locationUntil>=s.turn,label:'Localisation valide',action:'surveil'});
 return r;
}
export function inquiryCandidate(s,t,type,a,proof=null,useCredits=false){
 const target=inquiryTarget(s,t,type,proof),normal=E.options(s,a.id,type,target),reinforced=E.options(s,a.id,type,target,true),o=useCredits?reinforced:normal;
 let reason=inquiryCompleted(s,t,type);
 if(!reason&&s.ended)reason='Campagne terminée';
 if(!reason&&a.faction!==s.player)reason='Agent d’une autre équipe';
 if(!reason&&['captured','dead','retired'].includes(a.status))reason=a.status==='captured'?'Agent capturé':'Agent indisponible';
 if(!reason&&a.task)reason=`${a.task.queued?'Ordre planifié':'En mission'} · ${a.task.remaining} tour(s)`;
 const country=type==='analyze'?s.player:t.country;
 if(!reason&&a.country!==country)reason=`Déplacement nécessaire · ${COUNTRY[country].name}${type==='analyze'?' (QG)':''}`;
 // Never let a missing proof fall through to the engine's automatic, all-dossier choice.
 if(!reason&&type==='analyze'&&!target)reason='Aucune pièce de ce dossier disponible à vérifier';
 if(!reason)reason=o.error||'';
 return {a,target,normal,reinforced,o,reason};
}
export function inquiryModel(s,id,type,agentId=null,proof=null,useCredits=false){
 const t=E.knownTargets(s).find(t=>t.id===id);if(!t)return null;
 if(!INQUIRY_ACTIONS.includes(type))type=INQUIRY_ACTIONS[0];
 const rows=localInquiryAgents(s,type==='analyze'?s.player:t.country).map(a=>inquiryCandidate(s,t,type,a,proof,useCredits)).sort((a,b)=>Number(!!a.reason)-Number(!!b.reason)||b.o.chance-a.o.chance);
 const selected=rows.find(r=>r.a.id===agentId)||rows.find(r=>!r.reason)||null;
 return {t,type,rows,selected,proofs:inquiryProofs(s,t.id),requirements:inquiryRequirements(s,t,type)};
}

let api,selection=null,pending=false;
export function initCountryInquiry(callbacks){api=callbacks;}
export function openCountryInquiry(id,threat=false){
 if(threat){if(!threatInquiryModel(api.state(),id))return;selection={id,threat:true,type:'protect',agent:null,proof:null,boost:false,message:''};paint(true);return;}
 const s=api.state(),t=E.knownTargets(s).find(t=>t.id===id);if(!t)return;
 const next=E.nextOperation(s,t);selection={id,type:INQUIRY_ACTIONS.includes(next.type)?next.type:'contacts',agent:null,proof:null,boost:false,message:''};
 selection.step=stepForAction(selection.type);selection.substep=interventionForAction(selection.type);paint(true);
}
export function refreshCountryInquiry(){if(api?.modal.open&&api.modal.classList.contains('country-inquiry-modal'))paint();}
function selectionModel(s,current){return current.threat?threatInquiryModel(s,current.id,current.agent,current.boost):inquiryModel(s,current.id,current.type,current.agent,current.proof,current.boost);}
function readOnly(){return pending?'Confirmation en cours…':api.readOnlyReason()||'';}
function paint(open=false){
 if(!selection)return;
 const s=api.state();if(!s)return;
 let m=selectionModel(s,selection);if(!m){if(!open)api.modal.close();return;}
 if(selection.boost&&m.selected?.normal.boostGain===0){selection.boost=false;m=selectionModel(s,selection);}
 const {t,type,rows,selected,proofs,requirements,plot}=m;selection.agent=selected?.a.id||null;selection.proof=selected?.target&&type==='analyze'?selected.target:proofs[0]?.id||null;
 const locked=readOnly(),done=inquiryCompleted(s,t,type),e=E.evidenceFor(s,s.player,t.id),f=s.factions[s.player];
 const progress=plot?null:investigationSteps(s,t),stage=INVESTIGATION_STEPS.find(x=>x.id===selection.step)||INVESTIGATION_STEPS[0];
 const actionKeys=stage.id==='intervention'?INTERVENTION_ACTIONS[selection.substep||'prepare']:stage.actions;
 const actions=plot?'':`${investigationRail(s,t,stage.id)}<div class="inquiry-stage-heading"><h3>${esc(stage.label)}</h3><span>${progress.done}/5 étapes</span></div>${stage.id==='intervention'?`<p class="inquiry-description">Préparation et localisation peuvent être menées en parallèle. Le mandat est facultatif.</p>${interventionMarkup(s,t,true,selection.substep)}`:''}${stage.id==='validation'?`<p class="inquiry-description">${progress.verified} preuve(s) vérifiée(s) · 1 requise. Vous pouvez aussi vérifier la deuxième.</p>`:''}${stage.id==='proofs'?`<p class="inquiry-description">${progress.proofs}/2 preuves recevables. Plusieurs agents peuvent chercher des preuves pendant le même tour.</p>`:''}<div class="inquiry-action-buttons" aria-label="Actions de l’étape">${actionKeys.map(key=>{const complete=inquiryCompleted(s,t,key),available=!complete&&localInquiryAgents(s,key==='analyze'?s.player:t.country).some(a=>!inquiryCandidate(s,t,key,a).reason);return button(`${icon(complete?'check':ACTIONS[key].icon)}<span>${esc(ACTIONS[key].name)}</span>${complete?'<small>Fait</small>':!available?icon('lock'):''}`,'inquiry-action',`inquiry-action ${complete?'is-complete':!available?'is-blocked':''}`,`data-id="${key}" aria-pressed="${key===type}"`);}).join('')}</div>`;
 const running=E.team(s).filter(a=>a.task&&(a.task.target===t.id||a.task.type==='analyze'&&s.proofs.find(p=>p.id===a.task.target)?.suspect===t.id||a.country===t.country&&['contacts','influence','authorize','drone',...(plot?['protect']:[])].includes(a.task.type)));
 const missions=running.length?`<section class="inquiry-running"><h3>Missions affectées · ${running.length}</h3>${running.map(a=>`<div>${button(portrait(a),'inquiry-open-agent','inquiry-agent-portrait',`data-id="${a.id}" aria-label="Ouvrir les actions de ${esc(a.name)}"`)}<span><strong>${esc(a.name)}</strong><small>${esc(ACTIONS[a.task.type].name)} · ${a.task.remaining} tour(s)${a.task.queued?' · planifiée':''}</small></span></div>`).join('')}</section>`:'';

 const coverage=plot?threatCoverage(s,plot):null;

 const blocked=locked||done||selected?.reason||(!selected?'Aucun agent disponible pour cette action.':'');
 const html=`<section class="country-inquiry"><header class="inquiry-heading">${plot?'<span class="inquiry-threat-icon">'+icon('shield')+'</span>':suspectPortrait(t)}<div><span class="eyebrow">${esc(CELLS[t.cell]||'DIRECTION')} · ${plot?'MENACE':'DOSSIER'}</span><h2>${esc(t.name)}</h2><span>${flag(t.country)} ${esc(COUNTRY[t.country].name)}</span></div></header>
 <div class="inquiry-country-signals">${countrySignals(s,t.country)}</div>
 <div class="inquiry-summary">${plot?`<span>Attaque · fin du tour ${plot.turn}</span><span>${coverage.covered?'Protégée par votre pays':'Menace non couverte'}</span>`:`<span>${e.length}/2 preuves · ${e.filter(p=>p.verified).length} vérifiée(s)</span><span>${t.arrested?'En détention':t.locationUntil>=s.turn?'Localisé jusqu’à fin T'+t.locationUntil:'Position à confirmer'}</span>`}</div>
 <div class="inquiry-body">${actions}
 <section class="inquiry-operation">${plot?`<h3>${esc(ACTIONS.protect.name)}</h3><p class="inquiry-description">${esc(plot.kind)} · ${coverage.covered?'Protection de votre pays jusqu’à fin T'+coverage.until+'.':'Réussir la mission avant l’attaque pour protéger le pays.'}</p>`:''}<details class="inquiry-action-details"><summary>${icon('info')} Effets de l’action</summary><p class="inquiry-description">${esc(ACTIONS[type].desc)}</p></details>
 ${plot&&selected?`<p class="inquiry-warning">Fin de préparation : T${s.turn+selected.o.duration-1}${s.turn+selected.o.duration-1>plot.turn?' · Trop tard pour cette attaque.':plot.turn>s.turn+selected.o.duration+2?' · Protection expirée avant cette attaque si lancée maintenant.':' · Protection à temps en cas de réussite.'}</p>`:''}
 ${requirements.length?`<div class="inquiry-requirements">${requirements.map(r=>r.done?`<span class="is-met">${icon('check')} ${esc(r.label)}</span>`:button(`${icon('lock')} ${esc(r.label)}`,'inquiry-action','is-missing',`data-id="${r.action}"`)).join('')}</div>`:''}
 ${type==='arrest'&&!f.authorized[t.country]&&!t.arrested?'<p class="inquiry-warning">Sans mandat : arrestation clandestine, risque accru et coopération −1 niveau après la tentative.</p>':''}
 ${type==='analyze'?`<label class="inquiry-proof">Pièce de ce dossier<select id="inquiryProof" ${!proofs.length?'disabled':''}>${proofs.length?proofs.map(p=>`<option value="${p.id}" ${p.id===selection.proof?'selected':''}>${esc(proofTitle(s.proofs.find(x=>x.id===p.id)))}</option>`).join(''):'<option>Aucune pièce disponible</option>'}</select></label>`:''}
 <p class="inquiry-agent-label">Choisir un agent · ${type==='analyze'?'au QG':esc(COUNTRY[t.country].name)}</p>
 <div class="inquiry-agents">${rows.length?rows.map(r=>`<div class="inquiry-agent-row ${r.reason?'is-blocked':''}">${button(portrait(r.a),'inquiry-open-agent','inquiry-agent-portrait',`data-id="${r.a.id}" aria-label="Ouvrir les actions de ${esc(r.a.name)}"`)}${button(`<span><strong>${esc(r.a.name)}</strong><small>${esc(r.reason||'Disponible'+(r.a.status==='injured'?' · blessé':''))}</small></span><span class="inquiry-agent-numbers">${r.reason?'':`<b>${r.o.chance} %</b><small>${r.o.duration} tour(s)</small>`}</span>`,'inquiry-agent',`inquiry-agent ${r.reason?'is-blocked':''}`,`data-id="${r.a.id}" aria-pressed="${selected?.a.id===r.a.id}" ${r.reason||locked?'disabled':''}`)}</div>`).join(''):`<p class="inquiry-empty">Aucun agent de votre équipe ${type==='analyze'?'au QG':'présent dans ce pays'}.</p>`}</div>
 ${selected?`<div class="inquiry-costs">Énergie −${selected.o.fatigue*selected.o.duration} au total · ${selected.normal.explanations.map(esc).join(' · ')||'Aucun modificateur'}</div>`:''}
 <label class="inquiry-boost"><input type="checkbox" id="inquiryBoost" ${selection.boost?'checked':''} ${!selected||selected.normal.error||selected.reason&&!selection.boost||selected.normal.boostGain===0||locked||!selection.boost&&selected.reinforced.error?'disabled':''}><span>Boost +10 points · ${E.ECONOMY.boostCost} crédits<small>${f.budget} crédits disponibles${selected&&selected.normal.boostGain<10?' · plafond de 90 %':''}</small></span></label>
 ${missions}</section></div><footer class="inquiry-footer"><p class="inquiry-feedback" role="status">${esc(selection.message||blocked)}</p>${button(`${icon('check')} Confirmer${selected?' · '+esc(selected.a.name):''}`,'inquiry-confirm','primary wide',blocked?'disabled':'')}</footer></section>`;
 const modal=api.modal,scroll=modal.querySelector('.inquiry-body')?.scrollTop||0,focus=document.activeElement?.id;
 if(open)api.showModal(html,'country-inquiry-modal');else {modal.querySelector('.country-inquiry')?.remove();modal.insertAdjacentHTML('beforeend',html);}
 modal.querySelector('.inquiry-body').scrollTop=scroll;if(focus?.startsWith('inquiry'))modal.querySelector('#'+focus)?.focus({preventScroll:true});
}
export async function handleInquiryCommand(cmd,id){
 if(cmd==='country-inquiry'||cmd==='country-threat'){openCountryInquiry(id,cmd==='country-threat');return;}
 if(!selection||!api.modal.open||!api.modal.classList.contains('country-inquiry-modal'))return;
 if(pending)return;
 if(cmd==='inquiry-open-agent'){const m=selectionModel(api.state(),selection);if(!E.team(api.state()).some(a=>a.id===id))return;api.modal.close();api.openAgent(id);return;}
 if(cmd==='inquiry-step'&&!selection.threat){const st=INVESTIGATION_STEPS.find(x=>x.id===id);if(!st)return;selection.step=id;selection.substep='prepare';selection.type=st.actions[0];selection.agent=null;selection.boost=false;selection.message='';paint();}
 if(cmd==='inquiry-substep'&&!selection.threat&&INTERVENTION_ACTIONS[id]){selection.step='intervention';selection.substep=id;selection.type=INTERVENTION_ACTIONS[id][0];selection.agent=null;selection.boost=false;selection.message='';paint();}
 if(cmd==='inquiry-action'&&!selection.threat&&INQUIRY_ACTIONS.includes(id)){selection.type=id;selection.step=stepForAction(id,selection.step);if(selection.step==='intervention')selection.substep=interventionForAction(id);selection.agent=null;selection.boost=false;selection.message='';paint();}
 if(cmd==='inquiry-agent'){selection.agent=id;selection.message='';paint();}
 if(cmd==='inquiry-confirm'){
  const current=selection,s=api.state(),m=selectionModel(s,current),r=m?.selected;
  const reason=readOnly()||r?.reason||(!r?'Choisissez un agent disponible.':'');if(reason){api.notify(reason);paint();return;}
  const turn=s.turn;pending=true;paint();
  try{await api.assign({id:r.a.id,type:m.type,target:r.target,useCredits:current.boost});if(selection===current&&api.modal.open&&api.modal.classList.contains('country-inquiry-modal')&&api.state().turn===turn){current.message=`${r.a.name} · ${ACTIONS[m.type].name} : ordre confirmé.`;current.agent=null;current.boost=false;}}
  catch(e){api.notify(e.message);if(selection===current)current.message=e.message;}
  finally{pending=false;refreshCountryInquiry();}
 }
}
export function handleInquiryChange(el){if(!selection||pending||!api.modal.open||!api.modal.classList.contains('country-inquiry-modal'))return;if(el.id==='inquiryBoost'){selection.boost=el.checked;selection.message='';paint();}if(el.id==='inquiryProof'){selection.proof=el.value;selection.agent=null;selection.boost=false;selection.message='';paint();}}

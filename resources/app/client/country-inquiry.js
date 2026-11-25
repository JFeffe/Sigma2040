import {localizeContent} from './localization.js?v=246';
import {cellInfoBadge,captiveMarkup} from './cell-info.js?v=246';
import {isTutorial,tutorialHint} from './tutorial-rules.js?v=246';
import {INVESTIGATION_STEPS,INVESTIGATION_SUBSTEPS,investigationRail,investigationSubsteps,stepForAction,substepForAction} from './investigation-steps.js?v=246';
import {threatCoverage,threatProtectionText,coveringFactions} from './threat-status.js?v=246';
import {ACTIONS,COUNTRY,cellName,STAT_NAMES,TALENTS} from './data.js?v=246';
import * as E from './engine.js?v=246';
import {ACTION_GROUPS,actionResourceBadges} from './presentation.js?v=246';
import {esc,icon,button,flag,portrait} from './ui.js?v=246';
import {suspectPortrait} from './fracture-profiles.js?v=246';
import {proofTitle} from './intelligence.js?v=246';
import {operationReadingsMarkup,operationSuccessMarkup,operationIncidentMarkup,missionTimingMarkup,missionBoostLabel} from './operations-ui.js?v=246';

const relevant=new Set(['contacts','collect','analyze','surveil','authorize','prepare','arrest','influence','intimidate','hack','drone']);
// The dropdown owns the ordering. Never maintain a second ordered action list.
export const INQUIRY_ACTIONS=ACTION_GROUPS.flatMap(([,ids])=>ids).filter(id=>relevant.has(id)&&!ACTIONS[id].disabled);
export function countryTargetButtons(s,country,{empty='<p class="muted">Aucune cible connue dans ce pays.</p>',emptyLast=false,agentId=null}={}){
 const targets=E.knownTargets(s).filter(t=>t.country===country&&!t.arrested);
 const actor=agentId?` data-agent="${esc(agentId)}"`:'';
 const dossiers=targets.map(t=>button(`${suspectPortrait(t)}<span><strong>${esc(t.name)}</strong><small>${t.locationUntil>=s.turn?'Localisé · fin T'+t.locationUntil:'Position à confirmer'}</small></span>`,'country-inquiry','country-case-button',`data-id="${t.id}"${actor}`)).join('');
 const captives=E.team(s).filter(a=>a.status==='captured'&&a.country===country).map(a=>button(`${portrait(a)}<span><strong>${esc(a.name)}</strong><small>Extraire un agent</small></span>`,'rescue-captive','country-case-button',`data-id="${esc(a.id)}"`)).join('');
 const local=countryThreatButtons(s,country,agentId)+captives+captiveMarkup(s,country);
 const content=emptyLast?dossiers+local+(dossiers?'':empty):(dossiers||empty)+local;
 return content?`<div class="country-case-buttons" aria-label="Dossiers, menaces et actions locales">${content}</div>`:'';
}
export function countryThreatButtons(s,country,agentId=null){return E.visiblePlots(s).filter(p=>p.country===country).sort((a,b)=>a.turn-b.turn).map(p=>{
 const own=threatCoverage(s,p).covered,other=s.gameMode==='cooperative'&&coveringFactions(s,p).some(f=>f.id!==s.player),covered=own||other;
 return button(`${icon('shield')}<span><strong>Menace · ${esc(cellName(p.cell))}</strong><small>${esc(p.kind)} · fin du tour ${p.turn}</small>${covered?`<small class="${!own&&other?'other-coverage':''}">${own?'Protégée par votre pays':'Couverte par une autre équipe'}</small>`:''}</span>`,'country-threat',`country-case-button country-threat-button ${covered?'threat-covered':''}`,`data-id="${p.id}"${agentId?` data-agent="${esc(agentId)}"`:''} ${covered?'disabled':''}`);
 }).join('');}
export function localInquiryAgents(s,country){return E.team(s).filter(a=>a.country===country&&!E.travelInProgress(a));}
export function threatInquiryModel(s,id,agentId=null,useCredits=false){
 const plot=E.visiblePlots(s).find(p=>p.id===id);if(!plot)return null;
 const t={id:plot.id,country:plot.country,cell:plot.cell,name:cellName(plot.cell),threat:true};
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

export function inquiryActionInputs(type,candidate){
 const d=ACTIONS[type],a=candidate?.a,o=candidate?.normal;
 const stat=`<span title="Stat utilisée">${icon(['scan','case','shield'][d.stat])} ${esc(STAT_NAMES[d.stat])}${a?' '+a.stats[d.stat]:''}</span>`;
 const talents=d.talents.map(id=>{
  const applied=o?.talents.includes(id),language=id==='langues',bonus=language?5:10;
  const effect=`+${bonus} points de réussite${language?' à l’étranger (cumulable)':''}`;
  const status=!a?'':applied?` +${bonus}`:a.talents.includes(id)?' · à l’étranger seulement':' · absent';
  return `<span class="${a&&!applied?'is-inactive':''}" title="${effect}">${esc(TALENTS[id][0])}${status}</span>`;
 }).join('');
 const effects=type==='hack'?[{icon:'terminal',text:'Hack +1 tour'}]:[];
 return `<div class="inquiry-action-inputs" aria-label="Stat, talent et effets associés">${stat}${talents}${actionResourceBadges(type,a)}${effects.map(x=>`<span${x.title?` title="${x.title}"`:''}>${icon(x.icon)} ${esc(x.text)}</span>`).join('')}</div>`;
}
export function createCountryInquiryController(callbacks){
let api=callbacks,selection=null,pending=false;
function initCountryInquiry(callbacks){api=callbacks;}
function openCountryInquiry(id,threat=false,agent=null){
 if(threat){if(!threatInquiryModel(api.state(),id))return;selection={id,threat:true,type:'protect',agent,proof:null,boost:false,message:''};paint(true);return;}
 const s=api.state(),t=E.knownTargets(s).find(t=>t.id===id);if(!t)return;
 const next=E.nextOperation(s,t);selection={id,type:INQUIRY_ACTIONS.includes(next.type)?next.type:'contacts',agent,proof:null,boost:false,message:''};
 selection.step=stepForAction(selection.type);selection.substep=substepForAction(selection.step,selection.type);paint(true);
}
function refreshCountryInquiry(){if(api?.modal.open&&api.modal.classList.contains('country-inquiry-modal'))paint();}
function selectionModel(s,current){
 return current.threat?threatInquiryModel(s,current.id,current.agent,current.boost):inquiryModel(s,current.id,current.type,current.agent,current.proof,current.boost);
}
function readOnly(){return pending?'Confirmation en cours…':api.readOnlyReason()||'';}
function boostUnavailable(candidate,locked){return locked||candidate?.reason||candidate?.normal.error||(!candidate?'Choisissez un agent disponible.':'')||(candidate.normal.chance===100?'Formation : réussite garantie, sans boost.':candidate.normal.boostGain===0?'Chances déjà au plafond de 90 %.':'')||candidate.reinforced.error||'';}
function paint(open=false,focusAction=false){
 if(!selection)return;
 const s=api.state();if(!s)return;
 let m=selectionModel(s,selection);if(!m){if(!open)api.modal.close();return;}
 if(selection.boost&&(s.factions[s.player].budget<E.ECONOMY.boostCost||m.selected?.normal.boostGain===0)){selection.boost=false;m=selectionModel(s,selection);}
 const {t,type,rows,selected,proofs,requirements,plot}=m;selection.agent=selected?.a.id||null;selection.proof=selected?.target&&type==='analyze'?selected.target:proofs[0]?.id||null;
 const locked=readOnly(),done=inquiryCompleted(s,t,type),e=E.evidenceFor(s,s.player,t.id),f=s.factions[s.player],boostReason=boostUnavailable(selected,locked);
 const stage=INVESTIGATION_STEPS.find(x=>x.id===selection.step)||INVESTIGATION_STEPS[0];
 const substeps=INVESTIGATION_SUBSTEPS[stage.id],substep=selection.substep??substepForAction(stage.id,stage.actions[0]);
 const actionKeys=substeps?.[substep]??stage.actions;
 const actionChoices=plot?'':actionKeys.filter(key=>key!==type).map(key=>{
  const action=ACTIONS[key],complete=!!inquiryCompleted(s,t,key);
  const available=!complete&&localInquiryAgents(s,key==='analyze'?s.player:t.country).some(a=>!inquiryCandidate(s,t,key,a).reason);
  const content=`${icon(complete?'check':action.icon)} <span>${esc(action.name)}</span>`;
  return button(content,'inquiry-action',`inquiry-action ${complete?'is-complete':!available?'is-blocked':''}`,`data-id="${key}"${complete||!available?` title="${complete?'Terminé':'Indisponible'}"`:''}`);
 }).join('');
 const alternatives=substeps||actionChoices?`<div class="case-alternatives" role="group" aria-label="Autres actions">
  ${actionChoices}${substeps?investigationSubsteps(s,t,stage.id,true,substep):''}
 </div>`:'';
 const running=E.team(s).filter(a=>a.task&&(a.task.target===t.id||a.task.type==='analyze'&&s.proofs.find(p=>p.id===a.task.target)?.suspect===t.id||a.country===t.country&&['contacts','influence','authorize','drone',...(plot?['protect']:[])].includes(a.task.type)));
 const missions=running.length?`<section class="inquiry-running"><h3>Missions affectées · ${running.length}</h3>${running.map(a=>`<div>${button(portrait(a),'inquiry-open-agent','inquiry-agent-portrait',`data-id="${a.id}" aria-label="Consulter la fiche de ${esc(a.name)}"`)}<span><strong>${esc(a.name)}</strong><small>${esc(ACTIONS[a.task.type].name)} · ${a.task.remaining} tour(s)${a.task.queued?' · planifiée':''}</small></span></div>`).join('')}</section>`:'';

 const protection=plot?threatProtectionText(s,plot):null;
 const coverage=plot?threatCoverage(s,plot):null,otherCoverage=plot?coveringFactions(s,plot).filter(f=>f.id!==s.player):[];

 const blocked=locked||done||selected?.reason||(!selected?'Aucun agent disponible pour cette action.':'');
 const briefingId='inquiry-briefing-'+(plot?'threat-':'')+esc(t.id);
 const boost=!ACTIONS[type].safe?`<div class="mission-boost-control">
  ${button(icon('boost')+missionBoostLabel(selected?.normal,selected?.reinforced,f.budget),'inquiry-boost','mission-boost-toggle',`id="inquiryBoost" aria-pressed="${selection.boost}" ${locked||f.budget<E.ECONOMY.boostCost||!selection.boost&&boostReason?'disabled':''}`)}
  ${selected&&boostReason&&boostReason!==blocked?`<small class="mission-boost-reason">${esc(boostReason)}</small>`:''}
 </div>`:'';
 const country=COUNTRY[t.country],verified=e.filter(p=>p.verified).length;
 const location=t.arrested?'En détention':t.locationUntil>=s.turn?'Localisé jusqu’à la fin du tour '+t.locationUntil:'Position à confirmer';
 const heading=`<header class="inquiry-heading ${plot?'threat-briefing-heading':'dossier-sheet'}">
  <div class="inquiry-identity">${plot?`<span class="inquiry-threat-icon">${icon('shield')}</span>`:suspectPortrait(t)}
   <div><h2>${esc(plot?plot.kind:t.name)}</h2><div class="case-identity-meta">${plot?'':`<small>${esc(t.role)}</small>`}${cellInfoBadge(s,t.cell)}</div></div>
  </div>
  <div class="inquiry-case-country">
   <div class="inquiry-case-place">${flag(t.country)} <strong>${esc(country.name)}</strong></div>
   <div class="inquiry-case-facts"><span>${plot?`${icon('clock')} Attaque · fin du tour ${plot.turn}`:`${icon('target')} ${esc(location)}`}</span></div>
  </div>
 </header>`;
 const resources=actionResourceBadges(type,selected?.a);
 const details=`<div class="case-details">
  ${button(`${icon('chevron')} ${plot?'Détails':'Détails du dossier'}`,'inquiry-effects','inquiry-effects',`id="inquiryEffects" aria-expanded="${!!selection.effectsOpen}" aria-controls="${briefingId}"`)}
  <div id="${briefingId}" class="mission-briefing-content" ${selection.effectsOpen?'':'hidden'}>
   ${plot?(protection.planned?`<p>${esc(protection.planned)}</p>`:''):`<p>${icon('file')} ${e.length}/2 preuves · ${verified} ${verified===1?'vérifiée':'vérifiées'}</p>
    <p>${icon('seal')} ${f.authorized[t.country]?'Mandat obtenu':'Sans mandat'}</p>`}
   ${resources?`<p class="operation-resources">${resources}</p>`:''}
   ${operationIncidentMarkup(s,type,selected)}
  </div>
 </div>`;
 const missing=requirements.filter(r=>!r.done);
 const feedback=selection.message||locked||done||(rows.length&&!missing.length?blocked:'');
 const footer=`<footer class="inquiry-footer"><p class="inquiry-feedback" role="status">${esc(feedback)}</p>${boost}
  <div class="mission-confirm-control">${button(`${icon('check')} ${selected?'Confirmer avec '+esc(selected.a.name):'Confirmer'}`,'inquiry-confirm','primary wide',blocked?'disabled':'')}</div>
 </footer>`;
 const html=`<section class="country-inquiry ${plot?'threat-inquiry':'case-inquiry'}">${heading}
 <div class="inquiry-body">${isTutorial(s)?`<details class="tutorial-inquiry-note"><summary>Filigrane · Instructions de formation</summary><p translate="no">${esc(tutorialHint(s))}</p></details>`:''}
 ${plot?'':investigationRail(s,t,stage.id)}
 <section class="inquiry-operation operation-card">
 <h3 class="inquiry-single-action" id="inquiryActionTitle" data-action="${type}" tabindex="-1">${esc(ACTIONS[type].name)}</h3>
 ${plot?`<p class="inquiry-description">+${E.attackDamage(s,plot)} crise si non protégée · ${coverage.covered?'Protection de votre pays jusqu’à fin T'+coverage.until+'.':otherCoverage.length?'Couverte par une autre équipe':protection.planned?protection.attack:'Menace non couverte'}</p>`:alternatives}
 ${operationSuccessMarkup(type,'inquiryMechanics')}
 ${plot&&selected?`<p class="inquiry-warning"><span>Fin de préparation : T${s.turn+selected.o.duration-1}</span>${s.turn+selected.o.duration-1>plot.turn?' · Trop tard pour cette attaque.':plot.turn>s.turn+selected.o.duration+2?' · Protection expirée avant cette attaque si lancée maintenant.':' · Protection à temps en cas de réussite.'}</p>`:''}
 ${missing.length?`<div class="inquiry-requirements">${missing.map(r=>button(`${icon('lock')} ${esc(r.label)}`,'inquiry-action','is-missing',`data-id="${r.action}"`)).join('')}</div>`:''}
 ${type==='arrest'&&!f.authorized[t.country]&&!t.arrested?'<p class="inquiry-warning">Sans mandat : arrestation clandestine, risque accru et coopération −1 niveau après la tentative.</p>':''}
 ${type==='analyze'?`<label class="inquiry-proof">Pièce de ce dossier<select id="inquiryProof" ${!proofs.length?'disabled':''}>${proofs.length?proofs.map(p=>`<option value="${p.id}" ${p.id===selection.proof?'selected':''}>${esc(proofTitle(s.proofs.find(x=>x.id===p.id)))}</option>`).join(''):'<option>Aucune pièce disponible</option>'}</select></label>`:''}
 ${rows.length>1||type==='analyze'&&rows.length?`<div class="mission-compare-heading"><strong>${rows.length>1?'Comparer les agents':'Agents disponibles au QG'}</strong>${type==='analyze'&&rows.length>1?'<small>Agents disponibles au QG</small>':''}</div>`:''}
 <div class="inquiry-agents">${rows.length?rows.map(r=>{
  const status=r.reason||(r.a.status==='injured'?'Blessé':'');
  const odds=!r.reason?`<span class="inquiry-agent-numbers mission-candidate-readings"><b>${r.o.chance} %</b><small class="${rows.length>1?'sr-only':'case-chance-label'}">de réussite</small>${rows.length>1?missionTimingMarkup(r.a,type,r.o):''}</span>`:'';
  return `<div class="inquiry-agent-row ${r.reason?'is-blocked':''}">${button(portrait(r.a),'inquiry-open-agent','inquiry-agent-portrait',`data-id="${r.a.id}" aria-label="Consulter la fiche de ${esc(r.a.name)}"`)}${button(`<span><strong>${esc(r.a.name)}</strong>${status?`<small>${esc(status)}</small>`:''}</span>${odds}`,'inquiry-agent',`inquiry-agent ${r.reason?'is-blocked':''}`,`id="inquiry-agent-${esc(r.a.id)}" data-id="${r.a.id}" aria-pressed="${selected?.a.id===r.a.id}" ${r.reason||locked?'disabled':''}`)}</div>`;
 }).join(''):`<p class="inquiry-empty">Aucun agent de votre équipe ${type==='analyze'?'au QG':'présent dans ce pays'}.</p>`}</div>
 ${operationReadingsMarkup(s,type,selected)}
 ${footer}</section>
 ${details}${missions}</div></section>`;
 const modal=api.modal,scroll=modal.querySelector('.inquiry-body')?.scrollTop||0,focus=modal.contains?.(document.activeElement)?document.activeElement.id:null;
 if(api.setContent)api.setContent(html);
 else if(open)api.showModal(html,'country-inquiry-modal');
 else {modal.querySelector('.country-inquiry')?.remove();modal.insertAdjacentHTML('beforeend',html);localizeContent(modal.querySelector('.country-inquiry'));}
 modal.querySelector('.inquiry-body').scrollTop=scroll;
 if(focusAction)modal.querySelector('#inquiryActionTitle')?.focus({preventScroll:true});
 else if(focus?.startsWith('inquiry'))modal.querySelector('#'+CSS.escape(focus))?.focus({preventScroll:true});
}
async function handleInquiryCommand(cmd,id){
 if(cmd==='country-inquiry'||cmd==='country-threat'){openCountryInquiry(id,cmd==='country-threat');return;}
 if(!selection||!api.modal.open||!api.modal.classList.contains('country-inquiry-modal'))return;
 if(pending)return;
 if(cmd==='inquiry-open-agent'){if(!E.team(api.state()).some(a=>a.id===id))return;api.openAgent(id);return;}
 if(cmd==='inquiry-step'&&!selection.threat){const st=INVESTIGATION_STEPS.find(x=>x.id===id);if(!st)return;selection.step=id;selection.type=st.actions[0];selection.substep=substepForAction(id,selection.type);selection.agent=null;selection.boost=false;selection.message='';paint(false,true);}
 if(cmd==='inquiry-substep'&&!selection.threat){const choices=INVESTIGATION_SUBSTEPS[selection.step]?.[id];if(!choices)return;selection.substep=id;selection.type=choices[0];selection.agent=null;selection.boost=false;selection.message='';paint(false,true);}
 if(cmd==='inquiry-action'&&!selection.threat&&INQUIRY_ACTIONS.includes(id)){selection.type=id;selection.step=stepForAction(id,selection.step);selection.substep=substepForAction(selection.step,id);selection.agent=null;selection.boost=false;selection.message='';paint(false,true);}
 if(cmd==='inquiry-agent'){selection.agent=id;selection.message='';paint();}
 if(cmd==='inquiry-effects'){selection.effectsOpen=!selection.effectsOpen;paint();}
 if(cmd==='inquiry-boost'){
  if(readOnly())return;
  const s=api.state();if(s.factions[s.player].budget<E.ECONOMY.boostCost){selection.boost=false;api.notify('Budget insuffisant pour le boost.');paint();return;}
  if(!selection.boost){const reason=boostUnavailable(selectionModel(api.state(),selection)?.selected,'');if(reason){api.notify(reason);paint();return;}}
  selection.boost=!selection.boost;selection.message='';paint();
 }
 if(cmd==='inquiry-confirm'){
  const current=selection,s=api.state(),m=selectionModel(s,current),r=m?.selected;
  const reason=readOnly()||r?.reason||(!r?'Choisissez un agent disponible.':'');if(reason){api.notify(reason);paint();return;}
  const turn=s.turn;pending=true;paint();
  try{await api.assign({id:r.a.id,type:m.type,target:r.target,useCredits:current.boost});if(selection===current&&api.modal.open&&api.modal.classList.contains('country-inquiry-modal')&&api.state().turn===turn){current.message=`${r.a.name} · ${ACTIONS[m.type].name} : ordre confirmé.`;current.agent=null;current.boost=false;}}
  catch(e){api.notify(e.message);if(selection===current)current.message=e.message;}
  finally{pending=false;refreshCountryInquiry();}
 }
}
function handleInquiryChange(el){if(!selection||pending||!api.modal.open||!api.modal.classList.contains('country-inquiry-modal'))return;if(el.id==='inquiryBoost'){selection.boost=el.checked;selection.message='';paint();}if(el.id==='inquiryProof'){selection.proof=el.value;selection.agent=null;selection.boost=false;selection.message='';paint();}}

 return {initCountryInquiry,openCountryInquiry,refreshCountryInquiry,handleInquiryCommand,handleInquiryChange};
}
const defaultInquiry=createCountryInquiryController();
export const initCountryInquiry=(...args)=>defaultInquiry.initCountryInquiry(...args);
export const openCountryInquiry=(...args)=>defaultInquiry.openCountryInquiry(...args);
export const refreshCountryInquiry=(...args)=>defaultInquiry.refreshCountryInquiry(...args);
export const handleInquiryCommand=(...args)=>defaultInquiry.handleInquiryCommand(...args);
export const handleInquiryChange=(...args)=>defaultInquiry.handleInquiryChange(...args);

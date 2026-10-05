import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {INVESTIGATION_STEPS,investigationSteps,investigationProgressMarkup} from '../dist/client/investigation-steps.js';
import {ACTION_GROUPS} from '../dist/client/presentation.js';
import {INQUIRY_ACTIONS,countryTargetButtons,inquiryCandidate,inquiryModel,inquiryRequirements,inquiryCompleted,threatInquiryModel,countryThreatButtons,initCountryInquiry,openCountryInquiry,handleInquiryCommand,handleInquiryChange} from '../dist/client/country-inquiry.js';
const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);
const local=s=>{const t=E.knownTargets(s)[0],a=E.team(s)[0];a.country=t.country;return {t,a,f:s.factions.FR};};

test('Only local agents are offered, with HQ filtering for evidence verification',()=>{
 const s=fresh(),{t,a}=local(s),b=E.team(s)[1];
 assert.deepEqual(inquiryModel(s,t.id,'surveil').rows.map(r=>r.a.id),[a.id]);
 assert.ok(inquiryModel(s,t.id,'analyze').rows.every(r=>r.a.country===s.player));
 b.country=t.country;b.task={type:'travel',remaining:1,queued:false};
 assert.ok(!inquiryModel(s,t.id,'surveil').rows.some(r=>r.a.id===b.id));
});
test('Threat buttons only expose announced active local attacks; protection uses local agents and engine rules',()=>{
 const s=fresh(),p=E.visiblePlots(s)[0],a=E.team(s)[0];assert.ok(p);a.country=p.country;
 const html=countryThreatButtons(s,p.country);assert.match(html,new RegExp('data-id="'+p.id+'"'));assert.match(html,new RegExp('fin du tour '+p.turn));
 const m=threatInquiryModel(s,p.id);assert.equal(m.type,'protect');assert.ok(m.rows.every(r=>r.a.country===p.country));
 const r=m.rows.find(r=>r.a.id===a.id);assert.equal(r.o.chance,E.options(s,a.id,'protect',p.country).chance);assert.equal(r.target,p.country);
 E.assign(s,a.id,'protect',r.target);assert.equal(a.task.type,'protect');
 p.cancelled=true;assert.equal(threatInquiryModel(s,p.id),null);assert.ok(!countryThreatButtons(s,p.country).includes('data-id="'+p.id+'"'));
});
test('Compact controller switches actions, opens portraits, and assigns only protection from threats',async()=>{
 const s=fresh(),{t,a}=local(s);let html='',opened=null,assigned=null,readOnly='';
 const modal={open:false,className:'',classList:{contains:c=>modal.className===c},close(){this.open=false;},querySelector(q){return q==='.inquiry-body'?{scrollTop:0}:q==='.country-inquiry'?{remove(){html='';}}:null;},insertAdjacentHTML(_,value){html+=value;}};
 const previous=globalThis.document;globalThis.document={activeElement:null};
 try{
  initCountryInquiry({state:()=>s,modal,readOnlyReason:()=>readOnly,notify(){},showModal(h,c){html=h;modal.className=c;modal.open=true;},openAgent(id){assert.equal(modal.open,false);opened=id;},async assign(p){assigned=p;E.assign(s,p.id,p.type,p.target,p.useCredits);}});
  openCountryInquiry(t.id);assert.match(html,/inquiry-step-rail/);assert.doesNotMatch(html,/id="inquiryAction"/);
  await handleInquiryCommand('inquiry-step','intervention');
  assert.match(html,/data-id="prepare"/);assert.match(html,/Optionnel · une fois par pays/);
  await handleInquiryCommand('inquiry-substep','locate');assert.match(html,/data-id="surveil" aria-pressed="true"/);
  await handleInquiryCommand('inquiry-step','proofs');assert.match(html,/data-id="collect"/);assert.doesNotMatch(html,/data-id="analyze"/);
  await handleInquiryCommand('inquiry-step','access');assert.match(html,/data-id="contacts"/);assert.match(html,/data-id="drone"/);assert.doesNotMatch(html,/data-id="intimidate"/);
  await handleInquiryCommand('inquiry-action','analyze');assert.match(html,/data-id="validation" aria-pressed="true"/);assert.match(html,/vérifier la deuxième/);
  await handleInquiryCommand('inquiry-step','access');
  await handleInquiryCommand('inquiry-open-agent',a.id);assert.equal(opened,a.id);
  const plot=E.visiblePlots(s)[0];a.country=plot.country;
  await handleInquiryCommand('country-threat',plot.id);assert.match(html,/Protéger une infrastructure/);assert.doesNotMatch(html,/id="inquiryAction"/);
  await handleInquiryCommand('inquiry-action','arrest');await handleInquiryCommand('inquiry-agent',a.id);
  readOnly='Observateur';await handleInquiryCommand('inquiry-confirm');assert.equal(assigned,null);
  readOnly='';await handleInquiryCommand('inquiry-confirm');assert.equal(assigned.type,'protect');assert.equal(assigned.target,plot.country);assert.equal(modal.open,true);
 }finally{globalThis.document=previous;}
});

test('Country actions follow dropdown order and expose only known local active targets',()=>{
 assert.deepEqual(INQUIRY_ACTIONS,ACTION_GROUPS.flatMap(([,ids])=>ids).filter(id=>INQUIRY_ACTIONS.includes(id)));
 const s=fresh(),{t}=local(s),html=countryTargetButtons(s,t.country);
 assert.match(html,new RegExp('data-id="'+t.id+'"'));assert.match(html,/country-inquiry/);
 for(const target of s.suspects.filter(x=>!E.dossier(s,s.player,x.id)))assert.ok(!html.includes('data-id="'+target.id+'"'));
 assert.doesNotMatch(html,new RegExp('fracture/'+(t.templateId??t.id)+'.png'));
 s.factions.FR.known[t.id].identified=true;assert.match(countryTargetButtons(s,t.country),new RegExp('fracture/'+(t.templateId??t.id)+'.png'));
 s.suspects.find(x=>x.id===t.id).arrested=true;assert.ok(!countryTargetButtons(s,t.country).includes('data-id="'+t.id+'"'));
});
test('Local country actions cannot silently execute in the selected agent’s other country',()=>{
 const s=fresh(),{t,a}=local(s);a.country='FR';
 for(const type of ['contacts','authorize','influence','drone'])assert.match(inquiryCandidate(s,t,type,a).reason,/Déplacement nécessaire/);
 a.country=t.country;a.task={type:'rest',remaining:2};assert.match(inquiryCandidate(s,t,'collect',a).reason,/En mission/);
});
test('Verification remains scoped to the dossier, with a free analyst at headquarters',()=>{
 const s=fresh(),{t,a,f}=local(s),other=s.suspects.find(x=>x.id!==t.id);
 f.evidence=[{id:other.id+'-e0',verified:false}];a.country='FR';
 assert.match(inquiryCandidate(s,t,'analyze',a).reason,/Aucune pièce de ce dossier/);
 f.evidence.push({id:t.id+'-e0',verified:false});
 let r=inquiryCandidate(s,t,'analyze',a);assert.equal(r.reason,'');assert.equal(r.target,t.id+'-e0');
 E.assign(s,a.id,'analyze',r.target);const b=E.team(s)[1];assert.match(inquiryCandidate(s,t,'analyze',b).reason,/Aucune pièce de ce dossier/);
});
test('Displayed chances and single boost use the engine; completed steps stay distinct',()=>{
 const s=fresh(),{t,a,f}=local(s);f.access[t.country]=true;f.budget=50;
 assert.equal(inquiryCompleted(s,t,'contacts'),'Contact activé');
 for(const type of ['collect','surveil','hack'])for(const boost of [false,true]){
  const r=inquiryCandidate(s,t,type,a,null,boost),o=E.options(s,a.id,type,t.id,boost);
  assert.equal(r.o.chance,o.chance);assert.equal(r.o.cost,boost?E.ECONOMY.boostCost:0);assert.equal(r.o.duration,o.duration);
 }
 const r=inquiryCandidate(s,t,'collect',a);E.assign(s,a.id,'collect',r.target);assert.equal(a.task.chance,r.o.chance);
 assert.ok(inquiryModel(s,t.id,'collect').rows.find(r=>r.a.id===a.id).reason);
});
test('Arrest prerequisites allow the engine’s clandestine path without a mandate',()=>{
 const s=fresh(),{t,a,f}=local(s);Object.assign(f.known[t.id],{identified:true,prepared:true,locationUntil:8});
 f.evidence=[{id:t.id+'-e0',verified:true},{id:t.id+'-e1',verified:false}];delete f.authorized[t.country];
 const updated=E.knownTargets(s).find(x=>x.id===t.id),r=inquiryCandidate(s,updated,'arrest',a);
 assert.equal(r.reason,'');assert.equal(r.o.clandestine,true);assert.ok(inquiryRequirements(s,updated,'arrest').every(x=>x.done));
 f.known[t.id].locationUntil=0;const expired=E.knownTargets(s).find(x=>x.id===t.id);
 assert.ok(inquiryCandidate(s,expired,'arrest',a).reason);assert.ok(inquiryRequirements(s,expired,'arrest').some(x=>!x.done&&x.action==='surveil'));
});

test('Five-stage path keeps optional second verification and mandate independent of completion',()=>{
 assert.deepEqual(INVESTIGATION_STEPS.map(x=>x.id),['access','proofs','validation','intervention','arrest']);
 assert.deepEqual(INVESTIGATION_STEPS[0].actions,['contacts','influence','drone']);
 const s=fresh(),{t,a,f}=local(s);f.access[t.country]=true;
 f.evidence=[{id:t.id+'-e0',verified:true},{id:t.id+'-e1',verified:false}];
 Object.assign(f.known[t.id],{identified:false,prepared:true,locationUntil:8});
 const updated=E.knownTargets(s).find(x=>x.id===t.id),p=investigationSteps(s,updated);
 assert.equal(p.steps[2].done,true);assert.equal(p.steps[2].available,true);assert.equal(p.steps[3].done,true);assert.equal(p.steps[4].available,true);assert.equal(p.mandate,false);
 assert.equal(E.options(s,a.id,'arrest',t.id).error,null);
 assert.equal(E.nextOperation(s,updated).type,'arrest');
 assert.doesNotMatch(investigationProgressMarkup(s,updated),/Identit|Identifier|identifi/);
 f.evidence[1].verified=true;assert.equal(investigationSteps(s,updated).steps[2].available,false);
});

test('Parallel collection produces two distinct proofs; both can be verified in the same turn',()=>{
 const s=fresh(),{t,a,f}=local(s),b=E.team(s)[1];
 s.humanFactions=Object.keys(s.factions);s.plots=[];s.threatReports=[];s.fracture.cells.forEach(c=>c.resources=0);
 b.country=t.country;f.access[t.country]=true;
 for(const agent of [a,b]){const r=inquiryCandidate(s,t,'collect',agent);assert.equal(r.reason,'');E.assign(s,agent.id,'collect',r.target);agent.task.chance=100;agent.task.remaining=1;}
 E.advance(s);assert.equal(E.evidenceFor(s,s.player,t.id).length,2);assert.equal(new Set(f.evidence.map(x=>x.id)).size,2);assert.equal(f.known[t.id].identified,true);
 for(const agent of [a,b]){agent.country=s.player;agent.fatigue=0;const r=inquiryCandidate(s,t,'analyze',agent);assert.equal(r.reason,'');E.assign(s,agent.id,'analyze',r.target);}
 assert.notEqual(a.task.target,b.task.target);
});

test('Dossier stays on the chosen mission for two consecutive agent assignments',async()=>{
 for(const type of ['prepare','arrest']){
 const s=fresh(),{t,a,f}=local(s),b=E.team(s)[1];b.country=t.country;f.access[t.country]=true;
 f.evidence=[{id:t.id+'-e0',verified:true},{id:t.id+'-e1',verified:false}];Object.assign(f.known[t.id],{identified:false,prepared:type==='arrest',locationUntil:8});
 let html='';const modal={open:false,className:'',classList:{contains:c=>modal.className===c},close(){this.open=false;},querySelector(q){return q==='.inquiry-body'?{scrollTop:0}:q==='.country-inquiry'?{remove(){html='';}}:null;},insertAdjacentHTML(_,value){html+=value;}};
 const previous=globalThis.document;globalThis.document={activeElement:null};
 try{
 initCountryInquiry({state:()=>s,modal,readOnlyReason:()=>'',notify(){},showModal(h,c){html=h;modal.className=c;modal.open=true;},openAgent(){},async assign(p){E.assign(s,p.id,p.type,p.target,p.useCredits);}});
 openCountryInquiry(t.id);await handleInquiryCommand('inquiry-action',type);
 for(const agent of [a,b]){await handleInquiryCommand('inquiry-agent',agent.id);await handleInquiryCommand('inquiry-confirm');assert.equal(agent.task.type,type);assert.equal(agent.task.target,t.id);assert.equal(modal.open,true);}
 assert.match(html,/Missions affectées · 2/);
 }finally{globalThis.document=previous;}
 }
});

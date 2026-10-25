import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {createTutorialGame,tutorialObjective,validateTutorialGame,readTutorialProgress,saveTutorialProgress,TUTORIAL_MISSIONS} from '../dist/client/tutorial.js';
import {tutorialOrderError} from '../dist/client/tutorial-rules.js';
import {threatInquiryModel} from '../dist/client/country-inquiry.js';
function play(s,{favor='medical',swap=false}={}){
 if(s.tutorial.mission==='hostile'&&!s.factions.FR.lastFavor)E.requestGovernmentFavor(s,favor);
 for(let n=0;n<30;n++){
  const o=tutorialObjective(s);if(o.done||o.failed)return s;
  for(const type of o.tech||[])E.activateTech(s,type);
  for(const x of o.orders){const agentId=swap&&s.tutorial.mission==='hostile'?x.agentId==='p0'?'p14':x.agentId==='p14'?'p0':x.agentId:x.agentId;
   if(s.agents.find(a=>a.id===agentId).task)continue;
   const choice=E.options(s,agentId,x.type,x.target);assert.equal(choice.error,null,`${s.tutorial.mission} T${s.turn} ${agentId} ${x.type}`);assert.equal(choice.chance,100);
   E.assign(s,agentId,x.type,x.target);s=validateTutorialGame(s);
  }
  E.advance(s);s=validateTutorialGame(s);
 }
 throw Error('Exercise never completed');
}
test('Independent tutorials; all advanced missions finish with normal actions and reload after every order',()=>{
 assert.equal(TUTORIAL_MISSIONS.length,15);
 for(const id of ['countdown','longrange','hostile']){
  const s=play(createTutorialGame(id));assert.equal(tutorialObjective(s).done,true);assert.equal(s.ended,null);assert.deepEqual(Object.keys(s.factions),['FR']);assert.equal(s.turn,{countdown:5,longrange:4,hostile:6}[id]);
  assert.ok(s.operationReports.every(r=>r.chance===100&&r.status==='RÉUSSITE'&&!r.withoutObject));assert.throws(()=>E.advance(s),/Exercice terminé/);assert.throws(()=>E.validateSave(s),/incompatible/);
 }
});
test('Countdown begins covered now but uncovered at the attack; travel and real two-turn protection intercept for 4 points',()=>{
 let s=createTutorialGame('countdown');assert.equal(s.factions.FR.defense.DE,1);assert.equal(s.plots[0].turn,4);
 assert.deepEqual(tutorialObjective(s).orders.map(o=>o.type),['travel','collect','analyze']);
 E.assign(s,'p0','travel','DE');E.advance(s);const model=threatInquiryModel(s,'filigrane-berlin');assert.ok(model.rows.some(r=>r.a.id==='p0'&&!r.reason));
 assert.equal(E.options(s,'p0','protect').duration,2);E.assign(s,'p0','protect');E.advance(s);assert.equal(s.factions.FR.defense.DE,1);E.advance(s);assert.equal(s.factions.FR.defense.DE,6);
 s=play(s);assert.equal(s.credited['filigrane-berlin:FR'],'FR');assert.equal(s.prestigeLedger.find(r=>r.key==='filigrane-berlin:FR').points,4);
 const missed=createTutorialGame('countdown');while(missed.turn<=4)E.advance(missed);assert.equal(tutorialObjective(missed).failed,true);assert.equal(missed.attackReports[0].status,'RÉUSSIE');assert.equal(createTutorialGame('countdown').turn,1);
});
test('Logistics and relay use actual budgets, slots, durations, cancellation and lasting localization',()=>{
 let s=createTutorialGame('longrange'),f=s.factions.FR;
 assert.equal(E.travelTurns('FR','JP'),2);assert.match(E.options(s,'p0','travel','JP').error,/Logistique/);assert.match(E.options(s,'p12','surveil','s0').error,/Relais/);
 const logistics=E.activateTech(s,'logistics');E.activateTech(s,'relay');assert.equal(f.budget,1);assert.equal(E.getTechSlots(s,'FR'),2);assert.throws(()=>E.activateTech(s,'guard'));
 E.assign(s,'p0','travel','JP');E.assign(s,'p14','travel','JP');assert.equal(s.agents.find(a=>a.id==='p0').task.total,1);
 E.cancelTech(s,logistics.id);assert.equal(s.agents.find(a=>a.id==='p0').task,null);assert.equal(f.budget,4);E.activateTech(s,'logistics');
 E.assign(s,'p0','travel','JP');E.assign(s,'p14','travel','JP');E.assign(s,'p12','surveil','s0');E.advance(s);assert.equal(f.known.s0.locationUntil,6);
 assert.equal(s.operationReports.filter(r=>r.type==='travel'&&r.logisticsApplied&&r.duration===1).length,2);
 E.advance(s);assert.equal(f.tech.length,0);assert.equal(f.known.s0.locationUntil,6);s=play(validateTutorialGame(s));assert.equal(tutorialObjective(s).done,true);
 const cancelled=createTutorialGame('longrange');const relay=E.activateTech(cancelled,'relay');E.assign(cancelled,'p12','surveil','s0');E.advance(cancelled);E.cancelTech(cancelled,relay.id);assert.equal(cancelled.factions.FR.known.s0.locationUntil,4);
});
test('Hostile supports funding or medical, different agents, real cooldown and cooperation changes',()=>{
 for(const favor of ['funding','medical'])for(const swap of [false,true]){const s=play(createTutorialGame('hostile'),{favor,swap});assert.equal(tutorialObjective(s).done,true);assert.ok(s.factions.FR.cooperation.TR>=1);assert.equal(s.campaignStats.support.FR.government[favor].count,1);assert.ok(s.operationReports.some(r=>r.type==='influence'));assert.ok(s.operationReports.some(r=>['rest','fieldRest'].includes(r.type)));}
 const s=createTutorialGame('hostile');E.requestGovernmentFavor(s,'funding');assert.equal(s.factions.FR.budget,6);assert.equal(s.factions.FR.confidence,25);assert.throws(()=>E.requestGovernmentFavor(s,'medical'),/tour 3/);assert.equal(E.governmentOptions(s,'diplomacy','DE').error,'Les faveurs gouvernementales sont hors de cet exercice.');
 assert.equal(tutorialOrderError(s,'p12','influence'),null);assert.ok(tutorialOrderError(s,'p12','collect','s1'));assert.throws(()=>E.activateTech(s,'relay'));assert.throws(()=>E.assign(s,'p12','travel','JP'));
});
test('Advanced saves persist separately, preserve earlier lessons and reject unsupported modules or altered attacks',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};let p=readTutorialProgress(storage);
 for(const id of ['contact','countdown','longrange','hostile']){const s=createTutorialGame(id);if(id==='longrange')E.activateTech(s,'relay');p=saveTutorialProgress(storage,s,p);}
 const loaded=readTutorialProgress(storage);assert.equal(loaded.warning,false);assert.deepEqual(Object.keys(loaded.sessions),['contact','countdown','longrange','hostile']);
 const bad=createTutorialGame('countdown');bad.plots[0].turn=7;assert.throws(()=>validateTutorialGame(bad));const tech=createTutorialGame('contact');tech.factions.FR.tech.push({type:'relay',country:'FR',until:2});assert.throws(()=>validateTutorialGame(tech));
});

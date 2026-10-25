import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {createTutorialGame,tutorialObjective,validateTutorialGame,readTutorialProgress,saveTutorialProgress,TUTORIAL_MISSIONS} from '../dist/client/tutorial.js';
import {tutorialGuide} from '../dist/client/tutorial-ui.js';
function play(value,{skipAnalysis=false,skipInfluence=false}={}){
 let s=validateTutorialGame(value);
 for(let i=0;i<35;i++){
  const o=tutorialObjective(s);if(o.done||o.failed)return s;
  for(const type of o.tech||[])if(!s.factions.FR.tech.some(t=>t.type===type&&t.until>=s.turn))E.activateTech(s,type);
  for(const x of o.orders){if(s.agents.find(a=>a.id===x.agentId).task||skipAnalysis&&x.type==='analyze'&&s.factions.FR.evidence.some(e=>e.verified)||skipInfluence&&x.type==='influence')continue;
   const choice=E.options(s,x.agentId,x.type,x.target);assert.equal(choice.error,null,`${s.tutorial.mission} T${s.turn} ${JSON.stringify(x)}`);assert.equal(choice.chance,100);
   E.assign(s,x.agentId,x.type,x.target);s=validateTutorialGame(s);
  }
  E.advance(s);s=validateTutorialGame(s);
 }
 throw Error('Training did not finish');
}
test('Three new lessons resolve on the real engine with isolated saves and parallel opening orders',()=>{
 assert.equal(TUTORIAL_MISSIONS.length,9);
 const openings={stealth:['sneak','authorize','findSafehouse'],digital:['drone','cyberSupport','findSafehouse'],finale:['protect','collect','authorize','analyze']};
 for(const id of Object.keys(openings)){
  const s=createTutorialGame(id);assert.deepEqual(tutorialObjective(s).orders.map(o=>o.type),openings[id]);const done=play(s);
  assert.equal(tutorialObjective(done).done,true);assert.equal(done.turn,{stealth:4,digital:6,finale:5}[id]);assert.deepEqual(Object.keys(done.factions),['FR']);assert.ok(done.operationReports.every(r=>r.status==='RÉUSSITE'&&r.chance===100&&!r.withoutObject));assert.throws(()=>E.validateSave(done),/incompatible/);
 }
});
test('Stealth keeps the weapon and removes exposure while safehouse work advances separately',()=>{
 const s=createTutorialGame('stealth');E.assign(s,'p14','sneak','TR');E.assign(s,'p12','findSafehouse');E.assign(s,'p0','authorize');E.advance(s);
 const lei=s.agents.find(a=>a.id==='p14');assert.equal(lei.country,'TR');assert.equal(lei.exposure,0);assert.equal(lei.weapon,true);assert.ok(s.factions.FR.safehouses.includes('TR'));
 const done=play(s);assert.ok(done.agents.find(a=>a.id==='p12').exposure<20);assert.ok(done.operationReports.some(r=>r.type==='fieldRest'));assert.ok(done.operationReports.some(r=>r.type==='hide'));
});
test('Drone opens access without a proof; hack is active for the subsequent intrusion and verification is parallel',()=>{
 let s=createTutorialGame('digital');for(const x of tutorialObjective(s).orders)E.assign(s,x.agentId,x.type,x.target);
 assert.equal(E.getTechSlots(s,'FR'),1);E.advance(s);assert.equal(E.getTechSlots(s,'FR'),0);assert.equal(s.factions.FR.evidence.length,1);assert.equal(s.factions.FR.access.TR,true);assert.equal(s.factions.FR.cyberSupport.TR.from,2);
 const orders=tutorialObjective(s).orders;assert.ok(orders.some(o=>o.type==='hack'));assert.ok(orders.some(o=>o.type==='analyze'));
 const option=E.options(s,'p12','hack','s0');assert.ok(option.explanations.some(t=>t.includes('Hack d’un pays +10')));s=play(s);assert.equal(tutorialObjective(s).done,true);
});
test('Final lesson resolves the actual attack and flight deadlines, including useful failure states',()=>{
 const done=play(createTutorialGame('finale'));assert.equal(done.credited['filigrane-final:FR'],'FR');assert.ok(done.suspects[0].arrested);assert.equal(done.prestigeLedger.find(e=>e.key==='filigrane-final:FR').points,4);
 const miss=createTutorialGame('finale');for(let t=0;t<4;t++)E.advance(miss);assert.equal(tutorialObjective(miss).failed,true);assert.throws(()=>E.advance(miss),/Exercice terminé/);
 const flight=createTutorialGame('finale');E.assign(flight,'p0','protect');for(let t=0;t<6;t++)E.advance(flight);assert.equal(flight.suspects[0].country,'JP');assert.equal(tutorialObjective(flight).failed,true);
});
test('Mission 5 recovers an exhausted operative instead of suggesting an impossible action',()=>{
 const s=createTutorialGame('longrange');s.agents.find(a=>a.id==='p12').fatigue=100;
 assert.equal(tutorialObjective(s).orders.find(o=>o.agentId==='p12').type,'hide');assert.equal(tutorialObjective(play(s)).done,true);
 const cancelled=createTutorialGame('longrange');const logistics=E.activateTech(cancelled,'logistics');E.activateTech(cancelled,'relay');E.assign(cancelled,'p0','travel','JP');E.assign(cancelled,'p14','travel','JP');E.cancelTech(cancelled,logistics.id);assert.equal(cancelled.agents.find(a=>a.id==='p0').task,null);assert.equal(tutorialObjective(play(cancelled)).done,true);
});
test('Mission 6 accepts one verified proof after arrest and resumes existing arrested saves without impossible analysis',()=>{
 const s=createTutorialGame('hostile');E.requestGovernmentFavor(s,'medical');const done=play(s,{skipAnalysis:true});assert.equal(tutorialObjective(done).done,true);assert.equal(done.factions.FR.evidence.filter(e=>e.verified).length,1);assert.equal(E.evidenceQueue(done,'FR').length,0);
 const oldProgress={version:1,completed:[],sessions:{hostile:done}},storage={getItem:()=>JSON.stringify(oldProgress)};assert.ok(readTutorialProgress(storage).completed.includes('hostile'));
 done.factions.FR.cooperation.TR=0;const resumed=validateTutorialGame(done);assert.equal(tutorialObjective(resumed).done,false);assert.ok(tutorialObjective(resumed).orders.some(o=>o.type==='influence'));assert.ok(!tutorialObjective(resumed).orders.some(o=>o.type==='analyze'));assert.equal(tutorialObjective(play(resumed)).done,true);
});
test('Mission 6 returns a displaced analyst to headquarters and does not duplicate assigned analysis',()=>{
 let s=createTutorialGame('hostile');E.requestGovernmentFavor(s,'funding');E.assign(s,'p15','travel','TR');E.advance(s);
 assert.ok(tutorialObjective(s).orders.some(o=>o.agentId==='p15'&&o.type==='travel'&&o.target==='FR'));s=play(s);assert.equal(tutorialObjective(s).done,true);
 const queued=createTutorialGame('hostile');E.assign(queued,'p15','analyze','s0-e0');assert.ok(!tutorialObjective(queued).orders.some(o=>o.type==='analyze'));
});
test('The compact guide can minimize an active or finished lesson and retains detailed instructions separately',()=>{
 for(const s of [createTutorialGame('longrange'),play(createTutorialGame('stealth'))]){const html=tutorialGuide(s,true);assert.match(html,/is-collapsed/);assert.match(html,/id="tutorialDirections" hidden/);assert.match(html,/aria-label="Agrandir le guide" aria-expanded="false"/);assert.match(html,/Instructions/);}
 const html=tutorialGuide(createTutorialGame('longrange'));assert.match(html,/Minimiser le guide/);assert.match(html,/Logistique prioritaire · 3 cr/);assert.doesNotMatch(html,/Au même tour : IRIS et LEI/);
});
test('All nine progress slots survive save/reload independently',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};let p=readTutorialProgress(storage);
 for(const m of TUTORIAL_MISSIONS)p=saveTutorialProgress(storage,createTutorialGame(m.id),p);
 const loaded=readTutorialProgress(storage);assert.equal(loaded.warning,false);assert.equal(Object.keys(loaded.sessions).length,9);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {createTutorialGame,validateTutorialGame,tutorialObjective} from '../dist/client/tutorial.js';
import {tutorialPendingOrders,tutorialAgentPlan,tutorialHint} from '../dist/client/tutorial-rules.js';
import {tutorialGuide} from '../dist/client/tutorial-ui.js';
const firstProof=()=>{const s=createTutorialGame('evidence');E.assign(s,'p12','collect','s0');E.advance(s);E.advance(s);return s;};
test('Second collection and first verification can be staged in either order, cancelled and resumed',()=>{
 for(const reverse of [false,true]){
  let s=firstProof();const orders=tutorialPendingOrders(s);assert.deepEqual(orders.map(o=>o.type),['collect','analyze']);
  assert.match(tutorialHint(s),/BISHOP/);assert.match(tutorialHint(s),/APÉRO/);
  for(const o of reverse?[...orders].reverse():orders){E.assign(s,o.agentId,o.type,o.target);s=validateTutorialGame(s);}
  assert.equal(tutorialPendingOrders(s).length,0);assert.ok(tutorialAgentPlan(s).every(p=>p.status==='Planifié'));
  E.cancel(s,'p15');assert.equal(tutorialPendingOrders(s)[0].type,'analyze');assert.match(tutorialGuide(s),/À affecter/);E.assign(s,'p15','analyze','s0-e0');E.advance(s);
  assert.equal(s.factions.FR.evidence[0].verified,true);assert.equal(s.agents.find(a=>a.id==='p12').task.remaining,1);
  assert.equal(tutorialPendingOrders(s).find(o=>o.agentId==='p15').type,'rest');E.assign(s,'p15','rest');E.advance(s);assert.equal(s.factions.FR.evidence.length,2);assert.equal(s.agents.find(a=>a.id==='p15').fatigue,0);
 }
});
test('Preparation, mandate and location resolve in one turn; arrest still waits for all prerequisites',()=>{
 for(const ids of [['p12','p0','p14'],['p14','p0','p12']]){
  let s=createTutorialGame('arrest');const orders=tutorialObjective(s).orders;
  assert.deepEqual(orders.map(o=>o.type),['prepare','authorize','surveil']);
  for(const id of ids){const o=orders.find(o=>o.agentId===id);E.assign(s,id,o.type,o.target);assert.ok(E.options(s,'p14','arrest','s0').error);s=validateTutorialGame(s);}
  E.advance(s);assert.equal(s.turn,2);assert.equal(s.factions.FR.known.s0.locationUntil,4);assert.equal(E.options(s,'p14','arrest','s0').error,null);
  E.assign(s,'p14','arrest','s0');E.advance(s);assert.equal(tutorialObjective(s).done,true);
 }
});
test('Useful support remains optional and cannot hide an outstanding objective',()=>{
 const s=firstProof();E.assign(s,'p12','collect','s0');E.assign(s,'p15','analyze','s0-e0');E.advance(s);E.advance(s);
 const orders=tutorialObjective(s).orders;assert.equal(orders.find(o=>o.type==='findSafehouse').optional,true);
 E.assign(s,'p12','findSafehouse');assert.equal(tutorialPendingOrders(s)[0].type,'analyze');E.assign(s,'p15','analyze','s0-e1');E.advance(s);assert.ok(E.hasSafehouse(s,'FR','DE'));assert.equal(s.factions.FR.evidence[1].contested,true);
 for(let i=0;i<10&&!tutorialObjective(s).done;i++){for(const o of tutorialObjective(s).orders.filter(o=>!o.optional))if(!s.agents.find(a=>a.id===o.agentId).task)E.assign(s,o.agentId,o.type,o.target);E.advance(s);}
 assert.equal(tutorialObjective(s).done,true);
});
test('Legacy ongoing localization is retained without requesting a duplicate mission',()=>{
 const s=createTutorialGame('arrest');E.assign(s,'p14','surveil','s0');const task=s.agents.find(a=>a.id==='p14').task;s.agents.find(a=>a.id==='p14').task=null;s.agents.find(a=>a.id==='p12').task=task;
 const loaded=validateTutorialGame(s);assert.equal(tutorialObjective(loaded).orders.find(o=>o.type==='surveil').agentId,'p12');assert.ok(!tutorialPendingOrders(loaded).some(o=>o.type==='surveil'));E.advance(loaded);assert.equal(loaded.factions.FR.known.s0.locationUntil,4);
});
test('Waiting agents have an explicit prerequisite instead of a pointless order',()=>{
 const s=createTutorialGame('evidence'),apero=tutorialAgentPlan(s).find(p=>p.agent.id==='p15');assert.equal(apero.order,null);assert.match(apero.text,/attendre la collecte/);assert.match(tutorialGuide(s),/Ordres à coordonner ce tour/);
});

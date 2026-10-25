import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {createTutorialGame,validateTutorialGame,tutorialObjective} from '../dist/client/tutorial.js';
import {inquiryModel} from '../dist/client/country-inquiry.js';
import {tutorialGuide} from '../dist/client/tutorial-ui.js';
import {evidenceRegister} from '../dist/client/command-ui.js';

test('Existing training saves migrate inert factions without changing active orders',()=>{
 const s=createTutorialGame('contact'),normal=E.createConfiguredGame('FR',['p0','p12','p14','p15'],197);
 E.assign(s,'p0','travel','DE');s.factions={...normal.factions,FR:s.factions.FR};s.humanFactions=Object.keys(s.factions);
 const migrated=validateTutorialGame(s);assert.deepEqual(Object.keys(migrated.factions),['FR']);assert.deepEqual(migrated.humanFactions,['FR']);assert.deepEqual(migrated.agents,s.agents);E.advance(migrated);assert.equal(migrated.agents[0].country,'DE');
});
test('Training navigation cannot recruit, buy modules, request favors or waste early lesson turns',()=>{
 const s=createTutorialGame('contact'),before=JSON.stringify(s);
 assert.throws(()=>E.recruit(s,'p1'),/exercice/);assert.throws(()=>E.activateTech(s,'relay','DE'),/formation|exercice/i);assert.ok(E.governmentOptions(s,'funding').error);assert.throws(()=>E.advance(s),/ordre indiqué/);assert.equal(JSON.stringify(s),before);
 const arrest=createTutorialGame('arrest');assert.doesNotThrow(()=>E.advance(arrest));assert.equal(arrest.turn,2);
});
test('Every scripted investigation order is available in the real dossier and resolves there with the designated agent',()=>{
 for(const id of ['contact','evidence','arrest']){
  const s=createTutorialGame(id);
  for(let turn=0;turn<20&&!tutorialObjective(s).done;turn++){
   for(const order of tutorialObjective(s).orders){
    if(s.agents.find(a=>a.id===order.agentId).task)continue;
    if(order.type==='travel')E.assign(s,order.agentId,order.type,order.target);
    else {
     const model=inquiryModel(s,'s0',order.type,order.agentId,order.type==='analyze'?order.target:null);
     assert.ok(model?.selected,`${id}: ${order.type}`);assert.equal(model.selected.reason,'');assert.equal(model.selected.o.chance,100);
     E.assign(s,model.selected.a.id,model.type,model.selected.target);
    }
   }
   E.advance(s);
  }
  assert.equal(tutorialObjective(s).done,true,id);
 }
});
test('Actual evidence register keeps authenticity secret before verification',()=>{
 const s=createTutorialGame('evidence');for(let i=0;i<2;i++){E.assign(s,'p12','collect','s0');E.advance(s);E.advance(s);}
 let html=evidenceRegister(s);assert.equal((html.match(/>EN ATTENTE</g)||[]).length,2);assert.doesNotMatch(html,/>ÉCARTÉE</);
 E.assign(s,'p15','analyze','s0-e0');E.advance(s);E.assign(s,'p15','analyze','s0-e1');E.advance(s);html=evidenceRegister(s);assert.match(html,/>ÉCARTÉE</);assert.match(html,/>VÉRIFIÉE</);
});
test('Guide explains the real controls and contains no substitute order button',()=>{
 const s=createTutorialGame('contact'),html=tutorialGuide(s);assert.match(html,/Sur le globe/);assert.match(html,/Déployer un agent/);assert.doesNotMatch(html,/data-cmd="(?:assign|tutorial-agent|advance)"/);assert.match(tutorialGuide(s,true),/id="tutorialDirections" hidden/);
});

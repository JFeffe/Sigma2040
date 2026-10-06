import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {technologyPanel,selectTechnology} from '../dist/client/technology-ui.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.humanFactions=Object.keys(s.factions);s.factions.FR.budget=20;return s;};
const tick=s=>{s.event=null;E.advance(s);};
function evidence(s){s.factions.FR.evidence.push({id:'s0-e0',verified:false,contested:false});s.agents[0].stats[0]=5;}
test('Cancelled queued and legacy ongoing drones release their operator and slot with full refund and no results',()=>{
 for(const started of [false,true]){const s=fresh(),a=s.agents[0];a.country='TR';E.assign(s,a.id,'drone');if(started){a.task.total=a.task.remaining=2;tick(s);}const budget=s.factions.FR.budget,known=structuredClone(s.factions.FR.known);E.cancel(s,a.id);assert.equal(a.task,null);assert.equal(E.getTechSlots(s,'FR'),0);assert.equal(s.factions.FR.budget,budget);const once=s.factions.FR.budget;E.cancel(s,a.id);assert.equal(s.factions.FR.budget,once);tick(s);assert.equal(s.factions.FR.access.TR,undefined);assert.deepEqual(s.factions.FR.known,known);assert.ok(!(s.operationReports||[]).some(r=>r.agentId===a.id));E.assign(s,a.id,'drone');assert.ok(a.task);}
});
test('Sentry cancellation removes protection, refunds payment, and a subsequent attack is not blocked',()=>{
 const s=fresh();const t=E.activateTech(s,'guard','TR');const budget=s.factions.FR.budget;assert.equal(s.factions.FR.defense.TR,5);E.cancelTech(s,t.id);assert.equal(s.factions.FR.defense.TR,undefined);assert.equal(s.factions.FR.budget,budget+5);assert.equal(E.getTechSlots(s,'FR'),0);assert.throws(()=>E.cancelTech(s,t.id));s.plots=[{id:'cancel-test',country:'TR',turn:1,cell:0,kind:'Test',resolved:false}];tick(s);assert.equal(s.factions.FR.score,0);assert.equal(s.crisis,45);
});
test('Cancelling a sentry preserves other sentries and independently earned protection, including after reload',()=>{
 let s=fresh();s.factions.FR.defense.TR=3;const first=E.activateTech(s,'guard','TR'),second=E.activateTech(s,'guard','TR');s=E.validateSave(structuredClone(s));E.cancelTech(s,first.id);assert.equal(s.factions.FR.defense.TR,5);E.cancelTech(s,second.id);assert.equal(s.factions.FR.defense.TR,3);
 const a=s.agents[0];a.country='TR';const t=E.activateTech(s,'guard','TR');E.assign(s,a.id,'protect');a.task.chance=100;tick(s);tick(s);E.cancelTech(s,t.id);assert.equal(s.factions.FR.defense.TR,5);
});
test('AI cancellation before resolution prevents discovery and removes only its effective uncapped/capped bonus',()=>{
 for(const stat of [5,10]){const s=fresh();evidence(s);s.agents[0].stats[0]=stat;const baseline=E.options(s,'p0','analyze','s0-e0').chance;const t=E.activateTech(s,'ai');E.assign(s,'p0','analyze','s0-e0');const task=s.agents[0].task;E.cancelTech(s,t.id);assert.equal(task.chance,baseline);assert.equal(task.aiBonus,0);assert.ok(s.agents[0].task);assert.equal(E.leadResearch(s).progress,0);E.cancel(s,'p0');tick(s);assert.equal(E.leadResearch(s).progress,0);assert.equal(s.factions.FR.evidence[0].verified,false);}
});
test('AI supports never change earlier assignments; one surviving AI retains the shared bonus',()=>{
 const s=fresh();evidence(s);E.assign(s,'p0','analyze','s0-e0');const base=s.agents[0].task.chance;const t=E.activateTech(s,'ai');E.cancelTech(s,t.id);assert.equal(s.agents[0].task.chance,base);E.cancel(s,'p0');s.factions.FR.budget=30;const a=E.activateTech(s,'ai');assert.throws(()=>E.activateTech(s,'ai'),/déjà actif/);const b={...a,id:'FR-tech-'+(++s.factions.FR.techSerial)};s.factions.FR.tech.push(b);E.assign(s,'p0','analyze','s0-e0');const supported=s.agents[0].task.chance;E.cancelTech(s,a.id);assert.equal(s.agents[0].task.chance,supported);const saved=E.validateSave(structuredClone(s));E.cancelTech(saved,b.id);assert.equal(saved.agents[0].task.chance,base);
});
test('Active AI researches once at resolution; cancelled supports cannot be replayed or cancel foreign support',()=>{
 const s=fresh();const t=E.activateTech(s,'ai');assert.equal(E.leadResearch(s).progress,0);tick(s);assert.equal(E.leadResearch(s).progress,1);tick(s);assert.equal(E.leadResearch(s).progress,1);s.player='US';assert.throws(()=>E.cancelTech(s,t.id));s.player='FR';E.cancelTech(s,t.id);assert.equal(E.leadResearch(s).progress,1);
});
test('Legacy supports get durable ids and cancelled legacy sentries leave no ghost defense',()=>{
 const s=fresh(),f=s.factions.FR;delete f.defenseBase;delete f.techSerial;f.tech=[{type:'guard',country:'TR',until:5},{type:'ai',country:'FR',until:6}];f.defense.TR=5;const saved=E.validateSave(structuredClone(s));assert.ok(saved.factions.FR.tech.every(t=>t.id));E.cancelTech(saved,saved.factions.FR.tech[0].id);assert.equal(saved.factions.FR.defense.TR,undefined);E.validateSave(structuredClone(saved));
});
test('Console offers direct AI activation and retains cancellation of legacy sentries',()=>{
 const s=fresh();let html=technologyPanel(s,'TR');assert.match(html,/data-tech-drop/);assert.match(html,/Confirmer · 2 crédits/);const t=E.activateTech(s,'guard','TR');html=technologyPanel(s,'TR');assert.match(html,new RegExp('data-id="'+t.id+'"'));assert.match(html,/cancel-tech/);selectTechnology('guard');html=technologyPanel(s,'TR');assert.doesNotMatch(html,/guardCountry/);selectTechnology('drone');html=technologyPanel(s,'TR');assert.doesNotMatch(html,/consoleDroneAgent|console-config/);
});
test('Cancelling digital support removes its bonus without cancelling independent missions and refunds its cost',()=>{
 const s=fresh(),a=s.agents[0],f=s.factions.FR;a.country='TR';a.stats=[5,5,5];a.talents=[];const base=E.options(s,a.id,'contacts').chance;f.cyberSupport.TR={from:1,until:3};E.assign(s,a.id,'contacts');assert.equal(a.task.chance,base+10);const budget=f.budget;E.cancelCyberSupport(s,'TR');assert.ok(a.task);assert.equal(a.task.chance,base);assert.equal(f.budget,budget+2);assert.equal(f.cyberSupport.TR,undefined);assert.throws(()=>E.cancelCyberSupport(s,'TR'));
});
test('Legacy analysis bonus is removed on cancellation without cancelling the analyst',()=>{
 const s=fresh();evidence(s);const base=E.options(s,'p0','analyze','s0-e0').chance;const t=E.activateTech(s,'ai');E.assign(s,'p0','analyze','s0-e0');delete s.agents[0].task.aiBonus;E.cancelTech(s,t.id);assert.equal(s.agents[0].task.chance,base);assert.ok(s.agents[0].task);
});
test('Refunds preserve paid technology prices including event audits and old saves',()=>{
 for(const legacy of [false,true]){
  const s=fresh();s.turn=9;E.activateTech(s,'ai');const f=s.factions.FR,t=f.tech[0];assert.equal(f.budget,18);assert.equal(t.cost,2);if(legacy)delete t.cost;
  const saved=E.validateSave(structuredClone(s));E.cancelTech(saved,t.id);assert.equal(saved.factions.FR.budget,20);assert.throws(()=>E.cancelTech(saved,t.id));assert.equal(saved.factions.FR.budget,20);
 }
 const s=fresh(),t=E.activateTech(s,'ai');assert.equal(s.factions.FR.budget,18);E.cancelTech(s,t.id);assert.equal(s.factions.FR.budget,20);
});
test('Reserves above the income cap survive cancellation, next turn and reload',()=>{
 const s=fresh(),a=s.agents[0];a.country='TR';E.assign(s,a.id,'drone',null,true);s.factions.FR.budget=30;E.cancel(s,a.id);assert.equal(s.factions.FR.budget,36);tick(s);assert.equal(s.factions.FR.budget,36);assert.equal(E.validateSave(structuredClone(s)).factions.FR.budget,36);
});
test('Digital support stores and refunds the total paid for its active extensions exactly once',()=>{
 const s=fresh(),a=s.agents[0];for(let i=0;i<2;i++){E.assign(s,a.id,'cyberSupport','TR');a.task.chance=100;tick(s);}const f=s.factions.FR;assert.equal(f.cyberSupport.TR.cost,0);const before=f.budget;E.cancelCyberSupport(s,'TR');assert.equal(f.budget,before);assert.throws(()=>E.cancelCyberSupport(s,'TR'));assert.equal(f.budget,before);
});

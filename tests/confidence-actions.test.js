import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.humanFactions=Object.keys(s.factions);return s;};
const tick=s=>{s.event=null;s.eventsByFaction={};E.advance(s);};
test('Confidence starts at twenty; successful risk actions reward once at completion even with zero credits',()=>{
 const s=fresh(),f=s.factions.FR,a=E.team(s)[0];assert.equal(f.confidence,20);a.country='TR';f.budget=0;E.assign(s,a.id,'contacts');a.task.chance=100;a.task.remaining=2;tick(s);assert.equal(f.confidence,20);tick(s);assert.equal(f.confidence,23);tick(s);assert.equal(f.confidence,23);assert.equal(s.factions.US.confidence,20);
});
test('Failure, automatic recovery and cancelled actions grant no confidence; cap remains 100',()=>{
 const s=fresh(),f=s.factions.FR,a=E.team(s)[0];E.assign(s,a.id,'rest');tick(s);assert.equal(f.confidence,20);a.country='TR';E.assign(s,a.id,'contacts');a.task.chance=0;a.task.remaining=1;tick(s);assert.equal(f.confidence,20);E.assign(s,a.id,'contacts');E.cancel(s,a.id);tick(s);assert.equal(f.confidence,20);f.confidence=99;E.assign(s,a.id,'contacts');a.task.chance=100;a.task.remaining=1;tick(s);assert.equal(f.confidence,100);
});
test('Crossing 50 during resolution immediately earns three credits; favor spending lowers income; saves keep progress',()=>{
 const s=fresh(),f=s.factions.FR,a=E.team(s)[0];f.confidence=47;f.budget=0;a.country='TR';E.assign(s,a.id,'contacts');a.task.chance=100;a.task.remaining=1;tick(s);assert.equal(f.confidence,50);assert.equal(f.budget,3);f.cooperation.TR=2;E.requestGovernmentFavor(s,'diplomacy','TR');assert.equal(f.confidence,35);assert.equal(E.funding(f).income,2);assert.equal(E.governmentOptions(s,'funding').nextTurn,s.turn+2);tick(s);assert.equal(f.budget,5);assert.equal(E.validateSave(structuredClone(s)).factions.FR.confidence,35);
});
test('Arrest credits locator and preparer separately, plus successful operator, without repeating after reload',()=>{
 const s=fresh(),f=s.factions.FR,a=E.team(s)[0],t=s.suspects[0];a.country=t.country;a.weapon=true;f.authorized[t.country]=true;f.known[t.id]={identified:true,country:t.country,locationUntil:10,locBy:'US',prepared:true,prepBy:'CN'};f.evidence=[{id:t.id+'-e0',verified:true,contested:false},{id:t.id+'-e1',verified:true,contested:false}];E.assign(s,a.id,'arrest',t.id);a.task.chance=100;a.task.remaining=1;tick(s);assert.equal(f.confidence,25);assert.equal(s.factions.US.confidence,22);assert.equal(s.factions.CN.confidence,22);const saved=E.validateSave(structuredClone(s));tick(saved);assert.equal(saved.factions.FR.confidence,25);assert.equal(saved.factions.US.confidence,22);assert.equal(saved.factions.CN.confidence,22);
});
test('Proof verification rewards the verifying country, not the first discoverer',()=>{
 const s=fresh(),a=E.team(s)[0],p=s.proofs.find(p=>p.authentic);p.foundBy='US';s.factions.FR.evidence=[{id:p.id,verified:false,contested:false,collectedBy:'US',verifiedBy:null}];E.assign(s,a.id,'analyze',p.id);a.task.chance=100;a.task.remaining=1;tick(s);assert.equal(s.factions.FR.confidence,25);assert.equal(s.factions.US.confidence,20);const saved=E.validateSave(structuredClone(s));tick(saved);assert.equal(saved.factions.US.confidence,20);
});

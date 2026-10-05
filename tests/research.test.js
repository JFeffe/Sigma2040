import test from 'node:test';import assert from 'node:assert/strict';import * as E from '../dist/client/engine.js';
const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);
function counter(s,id='p0',success=true){E.assign(s,id,'counter');s.agents.find(a=>a.id===id).task.chance=success?100:0;}
test('Counter adds two, stacks by best contribution only, preserves overflow and never protects HQ',()=>{
 const s=fresh();s.humanFactions=Object.keys(s.factions);E.activateTech(s,'ai');counter(s);counter(s,'p12');E.advance(s);assert.equal(E.leadResearch(s).progress,2);assert.equal(E.knownTargets(s).length,2);assert.equal(s.factions.FR.defense.FR,undefined);counter(s);E.advance(s);assert.equal(E.knownTargets(s).length,3);assert.equal(E.leadResearch(s).progress,1);assert.deepEqual(E.leadResearch(E.validateSave(structuredClone(s))),E.leadResearch(s));counter(s);E.advance(s);assert.equal(E.knownTargets(s).length,4);assert.equal(E.leadResearch(s).progress,0);
});
test('A failed operation adds no research; migration preserves acquired dossiers',()=>{
 const s=fresh();counter(s,'p0',false);E.advance(s);assert.equal(E.leadResearch(s).progress,0);delete s.factions.FR.leadResearch;const migrated=E.validateSave(JSON.parse(JSON.stringify(s)));assert.equal(E.knownTargets(migrated).length,2);assert.deepEqual(E.leadResearch(migrated),{progress:0,lastTurn:0});migrated.factions.FR.leadResearch.progress=99;assert.throws(()=>E.validateSave(migrated));
});

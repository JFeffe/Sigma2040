import test from 'node:test';import assert from 'node:assert/strict';import * as E from '../dist/client/engine.js';
import {playerView} from '../dist/client/multiplayer-core.js';
import {compactOutcome} from '../dist/client/mission-reveal.js';
const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);
function counter(s,id='p0',success=true){E.assign(s,id,'counter');s.agents.find(a=>a.id===id).task.chance=success?100:0;}
test('Counter and AI gains all add in one turn, preserve overflow and never protect HQ',()=>{
 const s=fresh();s.humanFactions=Object.keys(s.factions);E.activateTech(s,'ai');counter(s);counter(s,'p12');E.advance(s);assert.equal(E.leadResearch(s).progress,2);assert.equal(E.knownTargets(s).length,3);assert.equal(s.factions.FR.defense.FR,undefined);counter(s);E.advance(s);assert.equal(E.knownTargets(s).length,4);assert.equal(E.leadResearch(s).progress,1);assert.deepEqual(E.leadResearch(E.validateSave(structuredClone(s))),E.leadResearch(s));counter(s);E.advance(s);assert.equal(E.knownTargets(s).length,5);assert.equal(E.leadResearch(s).progress,0);
});
test('A failed operation adds no research; migration preserves acquired dossiers',()=>{
 const s=fresh();counter(s,'p0',false);E.advance(s);assert.equal(E.leadResearch(s).progress,0);delete s.factions.FR.leadResearch;const migrated=E.validateSave(JSON.parse(JSON.stringify(s)));assert.equal(E.knownTargets(migrated).length,2);assert.deepEqual(E.leadResearch(migrated),{progress:0,lastTurn:0});migrated.factions.FR.leadResearch.progress=99;assert.throws(()=>E.validateSave(migrated));
});
test('Four successful counters discover two dossiers in one turn and preserve private progress after reload',()=>{
 const s=fresh();s.humanFactions=Object.keys(s.factions);for(const a of E.team(s))counter(s,a.id);E.advance(s);
 assert.equal(E.knownTargets(s).length,4);assert.equal(E.leadResearch(s).progress,2);assert.equal(s.factions.FR.known.s6,undefined);
 const saved=E.validateSave(structuredClone(s)),own=playerView({game:saved,offers:[]},'FR'),other=playerView({game:saved,offers:[]},'US');
 assert.deepEqual(E.leadResearch(own),E.leadResearch(s));assert.equal(other.factions.FR.leadResearch,undefined);assert.deepEqual(other.factions.FR.known,{});
 assert.equal(s.operationReports.filter(r=>r.faction==='FR'&&r.type==='counter'&&r.status==='RÉUSSITE').length,4);
 for(const r of s.operationReports.filter(r=>r.faction==='FR'))assert.match(compactOutcome(r),/Recherche \+2/);
});
test('Old best-gain metadata does not cap a later successful action, including in that same saved turn',()=>{
 const s=fresh();s.humanFactions=Object.keys(s.factions);s.factions.FR.leadResearch={progress:1,lastTurn:s.turn,turnGain:2};
 const loaded=E.validateSave(structuredClone(s));assert.deepEqual(E.leadResearch(loaded),{progress:1,lastTurn:1});counter(loaded);E.advance(loaded);
 assert.equal(E.knownTargets(loaded).length,3);assert.equal(E.leadResearch(loaded).progress,0);assert.deepEqual(E.leadResearch(E.validateSave(structuredClone(loaded))),E.leadResearch(loaded));
});

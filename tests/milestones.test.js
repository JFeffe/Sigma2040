import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {investigationSnapshot,investigationHighlights,milestoneBanner} from '../dist/client/milestones.js';
const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);
test('Milestones group real progress per case and never repeat unchanged stages',()=>{
 const s=fresh(),before=investigationSnapshot(s),k=s.factions.FR.known.s0;k.identified=true;k.prepared=true;k.locationUntil=6;s.factions.FR.evidence=[{id:'s0-e0',verified:true,contested:false},{id:'s0-e1',verified:false,contested:false}];const events=investigationHighlights(before,s);
 assert.equal(events.length,1);assert.equal(events[0].phase,'prepared');assert.equal(events[0].achieved.length,4);assert.deepEqual(investigationHighlights(investigationSnapshot(s),s),[]);
 k.locationUntil=10;assert.equal(investigationHighlights({...investigationSnapshot(s)},s).length,0);
});
test('Hidden authenticity and unknown dossiers cannot produce highlights',()=>{
 const s=fresh(),before=investigationSnapshot(s);s.proofs[0].authentic=false;s.factions.US.known.s5={identified:true,prepared:true,country:'CA',locationUntil:4};assert.deepEqual(investigationHighlights(before,s),[]);
 s.factions.FR.evidence=[{id:'s0-e0',verified:false,contested:false}];assert.deepEqual(investigationHighlights(before,s),[]);
});
test('A collective arrest and cell closure are attributed without claiming a player portrait',()=>{
 const s=fresh(),before=investigationSnapshot(s);for(const id of ['s0','s1']){const t=s.suspects.find(t=>t.id===id);t.arrested=true;t.arrestedBy='US';s.factions.FR.known[id]??={country:t.country};}const events=investigationHighlights(before,s);assert.equal(events.filter(e=>e.phase==='arrested').length,2);assert.equal(events.find(e=>e.phase==='arrested').actor,'États-Unis');assert.ok(events.every(e=>!e.agent));assert.equal(events.filter(e=>e.phase==='cell').length,1);
 const snapshot=JSON.stringify(s);milestoneBanner(events[0],0,events.length);assert.equal(JSON.stringify(s),snapshot);
});
test('Renewing an existing position is quiet, reacquisition after flight is announced',()=>{
 const s=fresh(),k=s.factions.FR.known.s0;k.locationUntil=2;const old=investigationSnapshot(s);k.locationUntil=8;assert.deepEqual(investigationHighlights(old,s),[]);k.locationUntil=0;const lost=investigationSnapshot(s);k.locationUntil=9;assert.equal(investigationHighlights(lost,s)[0].phase,'located');
});

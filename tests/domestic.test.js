import test from 'node:test';import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';import {locationActions} from '../dist/client/presentation.js';
test('A Fracture target at home can be investigated and arrested with the normal prerequisites',()=>{
 const s=E.createGame('FR',['p0','p12','p13','p14'],42),a=s.agents.find(a=>a.id==='p14'),k=s.factions.FR.known.s0;s.suspects[0].country='FR';k.country='FR';
 const allowed=locationActions(a,s).map(([id])=>id);for(const type of ['collect','surveil','prepare','arrest'])assert.ok(allowed.includes(type));
 assert.equal(E.options(s,a.id,'collect','s0').error,null);assert.equal(E.options(s,a.id,'surveil','s0').error,null);
 assert.ok(E.options(s,a.id,'arrest','s0').error);
 s.factions.FR.evidence=[{id:'s0-e0',verified:true,contested:false},{id:'s0-e1',verified:false,contested:false}];k.identified=true;
 assert.equal(E.options(s,a.id,'prepare','s0').error,null);k.prepared=true;k.locationUntil=5;
 assert.equal(E.options(s,a.id,'arrest','s0').error,null);E.assign(s,a.id,'arrest','s0');a.task.chance=100;E.advance(s);assert.ok(s.suspects[0].arrested);
});
test('Foreign power agents are not arrest targets and empty homeland has no target actions',()=>{
 const s=E.createGame('FR',['p0','p12','p13','p14'],42),a=s.agents[0];assert.ok(!locationActions(a,s).some(([id])=>id==='arrest'));assert.ok(E.options(s,a.id,'arrest','US-0').error);
});

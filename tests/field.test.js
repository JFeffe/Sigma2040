import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {locationActions} from '../dist/client/presentation.js';
const fresh=()=>E.createGame('FR',['p0','p1','p2','p3'],55);
const tick=s=>{if(s.event)E.answerEvent(s,1);E.advance(s);};
const finish=(s,a)=>{while(a.task)tick(s);};
test('Service weapons, legal disarming, clandestine carry and automatic HQ rearming',()=>{
 const s=fresh(),a=s.agents[0];assert.equal(a.weapon,true);
 E.assign(s,a.id,'travel','JP');E.cancel(s,a.id);assert.equal(a.weapon,true);
 E.assign(s,a.id,'travel','JP');tick(s);assert.equal(a.weapon,false);assert.throws(()=>E.cancel(s,a.id),/déplacement/);finish(s,a);assert.equal(a.weapon,false);
 E.assign(s,a.id,'equip');a.task.chance=100;finish(s,a);assert.equal(a.weapon,true);
 s.factions.FR.budget=30;E.assign(s,a.id,'sneak','DE');a.task.chance=100;finish(s,a);assert.equal(a.weapon,true);
 E.assign(s,a.id,'travel','FR');finish(s,a);assert.equal(a.weapon,true);assert.equal(a.country,'FR');assert.ok(E.options(s,a.id,'equip').error);
});
test('Planque must succeed, is shared by faction and country, rests less than HQ and persists',()=>{
 const s=fresh(),a=s.agents[0],b=s.agents[1];a.country='DE';a.weapon=false;b.country='DE';a.fatigue=60;
 assert.ok(E.options(s,a.id,'fieldRest').error);assert.ok(locationActions(a).some(([id])=>id==='fieldRest'));assert.match(E.options(s,a.id,'fieldRest').error,/planque/);
 E.assign(s,a.id,'findSafehouse');a.task.chance=0;finish(s,a);assert.equal(a.safehouses.length,0);
 E.assign(s,a.id,'findSafehouse');a.task.chance=100;finish(s,a);assert.deepEqual(a.safehouses,['DE']);assert.equal(E.options(s,b.id,'fieldRest').error,null);
 assert.ok(locationActions(a).some(([id])=>id==='fieldRest'));assert.ok(!locationActions(a).some(([id])=>id==='findSafehouse'));
 a.fatigue=60;E.assign(s,a.id,'fieldRest');finish(s,a);assert.equal(a.fatigue,30);assert.equal(s.operationReports[0].fatigue,-30);
 a.country='CA';assert.ok(E.options(s,a.id,'fieldRest').error);a.country='DE';assert.equal(E.options(s,a.id,'fieldRest').error,null);
 const copy=E.validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(copy.agents[0].safehouses,['DE']);a.country='FR';assert.ok(E.options(s,a.id,'findSafehouse').error);assert.ok(E.options(s,a.id,'fieldRest').error);
});
test('Old saves migrate HQ service weapons once without arming foreign agents',()=>{
 const s=fresh();delete s.equipmentRules;for(const a of s.agents){delete a.safehouses;a.weapon=false;}s.agents[1].country='DE';
 const v=E.validateSave(s);assert.equal(v.agents[0].weapon,true);assert.equal(v.agents[1].weapon,false);assert.deepEqual(v.agents[0].safehouses,[]);
 E.assign(v,'p0','travel','JP');tick(v);const reloaded=E.validateSave(JSON.parse(JSON.stringify(v)));assert.equal(reloaded.agents[0].weapon,false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ROSTER,TALENTS} from '../dist/client/data.js';
const fresh=()=>E.createGame('FR',['p0','p1','p2','p3'],99);
test('Twelve talents, three unique specialties each and approved Iris identity',()=>{
 assert.equal(Object.keys(TALENTS).filter(t=>t!=='chef').length,12);
 for(const a of ROSTER){assert.equal(new Set(a.talents).size,3);assert.ok(a.talents.every(t=>TALENTS[t]));}
 assert.deepEqual(ROSTER[0].stats,[9,4,7]);assert.deepEqual(ROSTER[0].nationalities,['GB']);
});
test('Best base talent plus cumulative languages, homeland bonus and cap',()=>{
 const s=fresh(),a=s.agents[0];a.country='GB';a.stats=[5,5,5];a.cover='Clandestine';
 assert.equal(E.options(s,a.id,'findSafehouse').chance,70);
 a.nationalities=[];assert.equal(E.options(s,a.id,'findSafehouse').chance,70);
 a.talents=['langues'];assert.equal(E.options(s,a.id,'findSafehouse').chance,60);
 a.talents=['diplomatie','langues'];const good=E.options(s,a.id,'authorize').chance;
 a.talents=['diplomatie'];assert.equal(E.options(s,a.id,'authorize').chance,good-5);
 a.nationalities=['GB','DE'];a.talents=['contacts','infiltration','langues'];assert.equal(E.options(s,a.id,'findSafehouse').chance,70);
 a.stats[2]=10;a.cover='Légale';assert.equal(E.options(s,a.id,'findSafehouse').chance,90);
 assert.equal(E.options(s,a.id,'travel','FR').chance,100);
});
test('Nationality applies at clandestine destination and physical operation site for remote support',()=>{
 const s=fresh(),a=s.agents[0];a.nationalities=[];const base=E.options(s,a.id,'sneak','GB').chance;
 a.nationalities=['GB'];assert.equal(E.options(s,a.id,'sneak','GB').chance,base);
 const remote=E.options(s,a.id,'cyberSupport','GB').chance;a.nationalities=[];assert.equal(E.options(s,a.id,'cyberSupport','GB').chance,remote);
});
test('Passives reduce exposure and fatigue; field aid does not boost medical energy recovery',()=>{
 const s=fresh(),a=s.agents[0];a.talents=['infiltration','endurance','secours'];a.fatigue=80;
 assert.equal(E.exposureGain(a,{type:'sneak'},18),15);assert.equal(E.exposureGain(a,{type:'arrest',clandestine:false},18),15);
 assert.equal(E.options(s,a.id,'surveil','s0').fatigue,6);
 a.status='injured';E.assign(s,a.id,'heal');E.advance(s);E.advance(s);assert.equal(a.fatigue,40);assert.equal(a.status,'ready');
});
test('Legacy roster migration retains campaign state and orders; new malformed nationalities fail',()=>{
 const s=fresh();delete s.agentRules;s.agents[0].talents=['diplomatie','charisme','polyglotte','analyse'];s.agents[0].stats=[8,4,8];delete s.agents[0].nationalities;
 E.assign(s,'p1','travel','DE');const task=structuredClone(s.agents[1].task),budget=s.factions.FR.budget;
 const migrated=E.validateSave(s);assert.deepEqual(migrated.agents[0].stats,[9,4,7]);assert.deepEqual(migrated.agents[0].nationalities,['GB','FR']);assert.deepEqual(migrated.agents[1].task,task);assert.equal(migrated.factions.FR.budget,budget);
 assert.deepEqual(E.validateSave(structuredClone(migrated)),migrated);
 migrated.agents[0].nationalities=['GB','GB'];assert.throws(()=>E.validateSave(migrated));
});

import * as E from '../dist/client/engine.js';
import {fixture} from './bb2-priorities.test.js';
import test from 'node:test';import assert from 'node:assert/strict';
for(const stat of [5,10])test(`Exhausted agent chooses recovery route appropriate to safehouse chance (stat ${stat})`,()=>{
 const {s,f,m}=fixture();
 const a=m[1];a.country='DE';a.stats=[stat,stat,stat];a.talents=[];a.cover='Clandestine';a.fatigue=70;
 for(const b of m)if(b!==a)E.assign(s,b.id,'rest');
 const chance=E.options(s,a.id,'findSafehouse').chance;
 E.planFaction(s,'FR');
 assert.equal(a.task.type,chance>=65?'findSafehouse':'hide');
});
test('Planning risk-aware actions consumes no randomness',()=>{
 const {s,m}=fixture();m[1].country='DE';m[1].fatigue=70;
 const rng=s.rng;E.planFaction(s,'FR');assert.equal(s.rng,rng);
});

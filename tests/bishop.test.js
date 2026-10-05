import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ROSTER} from '../dist/client/data.js';
import {portrait,nationalities} from '../dist/client/ui.js';
import {fullBody} from '../dist/client/visuals.js';
const fresh=()=>E.createGame('FR',['p0','p12','p1','p3'],77);
test('Bishop is a thirteenth unique recruit with matching standalone assets',()=>{
 assert.ok(ROSTER.length>=13);const b=ROSTER.find(a=>a.id==='p12');assert.deepEqual(b.stats,[9,6,5]);assert.deepEqual(b.talents,['enquete','infiltration','tactique']);assert.deepEqual(b.nationalities,['US']);assert.ok(portrait(b).includes('bishop-portrait.webp'));assert.ok(fullBody(b).includes('bishop-full.png'));assert.ok(nationalities(b).includes('us.svg'));
 const s=fresh();assert.deepEqual(E.validateSave(structuredClone(s)),s);
});
test('Bishop is strong at investigation with weaker social and intervention success',()=>{
 const s=fresh(),b=s.agents[1];b.country='DE';s.factions.FR.access.DE=true;
 assert.equal(E.options(s,b.id,'collect','s0').chance,88);assert.equal(E.options(s,b.id,'prepare','s0').chance,88);assert.equal(E.options(s,b.id,'sneak','CA').chance,53);assert.equal(E.options(s,b.id,'contacts').chance,52);
 b.country='US';const homeland=E.options(s,b.id,'contacts').chance;b.nationalities=[];assert.equal(homeland,E.options(s,b.id,'contacts').chance);
});
test('Existing campaign can recruit Bishop and preserve him across reload and turns',()=>{
 const s=E.createGame('FR',['p0','p1','p2','p3'],11);E.recruit(s,'p12','p2');E.advance(s);E.advance(s);let b=E.team(s).find(a=>a.id==='p12');assert.ok(b);const loaded=E.validateSave(structuredClone(s));assert.deepEqual(loaded.agents.find(a=>a.id==='p12'),b);E.assign(loaded,'p12','travel','US');E.advance(loaded);if(loaded.event)E.answerEvent(loaded,1);E.advance(loaded);b=loaded.agents.find(a=>a.id==='p12');assert.equal(b.country,'US');assert.deepEqual(b.nationalities,['US','FR']);
});

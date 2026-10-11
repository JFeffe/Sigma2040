import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ROSTER,DISPLAY_ROSTER} from '../dist/client/data.js';
import {portrait,nationalities} from '../dist/client/ui.js';
import {fullBody} from '../dist/client/visuals.js';

test('Amber follows Bishop without changing existing agent IDs',()=>{
 assert.deepEqual(DISPLAY_ROSTER.slice(0,3).map(a=>a.name),['IRIS','BISHOP','AMBER']);
 assert.equal(new Set(ROSTER.map(a=>a.id)).size,ROSTER.length);
 const a=ROSTER.find(a=>a.id==='p13');
 assert.deepEqual(a.stats,[5,7,8]);assert.deepEqual(a.talents,['contacts','informatique','drones']);assert.deepEqual(a.nationalities,['RU']);
 assert.match(portrait(a),/amber-portrait-transparent.webp/);assert.match(fullBody(a),/amber-full-transparent.webp/);assert.match(nationalities(a),/ru.svg/);
 const s=E.createGame('FR',['p0','p12','p13','p3'],77);
 assert.deepEqual(E.validateSave(structuredClone(s)),s);
 const amber=s.agents.find(a=>a.id==='p13');amber.country='RU';
 const local=E.options(s,amber.id,'contacts').chance;amber.nationalities=[];
 assert.equal(local,E.options(s,amber.id,'contacts').chance);
});

test('Existing campaigns can recruit Amber and reload her',()=>{
 const s=E.createGame('FR',['p0','p1','p2','p3'],11);
 E.recruit(s,'p13','p2');E.advance(s);E.advance(s);
 const amber=E.team(s).find(a=>a.id==='p13');assert.ok(amber);
 assert.deepEqual(E.validateSave(structuredClone(s)).agents.find(a=>a.id==='p13'),amber);
});

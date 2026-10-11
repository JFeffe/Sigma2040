import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ROSTER,DISPLAY_ROSTER} from '../dist/client/data.js';
import {portrait,nationalities} from '../dist/client/ui.js';
import {fullBody} from '../dist/client/visuals.js';
import {agentMapMarkers} from '../dist/client/map.js';

test('Lei follows Amber with his approved identity in roster, cards and map',()=>{
 assert.deepEqual(DISPLAY_ROSTER.slice(0,4).map(a=>a.name),['IRIS','BISHOP','AMBER','LEI']);
 const a=ROSTER.find(a=>a.id==='p14');
 assert.deepEqual(a.stats,[4,7,9]);assert.deepEqual(a.talents,['combat','endurance','infiltration']);assert.deepEqual(a.nationalities,['CN']);
 assert.match(portrait(a),/lei-portrait-transparent.webp/);assert.match(fullBody(a),/lei-full-transparent.webp/);assert.match(nationalities(a),/cn.svg/);
 const s=E.createGame('FR',['p0','p12','p13','p14'],77);
 assert.match(agentMapMarkers(s),/lei-portrait-transparent.webp/);
 assert.deepEqual(E.validateSave(structuredClone(s)),s);
 const lei=s.agents.find(a=>a.id==='p14');lei.country='CN';
 const local=E.options(s,lei.id,'contacts').chance;lei.nationalities=[];
 assert.equal(local,E.options(s,lei.id,'contacts').chance);
});

test('Lei can be recruited in existing campaigns and retained on reload',()=>{
 const s=E.createGame('FR',['p0','p1','p2','p3'],11);
 E.recruit(s,'p14','p2');E.advance(s);E.advance(s);
 const lei=E.team(s).find(a=>a.id==='p14');assert.ok(lei);
 assert.deepEqual(E.validateSave(structuredClone(s)).agents.find(a=>a.id==='p14'),lei);
 assert.match(agentMapMarkers(s),/lei-portrait-transparent.webp/);
});

test('Lei old statistics migrate on solo and multiplayer save load',()=>{for(const multi of [false,true]){const s=E.createGame('FR',['p0','p12','p13','p14'],11);const a=s.agents.find(a=>a.id==='p14');a.stats=[4,9,7];if(multi){a.templateId='p14';a.id='FR:p14';}const restored=E.validateSave(structuredClone(s));assert.deepEqual(restored.agents.find(a=>(a.templateId||a.id)==='p14').stats,[4,7,9]);}});

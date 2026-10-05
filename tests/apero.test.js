import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ROSTER,DISPLAY_ROSTER,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {portrait,nationalities} from '../dist/client/ui.js';
import {fullBody} from '../dist/client/visuals.js';
import {agentMapMarkers} from '../dist/client/map.js';
import {setupScreen} from '../dist/client/screens.js';

test('Apéro is selectable after Lei and retains his identity through recruitment and reload',()=>{
 assert.deepEqual(DISPLAY_ROSTER.slice(0,5).map(a=>a.name),['IRIS','BISHOP','AMBER','LEI','APÉRO']);
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,11);
 assert.deepEqual(E.team(s).map(a=>a.name),['IRIS','BISHOP','AMBER','LEI']);
 const markup=setupScreen('FR',DEFAULT_TEAM_IDS,false);
 const selected=[...markup.matchAll(/class="recruit-card selected[^"]*"[^>]+data-recruit-id="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(selected,[...DEFAULT_TEAM_IDS]);
 E.recruit(s,'p15','p13');E.advance(s);E.advance(s);
 const a=E.team(s).find(a=>a.id==='p15');assert.ok(a);
 assert.deepEqual(a.stats,[9,8,3]);assert.deepEqual(a.talents,['surveillance','informatique','enquete']);assert.equal(a.age,28);
 assert.deepEqual(a.nationalities,['FR']);assert.match(nationalities(a),/fr.svg/);
 assert.match(portrait(a),/apero-portrait.webp/);assert.match(fullBody(a),/apero-full.png/);
 assert.match(agentMapMarkers(s),/apero-portrait.webp/);
 assert.deepEqual(E.validateSave(structuredClone(s)).agents.find(a=>a.id==='p15'),a);
 const local=E.options(s,a.id,'contacts').chance;a.nationalities=[];
 assert.equal(local,E.options(s,a.id,'contacts').chance);
});

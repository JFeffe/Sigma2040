import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DISPLAY_ROSTER,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {portraitAsset} from '../dist/client/ui.js';
import {fullBody} from '../dist/client/visuals.js';
import {agentMapMarkers} from '../dist/client/map.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';

test('Nox follows Marlowe and survives recruitment, save and multiplayer identity changes',()=>{
 assert.equal(DISPLAY_ROSTER[DISPLAY_ROSTER.findIndex(a=>a.id==='p19')+1].id,'p20');
 assert.deepEqual(DEFAULT_TEAM_IDS,['p0','p12','p13','p14']);
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,11);
 E.recruit(s,'p20','p13');E.advance(s);E.advance(s);
 const a=E.team(E.validateSave(structuredClone(s))).find(a=>a.id==='p20');
 assert.ok(a);assert.deepEqual(a.stats,[7,9,4]);
 assert.deepEqual(a.talents,['informatique','surveillance','drones']);
 assert.ok(a.nationalities.includes('JP'));assert.equal(a.age,undefined);
 assert.equal(portraitAsset(a),'./assets/nox-portrait.webp');
 assert.match(fullBody(a),/nox-full.png/);
 assert.match(agentMapMarkers(s),/nox-portrait.webp/);
 const r=newRoom('dddddddd-dddd-dddd-dddd-dddddddddddd','cccccccc-cccc-cccc-cccc-cccccccccccc','host-nox-0000000000000000','Hôte');
 joinRoom(r,{invite:r.invite,token:'guest-nox-0000000000000000',name:'Invité'});
 r.members[0].agents=['p0','p12','p16','p20'];r.members.forEach(m=>{if(!m.agents.length)m.agents=['p0','p12','p13','p14'];m.confirmed=true;});startRoom(r,11);
 const view=playerView(restoreRoom(structuredClone(r)),'FR');
 const m=view.agents.find(a=>a.templateId==='p20');
 assert.ok(m);assert.equal(portraitAsset(m),'./assets/nox-portrait.webp');
 assert.match(fullBody(m),/nox-full.png/);
 assert.match(agentMapMarkers(view),/nox-portrait.webp/);
});

test('Only jointly created agents appear in setup and recruitment',()=>{assert.deepEqual(DISPLAY_ROSTER.map(a=>a.name),['IRIS','BISHOP','AMBER','LEI','APÉRO','MIRA','MIDNIGHT','MERCER','MARLOWE','NOX','ADLER','DANTE','SELIN','ROCKET','ALBA','RAVEN','LINK','MONROE','TARA','VIKTOR']);});

test('Nox legacy stats update on solo and multiplayer save load',()=>{for(const multiplayer of [false,true]){const s=E.createGame('FR',['p0','p12','p19','p20'],11);const a=s.agents.find(a=>a.id==='p20');a.stats=[4,8,8];if(multiplayer){a.templateId='p20';a.id='FR:p20';}const restored=E.validateSave(structuredClone(s));assert.deepEqual(restored.agents.find(a=>(a.templateId||a.id)==='p20').stats,[7,9,4]);assert.deepEqual(restored.agents.find(a=>a.id==='p19').stats,[4,8,8]);}});

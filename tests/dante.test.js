import {BUILD_VERSION} from '../dist/client/build-version.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DISPLAY_ROSTER,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {portraitAsset} from '../dist/client/ui.js';
import {fullBody} from '../dist/client/visuals.js';
import {agentMapMarkers} from '../dist/client/map.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';

test('Dante follows Adler and survives recruitment, save and multiplayer identity changes',()=>{
 assert.equal(DISPLAY_ROSTER[DISPLAY_ROSTER.findIndex(a=>a.id==='p21')+1].id,'p22');
 assert.deepEqual(DEFAULT_TEAM_IDS,['p0','p12','p13','p14']);
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,11);
 E.recruit(s,'p22','p13');E.advance(s);E.advance(s);
 const a=E.team(E.validateSave(structuredClone(s))).find(a=>a.id==='p22');
 assert.ok(a);assert.deepEqual(a.stats,[8,5,7]);
 assert.deepEqual(a.talents,['enquete','combat','endurance']);
 assert.ok(a.nationalities.includes('BR'));assert.equal(a.age,undefined);
 assert.equal(portraitAsset(a),`./assets/dante-portrait-transparent.webp?v=${BUILD_VERSION}`);
 assert.match(fullBody(a),/dante-full-transparent.webp/);
 assert.match(agentMapMarkers(s),/dante-portrait-transparent.webp/);
 const r=newRoom('dddddddd-dddd-dddd-dddd-dddddddddddd','cccccccc-cccc-cccc-cccc-cccccccccccc','host-dante-0000000000000000','Hôte');
 joinRoom(r,{invite:r.invite,token:'guest-dante-0000000000000000',name:'Invité'});
 r.members[0].agents=['p0','p12','p16','p22'];r.members.forEach(m=>{if(!m.agents.length)m.agents=['p0','p12','p13','p14'];m.confirmed=true;});startRoom(r,11);
 const view=playerView(restoreRoom(structuredClone(r)),'FR');
 const m=view.agents.find(a=>a.templateId==='p22');
 assert.ok(m);assert.equal(portraitAsset(m),`./assets/dante-portrait-transparent.webp?v=${BUILD_VERSION}`);
 assert.match(fullBody(m),/dante-full-transparent.webp/);
 assert.match(agentMapMarkers(view),/dante-portrait-transparent.webp/);
});


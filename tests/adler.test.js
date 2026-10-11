import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DISPLAY_ROSTER,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {portraitAsset} from '../dist/client/ui.js';
import {fullBody} from '../dist/client/visuals.js';
import {agentMapMarkers} from '../dist/client/map.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';

test('Adler follows Nox and survives recruitment, save and multiplayer identity changes',()=>{
 assert.equal(DISPLAY_ROSTER[DISPLAY_ROSTER.findIndex(a=>a.id==='p20')+1].id,'p21');
 assert.deepEqual(DEFAULT_TEAM_IDS,['p0','p12','p13','p14']);
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,11);
 E.recruit(s,'p21','p13');E.advance(s);E.advance(s);
 const a=E.team(E.validateSave(structuredClone(s))).find(a=>a.id==='p21');
 assert.ok(a);assert.deepEqual(a.stats,[8,9,3]);
 assert.deepEqual(a.talents,['diplomatie','contacts','tactique']);
 assert.ok(a.nationalities.includes('DE'));assert.equal(a.age,undefined);
 assert.equal(portraitAsset(a),'./assets/adler-portrait.webp');
 assert.match(fullBody(a),/adler-full-transparent.webp/);
 assert.match(agentMapMarkers(s),/adler-portrait.webp/);
 const r=newRoom('dddddddd-dddd-dddd-dddd-dddddddddddd','cccccccc-cccc-cccc-cccc-cccccccccccc','host-adler-0000000000000000','Hôte');
 joinRoom(r,{invite:r.invite,token:'guest-adler-0000000000000000',name:'Invité'});
 r.members[0].agents=['p0','p12','p16','p21'];r.members.forEach(m=>{if(!m.agents.length)m.agents=['p0','p12','p13','p14'];m.confirmed=true;});startRoom(r,11);
 const view=playerView(restoreRoom(structuredClone(r)),'FR');
 const m=view.agents.find(a=>a.templateId==='p21');
 assert.ok(m);assert.equal(portraitAsset(m),'./assets/adler-portrait.webp');
 assert.match(fullBody(m),/adler-full-transparent.webp/);
 assert.match(agentMapMarkers(view),/adler-portrait.webp/);
});


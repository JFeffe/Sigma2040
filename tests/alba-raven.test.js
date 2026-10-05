import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DISPLAY_ROSTER,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {portraitAsset,nationalityFlags} from '../dist/client/ui.js';
import {fullBody} from '../dist/client/visuals.js';
import {agentMapMarkers} from '../dist/client/map.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';

const agents=[
 {id:'p25',slug:'alba',stats:[7,7,6],talents:['diplomatie','endurance','infiltration'],nationality:'BR'},
 {id:'p26',slug:'raven',stats:[5,6,9],talents:['secours','langues','combat'],nationality:'CN'}
];
function check(a,expected){
 assert.ok(a);
 assert.deepEqual(a.stats,expected.stats);
 assert.deepEqual(a.talents,expected.talents);
 assert.ok(a.nationalities.includes(expected.nationality));
 assert.equal(portraitAsset(a),`./assets/${expected.slug}-portrait.webp${expected.id==='p26'?'?v=173':''}`);
 assert.ok(fullBody(a).includes(`${expected.slug}-full.png`));
 assert.ok(nationalityFlags(a).includes(`flags/${expected.nationality.toLowerCase()}.svg`));
}
test('Alba and Raven follow Rocket and retain their profiles through recruitment and save loading',()=>{
 assert.deepEqual(DISPLAY_ROSTER.slice(-3).map(a=>a.id),['p24','p25','p26']);
 for(const expected of agents){
  const s=E.createGame('FR',DEFAULT_TEAM_IDS,11);
  E.recruit(s,expected.id,'p13');E.advance(s);E.advance(s);
  const restored=E.validateSave(structuredClone(s));
  check(E.team(restored).find(a=>a.id===expected.id),expected);
  assert.ok(agentMapMarkers(restored).includes(`${expected.slug}-portrait.webp`));
 }
});
test('Both new agents can be selected together in multiplayer and keep their artwork after restore',()=>{
 const r=newRoom('dddddddd-dddd-dddd-dddd-dddddddddddd','cccccccc-cccc-cccc-cccc-cccccccccccc','host-new-agents-000000000000','Hôte');
 joinRoom(r,{invite:r.invite,token:'guest-new-agents-00000000000',name:'Invité'});
 r.members[0].agents=['p0','p24','p25','p26'];
 r.members.forEach(m=>{if(!m.agents.length)m.agents=[...DEFAULT_TEAM_IDS];m.confirmed=true;});
 startRoom(r,11);
 const view=playerView(restoreRoom(structuredClone(r)),'FR');
 for(const expected of agents){
  check(view.agents.find(a=>a.templateId===expected.id),expected);
  assert.ok(agentMapMarkers(view).includes(`${expected.slug}-portrait.webp`));
 }
});

test('Alba retains both native nationalities',()=>{assert.deepEqual(DISPLAY_ROSTER.find(a=>a.id==='p25').nationalities,['FR','BR']);});

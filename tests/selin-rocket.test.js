import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DISPLAY_ROSTER,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {portraitAsset,nationalityFlags} from '../dist/client/ui.js';
import {fullBody} from '../dist/client/visuals.js';
import {agentMapMarkers} from '../dist/client/map.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';

const agents=[
 {id:'p23',slug:'selin',stats:[6,8,6],talents:['langues','informatique','tactique'],nationality:'TR'},
 {id:'p24',slug:'rocket',stats:[8,8,4],talents:['secours','diplomatie','enquete'],nationality:'CA'}
];
function check(a,expected){
 assert.ok(a);
 assert.deepEqual(a.stats,expected.stats);
 assert.deepEqual(a.talents,expected.talents);
 assert.ok(a.nationalities.includes(expected.nationality));
 assert.equal(portraitAsset(a),`./assets/${expected.slug}-portrait.webp`);
 assert.ok(fullBody(a).includes(`${expected.slug}-full-transparent.webp`));
 assert.ok(nationalityFlags(a).includes(`flags/${expected.nationality.toLowerCase()}.svg`));
}
test('Selin and Rocket follow Dante and retain their profiles through recruitment and save loading',()=>{
 assert.deepEqual(DISPLAY_ROSTER.slice(DISPLAY_ROSTER.findIndex(a=>a.id==='p22'),DISPLAY_ROSTER.findIndex(a=>a.id==='p22')+3).map(a=>a.id),['p22','p23','p24']);
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
 r.members[0].agents=['p0','p22','p23','p24'];
 r.members.forEach(m=>{if(!m.agents.length)m.agents=[...DEFAULT_TEAM_IDS];m.confirmed=true;});
 startRoom(r,11);
 const view=playerView(restoreRoom(structuredClone(r)),'FR');
 for(const expected of agents){
  check(view.agents.find(a=>a.templateId===expected.id),expected);
  assert.ok(agentMapMarkers(view).includes(`${expected.slug}-portrait.webp`));
 }
});

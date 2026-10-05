import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {actionOptions,locationActions} from '../dist/client/presentation.js';
import {agentMapMarkers} from '../dist/client/map-markers.js';
import {newRoom,playerView} from '../dist/client/multiplayer-core.js';
test('Shared refuge survives its discoverer, migration and private multiplayer projection',()=>{
 const s=E.createGame('FR',['p0','p1','p2','p3'],55),a=s.agents[0],b=s.agents[1];
 a.safehouses=['DE'];a.status='dead';b.country='DE';
 const restored=E.validateSave(structuredClone(s));
 assert.deepEqual(restored.factions.FR.safehouses,['DE']);
 restored.agents=restored.agents.filter(x=>x.id!==a.id);
 assert.equal(E.options(restored,b.id,'fieldRest').error,null);
 assert.equal(E.hasSafehouse(restored,'US','DE'),false);
 const room=newRoom('room','invite','token','Host','FR');room.game=restored;
 const own=playerView(room,'FR'),other=playerView(room,'US');
 assert.equal(E.hasSafehouse(own,'FR','DE'),true);
 assert.equal(other.factions.FR.safehouses,undefined);
});
test('Travel anchors leave the country only after departure; both travel types lock cancellation',()=>{
 for(const type of ['travel','sneak']){
  const s=E.createGame('FR',['p0','p1','p2','p3'],55),a=s.agents[0];E.assign(s,a.id,type,'JP');
  assert.doesNotMatch(agentMapMarkers(s),/data-travel-to/);
  a.task.queued=false;a.task.remaining=1;
  assert.match(agentMapMarkers(s),/data-travel-from="FR" data-travel-to="JP"/);
  const before=JSON.stringify(s);assert.throws(()=>E.cancel(s,a.id),/déplacement/);assert.equal(JSON.stringify(s),before);
 }
});
test('Foreign actions follow requested order and unavailable options remain selectable',()=>{
 const s=E.createGame('FR',['p0','p1','p2','p3'],55),a=s.agents[0];a.country='DE';s.suspects[0].country='DE';s.factions.FR.known.s0.country='DE';
 const html=actionOptions(locationActions(a,s),'contacts',s,a);
 const ordered=['surveil','authorize','prepare','arrest','influence','hack','drone','protect'];
 for(let i=1;i<ordered.length;i++)assert.ok(html.indexOf(`value="${ordered[i]}"`)>html.indexOf(`value="${ordered[i-1]}"`));
 assert.doesNotMatch(html,/Diplomatie et accès/);
 assert.match(html,/<option value="prepare"[^>]*class="action-unavailable"/);
 assert.doesNotMatch(html,/<option[^>]*disabled/);
});

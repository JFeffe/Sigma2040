import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {nationalPanel} from '../dist/client/command-ui.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.factions.FR.confidence=50;return s;};
const unchanged=(s,fn,pattern)=>{const before=JSON.stringify(s);assert.throws(fn,pattern);assert.equal(JSON.stringify(s),before);};
test('Funding caps actual gain, protects old reserves and rejects ineffective or unaffordable favors atomically',()=>{
 for(const budget of [16,17]){const s=fresh();s.factions.FR.budget=budget;E.requestGovernmentFavor(s,'funding');assert.equal(s.factions.FR.budget,18);assert.equal(s.factions.FR.confidence,35);assert.equal(s.factions.FR.lastFavor.gain,18-budget);}
 for(const budget of [18,25]){const s=fresh();s.factions.FR.budget=budget;unchanged(s,()=>E.requestGovernmentFavor(s,'funding'),/pleine/);}
 const s=fresh();s.factions.FR.confidence=9;for(const type of ['funding','medical','diplomacy'])unchanged(s,()=>E.requestGovernmentFavor(s,type,'TR'),/confiance/);
 s.factions.FR.confidence=50;s.ended='defeat';unchanged(s,()=>E.requestGovernmentFavor(s,'funding'),/terminée/);
});
test('Diplomacy targets minors only and grants neither access nor mandate',()=>{
 const s=fresh(),f=s.factions.FR;for(const country of ['FR','US','invalid',null])unchanged(s,()=>E.requestGovernmentFavor(s,'diplomacy',country),/secondaire/);
 f.cooperation.DE=4;f.cooperation.TR=0;unchanged(s,()=>E.requestGovernmentFavor(s,'diplomacy','DE'),/maximale/);const access=structuredClone(f.access),authorized=structuredClone(f.authorized);E.requestGovernmentFavor(s,'diplomacy','TR');assert.equal(f.cooperation.TR,1);assert.deepEqual(f.access,access);assert.deepEqual(f.authorized,authorized);assert.equal(f.confidence,30);
});
test('Medical favor restores all eligible agents worldwide without healing injuries or changing orders',()=>{
 const s=fresh(),[a,b,c,d]=E.team(s);a.fatigue=10;a.status='injured';b.fatigue=65;E.assign(s,b.id,'rest');c.country='TR';c.fatigue=40;d.fatigue=50;d.status='captured';const task=structuredClone(b.task);E.requestGovernmentFavor(s,'medical');assert.equal(a.fatigue,0);assert.equal(a.status,'injured');assert.equal(b.fatigue,45);assert.deepEqual(b.task,task);assert.equal(c.fatigue,20);assert.equal(d.fatigue,30);assert.equal(s.factions.FR.confidence,25);
 const empty=fresh();unchanged(empty,()=>E.requestGovernmentFavor(empty,'medical'),/Aucun agent/);const traveler=E.team(empty)[0];traveler.fatigue=40;traveler.task={type:'travel',queued:false};E.requestGovernmentFavor(empty,'medical');assert.equal(traveler.fatigue,20);
});
test('Government saves migrate safely and reject forged cooldowns or country targets',()=>{
 const s=fresh(),before=s.factions.FR.budget;E.validateSave(s);assert.equal(s.factions.FR.lastFavor,null);assert.equal(s.factions.FR.budget,before);
 for(const lastFavor of [{type:'funding',turn:2,gain:3},{type:'diplomacy',turn:1,country:'US'},{type:'funding',turn:1,gain:99},{type:'unknown',turn:1}]){const bad=fresh();bad.factions.FR.lastFavor=lastFavor;assert.throws(()=>E.validateSave(bad));}
 E.requestGovernmentFavor(s,'funding');assert.deepEqual(E.validateSave(structuredClone(s)).factions.FR.lastFavor,s.factions.FR.lastFavor);
});
test('Government layout exposes three icon cards and puts detailed instructions last',()=>{
 const html=nationalPanel(fresh());assert.equal((html.match(/data-cmd="government-favor"/g)||[]).length,3);assert.ok(html.includes('governmentCountry'));assert.ok(html.indexOf('government-help')>html.indexOf('government-footer'));assert.ok(!html.includes('Influence Interne'));assert.ok(!html.includes('value="US"'));
});

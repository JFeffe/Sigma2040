import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {investigationSnapshot,investigationHighlights,milestoneBanner} from '../dist/client/milestones.js';
import {discoveryMarkup} from '../dist/client/fracture-profiles.js';
const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);
const readyResearch=s=>{s.turn=3;s.factions.FR.leadResearch={progress:2,lastTurn:2};return s;};
test('A new lead without other progress opens one discovery with persisted provenance',()=>{
 const s=readyResearch(fresh()),before=investigationSnapshot(s);E.activateTech(s,'ai');assert.deepEqual(investigationHighlights(before,s),[]);E.advance(s);const events=investigationHighlights(before,s);assert.equal(events.length,1);const item=events[0];assert.equal(item.phase,'discovered');assert.match(item.target.discovery.source,/Assistance IA/);assert.match(milestoneBanner(item,0,1),/ORIGINE DU DOSSIER/);assert.match(milestoneBanner(item,0,1),/Nouveau dossier découvert/);assert.deepEqual(investigationHighlights(investigationSnapshot(s),s),[]);assert.deepEqual(E.validateSave(JSON.parse(JSON.stringify(s))).factions.FR.known[item.id].discovery,item.target.discovery);
});
test('Partner discoveries stay private without exchanges',()=>{const s=fresh(),before=investigationSnapshot(s);s.factions.US.evidence=[{id:'s2-e0',verified:true,contested:false}];assert.deepEqual(investigationHighlights(before,s),[]);assert.throws(()=>E.share(s,'US'),/désactivés/);assert.deepEqual(investigationHighlights(before,s),[]);});
test('Recouping three dossiers gives the command lead its actual provenance',()=>{
 const s=fresh();s.factions.FR.evidence=['s0','s2','s4'].map(id=>({id:id+'-e0',verified:true,contested:false}));E.deduce(s,'FR');assert.match(s.factions.FR.known.s6.discovery.source,/trois suspects/);
});
test('Older dossiers never acquire a fabricated source, malformed metadata is rejected',()=>{
 const s=fresh();delete s.factions.FR.known.s0.discovery;const loaded=E.validateSave(JSON.parse(JSON.stringify(s)));assert.equal(loaded.factions.FR.known.s0.discovery,undefined);assert.match(discoveryMarkup(loaded.factions.FR.known.s0),/n’a pas été consignée/);loaded.factions.FR.known.s0.discovery={turn:1,source:'<script>'};assert.throws(()=>E.validateSave(loaded));
});
test('Unknown suspects keep their face and personality hidden until identification',async()=>{
 const {suspectPortrait,suspectProfile,SUSPECT_PROFILES}=await import('../dist/client/fracture-profiles.js');
 const s=fresh(),t=E.knownTargets(s)[0];
 assert.match(suspectPortrait(t),/Portrait non disponible/);
 assert.doesNotMatch(suspectProfile(t),/assets\/fracture|La négociatrice|Vesper parle bas/);
 readyResearch(s);const before=investigationSnapshot(s);E.activateTech(s,'ai');E.advance(s);
 const discovered=investigationHighlights(before,s)[0];assert.doesNotMatch(milestoneBanner(discovered,0,1),/assets\/fracture/);
 const knownBefore=investigationSnapshot(s);s.factions.FR.known[t.id].identified=true;
 const identified=investigationHighlights(knownBefore,s).find(x=>x.id===t.id);
 assert.equal(identified,undefined);
 assert.match(suspectPortrait(E.knownTargets(s).find(x=>x.id===t.id)),new RegExp('assets/fracture/'+(t.templateId??t.id)));
 assert.ok(suspectProfile(E.knownTargets(s)[0]).includes(SUSPECT_PROFILES[t.templateId??t.id].bio));
 assert.doesNotMatch(milestoneBanner(discovered,0,1),/assets\/fracture/);
});

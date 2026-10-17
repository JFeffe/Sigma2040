import {missionCards,missionRevealMarkup,revealDelay} from '../dist/client/mission-reveal.js';
import test from 'node:test';import assert from 'node:assert/strict';import * as E from '../dist/client/engine.js';import {playerView} from '../dist/client/multiplayer-core.js';
const game=seed=>E.createGame('FR',['p0','p12','p13','p14'],seed);
test('Three seeded forgeries, distinct suspects, first two positions, persisted and private',()=>{
 const layouts=new Set(),suspects=new Set(),positions=new Set();
 for(let seed=0;seed<100;seed++){
  const s=game(seed),falseProofs=s.proofs.filter(p=>!p.authentic);assert.equal(falseProofs.length,3);assert.equal(new Set(falseProofs.map(p=>p.suspect)).size,3);assert.ok(falseProofs.every(p=>p.source<2));assert.ok(s.proofs.filter(p=>p.source===2).every(p=>p.authentic));
  falseProofs.forEach(p=>{suspects.add(p.suspect);positions.add(p.source);});layouts.add(falseProofs.map(p=>p.id).join(','));
  assert.deepEqual(game(seed).proofs,s.proofs);assert.deepEqual(E.validateSave(structuredClone(s)).proofs,s.proofs);
  for(const f of ['FR','US'])assert.ok(playerView({game:s,offers:[]},f).proofs.every(p=>!('authentic' in p)));
 }assert.ok(layouts.size>20);assert.equal(suspects.size,7);assert.equal(positions.size,2);
});
function setup(type){
 const s=game(42);s.humanFactions=Object.keys(s.factions);s.fracture.cells.forEach(c=>c.resources=0);s.plots=[];
 const p=s.proofs.find(p=>!p.authentic),t=s.suspects.find(t=>t.id===p.suspect),[a,b,c]=E.team(s),f=s.factions.FR;
 a.country=c.country=t.country;b.country='FR';f.access[t.country]=true;f.known[t.id]={country:t.country,identified:true,locationUntil:20,prepared:type==='arrest'};
 f.evidence=s.proofs.filter(q=>q.suspect===t.id&&q.source<2).map(q=>({id:q.id,verified:q.authentic,contested:false}));
 E.assign(s,a.id,type,t.id);a.task.chance=100;a.task.remaining=2;
 E.assign(s,b.id,'analyze',p.id);b.task.chance=100;b.task.remaining=1;
 return {s,a,b,c,t,f,p};
}
for(const type of ['prepare','arrest'])test('False verification preserves ongoing '+type+' but blocks new orders',()=>{
 const {s,a,c,t,f,p}=setup(type);E.advance(s);
 assert.ok(f.evidence.find(e=>e.id===p.id).contested);const cards=missionCards(playerView({game:s,offers:[]},'FR')).filter(r=>r.type==='forgery');assert.equal(cards.length,1);assert.equal(cards[0].proofRejection.suspectName,t.name);assert.equal(cards[0].proofRejection.country,t.country);assert.equal(revealDelay(cards[0]),0);const html=missionRevealMarkup(cards[0],0,1);assert.match(html,/forged-proof.png/);assert.match(html,/Preuve falsifiée/);assert.ok(html.includes(t.name));assert.equal(missionCards(playerView({game:s,offers:[]},'US')).filter(r=>r.type==='forgery').length,0);assert.equal(f.score,2);assert.equal(a.task.type,type);assert.equal(a.task.remaining,1);
 for(const action of ['prepare','arrest']){assert.match(E.options(s,c.id,action,t.id).error,/Preuve falsifiée/);assert.throws(()=>E.assign(s,c.id,action,t.id),/Preuve falsifiée/);}
 E.advance(s);assert.equal(a.task,null);assert.ok(type==='arrest'?t.arrested:f.known[t.id].prepared);
 if(type==='prepare'){
  assert.match(E.options(s,c.id,'arrest',t.id).error,/Preuve falsifiée/);
  E.assign(s,c.id,'collect',t.id);c.task.chance=100;c.task.remaining=1;E.advance(s);
  assert.equal(E.evidenceFor(s,'FR',t.id).length,2);assert.ok(f.evidence.some(e=>e.id===t.id+'-e2'));assert.equal(E.options(s,a.id,'arrest',t.id).error,null);
 }
});

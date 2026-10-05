import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import * as E from '../dist/client/engine.js';
import {SUSPECTS,DEFAULT_TEAM_IDS,COUNTRY} from '../dist/client/data.js';
import {CRIMINAL_POOL,selectCriminals} from '../dist/client/criminal-roster.js';
import {CASES,caseFor,proofTitle} from '../dist/client/intelligence.js';
import {SUSPECT_PROFILES,suspectProfile,suspectPortrait} from '../dist/client/fracture-profiles.js';
import {playerView,newRoom,joinRoom,startRoom,restoreRoom,PROTOCOL} from '../dist/client/multiplayer-core.js';
import {caseBrief} from '../dist/client/operations-ui.js';
const game=seed=>E.createGame('FR',DEFAULT_TEAM_IDS,seed);
test('Six unique identities from twelve, plus the unchanged Architect, with balanced cells and unchanged forgery rules',()=>{
 const seen=new Map(CRIMINAL_POOL.map(t=>[t.id,0])),lineups=new Set();
 for(let seed=0;seed<300;seed++){
  const s=game(seed),regular=s.suspects.filter(t=>t.id!=='s6');
  assert.equal(regular.length,6);assert.equal(new Set(regular.map(t=>t.templateId)).size,6);
  assert.deepEqual(s.suspects.find(t=>t.id==='s6'),{...SUSPECTS.find(t=>t.id==='s6'),country:s.suspects.find(t=>t.id==='s6').country,arrested:false});
  for(let cell=0;cell<3;cell++)assert.equal(regular.filter(t=>t.cell===cell).length,2);
  assert.equal(new Set(regular.map(t=>t.country)).size,6);assert.ok(regular.every(t=>!COUNTRY[t.country].power));
  for(const t of regular){assert.ok(seen.has(t.templateId));seen.set(t.templateId,seen.get(t.templateId)+1);assert.equal(t.name,CRIMINAL_POOL.find(p=>p.id===t.templateId).name);}
  const forged=s.proofs.filter(p=>!p.authentic);assert.equal(forged.length,3);assert.equal(new Set(forged.map(p=>p.suspect)).size,3);assert.ok(forged.every(p=>p.source<2));assert.ok(s.proofs.filter(p=>p.source===2).every(p=>p.authentic));
  assert.deepEqual(game(seed).suspects,s.suspects);lineups.add(regular.map(t=>t.templateId).sort().join(','));
  const saved=E.validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(saved.suspects,s.suspects);assert.deepEqual(saved.proofs,s.proofs);
 }
 assert.equal(seen.size,12);assert.ok([...seen.values()].every(n=>n>0));assert.ok(lineups.size>100);
});
test('Identity selection consumes no gameplay RNG and changes no slot, cell or country',()=>{
 for(let seed=0;seed<50;seed++){
  const s={seed,rng:123456,suspects:structuredClone(SUSPECTS)};
  selectCriminals(s,E.random);assert.equal(s.rng,123456);
  assert.deepEqual(s.suspects.map(({id,cell,country})=>({id,cell,country})),SUSPECTS.map(({id,cell,country})=>({id,cell,country})));
 }
});
test('Every identity has its own three pieces, portrait and profile; deduction points to the actual cell partner',()=>{
 const covered=new Set();
 for(let seed=0;seed<300;seed++){
  const s=game(seed);s.factions.FR.known={};
  for(const t of s.suspects){
   const identity=t.templateId??t.id;covered.add(identity);
   s.factions.FR.known[t.id]={identified:true,country:t.country,locationUntil:0,prepared:false};
   const c=caseFor(s,t),p=SUSPECT_PROFILES[identity];assert.ok(p.bio&&p.trait&&p.signature);assert.equal(c.pieces.length,3);assert.equal(new Set(c.pieces).size,3);
   assert.ok(existsSync(new URL(`../dist/client/assets/fracture/${identity}.png`,import.meta.url)));
   const html=suspectProfile({...t,identified:true});assert.ok(html.includes(p.bio));assert.ok(html.includes(`fracture/${identity}.png`));
   for(const proof of s.proofs.filter(p=>p.suspect===t.id))assert.equal(proofTitle(proof),c.pieces[proof.source]);
   if(t.id!=='s6'){const partner=s.suspects.find(x=>x.cell===t.cell&&x.id!==t.id);assert.equal(c.link,partner.id);assert.ok(c.deduction.includes(t.name));assert.ok(c.deduction.includes(partner.name));}
   s.factions.FR.evidence.push(...s.proofs.filter(p=>p.suspect===t.id&&p.source<2).map(p=>({id:p.id,verified:true,contested:false})));
  }
  E.deduce(s,'FR');
  for(const t of E.knownTargets(s)){const html=caseBrief(s,t);assert.ok(html.includes(caseFor(s,t).title));assert.ok(html.includes(proofTitle(s.proofs.find(p=>p.suspect===t.id))));}
 }
 assert.equal(covered.size,13);
});
test('Legacy saves retain identities, artwork, evidence and narrative without a new draw',()=>{
 const old=game(21);for(const t of old.suspects){delete t.templateId;const p=SUSPECTS.find(p=>p.id===t.id);t.name=p.name;t.role=p.role;}
 for(const p of old.proofs)delete p.templateId;
 const loaded=E.validateSave(structuredClone(old));assert.deepEqual(loaded.suspects,old.suspects);assert.deepEqual(loaded.proofs,old.proofs);
 for(const t of loaded.suspects){assert.equal(caseFor(loaded,t),CASES[t.id]);assert.ok(suspectPortrait({...t,identified:true}).includes(`fracture/${t.id}.png`));}
});
test('Reject invalid, duplicate and partial identity draws; normalize names and proof identities from the selected roster',()=>{
 for(const mutate of [s=>s.suspects[0].templateId='missing',s=>s.suspects[0].templateId='s6',s=>s.suspects[1].templateId=s.suspects[0].templateId,s=>delete s.suspects[0].templateId,s=>s.suspects[6].templateId='s7']){
  const s=game(19);mutate(s);assert.throws(()=>E.validateSave(s));
 }
 const s=game(19),name=s.suspects[0].name;s.suspects[0].name='Wrong';s.proofs[0].templateId='wrong';E.validateSave(s);assert.equal(s.suspects[0].name,name);assert.equal(s.proofs[0].templateId,s.suspects[0].templateId);
});
test('Multiplayer host and guests share the same identities, proof titles and portraits, with hidden authenticity',()=>{
 const room=newRoom('room-12345678901234567890','invite-12345678901234567890','host-token-123456789012345','Host','FR');joinRoom(room,{invite:'invite-12345678901234567890',token:'guest-token-123456789012345',name:'Guest'});
 for(const m of room.members){m.agents=[...DEFAULT_TEAM_IDS];m.confirmed=true;}
 startRoom(room,31);
 const saved=structuredClone(room);saved.protocol=15;const restored=restoreRoom(saved);assert.equal(restored.protocol,PROTOCOL);assert.deepEqual(restored.game.suspects,room.game.suspects);
 assert.deepEqual(restored.game.proofs,room.game.proofs);
 for(const m of room.members){const s=playerView(room,m.country);
  assert.deepEqual(s.suspects.map(t=>[t.id,t.templateId,t.name]),room.game.suspects.map(t=>[t.id,t.templateId,t.name]));
  for(const p of s.proofs){assert.ok(!('authentic' in p));assert.equal(proofTitle(p),proofTitle(room.game.proofs.find(x=>x.id===p.id)));}
  for(const t of s.suspects)assert.equal(suspectPortrait({...t,identified:true}),suspectPortrait({...room.game.suspects.find(x=>x.id===t.id),identified:true}));
 }
});

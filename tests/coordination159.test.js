import test from 'node:test';import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {talents,sortedTalents} from '../dist/client/ui.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';
const ids=['p12','p0','p13','p14'];
const fresh=()=>{const s=E.createGame('FR',ids,42);const [chief,a]=E.team(s);a.stats=[5,5,5];a.talents=['enquete','combat','secours'];return {s,chief,a};};
test('First selected agent is chief; coordination helps colleagues only and obeys location, status, transit and cap',()=>{
 const {s,chief,a}=fresh();assert.equal(chief.id,'p12');assert.ok(chief.chief);assert.equal(chief.talents.length,3);assert.ok(sortedTalents(chief).includes('chef'));assert.match(talents(chief),/Chef — Coordination/);
 for(const f of Object.keys(s.factions))assert.equal(E.team(s,f).filter(a=>a.chief).length,1);
 chief.chief=false;const base=E.options(s,a.id,'counter').chance;const own=E.options(s,chief.id,'counter').chance;chief.chief=true;
 assert.equal(E.options(s,a.id,'counter').chance,base+5);assert.equal(E.options(s,chief.id,'counter').chance,own);assert.match(E.options(s,a.id,'counter').explanations.join(' '),/Coordination/);
 for(const status of ['dead','retired','captured']){chief.status=status;assert.equal(E.options(s,a.id,'counter').chance,base);}chief.status='injured';assert.equal(E.options(s,a.id,'counter').chance,base+5);chief.status='ready';
 chief.country='JP';assert.equal(E.options(s,a.id,'counter').chance,base);chief.country='FR';chief.task={type:'travel',queued:false};assert.equal(E.options(s,a.id,'counter').chance,base);chief.task.queued=true;assert.equal(E.options(s,a.id,'counter').chance,base+5);chief.task=null;
 chief.faction='US';assert.equal(E.options(s,a.id,'counter').chance,base);chief.faction='FR';
 assert.equal(E.options(s,a.id,'rest').chance,100);assert.equal(E.options(s,a.id,'rest').coordination,0);a.stats=[10,10,10];assert.equal(E.options(s,a.id,'counter',null,true).chance,90);
});
test('Assigned bonus survives chief departure, save reload and does not retrofit old missions or old campaigns',()=>{
 const {s,chief,a}=fresh();const task=E.assign(s,a.id,'counter');const chance=task.chance;assert.equal(task.coordination,5);chief.country='JP';chief.status='captured';assert.equal(task.chance,chance);
 const loaded=E.validateSave(structuredClone(s));assert.equal(loaded.agents.find(x=>x.id===chief.id).chief,true);assert.equal(loaded.agents.find(x=>x.id===a.id).task.chance,chance);
 const old=fresh();for(const x of old.s.agents)delete x.chief;E.assign(old.s,old.a.id,'counter');const original=old.a.task.chance;old.chief.chief=true;assert.equal(old.a.task.chance,original);
 for(const x of old.s.agents)delete x.chief;assert.ok(E.validateSave(structuredClone(old.s)).agents.every(x=>!x.chief));
 const invalid=fresh().s;E.team(invalid)[1].chief=true;assert.throws(()=>E.validateSave(invalid));
});
test('Multiplayer uses each player first selection and preserves chief in private views and restores',()=>{
 const r=newRoom('d'.repeat(24),'c'.repeat(24),'h'.repeat(24),'Host');joinRoom(r,{invite:r.invite,token:'g'.repeat(24),name:'Guest'});
 for(const [i,m] of r.members.entries()){m.agents=i?[...ids].reverse():ids;m.confirmed=true;}
 startRoom(r,42);
 for(const m of r.members){const a=E.team(r.game,m.country).find(a=>a.chief);assert.equal(a.templateId,m.agents[0]);assert.equal(playerView(r,m.country).agents.find(x=>x.id===a.id).chief,true);}
 const restored=restoreRoom(structuredClone(r));for(const m of restored.members)assert.equal(E.team(restored.game,m.country).find(a=>a.chief).templateId,m.agents[0]);
});

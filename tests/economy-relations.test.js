import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRIES} from '../dist/client/data.js';
import {newRoom,joinRoom,startRoom,execute,restoreRoom,playerView,PROTOCOL} from '../dist/client/multiplayer-core.js';
import {MISSION_IMAGES} from '../dist/client/mission-reveal.js';
import {existsSync} from 'node:fs';
const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);
test('Government favors share two-turn cooldown, preserve it in saves and isolate countries',()=>{
 const s=fresh(),f=s.factions.FR;f.confidence=50;f.cooperation.TR=0;s.factions.US.confidence=50;E.requestGovernmentFavor(s,'funding');assert.equal(f.budget,11);assert.equal(f.confidence,35);
 for(const turn of [1,2]){s.turn=turn;for(const type of ['funding','diplomacy','medical'])assert.throws(()=>E.requestGovernmentFavor(s,type,'TR'),/tour 3/);}
 E.requestGovernmentFavor(s,'funding',null,'US');assert.equal(s.factions.US.confidence,35);
 const restored=E.validateSave(structuredClone(s));assert.equal(E.governmentOptions(restored,'funding').nextTurn,3);restored.turn=3;restored.factions.FR.confidence=45;E.requestGovernmentFavor(restored,'diplomacy','TR');assert.equal(restored.factions.FR.confidence,30);assert.equal(restored.factions.FR.cooperation.TR,1);
});
test('Paid diplomatic support uses total cost, caps chance and refunds queued but not started orders',()=>{
 const s=fresh(),a=E.team(s)[0],f=s.factions.FR;a.country='TR';a.stats=[5,5,5];a.talents=[];f.budget=2;assert.ok(E.options(s,a.id,'authorize',null,true).error);f.budget=20;for(const type of ['authorize','influence']){f.budget=20;const normal=E.options(s,a.id,type),extra=E.options(s,a.id,type,null,true);assert.equal(extra.cost,normal.cost+6);assert.equal(extra.chance,Math.min(90,normal.chance+10));E.assign(s,a.id,type,null,true);assert.equal(f.budget,20-extra.cost);E.cancel(s,a.id);assert.equal(f.budget,20);}
 f.budget=20;E.assign(s,a.id,'authorize',null,true);a.task.queued=false;E.cancel(s,a.id);assert.equal(f.budget,14);assert.ok(E.options(s,a.id,'hide',null,true).error);
});
test('Each power keeps the requested cooperation distribution and saves preserve relations',()=>{
 const s=fresh(),minors=COUNTRIES.filter(c=>!c.power);for(const f of Object.values(s.factions))assert.deepEqual(minors.map(c=>f.cooperation[c.id]).sort(),[0,1,2,2,3,4]);
 s.factions.FR.cooperation.TR=3;assert.equal(E.validateSave(structuredClone(s)).factions.FR.cooperation.TR,3);
});
test('Old influence disappears without charging existing missions or rewriting relationships',()=>{
 const s=fresh(),f=s.factions.FR,a=E.team(s)[0];f.influence=15;f.lobbiedTurn=2;delete f.internalInfluenceUses;delete f.internalInfluenceLastTurn;a.country='TR';E.assign(s,a.id,'authorize');a.task.influenceSpent=1;a.task.chance=85;const budget=f.budget,relations=structuredClone(f.cooperation);const v=E.validateSave(s);assert.equal(v.factions.FR.influence,undefined);assert.equal(v.factions.FR.internalInfluenceUses,0);assert.equal(a.task.chance,85);assert.equal(f.budget,budget);assert.deepEqual(f.cooperation,relations);assert.equal(a.task.influenceSpent,undefined);const second=E.validateSave(structuredClone(v));assert.deepEqual(second,v);
});
test('Multiplayer authority enforces internal action limits and charges boosted guest orders',()=>{
 const host='host-token-000000000000',guest='guest-token-000000000000',invite='invite-token-0000000000',r=newRoom('room-000000000000000000',invite,host,'Hôte');joinRoom(r,{invite,token:guest});r.members.forEach(m=>{if(!m.agents.length)m.agents=['p0','p12','p13','p14'];m.confirmed=true;});startRoom(r,42);
 const cmd=(token,kind,payload={})=>execute(r,token,{protocol:PROTOCOL,seq:r.members.find(m=>m.token===token).lastSeq+1,turn:r.game.turn,kind,payload});assert.throws(()=>cmd(guest,'confidence'));r.game.turn=3;r.game.factions[r.members[1].country].confidence=50;r.game.factions[r.members[1].country].budget=12;cmd(guest,'government-favor',{type:'funding'});assert.throws(()=>cmd(guest,'government-favor',{type:'diplomacy',country:'TR'}));const f=r.members[1].country;assert.equal(playerView(r,f).factions[f].lastFavor.type,'funding');assert.equal(r.game.factions.FR.internalInfluenceUses,0);
 const a=E.team(r.game,f)[0];a.country='TR';const before=r.game.factions[f].budget;cmd(guest,'assign',{id:a.id,type:'authorize',useCredits:true});assert.equal(r.game.factions[f].budget,before-6);cmd(guest,'cancel',{id:a.id});assert.equal(r.game.factions[f].budget,before);assert.equal(restoreRoom(r).game.factions[f].lastFavor.type,'funding');
});
test('Supplied mission images exist and verification now uses the previous collection artwork',()=>{
 for(const k of ['sneak','contacts','hide','findSafehouse','analyze'])assert.ok(existsSync(new URL('../dist/client/'+MISSION_IMAGES[k],import.meta.url)));assert.equal(MISSION_IMAGES.analyze,'./assets/missions/analyze.webp');assert.equal(MISSION_IMAGES.collect,'./assets/missions/collect.webp');
});

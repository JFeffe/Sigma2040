import test from 'node:test';
import assert from 'node:assert/strict';
import {newRoom,joinRoom,startRoom,execute,roomView,restoreRoom,playingMembers,PROTOCOL,disconnect} from '../dist/client/multiplayer-core.js';
import {makeScreens} from '../dist/client/screens.js';
import {agentMapMarkers} from '../dist/client/map-markers.js';
const host='host-token-00000000000000',invite='invite-token-000000000000';
const cmd=(r,t,kind,payload={})=>execute(r,t,{protocol:PROTOCOL,seq:r.members.find(m=>m.token===t).lastSeq+1,turn:r.game?.turn,kind,payload});
function lobby(n=2){const r=newRoom('room-token-00000000000000',invite,host,'Observer');cmd(r,host,'observer',{observer:true});for(let i=0;i<n;i++){const token='guest-token-000000000000'+i;joinRoom(r,{invite,token,name:'Guest '+i});cmd(r,token,'team',{agents:['p0','p12','p13','p14']});}return r;}
test('Observer occupies no country, allows six players, requires two, and role is host-only and lobby-only',()=>{
 const r=lobby(6);assert.equal(r.members.length,7);assert.equal(new Set(playingMembers(r).map(m=>m.country)).size,6);assert.equal(r.members[0].country,null);assert.throws(()=>cmd(r,host,'observer',{observer:false}),/occupées/);assert.throws(()=>cmd(r,r.members[1].token,'observer',{observer:true}),/hôte/);assert.throws(()=>cmd(r,host,'team',{agents:['p0','p12','p13','p14']}));assert.throws(()=>startRoom(lobby(1)),/Deux joueurs/);startRoom(r,2040);assert.equal(r.game.humanFactions.length,6);assert.equal(r.game.agents.length,24);assert.throws(()=>cmd(r,host,'observer',{observer:false}));assert.equal(restoreRoom(r).members.length,7);
});
test('Observer cannot mutate, never readies, and sees each human without exposing their secrets to guests',()=>{
 const r=lobby();startRoom(r,2040);const [a,b]=playingMembers(r);const id=r.game.agents.find(x=>x.faction===b.country).id;cmd(r,b.token,'assign',{id,type:'travel',target:'JP'});
 for(const kind of ['ready','assign','cancel','tech','hire','event','request','government-favor']){const before=JSON.stringify(r);assert.throws(()=>cmd(r,host,kind,{ready:true,id,type:'rest'}),/consultation/);assert.equal(JSON.stringify(r),before);}
 const v=roomView(r,host,b.country);assert.equal(v.country,null);assert.equal(v.game.player,b.country);assert.equal(v.game.agents.length,8);assert.equal(v.game.agents.find(x=>x.id===id).task.target,'JP');assert.equal(v.game.factions[b.country].budget,r.game.factions[b.country].budget);assert.match(agentMapMarkers(v.game),/observer-map-agent/);
 for(const f of [a.country,b.country]){const screens=makeScreens(roomView(r,host,f).game,f,null,[],{});for(const screen of ['agents','inquiry','operations','government','diplomacy','journal','world'])assert.equal(typeof screens[screen](),'string');}
 const guest=roomView(r,a.token,b.country);assert.equal(guest.game.player,a.country);assert.equal(guest.game.multiplayer.observer,undefined);assert.equal(guest.game.agents.length,4);assert.deepEqual(guest.game.factions[b.country].known,{});
 cmd(r,a.token,'ready',{ready:true});assert.equal(r.game.turn,1);cmd(r,b.token,'ready',{ready:true});assert.equal(r.game.turn,2);assert.equal(r.members[0].ready,false);
 disconnect(r,b.token);cmd(r,a.token,'ready',{ready:true});assert.equal(r.game.turn,2);joinRoom(r,{invite,token:b.token});cmd(r,b.token,'ready',{ready:true});assert.equal(r.game.turn,3);
 const restored=restoreRoom(JSON.parse(JSON.stringify(r)));assert.equal(restored.members[0].observer,true);assert.equal(restored.members[0].country,null);assert.deepEqual(restored.game.agents,r.game.agents);assert.ok(playingMembers(restored).every(m=>!m.connected));
 cmd(r,host,'replace',{country:a.country});assert.equal(roomView(r,host,a.country).game.player,b.country);assert.throws(()=>cmd(r,host,'replace',{country:b.country}),/au moins/);assert.equal(restoreRoom(r).members[0].observer,true);
});
test('Malformed observer save cannot promote a guest or hide its team',()=>{const r=lobby();startRoom(r,1);r.members[1].observer=true;assert.throws(()=>restoreRoom(r));});

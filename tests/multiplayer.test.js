import test from 'node:test';
import assert from 'node:assert/strict';
import {newRoom,joinRoom,startRoom,execute,disconnect,playerView,roomView,restoreRoom,PROTOCOL} from '../dist/client/multiplayer-core.js';
import * as E from '../dist/client/engine.js';
import {makeScreens} from '../dist/client/screens.js';
import {portraitAsset} from '../dist/client/ui.js';
const host='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',guest='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',invite='cccccccc-cccc-cccc-cccc-cccccccccccc';
const room=()=>{const r=newRoom('dddddddd-dddd-dddd-dddd-dddddddddddd',invite,host,'Hôte');joinRoom(r,{invite,token:guest,name:'Invité'});r.members.forEach(m=>{if(!m.agents.length)m.agents=['p0','p12','p13','p14'];m.confirmed=true;});startRoom(r,2040);return r;};
const cmd=(r,token,kind,payload={})=>execute(r,token,{protocol:PROTOCOL,seq:r.members.find(m=>m.token===token).lastSeq+1,turn:r.game?.turn,kind,payload});
const readyAll=r=>{for(const m of r.members){if(r.game.eventsByFaction[m.country])cmd(r,m.token,'event',{index:1});}for(const m of r.members)cmd(r,m.token,'ready',{ready:true});};
test('Lobby reserves one country per player, rejects bad invitations and non-host starts',()=>{
 const r=newRoom('dddddddd-dddd-dddd-dddd-dddddddddddd',invite,host,'Hôte');assert.throws(()=>joinRoom(r,{invite:'wrong',token:guest}));joinRoom(r,{invite,token:guest});assert.throws(()=>cmd(r,guest,'country',{country:'FR'}));assert.throws(()=>cmd(r,guest,'start'));cmd(r,guest,'country',{country:'CN'});r.members.forEach(m=>cmd(r,m.token,'team',{agents:m.agents.length?m.agents:['p0','p12','p13','p14']}));cmd(r,host,'start');assert.deepEqual(r.game.humanFactions,['FR','CN']);assert.equal(r.game.agents.length,24);
});
test('Humans keep their agents idle while NPCs play; all-ready advances once and duplicates are harmless',()=>{
 const r=room(),country=r.members[1].country;cmd(r,host,'ready',{ready:true});assert.equal(r.game.turn,1);const message={protocol:PROTOCOL,seq:1,turn:1,kind:'ready',payload:{ready:true}};execute(r,guest,message);assert.equal(r.game.turn,2);assert.ok(E.team(r.game,country).every(a=>!a.task));const before=JSON.stringify(r.game);assert.equal(execute(r,guest,message).duplicate,true);assert.equal(JSON.stringify(r.game),before);assert.ok(r.game.agents.some(a=>!r.game.humanFactions.includes(a.faction)&&a.task)||r.game.campaignStats.events.some(e=>!r.game.humanFactions.includes(e.faction)));assert.ok(!r.game.campaignStats.events.some(e=>r.game.humanFactions.includes(e.faction)));assert.ok(Object.values(r.game.factions).every(f=>f.internalInfluenceUses===0));
});
test('Only owners can issue orders; budget is reserved once; readiness locks mutations and old-day commands fail',()=>{
 const r=room(),id=E.team(r.game)[0].id;assert.throws(()=>cmd(r,guest,'assign',{id,type:'travel',target:'JP'}));cmd(r,host,'assign',{id,type:'travel',target:'JP'});assert.equal(r.game.factions.FR.budget,6);cmd(r,host,'ready',{ready:true});assert.throws(()=>cmd(r,host,'cancel',{id}));cmd(r,host,'ready',{ready:false});cmd(r,host,'cancel',{id});assert.equal(r.game.factions.FR.budget,6);readyAll(r);assert.throws(()=>execute(r,host,{protocol:PROTOCOL,seq:100,turn:1,kind:'ready',payload:{ready:true}}));
});
test('Disconnection blocks the day indefinitely; reconnecting restores country and clears ready',()=>{
 const r=room(),country=r.members[1].country;disconnect(r,guest);cmd(r,host,'ready',{ready:true});assert.equal(r.game.turn,1);assert.throws(()=>cmd(r,guest,'ready',{ready:true}));joinRoom(r,{invite,token:guest,name:'Retour'});assert.equal(r.members[1].country,country);assert.equal(r.members[1].ready,false);cmd(r,guest,'ready',{ready:true});assert.equal(r.game.turn,2);
});
test('Private views omit secrets and preserve stale observed locations instead of actual positions',()=>{
 const r=room(),s=r.game,country=r.members[1].country;const id=Object.keys(s.factions[country].known)[0];s.suspects.find(t=>t.id===id).country='CA';s.factions[country].known[id].country='DE';s.factions.FR.known.s6={country:'JP',locationUntil:40,prepared:true,identified:true};E.assign(s,E.team(s)[0].id,'travel','JP');const v=playerView(r,country);assert.equal(v.suspects.find(t=>t.id===id).country,'DE');assert.equal(v.rng,undefined);assert.equal(v.fracture,undefined);assert.equal(v.seed,undefined);assert.deepEqual(v.factions.FR.known,{});assert.ok(v.agents.every(a=>a.faction===country));assert.ok(v.proofs.every(p=>!('authentic' in p)));assert.equal(v.plots.length,2);assert.equal(v.plots[0].turn,3);assert.equal(v.pressureRules,1);assert.equal(roomView(r,guest).members[0].token,undefined);assert.equal(roomView(r,guest).invite,undefined);
});
test('Removed events never block multiplayer readiness',()=>{const r=room();readyAll(r);readyAll(r);readyAll(r);assert.equal(r.game.turn,4);assert.ok(Object.values(r.game.eventsByFaction).every(e=>!e));readyAll(r);assert.equal(r.game.turn,5);});
test('Multiplayer rejects both new exchanges and answers to old offers',()=>{const r=room(),country=r.members[1].country,before=JSON.stringify(r.game);assert.throws(()=>cmd(r,host,'share',{to:country}),/désactivés/);assert.throws(()=>cmd(r,guest,'share-answer',{from:'FR',accept:true}),/désactivés/);assert.equal(JSON.stringify(r.game),before);});
function supply(s,f,id){s.factions[f].known[id]??={country:'DE',identified:true,locationUntil:0};s.factions[f].evidence.push({id:id+'-e0',verified:true,contested:false,collectedBy:f,verifiedBy:f});}
test('Export and restore preserve deterministic state, slots, events and queued actions',()=>{
 const r=room();cmd(r,host,'assign',{id:E.team(r.game)[0].id,type:'travel',target:'JP'});readyAll(r);const restored=restoreRoom(JSON.parse(JSON.stringify(r)));assert.equal(restored.members[1].connected,false);assert.equal(restored.game.rng,r.game.rng);assert.deepEqual(restored.game.agents,r.game.agents);joinRoom(restored,{invite,token:guest});readyAll(r);readyAll(restored);assert.deepEqual(restored.game,r.game);
});
test('Full campaign keeps all country views renderable and saves valid',()=>{
 const r=room();for(let i=0;i<40&&!r.game.ended;i++){for(const m of r.members){const v=playerView(r,m.country);const screens=makeScreens(v,m.country,null,[],{});for(const view of ['agents','inquiry','operations','diplomacy','government','journal'])assert.equal(typeof screens[view](),'string');}readyAll(r);restoreRoom(JSON.parse(JSON.stringify(r)));}assert.ok(r.game.ended);assert.equal(portraitAsset(playerView(r,'FR').agents[0]),'./assets/iris-portrait.webp');
});
test('Host can replace a departed player, but cannot silently skip an active human',()=>{
 const r=room(),country=r.members[1].country;assert.throws(()=>cmd(r,guest,'replace',{country:'FR'}));disconnect(r,guest);cmd(r,host,'replace',{country});assert.deepEqual(r.game.humanFactions,['FR']);assert.equal(r.game.turn,1);cmd(r,host,'ready',{ready:true});assert.equal(r.game.turn,2);assert.throws(()=>joinRoom(r,{invite,token:guest}));
});
test('Five humans and one NPC can pass the periodic diplomacy day',()=>{
 const r=newRoom('dddddddd-dddd-dddd-dddd-dddddddddddd',invite,host,'Hôte');for(let i=0;i<4;i++)joinRoom(r,{invite,token:'player-token-0000000000'+i,name:'J'+i});r.members.forEach(m=>{if(!m.agents.length)m.agents=['p0','p12','p13','p14'];m.confirmed=true;});startRoom(r,3);r.game.plots=[];for(let i=0;i<7;i++)readyAll(r);assert.equal(r.game.turn,8);
});
test('A national mandate never takes another human’s dossiers without consent',()=>{
 const r=room(),other=r.members[1].country;r.game.turn=15;r.game.event={id:'mandate'};r.game=E.validateSave(r.game);r.game.eventsByFaction.FR=structuredClone(r.game.event);supply(r.game,other,'s5');assert.throws(()=>cmd(r,host,'event',{index:0}),/désactivés/);assert.equal(r.game.factions.FR.evidence.some(e=>e.id==='s5-e0'),false);
});
test('Malformed technology commands cannot corrupt the authoritative budget or prototype',()=>{
 const r=room(),before=JSON.stringify(r.game);for(const type of ['constructor','__proto__','missing'])assert.throws(()=>cmd(r,guest,'tech',{type,country:'US'}));assert.throws(()=>cmd(r,guest,'tech',{type:'guard',country:'__proto__'}));assert.equal(JSON.stringify(r.game),before);
});
test('Authority levels and per-turn limits reach their owner without leaking foreign relations',()=>{
 const r=room(),country=r.members[1].country;r.game.factions[country].cooperation.DE=4;r.game.factions[country].cooperationRaised.DE=1;
 const view=playerView(r,country);assert.equal(view.factions[country].cooperation.DE,4);assert.equal(view.factions[country].cooperationRaised.DE,1);assert.deepEqual(view.factions.FR.cooperation,{});
 const html=makeScreens(view,'DE',view.agents[0].id,null,{}).diplomacy();assert.match(html,/Soutien total/);assert.match(html,/Coopération des autorités/);assert.doesNotMatch(html,/Coopération <strong>\d/);
});

test('Support cancellation is authoritative, owned, readiness-locked and refundable',()=>{
 const r=room();cmd(r,host,'tech',{type:'guard',country:'TR'});const id=r.game.factions.FR.tech[0].id;
 assert.throws(()=>cmd(r,guest,'cancel-tech',{id}));cmd(r,host,'ready',{ready:true});assert.throws(()=>cmd(r,host,'cancel-tech',{id}));cmd(r,host,'ready',{ready:false});
 cmd(r,host,'cancel-tech',{id});assert.equal(r.game.factions.FR.budget,6);assert.equal(r.game.factions.FR.tech.length,0);assert.equal(r.game.factions.FR.defense.TR,undefined);assert.throws(()=>cmd(r,host,'cancel-tech',{id}));
});

test('Old room saves migrate, but old live commands cannot spend the new reinforcement price',()=>{const r=room();r.protocol=1;delete r.game.economyRules;const loaded=restoreRoom(r);assert.equal(loaded.protocol,PROTOCOL);assert.equal(loaded.game.economyRules,1);const before=JSON.stringify(loaded);assert.throws(()=>execute(loaded,host,{protocol:1,seq:10,turn:1,kind:'assign',payload:{id:E.team(loaded.game)[0].id,type:'counter',useCredits:true}}),/incompatible/);assert.equal(JSON.stringify(loaded),before);});

test('Module update migrates protocol 2 saves and rejects stale module commands',()=>{const r=room();r.protocol=2;const loaded=restoreRoom(r);assert.equal(loaded.protocol,PROTOCOL);assert.throws(()=>execute(loaded,host,{protocol:2,seq:10,turn:1,kind:'tech',payload:{type:'relay',country:'FR'}}),/incompatible/);cmd(loaded,host,'tech',{type:'relay',country:'FR'});assert.equal(playerView(loaded,'FR').factions.FR.tech[0].type,'relay');assert.equal(playerView(loaded,'CN').factions.FR.tech.length,0);});
test('New host and guest start with no agents; country changes preserve explicit teams and empty lobby saves reload',()=>{const r=newRoom('dddddddd-dddd-dddd-dddd-dddddddddddd',invite,host,'Hôte');joinRoom(r,{invite,token:guest,name:'Invité'});assert.ok(r.members.every(m=>m.agents.length===0&&!m.confirmed));assert.ok(restoreRoom(r).members.every(m=>m.agents.length===0));cmd(r,host,'country',{country:'CN'});assert.deepEqual(r.members[0].agents,[]);const chosen=['p0','p12','p13','p14'];cmd(r,host,'team',{agents:chosen});cmd(r,host,'country',{country:'GB'});assert.deepEqual(r.members[0].agents,chosen);assert.equal(r.members[0].confirmed,false);assert.throws(()=>startRoom(r),/confirmer/);});

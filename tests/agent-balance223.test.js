import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DISPLAY_ROSTER,TALENTS} from '../dist/client/data.js';
import {recruitProfile,recruitDetails,recruitCard,setRecruitView} from '../dist/client/recruit-selection.js';
import {statlines} from '../dist/client/ui.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';
const profiles=[{id:'p13',old:[5,7,8],stats:[5,8,7],talents:['contacts','informatique','drones']},{id:'p18',old:[7,6,7],stats:[6,6,8],talents:['contacts','combat','infiltration']}];
const fresh=()=>E.createConfiguredGame('FR',['p13','p18','p0','p12'],223,'bb2',{operationMap:false});
test('Approved profiles preserve all roster creation constraints',()=>{
 for(const p of profiles){const a=DISPLAY_ROSTER.find(a=>a.id===p.id);assert.deepEqual(a.stats,p.stats);assert.deepEqual(a.talents,p.talents);}
 assert.equal(new Set(DISPLAY_ROSTER.map(a=>a.stats.join(','))).size,20);
 assert.equal(new Set(DISPLAY_ROSTER.map(a=>[...a.talents].sort().join(','))).size,20);
 for(const a of DISPLAY_ROSTER){assert.equal(a.stats.reduce((s,n)=>s+n,0),20);assert.ok(a.stats.every(n=>n>=3&&n<=9));}
 for(const t of Object.keys(TALENTS).filter(t=>t!=='chef'))assert.equal(DISPLAY_ROSTER.filter(a=>a.talents.includes(t)).length,5);
});
test('Cards, portrait faces, dossiers and stat bars display updated values',()=>{
 for(const p of profiles){const a=DISPLAY_ROSTER.find(a=>a.id===p.id);
 for(const html of [recruitProfile(a),recruitDetails(p.id),statlines(a)])assert.deepEqual([...html.matchAll(/<strong>(\d)<\/strong>/g)].map(m=>+m[1]),p.stats);
 setRecruitView('solo',p.id,true);const html=recruitCard(a,[]);for(const [i,n]of p.stats.entries())assert.match(html,new RegExp(`class="stat-${i}"[^>]*aria-label="[^"]+ : ${n}"`));
 }
});
test('Old solo saves migrate idempotently without changing confirmed missions or resources',()=>{
 const s=fresh();for(const p of profiles)s.agents.find(a=>a.id===p.id).stats=[...p.old];
 E.assign(s,'p13','cyberSupport','BR');E.assign(s,'p18','travel','BR');
 const tasks=profiles.map(p=>structuredClone(s.agents.find(a=>a.id===p.id).task)),budget=s.factions.FR.budget;
 const restored=E.validateSave(structuredClone(s));
 profiles.forEach((p,i)=>{const a=restored.agents.find(a=>a.id===p.id);assert.deepEqual(a.stats,p.stats);assert.deepEqual(a.task,tasks[i]);});
 assert.equal(restored.factions.FR.budget,budget);assert.deepEqual(E.validateSave(structuredClone(restored)),restored);
});
test('Multiplayer restores old template profiles and sends updated stats to clients',()=>{
 const r=newRoom('balance-room-00000000223','balance-invite-00000223','balance-host-0000000223','Hôte');
 joinRoom(r,{invite:r.invite,token:'balance-guest-000000223',name:'Invité'});
 r.members[0].agents=['p13','p18','p0','p12'];r.members[1].agents=['p0','p12','p13','p14'];r.members.forEach(m=>m.confirmed=true);startRoom(r,223);
 for(const a of r.game.agents){const p=profiles.find(p=>p.id===a.templateId);if(p)a.stats=[...p.old];}
 const view=playerView(restoreRoom(structuredClone(r)),'FR');
 for(const p of profiles)assert.deepEqual(view.agents.find(a=>a.templateId===p.id).stats,p.stats);
});

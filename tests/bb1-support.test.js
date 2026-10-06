import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
function fixture(){
 const s=E.createGame('FR',['p15','p12','p13','p14'],55,'bb1'),f=s.factions.FR,m=E.team(s),t=s.suspects[0];
 s.plots=[];f.confidence=40;f.budget=18;f.known={[t.id]:{country:'DE',identified:true,intimidated:true,prepared:true,locationUntil:6}};
 f.evidence=s.proofs.filter(p=>p.suspect===t.id).slice(0,2).map(p=>({id:p.id,verified:true,contested:false}));f.access.DE=true;f.authorized.DE=false;f.cooperation.DE=0;
 for(const a of m){a.country='DE';a.task={type:'rest',remaining:1};a.chief=false;a.stats=[6,6,6];a.talents=[];a.fatigue=a.exposure=0;a.status='ready';}
 m[0].country='FR';m[0].stats=[10,6,3];m[1].task=null;
 return {s,f,m,t,a:m[1]};
}
test('BB1 spends diplomacy on a usable mandate and respects the government cooldown',()=>{
 const {s,f}=fixture();E.planFaction(s,'FR');assert.equal(f.lastFavor.type,'diplomacy');assert.equal(f.lastFavor.country,'DE');assert.equal(f.cooperation.DE,1);assert.equal(f.confidence,20);assert.equal(f.authorized.DE,false);
 const saved=structuredClone(f.lastFavor);E.planFaction(s,'FR');assert.deepEqual(f.lastFavor,saved);
});
test('BB1 funding unlocks a useful paid intervention instead of filling an unused reserve',()=>{
 const {s,f,a}=fixture();f.authorized.DE=true;f.cooperation.DE=2;f.budget=1;f.confidence=35;
 E.planFaction(s,'FR');assert.equal(f.lastFavor.type,'funding');assert.equal(f.lastFavor.gain,5);assert.equal(a.task.type,'arrest');assert.equal(a.task.bonusCredits,6);assert.equal(f.budget,0);assert.equal(f.confidence,20);
 const idle=fixture();idle.f.known={};idle.f.evidence=[];idle.f.budget=0;for(const a of idle.m)a.task={type:'rest',remaining:1};E.planFaction(idle.s,'FR');assert.equal(idle.f.lastFavor,null);
});
test('BB1 values medical energy without changing already confirmed chances or orders',()=>{
 const {s,f,m}=fixture();f.known={};f.evidence=[];f.confidence=80;
 for(const a of m.slice(1,3)){a.fatigue=60;a.task={type:'collect',remaining:1,target:'s0',chance:47};}
 const tasks=m.slice(1,3).map(a=>structuredClone(a.task));E.planFaction(s,'FR');assert.equal(f.lastFavor.type,'medical');assert.deepEqual(m.slice(1,3).map(a=>a.fatigue),[40,40]);assert.deepEqual(m.slice(1,3).map(a=>a.task),tasks);
});
test('BB1 does not spend diplomacy on busy or already capped agents',()=>{
 for(const mode of ['busy','capped']){const {s,f,a}=fixture();f.authorized.DE=true;f.cooperation.DE=3;if(mode==='busy')a.task={type:'rest',remaining:2};else {a.stats=[10,10,10];a.talents=['combat','surveillance'];}E.planFaction(s,'FR');assert.notEqual(f.lastFavor?.type,'diplomacy');assert.equal(f.cooperation.DE,3);}
});
test('BB1 uses an analysis module for a real batch and keeps a field slot free',()=>{
 const {s,f,m}=fixture();f.confidence=0;f.known={};m[0].task=null;m[0].stats=[7,7,3];m[0].talents=[];f.evidence.forEach(e=>e.verified=false);
 E.planFaction(s,'FR');assert.ok(f.tech.some(t=>t.type==='ai'&&t.used));assert.equal(m[0].task.type,'analyze');assert.equal(m[0].task.aiBonus,10);assert.equal(E.getTechSlots(s,'FR'),1);
 const occupied=fixture();occupied.f.confidence=0;occupied.m[0].task=null;occupied.m[0].stats=[7,7,3];occupied.m[0].talents=[];occupied.f.evidence.forEach(e=>e.verified=false);occupied.f.tech=[{type:'relay',country:'FR',until:3}];E.planFaction(occupied.s,'FR');assert.equal(occupied.f.tech.some(t=>t.type==='ai'),false);
});
test('BB1 does not buy an analysis module for capped verifications',()=>{
 const {s,f,m}=fixture();f.confidence=0;m[0].task=null;m[0].stats=[10,7,3];m[0].talents=['enquete'];f.evidence.forEach(e=>e.verified=false);E.planFaction(s,'FR');assert.equal(f.tech.some(t=>t.type==='ai'),false);
});
test('BB1 can extend a location while the arrest specialist finishes a locked order',()=>{
 const {s,f,m,t}=fixture();f.confidence=0;f.known[t.id].locationUntil=s.turn;for(const a of m)a.task={type:'rest',remaining:1};
 E.planFaction(s,'FR');assert.ok(f.tech.some(t=>t.type==='relay'&&t.used));assert.equal(f.known[t.id].locationUntil,s.turn+2);
});
test('BB1 uses a free field slot to find an actually beneficial weapon while proofs await verification',()=>{
 const {s,f,a}=fixture();f.confidence=0;f.budget=0;f.authorized.DE=true;f.cooperation.DE=3;f.known.s0.prepared=false;f.evidence.forEach(e=>e.verified=false);a.weapon=false;
 E.planFaction(s,'FR');assert.equal(a.task.type,'equip');assert.equal(a.task.cost,0);
});
test('BB1 rejects weapon acquisition when its exposure would erase the arrest bonus',()=>{
 const {s,f,a}=fixture();f.confidence=0;f.budget=0;f.authorized.DE=true;f.cooperation.DE=3;f.known.s0.prepared=false;f.evidence.forEach(e=>e.verified=false);a.weapon=false;a.exposure=35;
 E.planFaction(s,'FR');assert.notEqual(a.task.type,'equip');
});
test('Government and module choices cannot see hidden authenticity, positions, rival orders or future draws',()=>{
 const {s}=fixture(),copy=structuredClone(s);copy.seed=933;copy.proofs.forEach(p=>p.authentic=!p.authentic);copy.suspects.forEach(t=>t.country='JP');for(const a of copy.agents.filter(a=>a.faction!=='FR')){a.country='DE';a.task={type:'arrest',target:'s0',remaining:1};}
 E.planFaction(s,'FR');E.planFaction(copy,'FR');assert.deepEqual(E.team(s).map(a=>a.task),E.team(copy).map(a=>a.task));assert.deepEqual(s.factions.FR.bb1,copy.factions.FR.bb1);assert.deepEqual(s.factions.FR.lastFavor,copy.factions.FR.lastFavor);
});

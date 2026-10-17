import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ACTIONS,COUNTRIES,ROSTER} from '../dist/client/data.js';
import {CAMPAIGN_KEY,ECONOMY_BACKUP_KEY,readCampaign} from '../dist/client/save-compat.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.humanFactions=COUNTRIES.filter(c=>c.power).map(c=>c.id);return s;};
const tick=s=>{s.eventsByFaction={};if(s.event)E.answerEvent(s,s.event.choices.length-1);E.advance(s);};
function fixture(type){const s=fresh(),a=E.team(s)[0],f=s.factions.FR;a.stats=[5,5,5];a.talents=['endurance','secours','langues'];a.nationalities=['FR'];let target=null;
 if(!ACTIONS[type].home&&!['travel','sneak'].includes(type))a.country='TR';
 s.suspects[0].country='TR';f.known.s0={identified:true,country:'TR',locationUntil:5,prepared:true};
 if(['travel','sneak','cyberSupport'].includes(type))target='JP';
 if(['collect','surveil','hack','prepare','arrest','drone','intimidate'].includes(type))target='s0';
 if(['collect','hack'].includes(type))f.access.TR=true;
 if(['prepare','arrest'].includes(type)){f.evidence=[{id:'s0-e0',verified:true,contested:false},{id:'s0-e1',verified:false,contested:false}];f.authorized.TR=true;}
 if(type==='prepare')f.known.s0.prepared=false;
 if(type==='analyze'){f.evidence=[{id:'s0-e0',verified:false,contested:false}];target='s0-e0';}
 if(type==='heal')a.status='injured';if(type==='equip')a.weapon=false;if(type==='fieldRest')f.safehouses=['TR'];
 if(type==='rescue'){const b=E.team(s)[1];b.status='captured';b.country='TR';target=b.id;}
 return {s,a,f,target};
}
test('Every available mission can be assigned with zero credits; duration and costs stay fixed',()=>{
 for(const [type,d] of Object.entries(ACTIONS).filter(([,d])=>!d.disabled)){const {s,a,f,target}=fixture(type);f.budget=0;const o=E.options(s,a.id,type,target);assert.equal(o.error,null,type);assert.equal(o.cost,0,type);E.assign(s,a.id,type,target);assert.equal(f.budget,0);assert.equal(a.task.cost,0);E.cancel(s,a.id);assert.equal(f.budget,0);}
});
test('Every risky action offers exactly one +10 boost, charges once and refunds a cancelled queued boost',()=>{
 for(const [type,d] of Object.entries(ACTIONS).filter(([,d])=>!d.disabled)){const {s,a,f,target}=fixture(type);const normal=E.options(s,a.id,type,target),boost=E.options(s,a.id,type,target,true);
 if(d.safe){assert.ok(boost.error,type);assert.throws(()=>E.assign(s,a.id,type,target,true));continue;}
 assert.equal(boost.error,null,type);assert.equal(boost.cost,6);assert.equal(boost.chance,Math.min(90,normal.chance+10));assert.equal(boost.duration,normal.duration);assert.equal(boost.fatigue,normal.fatigue);
 E.assign(s,a.id,type,target,true);assert.equal(f.budget,0);assert.equal(a.task.bonusCredits,6);const saved=E.validateSave(structuredClone(s));assert.equal(saved.agents.find(x=>x.id===a.id).task.chance,boost.chance);assert.throws(()=>E.assign(s,a.id,type,target,true));assert.equal(f.budget,0);E.cancel(s,a.id);assert.equal(f.budget,6);E.cancel(s,a.id);assert.equal(f.budget,6);
 }
});
test('Boost stays optional when broke, respects both probability bounds, and no-effect purchase is rejected',()=>{
 const {s,a,f,target}=fixture('sneak');f.budget=5;const before=JSON.stringify(s);assert.throws(()=>E.assign(s,a.id,'sneak',target,true));assert.equal(JSON.stringify(s),before);assert.equal(E.options(s,a.id,'sneak',target).error,null);
 f.budget=6;a.stats=[1,1,1];a.fatigue=90;a.status='injured';a.exposure=100;assert.equal(E.options(s,a.id,'sneak',target).chance,10);assert.equal(E.options(s,a.id,'sneak',target,true).chance,20);
 a.stats=[10,10,10];a.fatigue=0;a.status='ready';a.exposure=0;a.country='TR';a.nationalities.push('TR');a.talents=['contacts'];const capped=E.options(s,a.id,'contacts');assert.equal(capped.chance,90);assert.ok(E.options(s,a.id,'contacts',null,true).error);assert.throws(()=>E.assign(s,a.id,'contacts',null,true));assert.equal(f.budget,6);
});
test('Income rises at 50 confidence and respects reserves',()=>{
 const s=fresh();for(const f of Object.values(s.factions)){assert.equal(f.budget,6);for(const confidence of [0,49,50,69,70,89,90,100])assert.deepEqual(E.funding({...f,confidence}),{income:confidence<10?0:confidence>=50?3:2,cap:18});f.budget=0;}
 for(let i=1;i<=3;i++){tick(s);assert.equal(s.factions.FR.budget,2*i);}s.factions.FR.budget=17;tick(s);assert.equal(s.factions.FR.budget,18);s.factions.FR.budget=25;tick(s);assert.equal(s.factions.FR.budget,25);
});
test('Recruitment at zero credits keeps the two-turn delay and occupied-post restrictions',()=>{
 const s=fresh(),f=s.factions.FR;f.budget=0;const id=ROSTER.find(r=>!s.agents.some(a=>a.id===r.id)).id;assert.throws(()=>E.recruit(s,id));E.team(s)[0].status='dead';E.recruit(s,id);assert.equal(f.budget,0);assert.equal(s.recruitments[0].remaining,2);tick(s);assert.equal(s.recruitments[0].remaining,1);tick(s);assert.ok(E.team(s).some(a=>a.id===id));assert.equal(E.team(s).length,4);
});
test('Boosted legacy two-turn drone reserves a module, charges once, and cancellation retains the spent reinforcement',()=>{
 const {s,a,f,target}=fixture('drone');E.assign(s,a.id,'drone',target,true);a.task.total=a.task.remaining=2;assert.equal(E.getTechSlots(s,'FR'),1);tick(s);assert.equal(a.task.remaining,1);assert.equal(f.budget,2);E.cancel(s,a.id);assert.equal(f.budget,2);assert.equal(E.getTechSlots(s,'FR'),0);assert.equal(f.access.TR,undefined);tick(s);assert.equal(f.access.TR,undefined);
 const x=fixture('drone');E.activateTech(x.s,'ai');x.f.budget=5;E.activateTech(x.s,'guard','TR');assert.ok(E.options(x.s,x.a.id,'drone',x.target).error);
});
test('A resolved reinforcement is consumed on success or failure, including Hack support cancellation',()=>{
 for(const seed of [1,1000]){const {s,a,f,target}=fixture('cyberSupport');s.rng=seed;E.assign(s,a.id,'cyberSupport',target,true);a.task.chance=seed===1?100:10;tick(s);assert.equal(a.task,null);assert.equal(s.operationReports.find(r=>r.agentId===a.id).status,seed===1?'RÉUSSITE':'ÉCHEC');assert.equal(f.budget,2);if(f.cyberSupport[target]){assert.equal(f.cyberSupport[target].cost,0);E.cancelCyberSupport(s,target);assert.equal(f.budget,2);}E.cancel(s,a.id);assert.equal(f.budget,2);}
});
test('Cancelling AI preserves the paid bonus at and below the cap, including save/reload',()=>{
 for(const stat of [4,6,7]){const {s,a,f,target}=fixture('analyze');a.stats[0]=stat;f.budget=10;const base=E.options(s,a.id,'analyze',target,true).chance,t=E.activateTech(s,'ai');E.assign(s,a.id,'analyze',target,true);const loaded=E.validateSave(structuredClone(s));E.cancelTech(loaded,t.id);assert.equal(loaded.agents.find(x=>x.id===a.id).task.chance,base);assert.equal(loaded.factions.FR.budget,10-6);assert.equal(loaded.agents.find(x=>x.id===a.id).task.cost,6);}
});
test('Legacy paid tasks, reserves and chance survive migration; only an unstarted boost is refunded',()=>{
 const {s,a,f}=fixture('authorize');delete s.economyRules;f.budget=37;a.task={type:'authorize',target:null,remaining:1,total:1,cost:3,chance:73,fatigue:8,queued:true,origin:'TR',bonusCredits:2};const t=structuredClone(a.task),loaded=E.validateSave(structuredClone(s));assert.equal(loaded.factions.FR.budget,37);assert.deepEqual(loaded.agents[0].task,{...t,fatigue:E.missionFatigue(a,t.type),energyRules:2});assert.deepEqual(E.validateSave(structuredClone(loaded)),loaded);E.cancel(loaded,a.id);assert.equal(loaded.factions.FR.budget,39);E.cancel(loaded,a.id);assert.equal(loaded.factions.FR.budget,39);tick(loaded);assert.equal(loaded.factions.FR.budget,39);
});
test('Original solo save is preserved byte-for-byte once before migration and never overwritten',()=>{
 const s=fresh();delete s.economyRules;const raw=JSON.stringify(s),m=new Map([[CAMPAIGN_KEY,raw]]),storage={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};
 const loaded=readCampaign(storage,E.validateSave);assert.equal(loaded.economyRules,1);assert.equal(m.get(ECONOMY_BACKUP_KEY),raw);storage.setItem(CAMPAIGN_KEY,JSON.stringify(loaded));readCampaign(storage,E.validateSave);assert.equal(m.get(ECONOMY_BACKUP_KEY),raw);
 assert.throws(()=>readCampaign({getItem:k=>k===CAMPAIGN_KEY?raw:null,setItem:()=>{throw Error('Full');}},E.validateSave),/Full/);
});

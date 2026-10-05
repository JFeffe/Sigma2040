import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,ROSTER,TALENTS,ACTIONS} from '../dist/client/data.js';
const fresh=(seed=20)=>E.createGame('FR',['p0','p1','p2','p3'],seed);
const advance=s=>{if(s.event)E.answerEvent(s,s.event.choices.length-1);return E.advance(s);};
test('Six powers have distinct four-agent rosters, twelve talents and three numeric abilities',()=>{
 const s=fresh();assert.equal(Object.keys(s.factions).length,6);assert.equal(COUNTRIES.length,12);assert.equal(s.agents.length,24);assert.equal(new Set(s.agents.map(a=>a.id)).size,24);assert.equal(Object.keys(TALENTS).filter(t=>t!=='chef').length,12);for(const a of s.agents){assert.equal(a.stats.length,3);assert.ok(a.talents.length>=3&&a.talents.length<=6);}assert.throws(()=>E.createGame('CA',['p0','p1','p2','p3']));assert.throws(()=>E.createGame('FR',['p0','p0','p2','p3']));
});
test('Multi-turn travel resolves at the correct boundary, legal arrivals are public',()=>{
 const s=fresh();E.assign(s,'p1','travel','JP');assert.equal(s.agents[1].task.remaining,2);assert.equal(s.factions.FR.budget,6);advance(s);assert.equal(s.agents[1].country,'FR');assert.equal(s.agents[1].task.remaining,1);advance(s);assert.equal(s.agents[1].country,'JP');assert.equal(s.agents[1].task,null);assert.equal(s.factions.US.publicAgents.p1.country,'JP');assert.equal(s.factions.US.publicAgents.p1.task,undefined);
});
test('Queued travel refunds; ongoing travel cannot be cancelled',()=>{
 const s=fresh();E.assign(s,'p1','travel','JP');E.cancel(s,'p1');assert.equal(s.factions.FR.budget,6);E.assign(s,'p1','travel','JP');advance(s);const before=s.factions.FR.budget;assert.throws(()=>E.cancel(s,'p1'),/déplacement/);assert.ok(s.agents[1].task);assert.equal(s.factions.FR.budget,before);assert.equal(s.agents[1].country,'FR');
});
test('Illegal actions are rejected without mutation; arrest needs verified independent evidence',()=>{
 const s=fresh(),old=JSON.stringify(s);assert.throws(()=>E.assign(s,'p1','arrest','s0'));assert.equal(JSON.stringify(s),old);s.agents[1].country='DE';s.suspects[0].country='DE';const k=s.factions.FR.known.s0={};k.country='DE';Object.assign(k,{identified:true,prepared:true,locationUntil:5});assert.ok(E.options(s,'p1','arrest','s0').error);s.factions.FR.evidence=[{id:'s0-e0',verified:true},{id:'s0-e1',verified:false}];assert.equal(E.options(s,'p1','arrest','s0').error,null);k.locationUntil=0;assert.ok(E.options(s,'p1','arrest','s0').error);
});
test('Exchange cannot mutate evidence',()=>{const s=fresh(),before=JSON.stringify(s);assert.throws(()=>E.share(s,'US'),/désactivés/);assert.equal(JSON.stringify(s),before);});
test('Fatigue reduces chances, home rest recovers, tech slots enforce capacity',()=>{
 const s=fresh(),a=s.agents[0];const good=E.options(s,a.id,'counter').chance;a.fatigue=80;assert.ok(E.options(s,a.id,'counter').chance<good);E.assign(s,a.id,'rest');advance(s);assert.equal(a.fatigue,30);s.factions.FR.budget=9;E.activateTech(s,'ai');E.activateTech(s,'guard','DE');const before=s.factions.FR.budget;assert.throws(()=>E.activateTech(s,'ai'));assert.equal(s.factions.FR.budget,before);
});
test('Replacement takes two turns and permanently retires a relieved agent',()=>{
 const s=fresh();E.recruit(s,'p4','p0');assert.equal(s.agents[0].status,'retired');assert.equal(E.team(s).length,3);advance(s);assert.equal(E.team(s).length,3);advance(s);assert.equal(E.team(s).length,4);assert.equal(E.team(s).find(a=>a.id==='p4').country,'FR');assert.throws(()=>E.recruit(s,'p0','p1'));
});
test('Captured agents occupy a slot; rescue can liberate and death is permanent',()=>{
 const s=fresh();s.agents[0].status='captured';s.agents[0].country='DE';assert.equal(E.team(s).length,4);assert.throws(()=>E.recruit(s,'p4','p0'));s.agents[1].country='DE';E.assign(s,'p1','rescue','p0');s.agents[1].task.chance=100;advance(s);advance(s);assert.equal(s.agents[0].status,'injured');s.agents[0].status='dead';assert.equal(E.team(s).length,3);assert.ok(E.options(s,'p0','rest').error);E.recruit(s,'p4');assert.equal(s.recruitments.length,1);
});
test('Protection prevents the announced attack and points are awarded once',()=>{
 const s=fresh();s.plots=[{id:'test',country:'DE',turn:1,cell:0,kind:'test',resolved:false}];E.activateTech(s,'guard','DE');advance(s);assert.equal(s.plots[0].resolved,true);assert.equal(s.factions.FR.score,6);advance(s);assert.equal(s.factions.FR.score,6);assert.equal(s.crisis,13);
});
test('National prestige alone cannot win; success requires mastermind and two complete cells',()=>{
 const s=fresh();s.turn=40;s.factions.FR.score=1000;advance(s);assert.equal(s.ended,'defeat');const v=fresh();for(const t of v.suspects)if(t.cell<2||t.cell===3)t.arrested=true;advance(v);assert.equal(v.ended,'victory');assert.throws(()=>E.advance(v));
});
test('Saving preserves all future random results and private state projection hides truth',()=>{
 const s=fresh();E.assign(s,'p1','travel','DE');advance(s);const copy=E.validateSave(JSON.parse(JSON.stringify(s)));for(let i=0;i<15&&!s.ended;i++){advance(s);advance(copy);assert.deepEqual(s,copy);}assert.deepEqual(s,copy);const publicData=E.publicState(fresh());assert.equal(publicData.targets.length,2);assert.equal(publicData.proofs,undefined);assert.equal(publicData.plots,undefined);assert.equal(publicData.rng,undefined);
});
test('Hundred seeded campaigns terminate with valid budgets and teams under independent investigations',()=>{
 let wins=0,losses=0;for(let seed=1;seed<=100;seed++){const s=fresh(seed);while(!s.ended){if(s.event)E.answerEvent(s,s.event.choices.length-1);E.planFaction(s,s.player);E.advance(s);E.validateSave(JSON.parse(JSON.stringify(s)));for(const f of Object.values(s.factions)){assert.ok(f.budget>=0&&f.budget<=E.funding(f).cap);assert.ok(E.team(s,f.id).length<=4);}for(const a of s.agents){assert.ok(a.fatigue>=0&&a.fatigue<=100);assert.ok(!a.task||a.task.remaining>0);}}if(s.ended==='victory')wins++;else losses++;assert.ok(s.turn<=40);}assert.equal(wins+losses,100);console.log(`Simulations: ${wins} victoires, ${losses} défaites / 100 campagnes.`);
});

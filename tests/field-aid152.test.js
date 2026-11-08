import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {TALENTS} from '../dist/client/data.js';

function fresh(seed=152){
 const s=E.createGame('FR',['p0','p16','p27','p14'],seed);
 s.humanFactions=Object.keys(s.factions);
 s.plots=[];
 s.threatReports=[];
 s.fracture.cells.forEach(c=>c.resources=0);
 s.factions.FR.confidence=50;
 return s;
}

test('Medical support restores energy immediately and heals every injured member at turn end',()=>{
 const s=fresh(),[home,field,transit,captured]=E.team(s);
 const foreign=s.agents.find(a=>a.faction==='US');
 for(const a of [home,field,transit,foreign]){a.status='injured';a.fatigue=24;}
 captured.status='captured';
 captured.fatigue=24;
 field.country=foreign.country='DE';
 E.requestGovernmentFavor(s,'medical');
 assert.deepEqual([home,field,transit,captured,foreign].map(a=>a.fatigue),[12,12,12,12,24]);
 assert.equal(s.factions.FR.confidence,25);
 assert.equal(s.factions.FR.medicalUses,1);
 assert.equal(home.status,'injured');
 E.assign(s,transit.id,'travel','JP');
 assert.throws(()=>E.requestGovernmentFavor(s,'medical'),/tour 3/);
 E.advance(s);
 assert.deepEqual([home,field,transit].map(a=>a.status),['ready','ready','ready']);
 assert.equal(transit.task?.type,'travel');
 assert.equal(foreign.status,'injured');
 assert.equal(captured.status,'captured');
 assert.equal(home.fatigue,12);
 assert.equal(E.medicalCarePending(s),false);
});

test('Medical support remains available for a fully rested injured agent and survives reload',()=>{
 const s=fresh(),a=E.team(s)[0];
 a.status='injured';
 assert.equal(E.governmentOptions(s,'medical').error,null);
 E.requestGovernmentFavor(s,'medical');
 const restored=E.validateSave(structuredClone(s));
 assert.equal(E.medicalCarePending(restored),true);
 E.advance(restored);
 assert.equal(E.team(restored)[0].status,'ready');
 assert.equal(E.team(restored)[0].fatigue,0);
 const b=E.team(restored)[1];
 b.status='injured';
 E.advance(restored);
 assert.equal(b.status,'injured');
});

test('Medical support heals a new wound caused by a mission in the same turn',()=>{
 let observed=false;
 for(let seed=1;seed<=100&&!observed;seed++){
  const s=fresh(seed),a=E.team(s)[0];
  a.country='DE';
  a.fatigue=12;
  E.requestGovernmentFavor(s,'medical');
  E.assign(s,a.id,'findSafehouse').chance=0;
  const control=structuredClone(s);
  control.factions.FR.lastFavor=null;
  E.advance(control);
  if(E.team(control)[0].status!=='injured')continue;
  E.advance(s);
  assert.equal(a.status,'ready');
  assert.ok(s.logs.some(l=>l.text.startsWith('Soutien médical : ')));
  observed=true;
 }
 assert.ok(observed);
});

test('Plan B replaces Secourisme in existing saves and applies to the next rolled mission',()=>{
 const s=fresh(),a=E.team(s)[1];
 assert.ok(a.talents.includes('planB'));
 a.talents=a.talents.map(t=>t==='planB'?'secours':t);
 E.validateSave(s);
 assert.ok(a.talents.includes('planB'));
 assert.equal(E.options(s,a.id,'counter').planBonus,0);
 E.assign(s,a.id,'counter').chance=0;
 E.advance(s);
 assert.equal(a.planBExpires,s.turn+1);
 assert.match(TALENTS.planB[1],/\+7 points/);
 assert.ok(E.options(s,a.id,'protect').explanations.includes('Plan B +7'));
 assert.equal(E.options(s,a.id,'protect').planBonus,7);
 E.assign(s,a.id,'rest');
 E.advance(s);
 assert.equal(E.options(s,a.id,'protect').planBonus,7);
 const task=E.assign(s,a.id,'protect');
 assert.equal(task.planBonus,7);
 E.cancel(s,a.id);
 assert.equal(E.options(s,a.id,'protect').planBonus,7);
 E.advance(s);
 assert.equal(E.options(s,a.id,'protect').planBonus,0);
});

test('Plan B preserves queued +5 and +7 orders through saves and consumes their bonus at the roll',()=>{
 for(const bonus of [5,7]){
  const s=fresh(),a=E.team(s)[1];
  E.assign(s,a.id,'counter').chance=0;
  E.advance(s);
  E.advance(s);
  const task=E.assign(s,a.id,'protect');
  assert.equal(task.planBonus,7);
  if(bonus===5){
   task.planBonus=5;
   task.chanceInputs.raw-=2;
   task.chance=Math.min(90,Math.max(10,task.chanceInputs.raw));
  }
  const chance=task.chance,restored=E.validateSave(structuredClone(s)),b=E.team(restored)[1];
  E.advance(restored);
  assert.equal(b.task.planBonus,bonus);
  assert.equal(b.task.chance,chance);
  b.task.chance=100;
  E.advance(restored);
  assert.equal(b.planBExpires,undefined);
 }
});

test('An energy-only medical favor from an old save does not queue new healing',()=>{
 const s=fresh(),a=E.team(s)[0];
 a.status='injured';
 E.requestGovernmentFavor(s,'medical');
 delete s.factions.FR.lastFavor.care;
 const restored=E.validateSave(structuredClone(s));
 assert.equal(E.medicalCarePending(restored),false);
 E.advance(restored);
 assert.equal(E.team(restored)[0].status,'injured');
});

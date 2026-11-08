import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DEFAULT_TEAM_IDS,COUNTRIES,ROSTER} from '../dist/client/data.js';
test('Campaign passports are additive for every home, without changing the recruit catalogue',()=>{
 const original=structuredClone(ROSTER);
 for(const c of COUNTRIES.filter(c=>c.power)){
  const s=E.createGame(c.id,['p0','p12','p15','p16'],42);
  for(const a of E.team(s))assert.deepEqual(a.nationalities,[...new Set([...ROSTER.find(r=>r.id===a.id).nationalities,c.id])]);
  assert.deepEqual(E.validateSave(structuredClone(s)),s);
 }
 assert.deepEqual(ROSTER,original);
});
test('Save upgrade preserves extra passports and missions and adds the home once',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,24);s.agents[0].nationalities=['GB','CA'];
 E.assign(s,'p0','travel','DE');const task=structuredClone(s.agents[0].task),budget=s.factions.FR.budget;
 const loaded=E.validateSave(structuredClone(s));assert.deepEqual(loaded.agents[0].nationalities,['GB','CA','FR']);assert.deepEqual(loaded.agents[0].task,task);assert.equal(loaded.factions.FR.budget,budget);assert.deepEqual(E.validateSave(structuredClone(loaded)),loaded);
});
test('Recruitment grants the current campaign passport too',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,11);E.recruit(s,'p16','p13');E.advance(s);E.advance(s);
 assert.deepEqual(E.team(s).find(a=>a.id==='p16').nationalities,['IN','FR']);
});

test('Travel modes set exposure and weapon state and only passports announce arrival',()=>{
 for(const [mode,exposure,weapon,announced] of [['travel',43,false,true],['sneak',0,true,false]]){
  const s=E.createGame('FR',DEFAULT_TEAM_IDS,42),[a]=E.team(s);
  s.humanFactions=Object.keys(s.factions);s.plots=[];s.fracture.cells.forEach(c=>c.resources=0);
  a.exposure=33;a.weapon=true;
  const task=E.assign(s,a.id,mode,'JP');
  assert.ok(task.total>1);
  a.task.chance=100;
  E.advance(s);
  assert.equal(a.weapon,weapon);
  assert.equal(a.country,'FR');
  assert.ok(Object.values(s.factions).every(f=>!f.publicAgents[a.id]));
  while(a.task)E.advance(s);
  assert.equal(a.country,'JP');
  assert.equal(a.weapon,weapon);
  assert.equal(a.exposure,exposure);
  assert.ok(!Object.hasOwn(a,'cover'));
  for(const f of Object.values(s.factions).filter(f=>f.id!=='FR')){
   assert.equal(f.publicAgents[a.id]?.country,announced?'JP':undefined);
  }
 }
});

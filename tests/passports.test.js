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

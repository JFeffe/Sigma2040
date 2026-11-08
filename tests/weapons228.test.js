import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js?v=230';
import {ACTIONS,DISPLAY_ROSTER,DEFAULT_TEAM_IDS} from '../dist/client/data.js?v=230';
import {weaponOpportunity} from '../dist/client/bot-weapon.js?v=230';
const affected=['sneak','arrest','findSafehouse','intimidate','rescue'];
test('Armed Sang-froid actions get one bonus, with equip and automatic actions excluded',()=>{
 for(const r of DISPLAY_ROSTER)for(const fatigue of [0,55,80])for(const exposure of [0,25,65,90])for(const boost of [false,true]){
  const s=E.createConfiguredGame('FR',[r.id,...DISPLAY_ROSTER.filter(a=>a.id!==r.id).slice(0,3).map(a=>a.id)],9123),a=E.team(s)[0];a.country='JP';a.fatigue=fatigue;a.exposure=exposure;
  for(const type of Object.keys(ACTIONS)){
   const target=['travel','sneak'].includes(type)?'DE':E.knownTargets(s)[0]?.id;
   a.weapon=false;const bare=E.options(s,a.id,type,target,boost);a.weapon=true;const armed=E.options(s,a.id,type,target,boost);
   assert.equal(armed.explanations.filter(x=>x==='Arme +10').length,affected.includes(type)?1:0);
   if(affected.includes(type)){assert.ok(armed.chance>=bare.chance);assert.ok(armed.chance<=Math.min(90,bare.chance+10));}
   else assert.equal(armed.chance,bare.chance);
   assert.equal(armed.duration,bare.duration);assert.equal(armed.fatigue,bare.fatigue);assert.equal(armed.cost,bare.cost);
  }
 }
});
test('Actual successful clandestine travel retains an existing weapon, passport drops it',()=>{
 for(const weapon of [true,false])for(const type of ['travel','sneak']){
  const s=E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,991,'bb2',{operationMap:false});s.humanFactions=Object.keys(s.factions);const a=E.team(s)[0];a.weapon=weapon;a.exposure=43;
  E.assign(s,a.id,type,'DE');a.task.chance=100;
  const loaded=E.validateSave(structuredClone(s));assert.equal(loaded.agents.find(b=>b.id===a.id).task.chance,100);
  while(a.task)E.advance(s);assert.equal(a.country,'DE');assert.equal(a.weapon,type==='sneak'&&weapon);if(type==='sneak')assert.equal(a.exposure,0);
 }
});
test('NPC weapon valuation includes intimidation and planque, respects urgency, horizon, cap and hidden information',()=>{
 const s=E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,92),a=E.team(s)[0],f=s.factions.FR,t=s.suspects[0];
 a.country='JP';a.weapon=false;a.stats=[6,6,6];a.talents=[];a.fatigue=a.exposure=0;
 const targets=[{id:t.id,country:'JP',prepared:false,intimidated:false,locationUntil:0,cell:0}],proofs=()=>[];
 const value=()=>weaponOpportunity(s,a,E,targets,proofs);const full=value();assert.ok(full>0);
 targets[0].intimidated=true;assert.ok(value()<full);targets[0].intimidated=false;
 targets[0].prepared=true;targets[0].locationUntil=20;assert.equal(value(),0);targets[0].prepared=false;
 const original=value();s.suspects.forEach(t=>t.country='DE');s.proofs.forEach(p=>p.authentic=!p.authentic);assert.equal(value(),original);
 s.turn=30;assert.equal(value(),0);s.turn=1;a.weapon=true;assert.equal(value(),0);a.weapon=false;a.stats=[9,9,9];a.talents=['combat','contacts','langues'];assert.ok(value()<full);
});

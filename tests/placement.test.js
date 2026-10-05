import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRY} from '../dist/client/data.js';
import {refuge} from '../dist/client/placement.js';
import {locationActions,actionOptions} from '../dist/client/presentation.js';
import {tickFracture,observeFracture} from '../dist/client/fracture.js';
const fresh=seed=>E.createGame('FR',['p0','p1','p2','p3'],seed);
test('Seeded distribution varies, favors secondary countries and limits concentrations',()=>{
 const layouts=new Set();
 for(let seed=1;seed<=1000;seed++){
  const s=fresh(seed),counts={};layouts.add(s.suspects.map(t=>t.country).join(','));
  const n=s.suspects.filter(t=>COUNTRY[t.country].power).length;assert.equal(n,0);
  for(const t of s.suspects){counts[t.country]=(counts[t.country]||0)+1;}
  for(const [id,n] of Object.entries(counts))assert.ok(n<=(COUNTRY[id].power?1:2));
  for(let cell=0;cell<3;cell++)assert.equal(new Set(s.suspects.filter(t=>t.cell===cell).map(t=>t.country)).size,2);
  for(const f of Object.values(s.factions))for(const [id,k] of Object.entries(f.known))assert.equal(k.country,s.suspects.find(t=>t.id===id).country);
  if(seed===42)assert.deepEqual(s,fresh(42));
 }
 assert.ok(layouts.size>500);
});
test('Criminal placements stay evenly distributed across secondary countries over many seeds',()=>{
 const counts=Object.fromEntries(Object.keys(COUNTRY).filter(id=>!COUNTRY[id].power).map(id=>[id,0]));
 for(let seed=1;seed<=6000;seed++)for(const suspect of fresh(seed).suspects)counts[suspect.country]++;
 const average=6000*7/6;
 for(const count of Object.values(counts))assert.ok(Math.abs(count-average)<average*.04,JSON.stringify(counts));
});
test('Every superpower has exactly two secondary countries one passport turn away',()=>{
 const expected={FR:['DE','TR'],GB:['DE','TR'],RU:['DE','TR'],US:['CA','BR'],IN:['TR','JP'],CN:['TR','JP']};
 for(const [home,nearby] of Object.entries(expected)){
  const s=E.createGame(home,['p0','p1','p2','p3'],42),a=s.agents.find(agent=>agent.faction===home);
  const actual=Object.keys(COUNTRY).filter(id=>!COUNTRY[id].power&&E.options(s,a.id,'travel',id).duration===1);
  assert.deepEqual(actual.sort(),nearby.sort(),home);
  for(const destination of nearby){
   assert.equal(E.options(s,a.id,'sneak',destination).duration,1);
   a.country=destination;
   assert.equal(E.options(s,a.id,'travel',home).duration,1,`${destination} → ${home}`);
   a.country=home;
  }
 }
});
test('Fugitives only choose secondary countries and saved flights resume',()=>{
 const s=fresh(42),t=s.suspects[0];
 for(let i=0;i<2000;i++){const to=refuge(s,t,E.random);assert.notEqual(to,t.country);assert.ok(!COUNTRY[to].power);}
 observeFracture(s,0,3);tickFracture(s,E.random,E.log);
 const saved=E.validateSave(structuredClone(s)),flight=saved.fracture.flights[0];saved.turn=flight.turn;tickFracture(saved,E.random,E.log);assert.equal(saved.suspects.find(t=>t.id===flight.id).country,flight.to);
});
test('National menu and foreign-only drone restore previous behavior',()=>{
 const s=fresh(42),a=s.agents[0],allowed=locationActions(a,s);
 const html=actionOptions(allowed,'rest',s,a);assert.doesNotMatch(html,/Sur le territoire/);
 for(const type of ['drone','rescue','collect','surveil','prepare','arrest'])assert.ok(!allowed.some(([id])=>id===type));
 for(const type of ['rest','analyze','counter','cyberSupport'])assert.ok(allowed.some(([id])=>id===type));
 assert.ok(E.options(s,a.id,'drone').error);
});
test('Existing power-country targets and flight destinations migrate once, preserving evidence',()=>{
 const s=fresh(42),a=s.agents[0],t=s.suspects[0];t.country='FR';Object.assign(s.factions.FR.known.s0,{country:'FR',identified:true,prepared:true,locationUntil:8});
 E.assign(s,a.id,'collect','s0');a.task.cost=4;s.factions.FR.budget-=4;const paid=s.factions.FR.budget;s.fracture.flights=[{id:'s1',to:'US',turn:3}];
 const loaded=E.validateSave(structuredClone(s));assert.ok(!COUNTRY[loaded.suspects[0].country].power);assert.equal(loaded.factions.FR.known.s0.country,loaded.suspects[0].country);assert.equal(loaded.agents[0].task,null);assert.equal(loaded.factions.FR.budget,paid+4);assert.ok(!COUNTRY[loaded.fracture.flights[0].to].power);assert.deepEqual(loaded.factions.FR.evidence,s.factions.FR.evidence);assert.deepEqual(E.validateSave(structuredClone(loaded)),loaded);
});

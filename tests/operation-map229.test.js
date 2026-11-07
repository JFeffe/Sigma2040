import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../dist/client/engine.js';
import {COUNTRY,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {advanceNpcDraft,createDraft,draftCountry,pickDraftAgent,availableDraftAgents} from '../dist/client/game-setup.js';
import {execute,joinRoom,newRoom,PROTOCOL,restoreRoom,roomView} from '../dist/client/multiplayer-core.js';
import {mapCountries,operationIds,selectOperationMap,travelTurns} from '../dist/client/operation-map.js';
import {refuge} from '../dist/client/placement.js';
import {relocationCountries} from '../dist/client/threat-placement.js';
import {tickFracture,observeFracture,observeProtection} from '../dist/client/fracture.js';
import {cityArt} from '../dist/client/visuals.js';

const quickHQ={FR:['DE','TR','PT'],GB:['CA','DE','PT'],US:['CA','BR','PT'],RU:['DE','TR','JP'],IN:['ZA','JP','AU'],CN:['TR','JP','AU']};
const quickField={CA:['BR','JP'],BR:['CA','ZA'],DE:['TR','PT'],TR:['DE','PT'],ZA:['BR','AU'],JP:['CA','AU'],PT:['DE','TR'],AU:['ZA','JP']};
const all=Object.keys(quickField),powers=Object.keys(quickHQ);

test('Complete map has the agreed two-way HQ and field routes, assets and map geometry',()=>{
 const s={operationCountries:all};
 for(const [from,nearby] of [...Object.entries(quickHQ),...Object.entries(quickField)])
  for(const to of all.filter(id=>id!==from)){
   const expected=nearby.includes(to)?1:2;
   assert.equal(travelTurns(from,to,s),expected,`${from} → ${to}`);
   assert.equal(travelTurns(to,from,s),expected,`${to} → ${from}`);
  }
 const world=JSON.parse(readFileSync(new URL('../dist/client/assets/world.json',import.meta.url)));
 for(const [id,art] of [['PT','lisbonne'],['AU','darwin']]){
  assert.ok(world.some(f=>f.id===COUNTRY[id].iso));
  assert.match(cityArt(id),new RegExp(`${art}\\.webp`));
  assert.ok(readFileSync(new URL(`../dist/client/assets/${art}.webp`,import.meta.url)).length>10000);
  assert.match(readFileSync(new URL(`../dist/client/assets/flags/${id.toLowerCase()}.svg`,import.meta.url),'utf8'),/<svg/);
 }
});

test('Every four-HQ draw varies while preserving all three agreed selection rules',()=>{
 for(let i=0;i<powers.length;i++)for(let j=i+1;j<powers.length;j++){
  const participants=powers.filter((_,index)=>index!==i&&index!==j),maps=new Set();
  for(let seed=0;seed<512;seed++){
   const ids=selectOperationMap(participants,seed,'regular');maps.add(ids.join());
   assert.equal(ids.length,6);
   assert.deepEqual(ids,selectOperationMap(participants,seed,'advanced'));
   assert.ok(participants.every(p=>ids.filter(c=>quickHQ[p].includes(c)).length>=2));
   assert.ok(ids.filter(c=>participants.some(p=>quickHQ[p].includes(c))).length>=5);
   assert.ok(ids.every(c=>quickField[c].some(other=>ids.includes(other))));
  }
  assert.ok(maps.size>=9&&maps.size<=14);
 }
});

test('Normal and advanced campaigns confine real flights, attack transfers and orders to the saved map',()=>{
 for(const mode of ['regular','advanced']){
  const d=advanceNpcDraft(createDraft(['FR'],42,'advanced'));
  while(draftCountry(d)){pickDraftAgent(d,'FR',availableDraftAgents(d)[0].id);advanceNpcDraft(d);}
  let s=E.createConfiguredGame('FR',mode==='advanced'?d.teams.FR:DEFAULT_TEAM_IDS,42,'bb2',{gameMode:mode,participants:d.countries,...(mode==='advanced'?{teams:d.teams}:{})});
  const active=operationIds(s),missing=all.filter(c=>!active.includes(c)),agent=E.team(s)[0];
  assert.ok(s.suspects.every(t=>active.includes(t.country)));
  assert.ok(s.plots.every(p=>active.includes(p.country)));
  for(const id of missing){
   assert.match(E.options(s,agent.id,'travel',id).error,/ne fait pas partie/);
   assert.match(E.options(s,agent.id,'sneak',id).error,/ne fait pas partie/);
   assert.ok(E.options(s,agent.id,'cyberSupport',id).error);
   assert.ok(E.governmentOptions(s,'diplomacy',id).error);
   assert.ok(!mapCountries(s).some(c=>c.id===id));
  }
  const t=s.suspects[0];
  for(let i=0;i<50;i++)assert.ok(active.includes(refuge(s,t,E.random)));
  observeFracture(s,t.cell,3);tickFracture(s,()=>0,E.log);
  const flight=s.fracture.flights[0];assert.ok(flight&&active.includes(flight.to));
  s=E.validateSave(structuredClone(s));s.turn=flight.turn;tickFracture(s,()=>0,E.log);
  assert.equal(s.suspects.find(x=>x.id===flight.id).country,flight.to);
  const origin=active[0];
  s.plots=[{id:'transfer',turn:s.turn+4,country:origin,cell:1,kind:'Cyberattaque',resolved:false}];
  assert.deepEqual(relocationCountries(s,s.plots[0],Object.values(COUNTRY),s.turn+5).map(c=>c.id).sort(),active.filter(c=>c!==origin).sort());
  observeProtection(s,origin,s.turn+4);tickFracture(s,()=>0,E.log);
  assert.notEqual(s.plots[0].country,origin);assert.ok(active.includes(s.plots[0].country));
 }
});

test('Cooperative games have all eight countries and distribute eight non-Architect suspects',()=>{
 const d=advanceNpcDraft(createDraft(['FR'],42,'cooperative'));
 while(draftCountry(d)){pickDraftAgent(d,'FR',availableDraftAgents(d)[0].id);advanceNpcDraft(d);}
 const s=E.createConfiguredGame('FR',d.teams.FR,42,'bb2',{gameMode:'cooperative',participants:d.countries,teams:d.teams});
 assert.deepEqual(new Set(s.operationCountries),new Set(all));
 assert.deepEqual(new Set(s.suspects.filter(t=>t.cell!==3).map(t=>t.country)),new Set(all));
 for(const f of Object.values(s.factions))assert.deepEqual(all.map(id=>f.cooperation[id]).sort(),[0,1,1,2,2,3,3,4]);
 assert.deepEqual(E.validateSave(structuredClone(s)).operationCountries,s.operationCountries);
});

test('Regular multiplayer fixes the public map before recruitment and resumes with the same map',()=>{
 const r=newRoom('map-room-0000000000229','map-invite-000000000229','map-host-0000000000229','Hôte');
 joinRoom(r,{invite:r.invite,token:'map-guest-0000000000229',name:'Invité'});
 const send=(m,kind,payload)=>execute(r,m.token,{protocol:PROTOCOL,seq:m.lastSeq+1,kind,payload});
 for(const m of r.members)send(m,'confirm-country');
 send(r.members[0],'begin-map');
 const preview=roomView(r,r.members[1].token).operationCountries;
 assert.equal(preview.length,6);assert.equal(r.phase,'teams');
 assert.deepEqual(roomView(restoreRoom(structuredClone(r)),r.members[0].token).operationCountries,preview);
 assert.throws(()=>send(r.members[0],'country',{country:'RU'}));
 for(const m of r.members)send(m,'team',{agents:DEFAULT_TEAM_IDS});
 send(r.members[0],'start');assert.deepEqual(r.game.operationCountries,preview);
 for(const m of r.members)assert.deepEqual(roomView(r,m.token).game.operationCountries,preview);
 assert.deepEqual(restoreRoom(structuredClone(r)).game.operationCountries,preview);
});

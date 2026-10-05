import test from 'node:test';import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {aiChoiceScore,aiDifficultyControl} from '../dist/client/ai-difficulty.js';
import {newRoom,joinRoom,execute,roomView,startRoom,restoreRoom,PROTOCOL} from '../dist/client/multiplayer-core.js';
const team=['p0','p12','p13','p14'];
test('Difficulty changes decisions, never starting stats, Fracture or mission probabilities; saves persist and migrate',()=>{const games=['easy','normal','expert'].map(l=>E.createGame('FR',team,42,l));for(const s of games){assert.deepEqual(s.agents,games[0].agents);assert.deepEqual(s.fracture,games[0].fracture);assert.deepEqual(s.plots,games[0].plots);assert.equal(E.options(s,'p0','counter').chance,E.options(games[0],'p0','counter').chance);assert.equal(E.validateSave(structuredClone(s)).aiDifficulty,s.aiDifficulty);}const old=structuredClone(games[0]);delete old.aiDifficulty;assert.equal(E.validateSave(old).aiDifficulty,'normal');old.aiDifficulty='invalid';assert.throws(()=>E.validateSave(old));assert.ok(aiChoiceScore('expert',100,90,1,'collect')>aiChoiceScore('expert',110,50,2,'hack'));assert.match(aiDifficultyControl('expert'),/aria-pressed="true" >Expert/);});
test('Host alone selects AI difficulty before launch, exposed to guests and retained after restore',()=>{const host='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',guest='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',invite='cccccccc-cccc-cccc-cccc-cccccccccccc',r=newRoom('dddddddd-dddd-dddd-dddd-dddddddddddd',invite,host,'Host');joinRoom(r,{invite,token:guest,name:'Guest'});const cmd=(token,level)=>execute(r,token,{protocol:PROTOCOL,seq:1,kind:'ai-difficulty',payload:{level}});assert.throws(()=>cmd(guest,'expert'));assert.throws(()=>cmd(host,'bad'));cmd(host,'expert');assert.equal(roomView(r,guest).aiDifficulty,'expert');for(const m of r.members){m.agents=team;m.confirmed=true;}startRoom(r,42);assert.equal(r.game.aiDifficulty,'expert');assert.equal(restoreRoom(structuredClone(r)).game.aiDifficulty,'expert');assert.throws(()=>execute(r,host,{protocol:PROTOCOL,seq:2,kind:'ai-difficulty',payload:{level:'easy'}}));});
test('Every AI level assigns legal orders and keeps valid state through a campaign',()=>{for(const level of ['easy','normal','expert']){const s=E.createGame('FR',team,82,level);for(let i=0;i<10&&!s.ended;i++)E.advance(s);assert.equal(E.validateSave(structuredClone(s)).aiDifficulty,level);}});

test('Expert values completing an intervention over guaranteed travel and still considers probability and duration',()=>{assert.ok(aiChoiceScore('expert',140,60,2,'arrest')>aiChoiceScore('expert',90,100,1,'travel'));assert.ok(aiChoiceScore('expert',85,65,2,'protect')>aiChoiceScore('expert',70,100,1,'travel'));assert.ok(aiChoiceScore('expert',100,80,1,'hack')>aiChoiceScore('expert',100,60,1,'hack'));assert.ok(aiChoiceScore('expert',100,80,1,'hack')>aiChoiceScore('expert',100,80,2,'hack'));});

test('Accepted difficulties limit paid boosts to their supported mission types',()=>{
 const boosted={easy:new Set(),normal:new Set(),expert:new Set()};
 for(const level of Object.keys(boosted))for(let seed=1;seed<=5;seed++){
  const s=E.createGame('FR',team,seed,level);
  while(!s.ended){for(const f of Object.keys(s.factions).filter(f=>f!=='FR'))E.planFaction(s,f);for(const a of s.agents.filter(a=>a.faction!=='FR'&&a.task?.queued&&a.task.bonusCredits)){boosted[level].add(a.task.type);assert.equal(a.task.bonusCredits,E.ECONOMY.boostCost);const allowed=level==='easy'?['arrest','protect']:['arrest','rescue','protect','prepare','analyze','authorize','surveil'];assert.ok(allowed.includes(a.task.type),level+': '+a.task.type);}E.advance(s);}
 }
 assert.ok(boosted.easy.has('protect')||boosted.easy.has('arrest')); assert.ok(boosted.normal.size>0);assert.ok([...boosted.expert].some(t=>['prepare','analyze','authorize'].includes(t)));
});

test('Normal may collect a second piece while its first proof is being analyzed',()=>{
 for(const level of ['normal','expert']){const s=E.createGame('FR',team,42,level),f='US',a=E.team(s,f).find(x=>x.country===f),t=E.knownTargets(s,f)[0];a.country=t.country;s.factions[f].access[t.country]=true;s.factions[f].known[t.id].intimidated=true;s.factions[f].evidence=[{id:s.proofs.find(p=>p.suspect===t.id).id,verified:false,contested:false}];E.planFaction(s,f);assert.ok(a.task);if(level==='normal'&&['collect','hack','drone','intimidate'].includes(a.task.type))assert.ok(E.analysisAgent(s,f,s.factions[f].evidence[0].id));if(level==='expert')assert.ok(['collect','hack','drone'].includes(a.task.type));}
});

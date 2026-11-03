import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ACTIONS,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {selectParticipants,createDraft,advanceNpcDraft} from '../dist/client/game-setup.js';
import {readFileSync} from 'node:fs';

for(const gameMode of ['regular','advanced','cooperative'])test(`Common stat scale for every action in ${gameMode}`,()=>{
 const participants=selectParticipants(['FR'],215,gameMode);let teams;
 if(gameMode!=='regular'){const draft=createDraft(['FR'],215,gameMode);draft.humans=[];advanceNpcDraft(draft);teams=draft.teams;}
 const s=E.createGame('FR',teams?.FR||DEFAULT_TEAM_IDS,215,'bb2',{gameMode,participants,teams});
 s.humanFactions=[...participants];const a=E.team(s)[0];
 a.country='DE';a.talents=[];a.weapon=false;a.fatigue=a.exposure=0;
 for(const f of Object.values(s.factions)){f.authorized.DE=true;f.cooperation.DE=2;}
 for(const stat of [1,4,5,6,10]){
  a.stats=[stat,stat,stat];
  for(const [type,d] of Object.entries(ACTIONS)){
   if(d.disabled)continue;
   const o=E.options(s,a.id,type,['travel','sneak'].includes(type)?'TR':s.suspects[0].id);
   if(d.safe)assert.equal(o.chance,100,type);
   else {assert.ok(o.explanations[0].includes(`− 5) = ${50+7*(stat-5)} %`),type);assert.ok(o.chance>=10&&o.chance<=90,type);}
  }
  for(const type of ['arrest','rescue','sneak']){
   const o=E.options(s,a.id,type,type==='sneak'?'TR':s.suspects[0].id);
   assert.equal(o.rawChance,50+7*(stat-5),type);
  }
 }
});
test('Old assigned probabilities remain unchanged on save restoration; new orders use common scale',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,215,'bb2'),a=E.team(s)[0];a.exposure=a.fatigue=0;
 const expected=E.options(s,a.id,'sneak','DE').chance;E.assign(s,a.id,'sneak','DE');assert.equal(a.task.chance,expected);
 a.task.chance=43;a.task.chanceInputs.raw=43;
 const restored=E.validateSave(structuredClone(s));assert.equal(restored.agents.find(x=>x.id===a.id).task.chance,43);
});
test('Current help removes per-action difficulty',()=>{
 const wiki=readFileSync(new URL('../dist/client/wiki.js',import.meta.url),'utf8');
 assert.ok(wiki.includes('50 + 7 × (stat − 5)'));assert.doesNotMatch(wiki,/stat − difficulté|Difficulté 6/);
});

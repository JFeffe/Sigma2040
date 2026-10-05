import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,ACTIONS,DEFAULT_TEAM_IDS,NATIONAL_BONUSES_ENABLED} from '../dist/client/data.js';
import {setupScreen} from '../dist/client/screens.js';
test('National bonuses are disabled for all player and AI factions',()=>{
 assert.equal(NATIONAL_BONUSES_ENABLED,false);
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,42);
 for(const a of s.agents)for(const type of Object.keys(ACTIONS)){
  const o=E.options(s,a.id,type);
  assert.ok(!o.explanations.some(x=>x.includes('Doctrine nationale')),`${a.faction}: ${type}`);
 }
});
test('Solo and multiplayer setup omit all national bonus labels and descriptions',()=>{
 for(const mp of [null,{header:'SALON',taken:[]}]){
  const html=setupScreen('FR',DEFAULT_TEAM_IDS,false,mp);
  assert.doesNotMatch(html,/class="doctrine"/);
  for(const c of COUNTRIES.filter(c=>c.power)){
   assert.ok(!html.includes(`<small>${c.perk}</small>`));
   assert.ok(!html.includes(c.desc));
  }
 }
});

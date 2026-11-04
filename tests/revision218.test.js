import test from 'node:test';import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {countryOperationTypes,countryOperationTargets,countryOperationModel,countryOperationsMarkup,floatingAgentMarkup} from '../dist/client/country-operations.js';
test('Each player sees verification at own HQ and country hack only at the six secondary countries',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,218);
 for(const player of COUNTRIES.filter(c=>c.power)){
  s.player=player.id;
  for(const c of COUNTRIES){
   const types=countryOperationTypes(s,c.id);assert.equal(types.includes('analyze'),c.id===player.id);assert.equal(types.includes('cyberSupport'),!c.power);
   assert.deepEqual(countryOperationTargets(s,c.id,'cyberSupport'),c.power?[]:[[c.id,c.name]]);
   if(!c.power){const m=countryOperationModel(s,c.id,{type:'cyberSupport',target:'FR'});assert.equal(m.target,c.id);assert.ok(m.rows.every(r=>r.a.country===player.id&&r.a.faction===player.id));}
  }
 }
});
test('Country popup puts deployment in actions, omits the removed summary and keeps agent flags by the name',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,218),a=E.team(s)[0];a.country='TR';a.weapon=false;
 const html=countryOperationsMarkup(s,'TR',{type:'equip'});
 assert.doesNotMatch(html,/country-title-signals|country-authorities|country-operations-cases|équipe sur place/);
 assert.match(html,/class="country-operation-types">.*data-cmd="workspace-deploy"/);
 assert.match(html,/workspace-confirm/);
 const agent=floatingAgentMarkup(s,a.id);assert.doesNotMatch(agent,/Nat\./);assert.match(agent,/<h2>[^<]+ <span class="agent-nationality">/);assert.match(agent,/Nationalité :/);assert.match(agent,/Pays actuel/);
});

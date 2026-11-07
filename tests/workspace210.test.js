import * as D from '../dist/client/game-setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {countryOperationTypes} from '../dist/client/country-operations.js';
import {countryOptions} from '../dist/client/presentation.js';
import {assignDeployment} from '../dist/client/deployment.js';
import {makeScreens} from '../dist/client/screens.js';
import {createCamera} from '../dist/client/globe.js';
const fresh=()=>{const s=E.createGame('FR',DEFAULT_TEAM_IDS,42);s.humanFactions=Object.keys(s.factions);return s;};
test('Every team is blocked from other superpowers by passport, clandestine travel and local actions; own HQ remains usable',()=>{
 const s=fresh();for(const a of s.agents){for(const c of COUNTRIES.filter(c=>c.power&&c.id!==a.faction)){
  for(const type of ['travel','sneak']){assert.match(E.options(s,a.id,type,c.id).error,/Superpuissance/);assert.throws(()=>E.assign(s,a.id,type,c.id),/Superpuissance/);}
  a.country=c.id;for(const type of ['equip','contacts','drone','protect','hide'])assert.match(E.options(s,a.id,type).error,/Superpuissance/);
  assert.equal(E.options(s,a.id,'travel',a.faction).error,null);a.country=a.faction;
 }assert.equal(E.options(s,a.id,'rest').error,null);assert.equal(E.options(s,a.id,'travel','DE').error,null);}
 assert.throws(()=>assignDeployment(s,[E.team(s)[0].id],'travel','US'),/Superpuissance/);assert.deepEqual(countryOperationTypes(s,'US'),[]);
 const h=countryOptions('FR','DE',false,'FR');assert.match(h,/value="FR"/);assert.doesNotMatch(h,/value="(?:US|CN|IN|RU|GB)"/);
});
test('Legacy forbidden queued orders are cancelled before fatigue, equipment loss or movement; safe return remains possible',()=>{
 const s=fresh(),a=E.team(s)[0];E.assign(s,a.id,'travel','JP');a.task.target='US';a.weapon=true;const fatigue=a.fatigue;E.advance(s);assert.equal(a.country,'FR');assert.equal(a.task,null);assert.equal(a.fatigue,fatigue);assert.ok(a.weapon);
 a.country='US';if(s.event)E.answerEvent(s,1);E.assign(s,a.id,'travel','FR');for(let i=0;i<2;i++){if(s.event)E.answerEvent(s,1);E.advance(s);}assert.equal(a.country,'FR');
});
test('Sidebar shows agent details on selection, superpower artwork without actions, and deployment above country actions',()=>{
 const s=fresh(),a=E.team(s)[0],camera=createCamera();camera.panelOpen=true;
 const agent=makeScreens(s,'FR',a.id,null,camera).world();assert.match(agent,/agent-sidebar/);assert.match(agent,/floating-agent/);assert.match(agent,/Énergie/);
 const power=makeScreens(s,'US',null,null,camera).world().split('class="map-dossier')[1].split('<div class="world-overview">')[0];assert.match(power,/power-sidebar-art/);assert.match(power,/consultation uniquement/);assert.doesNotMatch(power,/data-cmd="workspace-(deploy|country)"/);
 const country=makeScreens(s,'JP',null,null,camera).world().split('class="map-dossier')[1].split('<div class="world-overview">')[0];assert.match(country,/compact-country-signals/);assert.ok(country.indexOf('Déployer un agent')<country.indexOf('Actions dans ce pays'));
});
test('Cooperative diplomacy other countries exclude all six superpowers, even inactive ones',()=>{
 const d=D.createDraft(['FR','US'],42,'cooperative');while(D.draftCountry(d))D.pickDraftAgent(d,D.draftCountry(d),D.availableDraftAgents(d)[0].id);const s=E.createGame('FR',d.teams.FR,42,'normal',{gameMode:'cooperative',participants:d.countries,teams:d.teams});const html=makeScreens(s,'FR',null,null,createCamera()).diplomacy().split('diplomacy-countries')[1].split('diplomacy-followup')[0];
 for(const c of COUNTRIES.filter(c=>!c.power&&!c.expansion))assert.ok(html.includes(c.name));for(const c of COUNTRIES.filter(c=>c.power))assert.ok(!html.includes('<h3>'+c.name+'</h3>'));
});

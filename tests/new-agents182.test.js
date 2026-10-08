import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as E from '../dist/client/engine.js';
import {DISPLAY_ROSTER,DEFAULT_TEAM_IDS,TALENTS} from '../dist/client/data.js';
import {portrait,portraitAsset,portraitBackgroundAsset,nationalityFlags} from '../dist/client/ui.js';
import {fullBody} from '../dist/client/visuals.js';
import {recruitCard,recruitDetails} from '../dist/client/recruit-selection.js';
import {agentMapMarkers,foreignMapMarkers} from '../dist/client/map-markers.js';
import {createDraft,draftCountry,pickDraftAgent,availableDraftAgents,validateDraft} from '../dist/client/game-setup.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';
import {BUILD_VERSION} from '../dist/client/build-version.js';

const additions=[
 {id:'p27',slug:'link',name:'LINK',role:'Le Furtif',stats:[3,9,8],talents:['informatique','infiltration','secours'],nationalities:['DE']},
 {id:'p29',slug:'monroe',name:'MONROE',role:'Le Gardien',stats:[8,3,9],talents:['combat','diplomatie','surveillance'],nationalities:['GB','FR']},
 {id:'p30',slug:'tara',name:'TARA',role:'La Prévoyante',stats:[9,5,6],talents:['tactique','endurance','secours'],nationalities:['IN']},
 {id:'p28',slug:'viktor',name:'VIKTOR',role:'Le Repéreur',stats:[6,9,5],talents:['drones','enquete','langues'],nationalities:['RU']}
];
function checkProfile(a,expected){
 assert.ok(a);assert.equal(a.name,expected.name);assert.equal(a.role,expected.role);
 assert.deepEqual(a.stats,expected.stats);assert.deepEqual(a.talents,expected.talents);
 assert.equal(portraitAsset(a),`./assets/${expected.slug}-portrait.webp?v=${BUILD_VERSION}`);
 assert.equal(portraitBackgroundAsset(a),`./assets/agent-portrait-background.webp?v=${BUILD_VERSION}`);
 assert.match(fullBody(a),new RegExp(`${expected.slug}-full.webp`));
 for(const c of expected.nationalities)assert.match(nationalityFlags(a),new RegExp(`flags/${c.toLowerCase()}.svg`));
}
test('Twenty distinct profiles retain approved stats, identities and five agents per talent',()=>{
 assert.equal(DISPLAY_ROSTER.length,20);
 assert.deepEqual(DISPLAY_ROSTER.slice(-4).map(a=>a.id),additions.map(a=>a.id));
 assert.equal(new Set(DISPLAY_ROSTER.map(a=>a.stats.join(','))).size,20);
 for(const a of DISPLAY_ROSTER){assert.equal(a.stats.reduce((n,v)=>n+v,0),20);assert.ok(a.stats.every(v=>v>=3&&v<=9));}
 for(const t of Object.keys(TALENTS).filter(t=>t!=='chef'))assert.equal(DISPLAY_ROSTER.filter(a=>a.talents.includes(t)).length,5,t);
 for(const expected of additions){
  const a=DISPLAY_ROSTER.find(a=>a.id===expected.id);checkProfile(a,expected);assert.deepEqual(a.nationalities,expected.nationalities);
  for(const b of DISPLAY_ROSTER.filter(b=>b.id!==a.id))assert.ok(a.talents.filter(t=>b.talents.includes(t)).length<2,`${a.name} / ${b.name}`);
 }
});
test('Transparent artwork is present, and cards and map markers use the shared centered background',()=>{
 for(const expected of additions){
  const a=DISPLAY_ROSTER.find(a=>a.id===expected.id);
  for(const suffix of ['portrait','full']){
   const path=new URL(`../dist/client/assets/${expected.slug}-${suffix}.webp`,import.meta.url);
   assert.ok(existsSync(path));const bytes=readFileSync(path);
   assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
   assert.equal(bytes.toString('ascii',12,16),'VP8X');assert.ok(bytes[20]&0x10,'Actual alpha channel');
  }
  assert.match(portrait(a),/portrait-cutout/);assert.match(recruitCard(a,[]),new RegExp(`${expected.slug}-portrait.webp`));
  assert.match(recruitDetails(a.id),new RegExp(`${expected.slug}-full.webp`));
 }
 const s=E.createConfiguredGame('FR',additions.map(a=>a.id),182),html=agentMapMarkers(s);
 assert.equal((html.match(/agent-portrait-background.webp/g)||[]).length,4);
 for(const a of additions)assert.match(html,new RegExp(`${a.slug}-portrait.webp`));
 assert.match(readFileSync(new URL('../dist/client/agent-art.css',import.meta.url),'utf8'),/\.portrait\.portrait-cutout[^}]+background-position:center/);
});
test('The four new agents keep artwork and approved profiles through solo saves and recruitment',()=>{
 const s=E.createConfiguredGame('FR',additions.map(a=>a.id),182);
 const restored=E.validateSave(structuredClone(s));
 for(const a of additions)checkProfile(E.team(restored).find(b=>b.id===a.id),a);
 for(const expected of additions){
  const old=E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,182);
  E.recruit(old,expected.id,'p13');E.advance(old);E.advance(old);
  checkProfile(E.team(E.validateSave(structuredClone(old))).find(a=>a.id===expected.id),expected);
 }
});
test('Multiplayer template IDs preserve portraits, bodies and nationalities after restoring a room',()=>{
 const r=newRoom('new-agents-room-0000182','new-agents-invite-0000182','new-agents-host-00000182','Hôte');
 joinRoom(r,{invite:r.invite,token:'new-agents-guest-00000182',name:'Invité'});
 r.members[0].agents=additions.map(a=>a.id);r.members[1].agents=[...DEFAULT_TEAM_IDS];
 r.members.forEach(m=>m.confirmed=true);startRoom(r,182);
 const view=playerView(restoreRoom(structuredClone(r)),'FR');
 for(const a of additions)checkProfile(view.agents.find(b=>b.templateId===a.id),a);
 assert.equal((agentMapMarkers(view).match(/agent-portrait-background.webp/g)||[]).length,4);
});
test('The expanded advanced draft keeps sixteen exclusive choices and supports every new agent',()=>{
 const d=createDraft(['FR','US','CN','IN'],182);
 assert.equal(availableDraftAgents(d).length,20);
 for(const a of additions)pickDraftAgent(d,draftCountry(d),a.id);
 while(draftCountry(d))pickDraftAgent(d,draftCountry(d),availableDraftAgents(d)[0].id);
 validateDraft(d);assert.equal(d.picks.length,16);assert.equal(availableDraftAgents(d).length,4);
 const s=E.createConfiguredGame('FR',d.teams.FR,182,'normal',{gameMode:'advanced',participants:d.countries,teams:d.teams});
 const restored=E.validateSave(structuredClone(s));
 for(const a of additions)checkProfile(restored.agents.find(b=>(b.templateId||b.id)===a.id),a);
});

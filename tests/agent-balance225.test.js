import test from 'node:test';import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DISPLAY_ROSTER as R,TALENTS} from '../dist/client/data.js';
import {recruitProfile,recruitDetails,recruitCard,setRecruitView,visibleRecruits,setRecruitFilter,resetRecruitFilters} from '../dist/client/recruit-selection.js';
import {statlines} from '../dist/client/ui.js';
import {createDraft,draftCountry,pickDraftAgent,availableDraftAgents,validateDraft} from '../dist/client/game-setup.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';
const profiles=[
 {id:'p16',oldStats:[6,7,7],stats:[6,8,6],oldTalents:['secours','langues','surveillance'],talents:['secours','langues','surveillance']},
 {id:'p17',oldStats:[8,7,5],stats:[8,7,5],oldTalents:['drones','tactique','surveillance'],talents:['drones','tactique','enquete']},
 {id:'p28',oldStats:[6,9,5],stats:[6,9,5],oldTalents:['drones','enquete','langues'],talents:['drones','surveillance','langues']}
];
const ids=['p16','p17','p28','p0'];const fresh=()=>E.createConfiguredGame('FR',ids,225);
function oldProfiles(s){for(const a of s.agents){const p=profiles.find(p=>p.id===(a.templateId||a.id));if(p){a.stats=[...p.oldStats];a.talents=[...p.oldTalents].reverse();}}}
function check(s){for(const a of s.agents){const p=profiles.find(p=>p.id===(a.templateId||a.id));if(p){assert.deepEqual(a.stats,p.stats);assert.deepEqual([...a.talents].sort(),[...p.talents].sort());}}}
test('225 roster retains20points, unique triples and talent sets, and5holders per talent',()=>{
 for(const p of profiles){const a=R.find(a=>a.id===p.id);assert.deepEqual(a.stats,p.stats);assert.deepEqual(a.talents,p.talents);}
 assert.equal(new Set(R.map(a=>a.stats.join(','))).size,20);assert.equal(new Set(R.map(a=>[...a.talents].sort().join(','))).size,20);
 for(const a of R){assert.equal(a.stats.reduce((s,n)=>s+n,0),20);assert.ok(a.stats.every(n=>n>=3&&n<=9));assert.equal(new Set(a.talents).size,3);}
 for(const t of Object.keys(TALENTS).filter(t=>t!=='chef'))assert.equal(R.filter(a=>a.talents.includes(t)).length,5,t);
});
test('225 card faces, dossiers, bars and talent filters use new profiles',()=>{
 for(const p of profiles){const a=R.find(a=>a.id===p.id);
  for(const html of [recruitProfile(a),recruitDetails(p.id),statlines(a)])assert.deepEqual([...html.matchAll(/<strong>(\d)<\/strong>/g)].map(m=>+m[1]),p.stats);
  for(const mode of ['solo','multi']){setRecruitView(mode,p.id,true);const card=recruitCard(a,[],mode);for(const t of p.talents)assert.ok(card.includes(TALENTS[t][0]));}
  const dossier=recruitDetails(p.id);for(const t of p.talents)assert.ok(dossier.includes(`<strong>${TALENTS[t][0]}</strong>`));for(const t of p.oldTalents.filter(t=>!p.talents.includes(t)))assert.ok(!dossier.includes(`<strong>${TALENTS[t][0]}</strong>`));
 }
 for(const mode of ['solo','multi']){resetRecruitFilters(mode);setRecruitFilter(mode,'talent','surveillance');assert.ok(visibleRecruits(mode).some(a=>a.id==='p28'));assert.ok(!visibleRecruits(mode).some(a=>a.id==='p17'));setRecruitFilter(mode,'talent','enquete');assert.ok(visibleRecruits(mode).some(a=>a.id==='p17'));assert.ok(!visibleRecruits(mode).some(a=>a.id==='p28'));resetRecruitFilters(mode);}
});
test('225 old stats/talents migrate once while confirmed orders and budgets stay intact',()=>{
 for(const id of ['p17','p28']){const s=fresh();oldProfiles(s);E.assign(s,id,'protect');const a=s.agents.find(a=>a.id===id),task=structuredClone(a.task),budget=s.factions.FR.budget,rng=s.rng;
 const restored=E.validateSave(structuredClone(s));check(restored);assert.deepEqual(restored.agents.find(a=>a.id===id).task,task);assert.equal(restored.factions.FR.budget,budget);assert.equal(restored.rng,rng);assert.deepEqual(E.validateSave(structuredClone(restored)),restored);
 }
 const s=fresh();oldProfiles(s);s.agents.find(a=>a.id==='p16').stats=[8,6,7];check(E.validateSave(s));
});
test('225 new protection orders use the swapped bonus',()=>{
 const s=fresh();oldProfiles(s);for(const a of s.agents)a.chief=false;
 const oldV=E.options(s,'p28','protect').chance,oldM=E.options(s,'p17','protect').chance;
 const restored=E.validateSave(structuredClone(s));assert.equal(E.options(restored,'p28','protect').chance,Math.min(90,oldV+10));assert.equal(E.options(restored,'p17','protect').chance,oldM-10);
});
test('225 multiplayer restored templates and player projections carry new profiles',()=>{
 const r=newRoom('balance-room-00000000225','balance-invite-00000225','balance-host-0000000225','Hôte');joinRoom(r,{invite:r.invite,token:'balance-guest-000000225',name:'Invité'});
 r.members[0].agents=ids;r.members[1].agents=ids;r.members.forEach(m=>m.confirmed=true);startRoom(r,225);oldProfiles(r.game);const restored=restoreRoom(structuredClone(r));check(restored.game);for(const m of restored.members)check(playerView(restored,m.country));
});
test('225 advanced/cooperative drafts and restored games retain approved profiles',()=>{
 for(const mode of ['advanced','cooperative']){const d=createDraft(['FR'],225,mode);for(const id of ids)pickDraftAgent(d,draftCountry(d),id);while(draftCountry(d))pickDraftAgent(d,draftCountry(d),availableDraftAgents(d)[0].id);validateDraft(d);
 const s=E.createConfiguredGame('FR',d.teams.FR,225,'bb2',{gameMode:mode,participants:d.countries,teams:d.teams});check(s);check(E.validateSave(structuredClone(s)));}
});

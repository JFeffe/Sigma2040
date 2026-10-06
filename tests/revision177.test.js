import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ACTIONS,DEFAULT_TEAM_IDS,ROSTER} from '../dist/client/data.js';
import {Multiplayer} from '../dist/client/multiplayer.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';
import {makeScreens} from '../dist/client/screens.js';
import {investigationRail} from '../dist/client/investigation-steps.js';
import {campaignSummary,recordOperation,operationTotals} from '../dist/client/campaign-stats.js';
import {esc,icon} from '../dist/client/ui.js';
const fresh=()=>E.createGame('FR',DEFAULT_TEAM_IDS,42);
const host='host-token-000000000000',guest='guest-token-000000000000',invite='invite-token-0000000000';
function room(){const r=newRoom('room-000000000000000000',invite,host,'Hôte');joinRoom(r,{token:guest,invite,name:'Invité'});for(const m of r.members){m.agents=[...DEFAULT_TEAM_IDS];m.confirmed=true;}return r;}

test('Multiplayer confirmation is the first lobby control for host and guest, with eligibility retained',()=>{
 const previous={location:globalThis.location,localStorage:globalThis.localStorage};
 globalThis.location={href:'https://example.com/'};globalThis.localStorage={getItem:()=>null,setItem(){}};
 let html='';const mp=new Multiplayer({lobby:h=>{html=h;}}),r=room();
 try{
  mp.active=true;mp.details={id:r.id,invite};
  for(const isHost of [true,false]){
   mp.room=isHost?r:null;const m=r.members[isHost?0:1];mp.snapshot={...r,country:m.country};mp.draftRoom=r.id;
   for(const [count,confirmed] of [[3,false],[4,false],[4,true]]){
    m.confirmed=confirmed;mp.draft=DEFAULT_TEAM_IDS.slice(0,count);mp.panel();
    const top=html.slice(html.indexOf('<section class="mp-lobby-header'),html.indexOf('Choisir votre pays')),button=top.match(/<button[^]*?<\/button>/)[0];
    assert.match(button,/data-cmd="mp-team"/);assert.equal(/disabled/.test(button),count!==4||confirmed);
    assert.equal((top.match(/data-cmd="mp-team"/g)||[]).length,1);
    assert.ok(top.indexOf('data-cmd="mp-team"')<top.indexOf('Lien d’invitation'));
    assert.match(button,confirmed?/Équipe confirmée/:/Confirmer mes 4 agents/);
   }
  }
  mp.room=r;r.members[0].observer=true;r.members[0].country=null;mp.snapshot={...r,country:null};mp.panel();assert.doesNotMatch(html,/data-cmd="mp-team"/);
 }finally{clearInterval(mp.timer);for(const [k,v] of Object.entries(previous))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});

test('Country inquiry steps use status icons and preserve selection and completion without ordinal numbers',()=>{
 const s=fresh(),t=E.knownTargets(s)[0];let html=investigationRail(s,t,'access');
 assert.doesNotMatch(html,/<span>[1-5]<\/span>/);assert.ok(html.includes(icon('unlock')));assert.ok(html.includes(icon('lock')));
 assert.match(html,/data-id="access" aria-pressed="true"/);assert.match(html,/inquiry-step pending/);
 s.factions.FR.access[t.country]=true;html=investigationRail(s,t,'proofs');assert.match(html,/inquiry-step complete/);assert.ok(html.includes(icon('check')));
 assert.match(html,/data-id="proofs" aria-pressed="true"/);
});

test('Selected agent exposes the same known local cases and threats even when map country differs',()=>{
 const s=fresh(),t=E.knownTargets(s)[0],a=E.team(s)[0];a.country=t.country;
 const render=()=>makeScreens(s,'FR',a.id,[],{}).world(),before=JSON.stringify(s);
 let html=render();assert.match(html,/agent-focus/);assert.ok(html.includes('data-cmd="country-inquiry" data-id="'+t.id+'"'));
 for(const unknown of s.suspects.filter(x=>!E.dossier(s,s.player,x.id)))assert.ok(!html.includes('data-cmd="country-inquiry" data-id="'+unknown.id+'"'));
 assert.equal(JSON.stringify(s),before);
 s.suspects.find(x=>x.id===t.id).arrested=true;assert.ok(!render().includes('data-cmd="country-inquiry" data-id="'+t.id+'"'));
 const p=E.visiblePlots(s)[0];a.country=p.country;html=render();assert.ok(html.includes('data-cmd="country-threat" data-id="'+p.id+'"'));
});

test('Operation summary includes all unused current actions at zero without changing counters or inventing retired actions',()=>{
 const s=fresh();recordOperation(s,{faction:'FR',type:'rest',turn:1,status:'RÉUSSITE',chance:100,fatigue:-50});
 const before=JSON.stringify(s),totals=operationTotals(s,'FR');
 for(const country of ['FR','US']){
  const html=campaignSummary(s,{country,tab:'operations'}),table=html.match(/<table[^>]*aria-label="Analyse de vos opérations"[^]*?<\/table>/)[0],rows=[...table.match(/<tbody>([^]*?)<\/tbody>/)[1].matchAll(/<tr>([^]*?)<\/tr>/g)].map(m=>m[1]);
  assert.equal(rows.length,Object.values(ACTIONS).filter(a=>!a.disabled).length);
  for(const [key,a] of Object.entries(ACTIONS).filter(([,a])=>!a.disabled)){
   const row=rows.find(r=>r.includes('>'+esc(a.name)+'</td>'));assert.ok(row,a.name);
   assert.ok(row.includes(country==='FR'&&key==='rest'?'>1 / 1</td>':'>0 / 0</td>'),a.name);
  }
  assert.doesNotMatch(table,/Faire pression|NaN|undefined/);
 }
 assert.deepEqual(operationTotals(s,'FR'),totals);assert.equal(JSON.stringify(s),before);
 // A retired action remains visible if it has an actual historical result.
 s.campaignStats.factions.FR.blackmail={...s.campaignStats.factions.FR.rest};assert.match(campaignSummary(s),/Faire pression/);
});

test('Iris uses 9-4-7 for new teams and loaded solo campaigns, retaining committed orders',()=>{
 assert.deepEqual(ROSTER.find(a=>a.id==='p0').stats,[9,4,7]);const s=fresh(),a=E.team(s)[0];assert.deepEqual(a.stats,[9,4,7]);
 a.stats=[7,4,9];E.assign(s,a.id,'counter');const order=structuredClone(a.task),seed=s.rng,budget=s.factions.FR.budget,restored=E.validateSave(structuredClone(s)),iris=E.team(restored)[0];
 assert.deepEqual(iris.stats,[9,4,7]);assert.deepEqual(iris.task,order);assert.equal(restored.rng,seed);assert.equal(restored.factions.FR.budget,budget);
 assert.deepEqual(E.validateSave(structuredClone(restored)),restored);
});

test('Iris stats migrate by template ID for each multiplayer team and private snapshots',()=>{
 const r=room();startRoom(r,42);for(const m of r.members){const iris=E.team(r.game,m.country).find(a=>a.templateId==='p0');assert.deepEqual(iris.stats,[9,4,7]);iris.stats=[7,4,9];}
 const restored=restoreRoom(structuredClone(r));for(const m of restored.members){const iris=E.team(restored.game,m.country).find(a=>a.templateId==='p0');assert.deepEqual(iris.stats,[9,4,7]);assert.deepEqual(playerView(restored,m.country).agents.find(a=>a.id===iris.id).stats,[9,4,7]);}
});

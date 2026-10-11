import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as E from '../dist/client/engine.js';
import {COUNTRY,DEFAULT_TEAM_IDS,DISPLAY_ROSTER,TALENTS} from '../dist/client/data.js';
import {createDraft,draftCountry,pickDraftAgent,advanceNpcDraft,availableDraftAgents} from '../dist/client/game-setup.js';
import {draftScreen,draftTeamSummary} from '../dist/client/draft-ui.js';
import {deploymentPickerMarkup,assignDeployment} from '../dist/client/deployment.js';
import {newRoom,joinRoom,startRoom,execute,roomView,restoreRoom,PROTOCOL} from '../dist/client/multiplayer-core.js';
import {makeScreens} from '../dist/client/screens.js';
import {PATCH_NOTES,balanceChangesMarkup,patchNotesPage} from '../dist/client/patch-notes.js';
import {BUILD_VERSION} from '../dist/client/build-version.js';

const fresh=()=>E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,184);
const send=(r,m,kind,payload={})=>execute(r,m.token,{protocol:PROTOCOL,seq:m.lastSeq+1,turn:r.game?.turn,kind,payload});
function room(observer=false){
 const r=newRoom('room-token-0000000000184','invite-token-0000000184','host-token-000000000184','Jean <Admin>');
 if(observer)send(r,r.members[0],'observer',{observer:true});
 for(let i=0;i<(observer?2:1);i++)joinRoom(r,{invite:r.invite,token:'guest-token-000000000184-'+i,name:'Alex & Jo '+i});
 for(const m of r.members.filter(m=>!m.observer)){m.agents=[...DEFAULT_TEAM_IDS];m.confirmed=true;}
 startRoom(r,184);return r;
}

test('Draft composition, totals and talent counts follow actual picks while remaining visible during selection',()=>{
 const d=advanceNpcDraft(createDraft(['FR'],184));
 for(let pick=0;pick<=4;pick++){
  const before=JSON.stringify(d),html=draftScreen(d,'FR'),summary=html.slice(html.indexOf('<aside class="draft-summary'),html.indexOf('</aside>',html.indexOf('<aside class="draft-summary')));
  const agents=d.teams.FR.map(id=>DISPLAY_ROSTER.find(a=>a.id===id));
  assert.match(summary,new RegExp(agents.length+' / 4 agents repêchés'));
  for(let i=0;i<3;i++)assert.ok(summary.includes(`<strong>${agents.reduce((n,a)=>n+a.stats[i],0)}/40</strong>`));
  const counts=new Map();for(const a of agents){assert.ok(summary.includes(a.name));for(const t of a.talents)counts.set(t,(counts.get(t)||0)+1);}
  for(const [id,count] of counts){assert.ok(summary.includes(`data-talent="${id}"`));assert.ok(summary.includes(TALENTS[id][0]));if(count>1)assert.ok(summary.includes(`×${count}`));}
  assert.equal(JSON.stringify(d),before);
  if(draftCountry(d)){pickDraftAgent(d,'FR',availableDraftAgents(d)[0].id);advanceNpcDraft(d);}
 }
 const ids=d.teams.FR,summary=draftTeamSummary([...ids].reverse(),'FR');
 assert.ok(summary.indexOf(DISPLAY_ROSTER.find(a=>a.id===ids[3]).name)<summary.indexOf(DISPLAY_ROSTER.find(a=>a.id===ids[0]).name));
});

test('Multiplayer draft summary belongs to each viewer and does not assign an observer a team',()=>{
 const d=createDraft(['FR','US','CN','IN'],184);
 for(let i=0;i<8;i++)pickDraftAgent(d,draftCountry(d),availableDraftAgents(d)[0].id);
 for(const country of d.countries){const html=draftScreen(d,country,{multi:true}),summary=html.slice(html.indexOf('<aside class="draft-summary'),html.indexOf('</aside>',html.indexOf('<aside class="draft-summary')));for(const id of d.teams[country])assert.ok(summary.includes(DISPLAY_ROSTER.find(a=>a.id===id).name));assert.match(summary,/2 \/ 4 agents repêchés/);}
 assert.doesNotMatch(draftScreen(d,null,{multi:true}),/<aside class="draft-summary/);
});

test('Grouped travel preserves individual engine forecasts and stages every selected agent without moving the turn',()=>{
 const s=fresh(),a=E.team(s)[0],b=E.team(s)[3];b.country='US';
 const ids=[a.id,b.id],plans=ids.map(id=>E.options(s,id,'travel','JP')),budget=s.factions.FR.budget,rng=s.rng;
 assignDeployment(s,ids,'travel','JP');
 for(let i=0;i<ids.length;i++){const agent=s.agents.find(a=>a.id===ids[i]);assert.equal(agent.task.target,'JP');assert.equal(agent.task.total,plans[i].duration);assert.equal(agent.task.fatigue,plans[i].fatigue);assert.equal(agent.task.queued,true);}
 assert.equal(s.turn,1);assert.equal(s.rng,rng);assert.equal(s.factions.FR.budget,budget);assert.notEqual(a.task.fatigue,b.task.fatigue);
 assert.doesNotThrow(()=>E.validateSave(structuredClone(s)));
});

test('A bad member rejects the entire deployment before any solo order or resource mutation',()=>{
 for(const invalid of ['busy','captured','already-there','foreign','duplicate','empty','action']){
  const s=fresh(),[a,b]=E.team(s);let ids=[a.id,b.id],type='travel';
  if(invalid==='busy')E.assign(s,b.id,'counter');if(invalid==='captured')b.status='captured';if(invalid==='already-there')b.country='JP';
  if(invalid==='foreign')ids[1]=s.agents.find(a=>a.faction!=='FR').id;if(invalid==='duplicate')ids=[a.id,a.id];if(invalid==='empty')ids=[];if(invalid==='action')type='counter';
  const before=JSON.stringify(s);assert.throws(()=>assignDeployment(s,ids,type,'JP'));assert.equal(JSON.stringify(s),before,invalid);
 }
});

test('Agent picker exposes checkboxes, per-agent previews and clear disabled availability',()=>{
 const s=fresh(),[a,b,c,d]=E.team(s);E.assign(s,b.id,'counter');c.country='JP';d.status='captured';
 const html=deploymentPickerMarkup(s,'travel','JP');
 assert.match(html,new RegExp(`name="deployAgent" value="${a.id}"  aria-label`));
 for(const agent of [b,c,d])assert.match(html,new RegExp(`name="deployAgent" value="${agent.id}" disabled`));
 assert.match(html,/data-cmd="confirm-deployment" disabled/);assert.match(html,/0 agent sélectionné/);assert.match(html,/Destination : <strong>Japon/);assert.match(html,/énergie/);
});

test('Host validates a guest deployment as one command, with ownership, readiness, duplicate and rollback protections',()=>{
 const r=room(),guest=r.members[1],ids=E.team(r.game,guest.country).slice(0,2).map(a=>a.id),revision=r.revision;
 const message={protocol:PROTOCOL,seq:guest.lastSeq+1,turn:1,kind:'deploy',payload:{ids,type:'travel',target:'JP'}};
 execute(r,guest.token,message);assert.equal(r.revision,revision+1);assert.equal(r.game.turn,1);
 assert.ok(ids.every(id=>r.game.agents.find(a=>a.id===id).task?.target==='JP'));
 const snapshot=JSON.stringify(r);assert.equal(execute(r,guest.token,message).duplicate,true);assert.equal(JSON.stringify(r),snapshot);
 send(r,guest,'ready',{ready:true});assert.throws(()=>send(r,guest,'deploy',{ids:[],type:'travel',target:'JP'}),/Modifier mes ordres/);send(r,guest,'ready',{ready:false});
 const unassigned=E.team(r.game,guest.country).find(a=>!a.task),foreign=E.team(r.game,'FR')[0],before=JSON.stringify(r);
 assert.throws(()=>send(r,guest,'deploy',{ids:[unassigned.id,foreign.id],type:'travel',target:'JP'}),/appartient/);assert.equal(JSON.stringify(r),before);
 const other=E.team(r.game,guest.country).find(a=>a!==unassigned&&!a.task);E.assign(r.game,other.id,'counter');const busy=JSON.stringify(r);
 assert.throws(()=>send(r,guest,'deploy',{ids:[unassigned.id,other.id],type:'travel',target:'JP'}));assert.equal(JSON.stringify(r),busy);
 const observed=room(true);assert.throws(()=>send(observed,observed.members[0],'deploy',{ids,type:'travel',target:'JP'}),/consultation/);
});

test('Actual confirmation handler stages solo orders and sends a single multiplayer deployment',async()=>{
 const source=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8'),fn=source.slice(source.indexOf('async function confirmDeployment('),source.indexOf('let lastAgentClick='));
 for(const multi of [false,true]){
  const s=fresh(),ids=E.team(s).slice(0,2).map(a=>a.id),confirm={disabled:false},picker={dataset:{deploymentType:'travel',deploymentTarget:'JP'},querySelector:()=>confirm,querySelectorAll:()=>ids.map(value=>({value}))},commands=[],signals=[];let closed=false,persisted=false;
  const context={state:s,COUNTRY,assignDeployment,multiplayer:{active:multi,observer:false,async command(kind,payload){commands.push({kind,payload});}},modal:{querySelector:()=>picker,close(){closed=true;}},stageSignal:a=>signals.push(a.id),persist(){persisted=true;},render(){},toast(){}};
  await runInNewContext(fn+'\nconfirmDeployment()',context);assert.equal(closed,true);
  if(multi){assert.equal(commands.length,1);assert.equal(commands[0].kind,'deploy');assert.deepEqual(Array.from(commands[0].payload.ids),ids);assert.ok(E.team(s).every(a=>!a.task));}
  else{assert.equal(persisted,true);assert.deepEqual(signals,ids);assert.ok(ids.every(id=>s.agents.find(a=>a.id===id).task));}
 }
});

test('Diplomacy shows escaped player names in private and observer views, through restore and replacement',()=>{
 for(const observer of [false,true]){
  const r=room(observer),view=roomView(r,r.members[0].token).game;
  for(const m of r.members.filter(m=>!m.observer))assert.ok(view.multiplayer.players.some(p=>p.country===m.country&&p.name===m.name));
  const html=makeScreens(view,view.player,null,[],{}).diplomacy();
  assert.match(html,/diplomacy-player/);assert.match(html,/Alex &amp; Jo/);assert.doesNotMatch(html,/<Admin>/);
  if(!observer)assert.match(html,/Jean &lt;Admin&gt;/);
  const before=JSON.stringify(r.game);assert.doesNotMatch(JSON.stringify(view.multiplayer),/token|invite/);assert.equal(JSON.stringify(r.game),before);
  const loaded=restoreRoom(structuredClone(r));assert.deepEqual(roomView(loaded,loaded.members[0].token).game.multiplayer.players,view.multiplayer.players);
  const guest=r.members.find(m=>!m.host);send(r,r.members[0],'replace',{country:guest.country});assert.ok(!roomView(r,r.members[0].token).game.multiplayer.players.some(p=>p.country===guest.country));
 }
 assert.doesNotMatch(makeScreens(fresh(),'FR',null,[],{}).diplomacy(),/diplomacy-player/);
});

test('Patch notes display verified before/after values with buffs, nerfs and neutral unchanged stats',()=>{
 assert.equal(PATCH_NOTES[0].version,BUILD_VERSION);
 const mira=balanceChangesMarkup(PATCH_NOTES.find(r=>r.version==='181')),iris=balanceChangesMarkup(PATCH_NOTES.find(r=>r.version==='177'));
 assert.match(mira,/<td>8<\/td><td>6<\/td>.*is-nerf/);assert.match(mira,/<td>6<\/td><td>7<\/td>.*is-buff/);assert.match(mira,/<td>7<\/td><td>7<\/td>.*is-unchanged/);
 assert.match(iris,/<td>7<\/td><td>9<\/td>.*is-buff/);assert.match(iris,/<td>9<\/td><td>7<\/td>.*is-nerf/);
 const government=balanceChangesMarkup(PATCH_NOTES.find(r=>r.version==='178'));assert.match(government,/<td>20<\/td><td>12<\/td>.*is-nerf/);assert.match(government,/<td>20<\/td><td>15<\/td>.*is-buff/);
 assert.match(patchNotesPage(),/Équilibrage · Avant \/ Après/);
});

test('Version 183 multiplayer saves migrate without losing names or staged individual orders',()=>{
 const r=room();r.protocol=17;const a=E.team(r.game)[0];E.assign(r.game,a.id,'travel','JP');const order=structuredClone(a.task);
 const loaded=restoreRoom(structuredClone(r));assert.equal(loaded.protocol,PROTOCOL);assert.deepEqual(loaded.game.agents.find(b=>b.id===a.id).task,order);assert.equal(loaded.members[0].name,'Jean <Admin>');
});

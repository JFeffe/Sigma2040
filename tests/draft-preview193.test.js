import test from 'node:test';
import assert from 'node:assert/strict';
import {DISPLAY_ROSTER} from '../dist/client/data.js';
import {createDraft,draftCountry,pickDraftAgent,advanceNpcDraft,availableDraftAgents} from '../dist/client/game-setup.js';
import {draftScreen,draftCandidate} from '../dist/client/draft-ui.js';
import {newRoom,joinRoom,execute,PROTOCOL} from '../dist/client/multiplayer-core.js';
import {Multiplayer} from '../dist/client/multiplayer.js';
const send=(r,m,kind,payload={})=>execute(r,m.token,{protocol:PROTOCOL,seq:m.lastSeq+1,turn:r.game?.turn,kind,payload});
function room(){const r=newRoom('revision193-room-00000001','revision193-invite-000001','revision193-host-00000001','Hôte');joinRoom(r,{invite:r.invite,token:'revision193-guest-0000001',name:'Invité'});return r;}

test('Draft preview adds the candidate to displayed totals while leaving picks, RNG and owned talents unmodified',()=>{
 const d=advanceNpcDraft(createDraft(['FR'],193));pickDraftAgent(d,'FR',availableDraftAgents(d)[0].id);advanceNpcDraft(d);
 const id=availableDraftAgents(d)[0].id,a=DISPLAY_ROSTER.find(a=>a.id===id),before=JSON.stringify(d),owned=d.teams.FR.map(id=>DISPLAY_ROSTER.find(a=>a.id===id));
 const html=draftScreen(d,'FR',{candidate:id});
 assert.equal(JSON.stringify(d),before);assert.match(html,/draft-country-preview/);assert.match(html,/1 \/ 4 agents repêchés/);assert.match(html,/À confirmer/);assert.match(html,/data-cmd="solo-draft-confirm"/);assert.doesNotMatch(html,/data-cmd="solo-draft-pick"/);
 for(let i=0;i<3;i++){const base=owned.reduce((n,b)=>n+b.stats[i],0);assert.ok(html.includes(`${base} → </span>${base+a.stats[i]}/40`));}
 assert.equal(draftCandidate(d,'FR',d.picks[0].id),null);assert.equal(draftCandidate(d,'US',id),null);assert.equal(draftCandidate(null,'FR',id),null);
});

test('Actual multiplayer preview can be changed without sending a pick; only confirmation reserves an agent',async()=>{
 const previous={document:globalThis.document,location:globalThis.location,localStorage:globalThis.localStorage};let html='';
 globalThis.document={querySelector:()=>null};globalThis.location={href:'https://sigma.test/'};globalThis.localStorage={getItem:()=>null,setItem(){}};
 const mp=new Multiplayer({lobby:value=>html=value,close(){},render:()=>mp.panel(),state(){},toast(){}});
 try{
  const r=room();send(r,r.members[0],'game-mode',{mode:'advanced'});r.members.forEach(m=>send(r,m,'confirm-country'));send(r,r.members[0],'begin-draft');
  for(let i=0;draftCountry(r.draft)!=='FR'&&i<16;i++){const m=r.members.find(m=>m.country===draftCountry(r.draft));assert.ok(m);send(r,m,'draft-pick',{id:availableDraftAgents(r.draft)[0].id});}
  assert.equal(draftCountry(r.draft),'FR');mp.room=r;mp.active=true;mp.token=r.members[0].token;mp.details={id:r.id,invite:r.invite};mp.publish();
  const before=JSON.stringify(r.draft),ids=availableDraftAgents(r.draft).slice(0,2).map(a=>a.id),count=r.draft.teams.FR.length;
  await mp.handle('mp-draft-preview',ids[0]);assert.equal(JSON.stringify(r.draft),before);assert.match(html,/mp-draft-confirm/);
  await mp.handle('mp-draft-preview',ids[1]);assert.equal(JSON.stringify(r.draft),before);
  await mp.handle('mp-draft-confirm');assert.equal(r.draft.teams.FR.length,count+1);assert.ok(r.draft.teams.FR.includes(ids[1]));assert.ok(!r.draft.teams.FR.includes(ids[0]));
  const committed=JSON.stringify(r.draft);await mp.handle('mp-draft-confirm');assert.equal(JSON.stringify(r.draft),committed);
 }finally{clearInterval(mp.timer);Object.assign(globalThis,previous);}
});


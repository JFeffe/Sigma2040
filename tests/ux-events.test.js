import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {bindBackdropDismiss} from '../dist/client/dialog-behavior.js';
import {Multiplayer} from '../dist/client/multiplayer.js';
import {PROTOCOL} from '../dist/client/multiplayer-core.js';
import {countryPin,layoutCountryLabels} from '../dist/client/globe.js';
import {COUNTRY} from '../dist/client/data.js';
const fresh=seed=>E.createGame('FR',['p0','p12','p13','p14'],seed||42);

test('Text selection ending outside a dialog keeps it open; a full backdrop click closes it',()=>{
 const handlers={},dialog={addEventListener:(k,f)=>handlers[k]=f,getBoundingClientRect:()=>({left:100,right:300,top:100,bottom:300})};let closed=0;bindBackdropDismiss(dialog,()=>closed++);
 handlers.pointerdown({target:{},button:0,clientX:150,clientY:150});handlers.click({target:dialog,clientX:50,clientY:150});assert.equal(closed,0);
 handlers.pointerdown({target:dialog,button:0,clientX:50,clientY:150});handlers.click({target:dialog,clientX:50,clientY:150});assert.equal(closed,1);
 handlers.pointerdown({target:dialog,button:0,clientX:50,clientY:150});handlers.pointercancel();handlers.click({target:dialog,clientX:50,clientY:150});assert.equal(closed,1);
});

test('Snapshots and connectivity updates do not reopen a closed lobby during play',()=>{
 let open=false,panels=0;globalThis.document={querySelector:q=>q==='dialog[open] #mpLobby'?(open?{}:null):q==='#mpLobby'?{}:null};
 const m=new Multiplayer({state(){},render(){}});m.panel=()=>panels++;
 try{m.receive({protocol:PROTOCOL,revision:1,lastSeq:0,phase:'playing',game:{turn:1}});m.refreshPanel();assert.equal(panels,0);open=true;m.receive({protocol:PROTOCOL,revision:2,lastSeq:0,phase:'playing',game:{turn:1}});assert.equal(panels,1);open=false;m.receive({protocol:PROTOCOL,revision:3,lastSeq:0,phase:'lobby'});assert.equal(panels,2);}finally{clearInterval(m.timer);delete globalThis.document;}
});

test('Japan and Turkey country labels avoid city text at desktop and compact widths',()=>{
 for(const width of [480,1200])for(const id of ['TR','JP']){
  const x=width/2,y=250,cityBox={left:x-15,right:x+85,top:y-27,bottom:y+17};
  const pos=layoutCountryLabels([{id,x,y,cityBox}],width,500,id)[id],cw=width<700?104:132,ch=width<700?39:43;
  const box={left:x+pos[0]-cw/2,right:x+pos[0]+cw/2,top:y+pos[1]-ch/2,bottom:y+pos[1]+ch/2};
  assert.ok(box.right<=cityBox.left||box.left>=cityBox.right||box.bottom<=cityBox.top||box.top>=cityBox.bottom);
 }
 const s=fresh();s.factions.FR.cyberSupport.JP={from:1,until:3};assert.match(countryPin(s,COUNTRY.JP,[],[]),/class="hack-count"/);assert.match(countryPin(s,COUNTRY.JP,[],[]),/>3<\/text>/);s.turn=4;assert.doesNotMatch(countryPin(s,COUNTRY.JP,[],[]),/class="hack-count"/);
});

test('Scripted events are disabled and pending choices migrate without spending resources',()=>{for(const event of E.EVENTS){const s=fresh();s.turn=event.turn;s.event=structuredClone(event);const before=JSON.stringify(s);assert.throws(()=>E.answerEvent(s,0),/désactivés/);assert.equal(JSON.stringify(s),before);const saved=E.validateSave(s);assert.equal(saved.event,null);}});
test('AI can activate while idle; only later assignments receive its non-stacking bonus',()=>{
 const s=fresh(),a=E.team(s)[0],f=s.factions.FR;f.budget=8;f.evidence.push({id:'s0-e0',verified:false,contested:false,collectedBy:'FR'});a.stats[0]=1;
 const base=E.options(s,a.id,'analyze','s0-e0').chance;E.assign(s,a.id,'analyze','s0-e0');E.activateTech(s,'ai');assert.equal(a.task.chance,base);assert.equal(f.tech[0].until,3);
 E.cancel(s,a.id);assert.equal(E.options(s,a.id,'analyze','s0-e0').chance,base+10);assert.throws(()=>E.activateTech(s,'ai'),/déjà actif/);assert.equal(E.options(s,a.id,'analyze','s0-e0').chance,base+10);s.turn=7;assert.equal(E.options(s,a.id,'analyze','s0-e0').chance,base);
 const idle=fresh();E.activateTech(idle,'ai');assert.ok(E.team(idle).every(a=>!a.task));assert.equal(E.leadResearch(idle).progress,0);
});

test('Competing arrests have one winner, reproducible random priority, and no duplicate prestige',()=>{
 const winners=new Set();for(let seed=1;seed<=30;seed++){
  const s=fresh(seed);s.humanFactions=Object.keys(s.factions);const t=s.suspects[0];
  for(const f of ['FR','US']){const a=E.team(s,f)[0];a.country=t.country;s.factions[f].known[t.id]={country:t.country,identified:true,prepared:true,locationUntil:8,locBy:f,prepBy:f};a.task={type:'arrest',target:t.id,remaining:1,total:1,cost:3,chance:100,fatigue:8,origin:t.country,queued:true};}
  const copy=structuredClone(s);E.advance(s);E.advance(copy);assert.deepEqual(s,copy);winners.add(t.arrestedBy);assert.equal(s.prestigeLedger.filter(l=>l.key==='arrest:'+t.id).length,1);assert.equal(s.operationReports.filter(r=>r.type==='arrest'&&r.status==='INTERROMPUE').length,1);
 }
 assert.deepEqual(winners,new Set(['FR','US']));
});

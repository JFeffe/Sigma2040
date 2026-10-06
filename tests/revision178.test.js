import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,COUNTRY,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {createMapAgentActivation} from '../dist/client/map-agent-activation.js';
import {missionCards,missionRevealMarkup,revealDelay} from '../dist/client/mission-reveal.js';
import {observeProtection,observeFracture,tickFracture} from '../dist/client/fracture.js';
import {nationalPanel} from '../dist/client/command-ui.js';
import {newRoom,joinRoom,startRoom,execute,restoreRoom,playerView,PROTOCOL} from '../dist/client/multiplayer-core.js';

const fresh=()=>{const s=E.createGame('FR',DEFAULT_TEAM_IDS,42);s.humanFactions=COUNTRIES.filter(c=>c.power).map(c=>c.id);return s;};
const tick=s=>tickFracture(s,E.random,E.log);
function fakeClock(){
 let time=0,next=0;const timers=new Map();
 return {options:{now:()=>time,setTimer:(fn,ms)=>{timers.set(++next,{fn,at:time+ms});return next;},clearTimer:id=>timers.delete(id)},advance(ms){time+=ms;for(const [id,t] of timers)if(t.at<=time){timers.delete(id);t.fn();}}};
}
function room(){
 const r=newRoom('room-token-00000000178','invite-token-000000178','host-token-000000000178','Hôte');
 joinRoom(r,{token:'guest-token-00000000178',invite:r.invite,name:'Invité'});
 for(const m of r.members){m.agents=[...DEFAULT_TEAM_IDS];m.confirmed=true;}startRoom(r,42);return r;
}
function send(r,m,kind,payload,seq=m.lastSeq+1){return execute(r,m.token,{protocol:PROTOCOL,seq,turn:r.game.turn,kind,payload});}
function evidenceMission(s,type,flightTurn=s.turn){
 const a=E.team(s)[1],t=s.suspects.find(t=>t.id==='s0'),f=s.factions.FR;
 a.country=t.country='DE';a.stats=[5,5,5];a.talents=['endurance','secours','langues'];a.fatigue=20;a.exposure=10;
 f.known[t.id]={country:'DE',identified:true,prepared:false,locationUntil:5};f.access.DE=true;
 E.assign(s,a.id,type,t.id,true);s.fracture.flights=[{id:t.id,to:'TR',turn:flightTurn}];
 return {a,t,f};
}

test('Real map selection keeps an off-center portrait still until the second click and opens its menu once',()=>{
 const app=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8'),clock=fakeClock(),trace=[],camera={};
 const context={createMapAgentActivation:(select,open)=>createMapAgentActivation(select,open,clock.options),state:{player:'FR',agents:[{id:'iris',country:'DE',faction:'FR'}]},setup:false,menuOpen:false,camera,modal:{close:()=>trace.push('close')},selectedAgent:null,selectedCountry:'FR',view:'world',multiplayer:{observer:false},focusCountry:(_,country)=>trace.push('center '+country),render:()=>trace.push('render'),openAgent:id=>trace.push('menu '+id)};
 const activation=app.match(/const mapAgentActivation=createMapAgentActivation\([^]*?\},openAgent\);/)[0];
 const control=runInNewContext(activation+'mapAgentActivation;',context);
 control.click('iris');assert.deepEqual(trace,[]);clock.advance(120);control.click('iris');
 assert.deepEqual(trace,['close','center DE','render','menu iris']);assert.equal(context.selectedAgent,'iris');assert.equal(context.selectedCountry,'DE');assert.equal(camera.panelOpen,true);
 clock.advance(1000);assert.equal(trace.length,4);
 context.multiplayer={observer:true,observe:f=>trace.push('observe '+f)};context.state.agents[0].faction='US';trace.length=0;
 control.click('iris');assert.deepEqual(trace,[]);clock.advance(100);control.click('iris');assert.deepEqual(trace,['observe US','close','center DE','render','menu iris']);
});

test('Single map clicks still select; a different agent or cancelled click cannot trigger a stale selection',()=>{
 const clock=fakeClock(),calls=[],control=createMapAgentActivation(id=>calls.push('select '+id),id=>calls.push('open '+id),clock.options);
 control.click('a');clock.advance(399);assert.deepEqual(calls,[]);clock.advance(1);assert.deepEqual(calls,['select a']);
 control.click('a');clock.advance(80);control.click('b');clock.advance(400);assert.deepEqual(calls,['select a','select b']);
 control.click('a');control.cancel();clock.advance(1000);assert.deepEqual(calls,['select a','select b']);
});

test('Attack postponement produces a saved public announcement with the old and new deadlines and placeholder image',()=>{
 const s=fresh(),p=s.plots[0];s.plots=[p];s.turn=2;p.turn=5;p.country='DE';observeProtection(s,'DE',8);
 E.advance(s);const report=s.attackDelayReports[0];
 assert.equal(report.reason,'protection');assert.equal(report.oldTurn,5);assert.equal(report.attackTurn,7);assert.equal(report.turn,2);assert.equal(report.country,'DE');
 assert.equal(missionCards(s).filter(r=>r.type==='postponement').length,1);assert.equal(revealDelay(report),0);
 const html=missionRevealMarkup(report,0,1);assert.match(html,/Image à venir/);assert.match(html,/Attaque reportée/);assert.match(html,/Fin du tour 5/);assert.match(html,/Fin du tour 7/);assert.match(html,/data-cmd="reveal-next"/);assert.match(html,/data-cmd="reveal-skip"/);
 const loaded=E.validateSave(structuredClone(s));assert.deepEqual(loaded.attackDelayReports,s.attackDelayReports);
 for(const country of ['FR','US'])assert.deepEqual(playerView({game:loaded,offers:[]},country).attackDelayReports,[report]);
 E.advance(s);assert.deepEqual(s.attackDelayReports,[]);assert.equal(p.turn,7);
});

test('Flight and relocation announcements preserve their cause and route; blocked delays do not announce',()=>{
 const s=fresh(),p=s.plots.find(p=>p.cell===1);s.plots=[p];p.turn=7;p.country='DE';s.turn=3;observeProtection(s,'DE',7);tick(s);
 const r=s.attackDelayReports[0];assert.equal(r.reason,'relocation');assert.equal(r.origin,'DE');assert.equal(r.country,p.country);assert.notEqual(r.country,r.origin);assert.equal(r.attackTurn,8);
 const frozen=structuredClone(r);p.country='BR';assert.deepEqual(r,frozen);assert.match(missionRevealMarkup(r,0,1),new RegExp(COUNTRY[frozen.country].name));assert.match(missionRevealMarkup(r,0,1),/La protection reste dans le pays précédent/);
 const flight=fresh();flight.plots=[flight.plots[0]];flight.plots[0].turn=5;observeFracture(flight,0,3);tick(flight);assert.equal(flight.attackDelayReports[0].reason,'flight');assert.equal(flight.attackDelayReports[0].attackTurn,6);
 const blocked=fresh(),plot=blocked.plots[0];blocked.plots=[plot];blocked.turn=2;plot.turn=5;plot.fractureDelay=2;observeProtection(blocked,plot.country,10);tick(blocked);assert.equal(plot.turn,5);assert.deepEqual(blocked.attackDelayReports||[],[]);
});

test('Malformed attack postponement reports are rejected while old saves without reports remain valid',()=>{
 const s=fresh(),p=s.plots[0];s.plots=[p];p.turn=5;s.turn=2;observeProtection(s,p.country,9);tick(s);const r=s.attackDelayReports[0];assert.ok(r);
 for(const patch of [{plotId:'missing'},{cell:3},{reason:'unknown'},{origin:'invalid'},{attackTurn:r.oldTurn},{attackTurn:r.oldTurn+3},{oldTurn:2},{turn:2.5},{reason:'relocation'},{kind:'<script>'}]){const bad=structuredClone(s);Object.assign(bad.attackDelayReports[0],patch);assert.throws(()=>E.validateSave(bad),JSON.stringify(patch));}
 const old=fresh();delete old.attackDelayReports;assert.doesNotThrow(()=>E.validateSave(old));
});

test('A queued boost refunds only its owner, once, after multiplayer save/reload and duplicate commands',()=>{
 let r=room();const guest=r.members[1],id=E.team(r.game,guest.country)[1].id,hostBefore=r.game.factions.FR.budget;
 send(r,guest,'assign',{id,type:'counter',useCredits:true});assert.equal(r.game.factions[guest.country].budget,0);
 r=restoreRoom(structuredClone(r));const m=r.members[1];m.connected=true;send(r,m,'cancel',{id});assert.equal(r.game.factions[m.country].budget,6);assert.equal(r.game.factions.FR.budget,hostBefore);
 assert.deepEqual(send(r,m,'cancel',{id},m.lastSeq),{duplicate:true});send(r,m,'cancel',{id});assert.equal(r.game.factions[m.country].budget,6);
});

test('Started two-turn actions keep their spent boost while queued cancellation restores the full amount above the reserve cap',()=>{
 const s=fresh(),{a,f}=evidenceMission(s,'collect',s.turn+5);E.advance(s);assert.equal(a.task.remaining,1);const budget=f.budget;E.cancel(s,a.id);assert.equal(f.budget,budget);
 const q=fresh(),x=evidenceMission(q,'hack');x.f.budget=24;const loaded=E.validateSave(structuredClone(q));E.cancel(loaded,x.a.id);assert.equal(loaded.factions.FR.budget,30);E.cancel(loaded,x.a.id);assert.equal(loaded.factions.FR.budget,30);
});

test('Collect and intrusion stop on the departure turn, without a second fatigue cost, exposure, proof or random roll',()=>{
 for(const type of ['collect','hack']){
  const s=fresh(),{a,t,f}=evidenceMission(s,type),fatigue=a.task.fatigue,control=structuredClone(s);control.agents.find(x=>x.id===a.id).task=null;
  E.advance(s);E.advance(control);assert.equal(t.country,'TR');assert.equal(a.task,null);assert.equal(a.fatigue,20+fatigue);assert.equal(a.exposure,10);assert.equal(f.evidence.length,0);assert.equal(s.rng,control.rng);
  const r=s.operationReports.find(r=>r.agentId===a.id);assert.equal(r.status,'INTERROMPUE');assert.equal(r.fatigue,fatigue);assert.equal(r.prestige,0);assert.match(r.notes.join(' '),/la cible a quitté le pays/);assert.equal(f.budget,2);
  const loaded=E.validateSave(structuredClone(s));assert.equal(loaded.agents.find(x=>x.id===a.id).task,null);assert.equal(loaded.campaignStats.factions.FR[type].stopped,1);E.advance(loaded);assert.equal(loaded.campaignStats.factions.FR[type].count,1);
  assert.equal(E.options(s,a.id,'travel',t.country).error,null);E.assign(s,a.id,'travel',t.country);assert.equal(a.task.type,'travel');
 }
});

test('Already departed targets free all their collecting agents before another tick; unchanged targets retain two turns',()=>{
 const s=fresh(),{a,t}=evidenceMission(s,'collect'),b=E.team(s)[2];b.country='DE';b.stats=[5,5,5];b.talents=['endurance','secours','langues'];E.assign(s,b.id,'hack',t.id);t.country='TR';s.fracture.flights=[];
 E.advance(s);assert.equal(a.task,null);assert.equal(b.task,null);assert.equal(a.fatigue,20);assert.equal(b.fatigue,0);assert.equal(s.operationReports.filter(r=>r.targetName===t.name&&r.status==='INTERROMPUE').length,2);
 for(const type of ['collect','hack']){const live=fresh(),x=evidenceMission(live,type,5);x.a.task.chance=100;E.advance(live);assert.equal(x.a.task.remaining,1);E.advance(live);assert.equal(x.a.task,null);assert.equal(live.operationReports[0].status,'RÉUSSITE');assert.equal(x.f.evidence.length,1);}
});

test('Multiplayer interruptions reach both private reports without disclosing another player’s operation',()=>{
 const r=room(),s=r.game,t=s.suspects.find(t=>t.id==='s0');s.humanFactions=COUNTRIES.filter(c=>c.power).map(c=>c.id);t.country='DE';
 const ids=[];for(const m of r.members){const a=E.team(s,m.country)[1];ids.push(a.id);a.country='DE';s.factions[m.country].known[t.id]={country:'DE',identified:true,locationUntil:4};s.factions[m.country].access.DE=true;E.assign(s,a.id,'collect',t.id);}
 s.fracture.flights=[{id:t.id,to:'TR',turn:1}];E.advance(s);
 for(const m of r.members){const view=playerView(r,m.country);assert.equal(view.agents.find(a=>a.id===ids[r.members.indexOf(m)]).task,null);assert.equal(view.turnActivities.filter(a=>a.status==='INTERROMPUE').length,1);assert.ok(view.turnActivities.every(a=>a.faction===m.country));}
});

test('Government UI and multiplayer use the new diplomatic costs and exactly twelve medical energy',()=>{
 const s=fresh();s.factions.FR.confidence=100;s.factions.FR.cooperation.DE=0;const html=nationalPanel(s,'DE');assert.match(html,/<strong>\+12<\/strong>/);assert.doesNotMatch(html,/\+20|jusqu’à 20 énergie/);assert.match(html,/Hostile → Réticente : 15/);assert.match(html,/Favorable → Soutien total : 5/);
 const r=room(),m=r.members[1],f=r.game.factions[m.country],a=E.team(r.game,m.country)[0];a.fatigue=60;f.confidence=100;send(r,m,'government-favor',{type:'medical'});assert.equal(r.game.agents.find(x=>x.id===a.id).fatigue,48);assert.equal(r.game.factions[m.country].medicalUses,1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {createTutorialGame,tutorialObjective,validateTutorialGame,readTutorialProgress,saveTutorialProgress,TUTORIAL_KEY,TUTORIAL_MISSIONS} from '../dist/client/tutorial.js';
import {tutorialHint} from '../dist/client/tutorial-rules.js';
import {tutorialGuide,tutorialMenu,markTutorialControls} from '../dist/client/tutorial-ui.js';
import {inquiryModel,countryTargetButtons} from '../dist/client/country-inquiry.js';
import {TUTORIAL_ROADMAP} from '../dist/client/tutorial-autonomy.js';
function turn(s,{modules=true,reverse=false,swap=false}={}){
 const o=tutorialObjective(s);
 if(modules)for(const type of o.tech||[])E.activateTech(s,type);
 for(const x of reverse?[...o.orders].reverse():o.orders){
  const id=swap&&s.tutorial.mission==='resources'?(x.agentId==='p0'?'p14':x.agentId==='p14'?'p0':x.agentId):x.agentId;
  if(s.agents.find(a=>a.id===id).task)continue;
  assert.equal(E.options(s,id,x.type,x.target).error,null,`${s.tutorial.mission} T${s.turn}: ${id} ${x.type} ${x.target}`);
  E.assign(s,id,x.type,x.target);s=validateTutorialGame(s);
 }
 E.advance(s);return validateTutorialGame(s);
}
function finish(s,opts={}){for(let i=0;i<30&&!tutorialObjective(s).done&&!tutorialObjective(s).failed;i++)s=turn(s,opts);assert.equal(tutorialObjective(s).done,true,`${s.tutorial.mission} T${s.turn}`);return s;}
test('Mission 7 exposes two actual dossiers and collects Cobalt while analyzing him and locating Vesper',()=>{
 let s=createTutorialGame('stealth');const html=countryTargetButtons(s,'TR');assert.match(html,/data-id="s0"/);assert.match(html,/data-id="s1"/);
 s=turn(s);const orders=tutorialObjective(s).orders;
 assert.ok(orders.some(o=>o.type==='collect'&&o.target==='s1'));
 assert.ok(orders.some(o=>o.type==='analyze'&&o.target==='s1-e0'));
 assert.ok(orders.some(o=>o.type==='surveil'&&o.target==='s0'));
 for(const [target,type,agent] of [['s1','collect','p14'],['s1','analyze','p15'],['s0','surveil','p0']])assert.equal(inquiryModel(s,target,type,agent).selected.reason,'');
 assert.ok(inquiryModel(s,'s0','collect','p14').selected.reason);
 assert.match(tutorialHint(s),/dossier Cobalt/);assert.match(tutorialGuide(s),/Recueillir une preuve · Cobalt/);
 const selectors=[];markTutorialControls({querySelectorAll:q=>{selectors.push(q);return []},querySelector:()=>null},s);
 assert.ok(selectors.includes('[data-cmd="country-inquiry"][data-id="s1"]'));
 const done=finish(s,{reverse:true});assert.ok(done.suspects.filter(t=>['s0','s1'].includes(t.id)).every(t=>t.arrested));
 assert.ok(done.operationReports.some(r=>r.type==='collect'&&r.targetName==='Cobalt'));
});
test('Legacy mission 7 saves gain the second dossier and analyst without discarding assigned orders',()=>{
 const old=createTutorialGame('stealth');old.tutorial={version:1,mission:'stealth'};old.agents=old.agents.filter(a=>a.id!=='p15');delete old.factions.FR.known.s1;old.factions.FR.evidence=old.factions.FR.evidence.filter(e=>!e.id.startsWith('s1-'));
 // Simulate an already assigned order from build 202, using the normal task shape.
 const current=createTutorialGame('stealth');E.assign(current,'p14','sneak','TR');old.agents.find(a=>a.id==='p14').task=current.agents.find(a=>a.id==='p14').task;
 const stored=JSON.stringify({version:1,completed:[],sessions:{stealth:old}}),p=readTutorialProgress({getItem:()=>stored});
 assert.equal(p.warning,false);assert.equal(p.sessions.stealth.agents.length,4);assert.equal(p.sessions.stealth.agents.find(a=>a.id==='p14').task.type,'sneak');assert.ok(p.sessions.stealth.factions.FR.known.s1);finish(p.sessions.stealth);
 const corrupt=createTutorialGame('stealth');corrupt.agents.pop();assert.throws(()=>validateTutorialGame(corrupt));
});
test('Mission 8 renews the country hack between proof checks and preserves its +10 bonus',()=>{
 let s=createTutorialGame('digital');s=turn(s);s=turn(s);
 assert.equal(s.turn,3);assert.ok(tutorialObjective(s).orders.some(o=>o.agentId==='p15'&&o.type==='cyberSupport'&&o.target==='TR'));
 const previous=s.factions.FR.cyberSupport.TR.until;s=turn(s);assert.ok(s.factions.FR.cyberSupport.TR.until>=previous+3);
 assert.ok(E.options(s,'p12','prepare','s0').explanations.includes('Hack d’un pays +10'));
 const done=finish(s);assert.equal(done.operationReports.filter(r=>r.agentId==='p15'&&r.type==='cyberSupport').length,3);
 assert.equal(done.turnActivities.find(a=>a.agentId==='p15').type,'cyberSupport');
});
test('Chapters 10 to 12 finish through legal real orders, survive every reload, and contain no NPC players',()=>{
 for(const id of ['resources','reroute','autonomy'])for(const reverse of [false,true]){
  const s=finish(createTutorialGame(id),{reverse});assert.deepEqual(Object.keys(s.factions),['FR']);assert.ok(s.agents.every(a=>a.faction==='FR'));assert.throws(()=>E.validateSave(s));assert.equal(s.ended,null);
  assert.ok(s.operationReports.every(r=>r.status==='RÉUSSITE'&&r.chance===100&&!r.withoutObject));
 }
});
test('Limited budget allows logistics, relay, no module or funding without dead ends',()=>{
 const original=createTutorialGame('resources');assert.equal(original.factions.FR.budget,3);E.activateTech(original,'relay');assert.throws(()=>E.activateTech(original,'logistics'),/Budget/);finish(original,{modules:false});
 const slow=finish(createTutorialGame('resources'),{modules:false});assert.ok(slow.operationReports.some(r=>r.type==='travel'&&r.duration===2));
 const fast=finish(createTutorialGame('resources'));assert.ok(fast.operationReports.some(r=>r.type==='travel'&&r.duration===1&&r.logisticsApplied));
 const funded=createTutorialGame('resources');E.requestGovernmentFavor(funded,'funding');E.activateTech(funded,'relay');finish(funded);
 const cancelled=createTutorialGame('resources'),m=E.activateTech(cancelled,'logistics');E.assign(cancelled,'p0','travel','JP');E.cancelTech(cancelled,m.id);assert.equal(cancelled.agents.find(a=>a.id==='p0').task,null);finish(cancelled);
});
test('Real flight keeps the case, clears location and leaves Cobalt investigation in progress',()=>{
 const initial=createTutorialGame('reroute');assert.equal(initial.factions.FR.known.s0.flightUntil,undefined);let s=turn(initial);assert.equal(s.suspects.find(t=>t.id==='s0').country,'JP');assert.equal(s.factions.FR.known.s0.locationUntil,0);assert.equal(s.factions.FR.known.s0.prepared,true);assert.equal(E.evidenceFor(s,'FR','s0').length,2);assert.ok(s.flightReports.some(r=>r.suspectId==='s0'));
 assert.equal(s.agents.find(a=>a.id==='p0').task.target,'s1');assert.equal(s.agents.find(a=>a.id==='p0').task.remaining,1);
 const o=tutorialObjective(s);assert.equal(o.orders.filter(o=>o.type==='travel'&&o.target==='JP').length,2);finish(s);
});
test('Autonomous chapter shows goals, leaves roles free and validates real attack and departure failures',()=>{
 const s=createTutorialGame('autonomy'),html=tutorialGuide(s);assert.match(html,/Berlin/);assert.doesNotMatch(html,/tutorial-agent-plan/);assert.match(tutorialHint(s),/dossier Cobalt/);
 assert.equal(E.options(s,'p0','protect').error,null);assert.equal(E.options(s,'p15','cyberSupport','JP').error,null);
 const miss=createTutorialGame('autonomy');for(let i=0;i<6;i++)E.advance(miss);assert.equal(tutorialObjective(miss).failed,true);assert.throws(()=>E.advance(miss),/Exercice terminé/);
 const early=createTutorialGame('autonomy');E.assign(early,'p0','protect');for(let i=0;i<6;i++)E.advance(early);assert.equal(tutorialObjective(early).failed,true);
 const escape=createTutorialGame('autonomy');E.advance(escape);E.assign(escape,'p0','protect');for(let i=0;i<11;i++)E.advance(escape);assert.equal(tutorialObjective(escape).failed,true);
 const done=finish(s);assert.equal(done.credited['filigrane-autonomy:FR'],'FR');assert.equal(done.prestigeLedger.find(e=>e.key==='filigrane-autonomy:FR').points,4);
});
test('Twelve playable chapters are saved separately; 13–15 remain an explicit NPC roadmap',()=>{
 assert.equal(TUTORIAL_MISSIONS.length,12);assert.deepEqual(TUTORIAL_ROADMAP.map(m=>m.number),['13','14','15']);
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};let p=readTutorialProgress(storage);
 for(const m of TUTORIAL_MISSIONS)p=saveTutorialProgress(storage,createTutorialGame(m.id),p);
 assert.ok(data.has(TUTORIAL_KEY));assert.equal(readTutorialProgress(storage).warning,false);assert.equal(Object.keys(readTutorialProgress(storage).sessions).length,12);
 const menu=tutorialMenu(p);assert.match(menu,/Douze missions/);assert.match(menu,/ne sont pas encore jouables/);assert.equal((menu.match(/data-cmd="tutorial-start"/g)||[]).length,12);
});

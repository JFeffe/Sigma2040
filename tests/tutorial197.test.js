import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as E from '../dist/client/engine.js';
import {createTutorialGame,tutorialObjective,validateTutorialGame,readTutorialProgress,saveTutorialProgress,TUTORIAL_KEY,TUTORIAL_MISSIONS} from '../dist/client/tutorial.js';
import {tutorialMenu,tutorialGuide} from '../dist/client/tutorial-ui.js';
import {campaignRules} from '../dist/client/campaign-rules.js';
import {CAMPAIGN_KEY} from '../dist/client/save-compat.js';
const storage=()=>{const data=new Map();return {data,getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
function play(s){for(let i=0;i<20;i++){const o=tutorialObjective(s);if(o.done||o.failed)return s;for(const order of o.orders)if(!s.agents.find(a=>a.id===order.agentId).task){const options=E.options(s,order.agentId,order.type,order.target);assert.equal(options.error,null);assert.equal(options.chance,100);E.assign(s,order.agentId,order.type,order.target);s=validateTutorialGame(s);}E.advance(s);s=validateTutorialGame(s);}throw Error('Training did not finish');}
test('All three missions resolve through real orders, including save/reload at every assignment and turn',()=>{
 for(const m of TUTORIAL_MISSIONS){const s=play(createTutorialGame(m.id));assert.equal(tutorialObjective(s).done,true);assert.equal(s.turn,{contact:3,evidence:10,arrest:4}[m.id]);assert.equal(s.crisis,0);assert.equal(s.ended,null);assert.equal(s.plots.length,0);assert.equal(s.agents.length,m.agents);assert.ok(s.agents.every(a=>a.faction==='FR'));assert.ok(s.operationReports.every(r=>r.status==='RÉUSSITE'&&r.faction==='FR'&&r.chance===100));assert.throws(()=>E.advance(s),/Exercice terminé/);}
});
test('Training uses independent fixed setups and never accepts them as a normal campaign or multiplayer save',()=>{
 const s=createTutorialGame('contact');assert.throws(()=>E.validateSave(structuredClone(s)),/incompatible/);assert.deepEqual(createTutorialGame('contact'),s);
 const normal=E.createConfiguredGame('FR',['p0','p12','p14','p15'],197);assert.equal(normal.agents.length,16);assert.equal(campaignRules(normal).crisisPerTurn,3);assert.notEqual(E.options(normal,'p15','counter').chance,100);assert.doesNotThrow(()=>E.validateSave(normal));
 assert.throws(()=>createTutorialGame('unknown'),/inconnue/);
 const injected=createTutorialGame('contact');injected.agents.push({...injected.agents[0],id:'US-0',faction:'US'});assert.throws(()=>validateTutorialGame(injected),/incompatible/);
});
test('Only the current teaching actions are accepted; invalid targets and credit boosts cannot spend resources',()=>{
 const s=createTutorialGame('contact'),before=JSON.stringify(s);
 for(const args of [['p0','travel','JP'],['p0','counter',null],['p0','travel','DE',true]])assert.throws(()=>E.assign(s,...args));
 assert.equal(JSON.stringify(s),before);E.assign(s,'p0','travel','DE');assert.equal(s.agents[0].task.queued,true);assert.equal(s.agents[0].country,'FR');E.cancel(s,'p0');assert.equal(s.agents[0].task,null);assert.equal(s.turn,1);assert.equal(tutorialObjective(s).step,0);
 E.assign(s,'p0','travel','DE');E.advance(s);assert.equal(s.agents[0].country,'DE');assert.equal(s.agents[0].fatigue,6);
});
test('Evidence lesson conceals authenticity until verification and requires replacement of the rejected document',()=>{
 const s=createTutorialGame('evidence');
 for(let i=0;i<2;i++){E.assign(s,'p12','collect','s0');E.advance(s);assert.equal(s.agents.find(a=>a.id==='p12').task.remaining,1);E.advance(s);}
 assert.equal(s.factions.FR.evidence.length,2);assert.ok(s.factions.FR.evidence.every(e=>!e.verified&&!e.contested));assert.doesNotMatch(tutorialGuide(s),/Falsification écartée/);
 E.assign(s,'p15','analyze','s0-e0');E.advance(s);E.assign(s,'p15','analyze','s0-e1');E.advance(s);
 assert.equal(s.factions.FR.evidence.find(e=>e.id==='s0-e1').contested,true);assert.equal(E.evidenceFor(s,'FR','s0').length,1);assert.equal(tutorialObjective(s).step,4);
 const done=play(s);assert.equal(done.factions.FR.evidence.filter(e=>e.verified).length,2);assert.equal(done.factions.FR.evidence.filter(e=>e.contested).length,1);
});
test('Preparation and mandate can resolve in parallel and do not localize the target',()=>{
 const s=createTutorialGame('arrest');E.assign(s,'p0','authorize');E.assign(s,'p12','prepare','s0');E.advance(s);
 assert.equal(s.turn,2);assert.equal(s.factions.FR.authorized.DE,true);assert.equal(s.factions.FR.known.s0.prepared,true);assert.equal(s.factions.FR.known.s0.locationUntil,0);assert.equal(s.operationReports.length,2);assert.equal(tutorialObjective(s).orders[0].type,'surveil');assert.ok(E.options(s,'p14','arrest','s0').error);
});
test('Arrest succeeds on the last inclusive flight turn with a valid location; expiry still blocks arrest',()=>{
 const s=createTutorialGame('arrest');E.assign(s,'p0','authorize');E.assign(s,'p12','prepare','s0');E.advance(s);E.advance(s);E.assign(s,'p12','surveil','s0');E.advance(s);
 assert.equal(s.factions.FR.known.s0.locationUntil,6);E.advance(s);E.advance(s);assert.equal(s.turn,6);assert.equal(E.options(s,'p14','arrest','s0').error,null);E.assign(s,'p14','arrest','s0');E.advance(s);assert.equal(tutorialObjective(s).done,true);assert.equal(s.suspects[0].country,'DE');
 const expired=createTutorialGame('arrest');E.assign(expired,'p0','authorize');E.assign(expired,'p12','prepare','s0');E.advance(expired);E.assign(expired,'p12','surveil','s0');E.advance(expired);while(expired.turn<6)E.advance(expired);assert.equal(expired.factions.FR.known.s0.locationUntil,5);assert.ok(E.options(expired,'p14','arrest','s0').error);assert.equal(tutorialObjective(expired).orders[0].type,'surveil');
});
test('The scripted flight produces a recoverable lesson failure and never changes the next attempt',()=>{
 const s=createTutorialGame('arrest');for(let i=0;i<6;i++)E.advance(s);assert.equal(s.suspects[0].country,'TR');assert.equal(tutorialObjective(s).failed,true);assert.throws(()=>E.advance(s),/Exercice terminé/);assert.match(tutorialGuide(s),/Réessayer cette mission/);const retry=createTutorialGame('arrest');assert.equal(retry.turn,1);assert.equal(retry.suspects[0].country,'DE');assert.equal(tutorialObjective(play(retry)).done,true);
});
test('Each mission saves separately; completing, replaying and resuming never modifies campaign bytes',()=>{
 const store=storage(),campaign=JSON.stringify(E.createConfiguredGame('FR',['p0','p12','p14','p15'],42));store.setItem(CAMPAIGN_KEY,campaign);
 let p=readTutorialProgress(store),contact=play(createTutorialGame('contact'));p=saveTutorialProgress(store,contact,p);
 const evidence=createTutorialGame('evidence');E.assign(evidence,'p12','collect','s0');E.advance(evidence);p=saveTutorialProgress(store,evidence,p);
 p=readTutorialProgress(store);assert.equal(p.sessions.evidence.agents.find(a=>a.id==='p12').task.remaining,1);assert.deepEqual(p.completed,['contact']);p=saveTutorialProgress(store,createTutorialGame('contact'),p);assert.equal(p.sessions.evidence.turn,2);assert.deepEqual(p.completed,['contact']);assert.equal(store.getItem(CAMPAIGN_KEY),campaign);
 assert.match(tutorialMenu(p),/Reprendre · tour 2/);
});
test('A damaged exercise does not discard other progress; unavailable storage is explicit',()=>{
 const store=storage();let p=saveTutorialProgress(store,play(createTutorialGame('contact')),readTutorialProgress(store));p.sessions.evidence={broken:true};store.setItem(TUTORIAL_KEY,JSON.stringify(p));p=readTutorialProgress(store);assert.equal(p.warning,true);assert.equal(tutorialObjective(p.sessions.contact).done,true);assert.equal(p.sessions.evidence,undefined);assert.deepEqual(p.completed,['contact']);
 assert.equal(readTutorialProgress({getItem(){throw Error('denied');}}).warning,true);assert.throws(()=>saveTutorialProgress({setItem(){throw Error('denied');}},createTutorialGame('contact'),p),/denied/);
});
test('The actual application persistence and exit routes preserve the ordinary in-memory campaign',()=>{
 const source=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8'),store=storage(),campaign=E.createConfiguredGame('FR',['p0','p12','p14','p15'],21),raw=JSON.stringify(campaign);store.setItem(CAMPAIGN_KEY,raw);
 const context={isTutorial:s=>!!s?.tutorial,state:createTutorialGame('contact'),campaignBeforeTutorial:campaign,multiplayer:{active:false},inquiryStorage:store,tutorialProgress:readTutorialProgress(store),saveTutorialProgress,SAVE:CAMPAIGN_KEY,localStorage:store,saveWarning:false,toast(){},clearTimeout(){},showReveals:{timer:1},revealSession:{},cinematic:{},closeBureau(){},clearSignals(){},resetExperience(){}};
 const functions=source.slice(source.indexOf('function persist()'),source.indexOf('function launchTutorial('));runInNewContext(functions+';persist();leaveTutorial();',context);
 assert.equal(store.getItem(CAMPAIGN_KEY),raw);assert.equal(context.state,campaign);assert.equal(context.campaignBeforeTutorial,null);assert.equal(context.revealSession,null);assert.equal(context.cinematic,null);assert.equal(context.setup,false);
 assert.ok(readTutorialProgress(store).sessions.contact);
});

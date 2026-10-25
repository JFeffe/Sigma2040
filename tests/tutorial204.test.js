import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {createTutorialGame,tutorialObjective,validateTutorialGame,readTutorialProgress,saveTutorialProgress,TUTORIAL_MISSIONS} from '../dist/client/tutorial.js';
import {tutorialGuaranteed,tutorialParticipants,tutorialRiskNote,tutorialSeed} from '../dist/client/tutorial-mode.js';
import {tutorialGuide,tutorialMenu,markTutorialControls} from '../dist/client/tutorial-ui.js';
import {campaignRules,CURRENT_RULES} from '../dist/client/campaign-rules.js';
import {endingScreen} from '../dist/client/ending-ui.js';
import {gameShell} from '../dist/client/shell.js';
import {missionCostsMarkup} from '../dist/client/operations-ui.js';
function play(value,{policy='advice',reverse=false}={}){
 let s=validateTutorialGame(value);let turns=0;
 while(!s.ended&&!tutorialObjective(s).done&&!tutorialObjective(s).failed&&turns++<32){
  if(policy==='bb1')E.planFaction(s,'FR');
  if(policy==='advice')for(const o of reverse?[...tutorialObjective(s).orders].reverse():tutorialObjective(s).orders){
   const option=E.options(s,o.agentId,o.type,o.target);assert.equal(option.error,null,`${s.tutorial.mission} T${s.turn} ${o.agentId} ${o.type} ${o.target}`);
   E.assign(s,o.agentId,o.type,o.target);s=validateTutorialGame(s);
  }
  E.advance(s);s=validateTutorialGame(s);
 }
 assert.ok(s.ended||tutorialObjective(s).done||tutorialObjective(s).failed);return s;
}
test('Three NPC chapters have explicit factions and real BB1 activity; the first twelve stay isolated',()=>{
 assert.equal(TUTORIAL_MISSIONS.length,15);
 for(const id of ['allies','network','command']){
  let s=createTutorialGame(id);assert.deepEqual(Object.keys(s.factions).sort(),[...tutorialParticipants(id)].sort());assert.equal(E.team(s).length,4);assert.equal(s.aiDifficulty,'bb1');
  E.advance(s);E.advance(s);s=validateTutorialGame(s);
  for(const f of Object.keys(s.factions).filter(f=>f!=='FR'))assert.ok(Object.values(s.campaignStats.factions[f]||{}).reduce((n,r)=>n+r.count,0)>0,`${id}: ${f} acts`);
  assert.equal(s.player,'FR');assert.throws(()=>E.validateSave(structuredClone(s)),/incompatible/);
 }
 for(const m of TUTORIAL_MISSIONS.slice(0,12)){const s=createTutorialGame(m.id);assert.deepEqual(Object.keys(s.factions),['FR']);assert.ok(tutorialGuaranteed(s));}
});
test('Chapter 13 guarantees only French actions, not the NPC, and offers protection, collection and analysis together',()=>{
 const s=createTutorialGame('allies'),o=tutorialObjective(s);assert.ok(o.orders.some(x=>x.type==='protect'));assert.ok(o.orders.some(x=>x.type==='collect'));assert.ok(o.orders.some(x=>x.type==='analyze'));
 assert.equal(E.options(s,'p12','collect','s0').chance,100);assert.ok(E.options(s,'GB-2','collect','s0').chance<=90);
 assert.ok(E.options(s,'p12','collect','s0',true).error);assert.equal(tutorialGuaranteed(s,'GB'),false);
 assert.match(tutorialRiskNote(s),/britannique/);
});
test('Both countries can intercept and share the real four protection points',()=>{
 let s=createTutorialGame('allies');const f=s.factions;f.FR.defense.DE=f.FR.defenseBase.DE=4;f.GB.defense.DE=f.GB.defenseBase.DE=4;
 for(let i=0;i<4;i++)E.advance(s);s=validateTutorialGame(s);
 const rows=s.prestigeLedger.filter(x=>x.key.startsWith('allies-berlin:'));assert.equal(rows.length,2);assert.equal(rows.reduce((n,x)=>n+x.points,0),4);assert.ok(rows.every(x=>x.points===2));
});
test('An NPC arrest counts toward chapter 13 completion, including with no player orders',()=>{
 const s=play(createTutorialGame('allies'),{policy:'idle'});assert.equal(tutorialObjective(s).done,true);assert.equal(s.suspects.find(t=>t.id==='s0').arrestedBy,'GB');assert.equal(s.turn,9);
 const guided=play(createTutorialGame('allies'));assert.equal(tutorialObjective(guided).done,true);
});
test('Chapters 14 and 15 use real odds, boosts, module costs and failure forecasts',()=>{
 for(const id of ['network','command']){
  const s=createTutorialGame(id),plain=structuredClone(s);delete plain.tutorial;
  for(const [agent,type,target] of [['p15','cyberSupport','TR'],['p0','sneak','TR']]){
   const before=E.options(plain,agent,type,target),after=E.options(s,agent,type,target);assert.deepEqual(after,before);assert.ok(after.chance<100);
  }
  const boost=E.options(s,'p0','cyberSupport','TR',true);assert.equal(boost.error,null);assert.equal(boost.cost,6);E.assign(s,'p0','cyberSupport','TR',true);assert.equal(s.factions.FR.budget,0);E.cancel(s,'p0');assert.equal(s.factions.FR.budget,6);
  E.activateTech(s,'ai');assert.equal(s.factions.FR.budget,4);assert.equal(validateTutorialGame(s).factions.FR.tech[0].type,'ai');
  assert.doesNotMatch(E.operationForecast(s,'p0','sneak','TR').risk,/garantie/);assert.match(missionCostsMarkup(s,'p0','sneak','TR'),/échec/);
 }
});
test('Chapter 15 is the ordinary thirty-turn campaign setup, with its original randomness and forgeries',()=>{
 const s=createTutorialGame('command'),normal=E.createConfiguredGame('FR',['p0','p12','p14','p15'],tutorialSeed('command'),'bb1',{participants:['FR','GB','US','CN']});
 for(const key of ['suspects','proofs','plots','factions','agents','fracture','rng','crisis'])assert.deepEqual(s[key],normal[key],key);
 assert.equal(s.humanFactions,undefined);assert.deepEqual(campaignRules(s),CURRENT_RULES);assert.equal(s.proofs.filter(p=>!p.authentic).length,3);
 const short=createTutorialGame('network');assert.equal(campaignRules(short).maxTurns,20);assert.ok(short.plots.every(p=>p.turn<=20));assert.notEqual(short.seed,s.seed);
});
test('All three scenarios finish under multiple player strategies with valid reloads, victories and defeats',()=>{
 let won=false,lost=false;
 for(const id of ['allies','network','command'])for(const policy of ['advice','bb1','idle']){
  const s=play(createTutorialGame(id),{policy});assert.equal(tutorialObjective(s).done,true,`${id} ${policy}`);
  won||=s.ended==='victory';lost||=s.ended==='defeat';
  if(s.ended){const html=endingScreen(s);assert.match(html,/Chapitre \d+ terminé/);assert.match(html,/Protection :/);assert.match(html,/Tous les chapitres/);assert.match(html,s.ended==='victory'?/VICTOIRE COLLECTIVE/:/DÉFAITE COLLECTIVE/);assert.doesNotMatch(html,/data-cmd="new"/);}
 }
 assert.ok(won&&lost);
});
test('Replacing a lost operative, recovering injuries and resuming captured agents use normal rules',()=>{
 let s=createTutorialGame('command');s.agents.find(a=>a.id==='p12').status='dead';const candidate=E.recruitmentCandidates(s)[0];E.recruit(s,candidate.id);s=validateTutorialGame(s);E.advance(s);E.advance(s);s=validateTutorialGame(s);assert.ok(E.team(s).some(a=>a.id===candidate.id));assert.equal(E.team(s).length,4);
 const wounded=createTutorialGame('allies'),iris=wounded.agents.find(a=>a.id==='p0');iris.status='injured';assert.ok(tutorialObjective(wounded).orders.some(o=>o.agentId==='p0'&&o.type==='travel'&&o.target==='FR'));
 const captive=createTutorialGame('allies');captive.agents.find(a=>a.id==='p12').status='captured';assert.ok(tutorialObjective(captive).orders.some(o=>o.type==='rescue'&&o.target==='p12'));assert.doesNotThrow(()=>validateTutorialGame(captive));
});
test('Saved NPC chapters cannot change participants or human controllers, and preserve independent progress',()=>{
 for(const mutate of [s=>delete s.factions.GB,s=>s.humanFactions=['FR','GB'],s=>s.seed++,s=>s.aiDifficulty='easy',s=>s.plots.pop()]){const s=createTutorialGame('command');mutate(s);assert.throws(()=>validateTutorialGame(s));}
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};let p=readTutorialProgress(storage);
 for(const id of ['contact','allies','network','command'])p=saveTutorialProgress(storage,id==='contact'?createTutorialGame(id):play(createTutorialGame(id)),p);
 const restored=readTutorialProgress(storage);assert.equal(restored.warning,false);assert.deepEqual(restored.completed,['allies','network','command']);assert.equal(restored.sessions.contact.turn,1);assert.ok(JSON.stringify(restored).length<4500000);
});
test('The guide displays only player agents, keeps recruitment enabled and never promises guaranteed late operations',()=>{
 const s=createTutorialGame('allies'),html=tutorialGuide(s);assert.equal((html.match(/<li title=/g)||[]).length,4);assert.doesNotMatch(html,/GB-0/);assert.match(gameShell(s,'world',''),/--training-agents:4/);
 const recruit={dataset:{cmd:'recruit'},disabled:false};markTutorialControls({querySelectorAll:q=>q.includes('[data-cmd="recruit"]')?[recruit]:[],querySelector:()=>null},s);assert.equal(recruit.disabled,false);
 const menu=tutorialMenu({sessions:{},completed:[]});assert.match(menu,/Quinze chapitres/);assert.match(menu,/3 PNJ/);assert.doesNotMatch(menu,/ne sont pas encore jouables/);
 assert.match(tutorialRiskNote(createTutorialGame('command')),/risques de la campagne/);
});

test('A pending replacement proof does not suggest arrest after a forgery is rejected',()=>{
 const s=createTutorialGame('allies'),f=s.factions.FR;f.known.s0.prepared=true;f.known.s0.locationUntil=10;f.authorized.TR=true;
 f.evidence=[{id:'s0-e0',verified:true,contested:false},{id:'s0-e1',verified:false,contested:true}];
 E.assign(s,'p12','collect','s0');
 assert.ok(!tutorialObjective(s).orders.some(o=>o.type==='arrest'&&o.target==='s0'));
});

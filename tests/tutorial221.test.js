import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {TUTORIAL_MISSIONS,createTutorialGame,tutorialObjective,validateTutorialGame} from '../dist/client/tutorial.js';
import {tutorialMenu} from '../dist/client/tutorial-ui.js';
test('Six short modules complete through real engine orders and reload at every turn',()=>{
 assert.equal(TUTORIAL_MISSIONS.length,6);
 assert.equal(TUTORIAL_MISSIONS.reduce((n,m)=>n+parseInt(m.duration),0),19);
 for(const m of TUTORIAL_MISSIONS){
  let s=validateTutorialGame(createTutorialGame(m.id));
  for(let i=0;i<15&&!tutorialObjective(s).done;i++){
   const o=tutorialObjective(s);
   if(m.id==='recovery'&&!s.campaignStats?.support?.FR?.government?.funding?.count)E.requestGovernmentFavor(s,'funding');
   for(const x of o.orders){
    if(s.agents.find(a=>a.id===x.agentId)?.task)continue;
    const opt=E.options(s,x.agentId,x.type,x.target);
    assert.equal(opt.error,null,`${m.id} T${s.turn}: ${JSON.stringify(x)}`);
    E.assign(s,x.agentId,x.type,x.target);
    s=validateTutorialGame(s);
   }
   E.advance(s);s=validateTutorialGame(s);
  }
  assert.equal(tutorialObjective(s).done,true,`${m.id} T${s.turn}`);
  if(m.id==='simulation'){assert.equal(s.turn,11);assert.ok(Object.values(s.campaignStats.factions.GB).some(r=>r.count>0));}
  else assert.ok(s.turn<=4,`${m.id} should need at most three resolutions`);
  assert.throws(()=>E.advance(s),/Exercice terminé/);
 }
});
test('Menu exposes only six modules and current timings',()=>{
 const html=tutorialMenu({sessions:{},completed:[]});
 assert.equal((html.match(/class="training-mission"/g)||[]).length,6);
 assert.match(html,/19 minutes/);assert.doesNotMatch(html,/Quinze|chapitre 14/);
});

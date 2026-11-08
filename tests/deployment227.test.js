import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as E from '../dist/client/engine.js';
import {DEFAULT_TEAM_IDS,COUNTRY} from '../dist/client/data.js';
import {agentTravelDestinations,agentTravelPickerMarkup,deploymentPickerMarkup,assignDeployment} from '../dist/client/deployment.js';
const fresh=()=>E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,227);
test('Deployment mode switch preserves eligible checks, recalculates forecasts and stages nothing',()=>{
 const s=fresh(),[a,b]=E.team(s);b.status='captured';const before=JSON.stringify(s);
 for(const type of ['travel','sneak']){
  const html=deploymentPickerMarkup(s,type,'JP',[a.id,b.id]);const plan=E.options(s,a.id,type,'JP');
  assert.match(html,new RegExp(`value="${type}" selected`));assert.match(html,new RegExp(`${plan.duration} tour\\(s\\) · ${plan.fatigue} énergie.*${plan.chance} %`));
  const inputs=[...html.matchAll(/<input[^>]+>/g)].map(m=>m[0]);assert.match(inputs.find(i=>i.includes(`value="${a.id}"`)),/checked/);assert.doesNotMatch(inputs.find(i=>i.includes(`value="${b.id}"`)),/checked/);
  assert.match(html,/<option value="sneak"[^>]*>Passage clandestin<\/option>/);
  assert.match(html,/1 agent sélectionné/);assert.match(html,/Déployer 1 agent/);assert.equal(JSON.stringify(s),before);
 }
});
test('Changing the dropdown rerenders the same destination with the selected agents',()=>{
 const source=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8');const handler=source.slice(source.indexOf(" if(event.target.id==='deploymentMode'||"),source.indexOf(" if(event.target.name==='deployAgent')"));
 const s=fresh(),ids=E.team(s).slice(0,2).map(a=>a.id);let html='',focused=false;
 const picker={dataset:{deploymentTarget:'JP'},querySelectorAll:()=>ids.map(value=>({value}))};
 runInNewContext('(function(){'+handler+'})()', {state:s,event:{target:{id:'deploymentMode',value:'sneak',closest:()=>picker}},deploymentPickerMarkup,showModal:v=>html=v,modal:{querySelector:()=>({focus(){focused=true;}})}});
 assert.match(html,/data-deployment-type="sneak"/);assert.match(html,/2 agents sélectionnés/);assert.ok(focused);assert.ok(E.team(s).every(a=>!a.task));
});
test('Both modes reach actual solo and multiplayer confirmation unchanged',async()=>{
 const source=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8');const fn=source.slice(source.indexOf('async function confirmDeployment('),source.indexOf('let lastAgentClick='));
 for(const type of ['travel','sneak'])for(const multi of [false,true]){
  const s=fresh(),ids=E.team(s).slice(0,2).map(a=>a.id),commands=[];
  const picker={dataset:{deploymentType:type,deploymentTarget:'JP'},querySelector:()=>({disabled:false}),querySelectorAll:()=>ids.map(value=>({value}))};
  await runInNewContext(fn+'\nconfirmDeployment()', {state:s,COUNTRY,assignDeployment,multiplayer:{active:multi,observer:false,async command(kind,payload){commands.push({kind,payload});}},modal:{querySelector:()=>picker,close(){}},stageSignal(){},persist(){},render(){},toast(){}});
  if(multi){assert.equal(commands[0].payload.type,type);assert.equal(commands[0].payload.target,'JP');}
  else for(const id of ids)assert.equal(s.agents.find(a=>a.id===id).task.type,type);
 }
});

test('Agent travel opens the common deployment picker with the agent already checked',()=>{
 const s=fresh(),[a,b]=E.team(s);a.country='JP';
 const destinations=agentTravelDestinations(s,a.id);
 assert.ok(destinations.some(x=>x.country.id==='FR'));
 assert.ok(destinations.every(x=>x.country.id!=='JP'&&(!x.country.power||x.country.id==='FR')));
 const choice=destinations.find(row=>!row.travel.error||!row.sneak.error);
 const html=agentTravelPickerMarkup(s,a.id);
 assert.equal(html,deploymentPickerMarkup(s,choice.travel.error?'sneak':'travel',choice.country.id,[a.id],a.id));
 assert.match(html,/Choisir un agent.*id="deploymentDestination".*Avec passeport.*Passage clandestin/);
 assert.match(html,new RegExp(`name="deployAgent" value="${a.id}" [^>]*checked`));
 assert.match(html,new RegExp(`name="deployAgent" value="${b.id}"`));
 E.assign(s,a.id,'hide');
 assert.match(agentTravelPickerMarkup(s,a.id),/data-cmd="confirm-deployment" disabled/);
});

test('Changing the destination from agent travel keeps eligible agents selected',()=>{
 const source=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8');
 const handler=source.slice(source.indexOf(" if(event.target.id==='deploymentMode'||"),source.indexOf(" if(event.target.name==='deployAgent')"));
 const s=fresh(),[a,b]=E.team(s);b.country='JP';
 const picker={dataset:{deploymentAgent:a.id,deploymentType:'sneak'},querySelectorAll:()=>[a,b].map(({id})=>({value:id}))};
 let html='';
 runInNewContext('(function(){'+handler+'})()', {state:s,event:{target:{id:'deploymentDestination',value:'JP',closest:()=>picker}},deploymentPickerMarkup,showModal:v=>html=v,modal:{querySelector:()=>null}});
 assert.match(html,/data-deployment-type="sneak" data-deployment-target="JP"/);
 assert.match(html,/value="JP" selected/);
 assert.match(html,new RegExp(`name="deployAgent" value="${a.id}" [^>]*checked`));
 assert.match(html,new RegExp(`name="deployAgent" value="${b.id}" disabled[^>]*(?<!checked)>`));
 assert.match(html,/1 agent sélectionné/);
 assert.ok(E.team(s).every(agent=>!agent.task));
});

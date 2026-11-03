import test from 'node:test';import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {incidentRates,incidentDescription} from '../dist/client/incident-rules.js';
import {ACTIONS} from '../dist/client/data.js';
import {readFileSync} from 'node:fs';
const cases=[['arrest',false,.5,.4,.1],['arrest',true,.5,.35,.15],['sneak',false,.5,.35,.15],['rescue',false,.5,.4,.1],['findSafehouse',false,.75,.2,.05],['equip',false,.75,.175,.075],['intimidate',false,.75,.2,.05]];
function fixture(seed,type,clandestine){
 const s=E.createGame('FR',['p0','p12','p13','p14'],seed,'bb2');s.humanFactions=Object.keys(s.factions);s.plots=[];s.fracture.cells.forEach(c=>c.resources=0);for(const a of s.agents)a.talents=['enquete','informatique','surveillance'];
 const [a,v]=E.team(s),t=s.suspects[0],f=s.factions.FR;a.country=t.country='DE';a.weapon=false;a.exposure=0;
 f.known[t.id]={country:'DE',identified:true,prepared:true,locationUntil:30};f.access.DE=true;f.authorized.DE=!clandestine;f.cooperation.DE=2;
 f.evidence=s.proofs.filter(p=>p.suspect===t.id&&p.authentic).slice(0,2).map(p=>({id:p.id,verified:true,contested:false}));
 let target=['arrest','intimidate'].includes(type)?t.id:null;
 if(type==='rescue'){v.status='captured';v.country='DE';target=v.id;}if(type==='sneak'){a.country='FR';target='DE';}
 return {s,a,v,t,f,target};
}
for(const [type,clandestine,safe,injury,capture]of cases)test(`217 failed ${type} ${clandestine?'without mandate':''}: rates, forecast, real resolution, exposure and no gains`,()=>{
 assert.deepEqual(incidentRates(type,clandestine),{safe,injury,capture});
 const counts={ready:0,injured:0,captured:0,dead:0};
 for(let seed=1;seed<=1000;seed++){
  const {s,a,v,t,f,target}=fixture(seed,type,clandestine);
  const forecast=E.operationForecast(s,a.id,type,target);assert.ok(forecast.risk.includes(incidentDescription(type,clandestine)));assert.match(forecast.risk,/En cas d’échec/);
  assert.equal(E.options(s,a.id,type,target).error,null);
  E.assign(s,a.id,type,target);a.task.chance=0;a.task.remaining=1;
  const proofs=f.evidence.length,clone=seed===1?JSON.parse(JSON.stringify(s)):null;
  E.advance(s);if(clone){E.advance(clone);assert.deepEqual(s,clone);E.validateSave(clone);}
  counts[a.status]++;assert.equal(a.task,null);assert.equal(a.exposure,type==='sneak'?10:type==='intimidate'?20:18);
  assert.equal(a.country,type==='sneak'&&a.status!=='captured'?'FR':'DE');assert.equal(f.evidence.length,proofs);assert.equal(t.arrested,false);assert.equal(a.weapon,false);
  if(type==='findSafehouse')assert.equal(E.hasSafehouse(s,'FR','DE'),false);if(type==='rescue')assert.equal(v.status,'captured');
 }
 assert.equal(counts.dead,0);for(const [status,p]of Object.entries({ready:safe,injured:injury,captured:capture}))assert.ok(Math.abs(counts[status]/1000-p)<.04,JSON.stringify(counts));
});
test('217 ordinary failures stay free of injuries and current help no longer advertises lethal risks',()=>{
 assert.equal(incidentRates('collect'),null);assert.equal(incidentRates('protect'),null);
 for(const type of ['findSafehouse','equip','intimidate','arrest','sneak','rescue'])assert.match(ACTIONS[type].desc,/Aucun décès/);
 const wiki=readFileSync(new URL('../dist/client/wiki.js',import.meta.url),'utf8');assert.doesNotMatch(wiki,/3,5 % décès|Décès','Définitif|capture ou décès possible/);
 const engine=readFileSync(new URL('../dist/client/engine.js',import.meta.url),'utf8');assert.doesNotMatch(engine,/\.status\s*=\s*['"]dead['"]/);
});

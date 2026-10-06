import {SUSPECTS} from '../dist/client/data.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {locationActions} from '../dist/client/presentation.js';
import {contributors,foreignProgress,evidenceRegister} from '../dist/client/command-ui.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p1','p2','p3'],47);for(const t of s.suspects)t.country=SUSPECTS.find(x=>x.id===t.id).country;for(const f of Object.values(s.factions))for(const [id,k] of Object.entries(f.known))k.country=s.suspects.find(t=>t.id===id).country;return s;};
const finish=(s,a)=>{a.task.chance=100;while(a.task){if(s.event)E.answerEvent(s,1);E.advance(s);}};
const add=(s,id,verified=false)=>{s.proofs.find(p=>p.id===id).foundBy='FR';s.factions.FR.evidence.push({id,verified,contested:false,collectedBy:'FR',verifiedBy:verified?'FR':null});};
test('Recovery orders restore requested energy while retaining different exposure reductions',()=>{
 for(const [type,country,recovery,exposure] of [['rest','FR',50,20],['fieldRest','DE',30,15],['hide','DE',10,35]]){const s=fresh(),a=s.agents[0];a.country=country;a.safehouses=['DE'];a.fatigue=80;a.exposure=70;E.assign(s,a.id,type);finish(s,a);assert.equal(a.fatigue,80-recovery);assert.equal(a.exposure,70-exposure);assert.equal(s.operationReports[0].fatigue,-recovery);}
});
test('Legal safehouse bonus, armed action filtering and exposure acquisition are consistent',()=>{
 const s=fresh(),a=s.agents[1];a.country='DE';a.stats[2]=5;a.cover='Clandestine';const base=E.options(s,a.id,'findSafehouse').chance;a.cover='Légale';assert.equal(E.options(s,a.id,'findSafehouse').chance,base+15);
 assert.ok(locationActions(a,s).some(([id])=>id==='equip'));assert.match(E.options(s,a.id,'equip').error,/arme/);assert.throws(()=>E.assign(s,a.id,'equip'));a.weapon=false;a.exposure=7;assert.ok(locationActions(a,s).some(([id])=>id==='equip'));E.assign(s,a.id,'equip');finish(s,a);assert.equal(a.weapon,true);assert.equal(a.exposure,15);
});
test('Field targets constrain both UI and engine; drone explores without one',()=>{
 const s=fresh(),a=s.agents[1];a.country='JP';a.weapon=false;for(const id of ['hack','prepare','arrest']){assert.ok(!locationActions(a,s).some(([x])=>x===id));assert.ok(E.options(s,a.id,id,'s0').error);}assert.ok(!locationActions(a,s).some(([id])=>id==='blackmail'));assert.throws(()=>E.assign(s,a.id,'blackmail','s0'));
 assert.equal(E.options(s,a.id,'drone',null).error,null);E.assign(s,a.id,'drone');finish(s,a);assert.equal(s.factions.FR.access.JP,true);assert.equal(s.factions.FR.known.s2.identified,true);assert.equal(s.factions.FR.known.s2.identityBy,'FR');assert.ok(locationActions(a,s).some(([id])=>id==='hack'));assert.equal(E.options(s,a.id,'hack','s2').error,null);a.country='FR';assert.ok(E.options(s,a.id,'hack','s2').error);assert.ok(!locationActions(a,s).some(([id])=>id==='hack'));
 const empty=fresh(),b=empty.agents[1];b.country='GB';const before=Object.keys(empty.factions.FR.known);E.assign(empty,b.id,'drone');finish(empty,b);assert.deepEqual(Object.keys(empty.factions.FR.known),before);assert.equal(empty.factions.FR.access.GB,true);
});
test('HQ cyber support is national, geographic, time-limited and never grants evidence',()=>{
 const s=fresh(),a=s.agents[0],b=s.agents[1];b.country='DE';b.stats[0]=5;s.factions.FR.access.DE=true;const before=E.options(s,b.id,'collect','s0').chance;
 E.assign(s,a.id,'cyberSupport','DE');finish(s,a);assert.deepEqual(s.factions.FR.cyberSupport.DE,{from:2,until:4,cost:0});assert.equal(s.factions.FR.evidence.length,0);assert.equal(E.options(s,b.id,'collect','s0').chance,before+10);
 assert.ok(!E.options(s,s.agents.find(x=>x.faction==='US').id,'counter').explanations.some(x=>x.includes('Soutien')));
 assert.equal(E.options(s,b.id,'cyberSupport','DE').error,'Cette action se prépare au QG, dans votre pays.');s.turn=5;assert.equal(E.options(s,b.id,'collect','s0').chance,before);
});
test('Queued reinforcement refunds and confidence threshold raises income',()=>{
 const s=fresh(),a=s.agents[1],f=s.factions.FR;f.budget=20;a.country='DE';a.stats[1]=5;const base=E.options(s,a.id,'authorize').chance;assert.equal(E.options(s,a.id,'authorize',null,true).chance,base+10);E.assign(s,a.id,'authorize',null,true);assert.equal(f.budget,14);assert.equal(a.task.bonusCredits,6);E.cancel(s,a.id);assert.equal(f.budget,20);E.assign(s,a.id,'authorize',null,true);finish(s,a);assert.equal(f.influence,undefined);
 s.turn=3;f.confidence=60;f.budget=6;E.requestGovernmentFavor(s,'funding');assert.equal(f.confidence,45);assert.equal(f.budget,11);assert.throws(()=>E.requestGovernmentFavor(s,'funding'));f.budget=0;if(s.event)E.answerEvent(s,1);E.advance(s);assert.equal(f.budget,2);f.confidence=90;f.budget=0;s.event=null;E.advance(s);assert.equal(f.budget,3);
});
test('Targeted verification reserves one piece and records the verifying country independently of discovery',()=>{
 const s=fresh(),a=s.agents[0];add(s,'s0-e0');add(s,'s1-e0');E.assign(s,a.id,'analyze','s1-e0');assert.equal(E.analysisAgent(s,'FR','s1-e0').id,a.id);assert.throws(()=>E.assign(s,'p2','analyze','s1-e0'));assert.match(evidenceRegister(s),/EN VÉRIFICATION/);finish(s,a);assert.equal(s.factions.FR.evidence[0].verified,false);assert.equal(s.factions.FR.evidence[1].verified,true);assert.equal(s.factions.FR.evidence[1].verifiedBy,'FR');assert.equal(s.factions.FR.confidence,25);assert.equal(s.factions.FR.influence,undefined);
 assert.throws(()=>E.share(s,'US'),/désactivés/);assert.match(contributors(s,{id:'s1'}),/France/);
});
test('Removed exchanges do not reveal foreign progress',()=>{const s=fresh(),before=JSON.stringify(s);assert.throws(()=>E.share(s,'US'),/désactivés/);assert.equal(JSON.stringify(s),before);assert.equal(E.publicState(s).foreignIntel.US,undefined);});
test('Older saves recover new fields and refund retired actions once; malformed new fields are rejected',()=>{
 const s=fresh();delete s.operationsRules;for(const f of Object.values(s.factions))for(const key of ['confidence','influence','lobbiedTurn','cyberSupport','foreignIntel'])delete f[key];s.agents[0].task={type:'hack',target:'s0',origin:'FR',remaining:1,total:2,cost:4,chance:70,fatigue:12,queued:false};const before=s.factions.FR.budget;E.validateSave(s);assert.equal(s.agents[0].task,null);assert.equal(s.factions.FR.budget,before+4);assert.equal(s.factions.FR.confidence,20);E.validateSave(s);assert.equal(s.factions.FR.budget,before+4);s.factions.FR.internalInfluenceUses=-1;assert.throws(()=>E.validateSave(s));
});

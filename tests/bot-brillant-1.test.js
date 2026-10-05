import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {playerView} from '../dist/client/multiplayer-core.js';
function fixture(){
 const s=E.createGame('FR',['p15','p12','p0','p20'],55,'bb1'),f=s.factions.FR,m=E.team(s,'FR'),t=s.suspects[0];
 s.plots=[];f.budget=0;f.confidence=0;f.known={[t.id]:{country:'DE',identified:true,intimidated:true,prepared:true,locationUntil:5}};
 f.evidence=s.proofs.filter(p=>p.suspect===t.id).slice(0,2).map(p=>({id:p.id,verified:true,contested:false}));f.access.DE=true;f.authorized.DE=true;f.cooperation.DE=4;
 for(const a of m){a.country='DE';a.task=null;a.stats=[9,9,9];a.fatigue=a.exposure=0;a.chief=false;a.talents=[];a.status='ready';}
 m[0].country='FR';m[0].stats=[10,6,3];
 return {s,f,m,t};
}
test('BB1 takes a shared protection and decisions do not change with crisis urgency',()=>{
 const {s,f,m}=fixture();f.known={};f.evidence=[];s.plots=[{id:'p-test',country:'DE',cell:0,turn:2,resolved:false}];
 for(const ff of Object.values(s.factions))if(ff.id!=='FR')ff.defense.DE=4;
 const high=structuredClone(s);high.crisis=80;E.planFaction(s,'FR');E.planFaction(high,'FR');
 assert.ok(m.some(a=>a.task?.type==='protect'));assert.deepEqual(m.map(a=>a.task),E.team(high,'FR').map(a=>a.task));assert.equal(m.filter(a=>a.task?.type==='protect').length,1);
});
test('BB1 arrests now on last valid location, without spending on a relay',()=>{
 const {s,f,m,t}=fixture();f.known[t.id].locationUntil=1;f.budget=3;E.planFaction(s,'FR');assert.ok(m.some(a=>a.task?.type==='arrest'));assert.equal(f.budget,3);
});
test('BB1 delays cell closure once to collect an already covered attack',()=>{
 const {s,f,m,t}=fixture();s.suspects.find(x=>x.cell===t.cell&&x.id!==t.id).arrested=true;s.plots=[{id:'harvest',cell:t.cell,country:'DE',turn:1,resolved:false}];f.defense.DE=3;
 E.planFaction(s,'FR');assert.equal(m.some(a=>a.task?.type==='arrest'),false);assert.equal(f.bb1.delayed[t.id],1);assert.ok(f.bb1.decisions.some(d=>d.type==='delay'));
 s.turn=2;s.plots[0].resolved=true;for(const a of m)a.task=null;E.planFaction(s,'FR');assert.ok(m.some(a=>a.task?.type==='arrest'));
});
test('A current public rival sighting prevents delaying an arrest',()=>{
 const {s,f,m,t}=fixture();s.suspects.find(x=>x.cell===t.cell&&x.id!==t.id).arrested=true;s.plots=[{id:'harvest',cell:t.cell,country:'DE',turn:1,resolved:false}];f.defense.DE=3;f.publicAgents.rival={name:'Rival',faction:'US',country:'DE',turn:1};E.planFaction(s,'FR');assert.ok(m.some(a=>a.task?.type==='arrest'));assert.equal(f.bb1.delayed[t.id],undefined);
});
test('BB1 can prepare and localize a dossier with complementary agents in one turn',()=>{
 const {s,f,m,t}=fixture();f.known[t.id].prepared=false;f.known[t.id].locationUntil=0;E.planFaction(s,'FR');assert.ok(m.some(a=>a.task?.type==='prepare'));assert.ok(m.some(a=>['surveil','drone'].includes(a.task?.type)));assert.equal(m.filter(a=>a.task?.type==='prepare').length,1);
});
test('BB1 assigns two verifiers when two home agents and proofs are available',()=>{
 const {s,f,m}=fixture();m[1].country='FR';f.evidence.forEach(e=>e.verified=false);E.planFaction(s,'FR');const tasks=m.filter(a=>a.task?.type==='analyze').map(a=>a.task.target);assert.equal(new Set(tasks).size,2);
});
test('BB1 never uses true proof authenticity, hidden suspect positions or rival orders',()=>{
 const {s}=fixture(),other=structuredClone(s);other.proofs.forEach(p=>p.authentic=!p.authentic);other.suspects.forEach(t=>t.country='JP');
 for(const a of other.agents.filter(a=>a.faction!=='FR')){a.country='DE';a.task={type:'arrest',target:'s0',remaining:1};}
 E.planFaction(s,'FR');E.planFaction(other,'FR');assert.deepEqual(E.team(s,'FR').map(a=>a.task),E.team(other,'FR').map(a=>a.task));assert.deepEqual(s.factions.FR.bb1,other.factions.FR.bb1);
});
test('BB1 respects occupied technology slots and spends no boost at capped odds',()=>{
 const {s,f,m}=fixture();f.budget=18;f.tech=[{type:'ai',country:'FR',until:3},{type:'relay',country:'FR',until:3}];E.planFaction(s,'FR');assert.ok(E.getTechSlots(s,'FR')<=2);assert.ok(m.filter(a=>a.task?.chance>=90).every(a=>!a.task.bonusCredits));
});
test('BB1 decision memory survives save but stays private during multiplayer',()=>{
 const s=E.createGame('FR',['p15','p12','p0','p20'],901,'bb1');E.planFaction(s,'US');const restored=E.validateSave(structuredClone(s));assert.deepEqual(restored.factions.US.bb1,s.factions.US.bb1);assert.equal(playerView({game:s,offers:[]},'FR').factions.US.bb1,undefined);
});
test('Six BB1 bots produce legal reproducible campaigns and bounded decision memories',()=>{
 const run=()=>{const s=E.createGame('FR',['p15','p12','p0','p20'],901,'bb1');s.humanFactions=[];while(!s.ended){E.advance(s);E.validateSave(structuredClone(s));for(const f of Object.values(s.factions))assert.ok(f.bb1.decisions.length<=11);}return s;};assert.deepEqual(run(),run());
});

test('BB1 accepts a low-probability last-turn arrest but prepares the same risk when time remains',()=>{
 const build=turn=>{const {s,f,m,t}=fixture();s.turn=turn;f.known[t.id].locationUntil=turn;f.authorized.DE=false;f.cooperation.DE=0;for(const a of m)a.task={type:'rest',remaining:1};const a=m[1];a.task=null;a.stats=[9,9,5];a.talents=[];a.weapon=false;if(turn<30)f.known[t.id].locationUntil=turn+5;return {s,f,a,t};};
 const last=build(30),early=build(10);const p=E.options(last.s,last.a.id,'arrest',last.t.id).chance;assert.ok(p<35&&p>=20);
 E.planFaction(last.s,'FR');E.planFaction(early.s,'FR');assert.equal(last.a.task.type,'arrest');assert.equal(early.a.task.type,'authorize');
});
test('Credits promised to a protector are not spent on a secondary operation during transit',()=>{
 const {s,f,m,t}=fixture();s.turn=2;f.budget=8;f.evidence=[];f.known[t.id].prepared=false;f.known[t.id].intimidated=false;
 const traveler=m[3];traveler.country='FR';traveler.task={type:'travel',target:'BR',remaining:1};
 f.bb1={version:2,plans:{[traveler.id]:{key:'protect:reserve',type:'protect',country:'BR',deadline:4,reserved:6,started:1}},delayed:{}};
 for(const a of m.slice(0,3)){a.stats=[7,7,7];a.talents=[];}
 E.planFaction(s,'FR');assert.ok(f.budget>=4);assert.equal(traveler.task.type,'travel');
});
test('Hidden opponent dossiers and future random seed cannot change a BB1 decision',()=>{
 const {s}=fixture(),copy=structuredClone(s);copy.seed=429;for(const f of Object.values(copy.factions).filter(f=>f.id!=='FR')){f.evidence=[];f.known={};f.budget=0;}
 E.planFaction(s,'FR');E.planFaction(copy,'FR');assert.deepEqual(E.team(s,'FR').map(a=>a.task),E.team(copy,'FR').map(a=>a.task));
});

test('BB1 pays for logistics to shorten a useful long trip through the real engine',()=>{
 const {s,f,m,t}=fixture();f.budget=3;f.known[t.id].country='JP';
 m.forEach(a=>{a.task={type:'rest',remaining:1};});const a=m[1];a.task=null;a.country='BR';
 assert.equal(E.options(s,a.id,'travel','JP').duration,2);
 E.planFaction(s,'FR');assert.equal(a.task.type,'travel');assert.equal(a.task.target,'JP');assert.equal(a.task.total,1);assert.equal(f.budget,0);assert.ok(f.tech.some(t=>t.type==='logistics'&&t.used));
});

test('BB1 refreshes a location expiring during parallel preparation',()=>{
 const {s,f,m,t}=fixture();f.known[t.id].prepared=false;f.known[t.id].locationUntil=s.turn;
 E.planFaction(s,'FR');assert.ok(m.some(a=>a.task?.type==='prepare'));assert.ok(m.some(a=>['surveil','drone'].includes(a.task?.type)));
});

test('BB1 verifies the first proof of a new dossier before a redundant verification',()=>{
 const {s,f,m,t}=fixture();const second=s.suspects.find(x=>x.id!==t.id);
 f.known[second.id]={country:'DE',prepared:false,locationUntil:0};
 const newProof=s.proofs.find(p=>p.suspect===second.id);
 f.evidence[1].verified=false;f.evidence.push({id:newProof.id,verified:false,contested:false});
 for(const a of m.slice(1))a.task={type:'rest',remaining:1};
 E.planFaction(s,'FR');assert.equal(m[0].task.type,'analyze');assert.equal(m[0].task.target,newProof.id);
});

function passageFixture(){
 const {s,f,m}=fixture(),t=s.suspects.find(t=>t.cell===3);
 f.known={[t.id]:{country:'DE',identified:true,intimidated:true,prepared:true,locationUntil:5}};
 f.evidence=s.proofs.filter(p=>p.suspect===t.id).slice(0,2).map(p=>({id:p.id,verified:true,contested:false}));
 f.budget=12;f.authorized.DE=false;f.cooperation.DE=0;
 for(const a of m){a.country='FR';a.task={type:'rest',remaining:1};}
 const a=m[1];a.task=null;a.templateId='p14';a.stats=[4,7,9];a.talents=['combat','endurance','infiltration'];a.exposure=35;a.weapon=true;
 return {s,f,m,t,a};
}
test('BB1 can choose a boosted clandestine passage when the retained weapon and discretion improve the dossier',()=>{
 const {s,f,a}=passageFixture();E.planFaction(s,'FR');
 assert.equal(a.task.type,'sneak');assert.equal(a.task.target,'DE');assert.equal(a.task.chance,90);assert.equal(a.task.cost,6);
 assert.equal(f.budget,6);assert.equal(f.bb1.plans[a.id].type,'case');assert.ok(Number.isFinite(f.bb1.decisions.find(d=>d.agent===a.id).utility));
});
test('Clandestine travel remains conditional on its benefit, the real odds and the budget',()=>{
 for(const change of [({a})=>{a.weapon=false;},({a})=>{a.exposure=0;},({a})=>{a.stats[2]=4;},({a})=>{a.fatigue=41;},({f})=>{f.budget=0;},({f})=>{f.authorized.DE=true;f.cooperation.DE=4;}]){
  const scenario=passageFixture();change(scenario);E.planFaction(scenario.s,'FR');assert.equal(scenario.a.task.type,'travel');
 }
});
test('The passage comparison accounts for faster passport logistics',()=>{
 const {s,f,a,t}=passageFixture();a.country='BR';f.known[t.id].country='JP';
 E.planFaction(s,'FR');assert.equal(a.task.type,'travel');assert.equal(a.task.total,1);assert.equal(a.task.target,'JP');assert.ok(f.tech.some(t=>t.type==='logistics'&&t.used));
});
test('A clandestine traveler already counts toward the agents allocated to its destination',()=>{
 const {s,f,m}=fixture();m[1].country='BR';m[1].weapon=false;
 m[0].task={type:'rest',remaining:1};m[2].country='FR';m[2].task={type:'sneak',target:'DE',remaining:1};m[3].task={type:'rest',remaining:1};
 E.planFaction(s,'FR');assert.equal(m[1].task,null);assert.equal(m[2].task.type,'sneak');
});
test('A clandestine protector keeps the funding reserved during transit',()=>{
 const {s,f,m,t}=fixture();s.turn=2;f.budget=8;f.evidence=[];f.known[t.id].prepared=false;f.known[t.id].intimidated=false;
 const traveler=m[3];traveler.country='FR';traveler.task={type:'sneak',target:'BR',remaining:1};
 f.bb1={version:2,plans:{[traveler.id]:{key:'protect:reserve',type:'protect',country:'BR',deadline:4,reserved:6,started:1}},delayed:{}};
 for(const a of m.slice(0,3)){a.stats=[7,7,7];a.talents=[];}
 E.planFaction(s,'FR');assert.ok(f.budget>=4);assert.equal(traveler.task.type,'sneak');
});
test('The clandestine comparison cannot inspect hidden positions, authenticity, rival orders or future rolls',()=>{
 const {s}=passageFixture(),other=structuredClone(s);other.seed=991;other.proofs.forEach(p=>p.authentic=!p.authentic);other.suspects.forEach(t=>t.country='BR');
 for(const a of other.agents.filter(a=>a.faction!=='FR')){a.country='DE';a.task={type:'arrest',target:'s6',remaining:1};}
 E.planFaction(s,'FR');E.planFaction(other,'FR');assert.deepEqual(E.team(s,'FR').map(a=>a.task),E.team(other,'FR').map(a=>a.task));assert.deepEqual(s.factions.FR.bb1,other.factions.FR.bb1);
});

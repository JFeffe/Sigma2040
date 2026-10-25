import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';

function fixture(){
 const s=E.createGame('FR',['p0','p12','p13','p14'],42,'normal'),f=s.factions.US,m=E.team(s,'US'),t=s.suspects[0];
 s.plots=[{id:'test-threat',cell:0,country:'DE',turn:3,kind:'Test',resolved:false}];s.crisis=12;
 f.known={[t.id]:{country:'DE',identified:true,intimidated:true,locationUntil:0,prepared:false}};
 f.budget=0;f.confidence=0;f.access.DE=f.authorized.DE=true;t.country='DE';
 f.evidence=[{id:s.proofs.find(p=>p.suspect===t.id&&p.authentic).id,verified:true,contested:false}];
 for(const a of m){a.country='DE';a.task={type:'rest',remaining:1};a.chief=false;a.stats=[6,8,7];a.talents=[];a.fatigue=a.exposure=0;a.status='ready';}
 m[0].country='US';m[0].stats=[10,5,5];m[0].task=null;m[1].task=null;
 return {s,f,m,t,a:m[1]};
}
test('Normal continues a verified local dossier instead of a noncritical competing protection',()=>{
 const {s,a,t}=fixture();E.planFaction(s,'US');assert.equal(a.task.type,'hack');assert.equal(a.task.target,t.id);assert.equal(a.task.bonusCredits,0);
});
test('Normal protects against a potentially fatal attack before continuing the case',()=>{
 const {s,a}=fixture();s.crisis=70;E.planFaction(s,'US');assert.equal(a.task.type,'protect');
});
test('Normal still rests when too fatigued to continue safely',()=>{
 const {s,a}=fixture();a.fatigue=80;E.planFaction(s,'US');assert.equal(a.task.type,'findSafehouse');
});
test('Normal arrests on the last valid location turn without wasting credits on a relay',()=>{
 const {s,f,a,t}=fixture();s.plots=[];f.budget=3;
 f.evidence=s.proofs.filter(p=>p.suspect===t.id&&p.authentic).map(p=>({id:p.id,verified:true,contested:false}));
 f.known[t.id].prepared=true;f.known[t.id].locationUntil=1;
 E.planFaction(s,'US');assert.equal(a.task.type,'arrest');assert.equal(a.task.target,t.id);assert.equal(f.budget,3);assert.equal(f.tech.length,0);assert.equal(f.known[t.id].locationUntil,1);
});
test('Normal uses relay for one-turn localization of a prepared case with an expired position',()=>{
 const {s,f,a,t}=fixture();s.plots=[];f.budget=3;
 f.evidence=s.proofs.filter(p=>p.suspect===t.id&&p.authentic).map(p=>({id:p.id,verified:true,contested:false}));
 f.known[t.id].prepared=true;f.known[t.id].locationUntil=0;
 E.planFaction(s,'US');assert.equal(a.task.type,'surveil');assert.equal(a.task.total,1);assert.equal(f.budget,1);
});
test('Continuity uses observed progress only, with unchanged chances and no extra money',()=>{
 const {s,a,t}=fixture(),other=structuredClone(s),before=E.options(s,a.id,'hack',t.id);
 for(const p of other.proofs)p.authentic=!p.authentic;for(const x of other.suspects)x.country='JP';
 E.planFaction(s,'US');E.planFaction(other,'US');
 assert.deepEqual(E.team(s,'US').map(a=>a.task),E.team(other,'US').map(a=>a.task));
 assert.equal(a.task.chance,before.chance);assert.equal(a.task.fatigue,before.fatigue);assert.equal(s.factions.US.budget,0);
});

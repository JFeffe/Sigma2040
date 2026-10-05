import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
function fixture(level='normal'){
 const s=E.createGame('FR',['p0','p12','p13','p14'],42,level),f=s.factions.US,m=E.team(s,'US'),t=s.suspects[0];
 s.turn=24;s.plots=[];f.budget=7;f.confidence=30;t.country='DE';
 f.known={[t.id]:{country:'DE',identified:true,intimidated:true,prepared:true,locationUntil:30}};
 f.evidence=s.proofs.filter(p=>p.suspect===t.id).slice(0,2).map(p=>({id:p.id,verified:true,contested:false}));
 f.cooperation.DE=0;f.access.DE=true;f.authorized.DE=false;
 for(const a of m){a.country='DE';a.chief=false;a.fatigue=a.exposure=0;a.task={type:'rest',remaining:1};a.stats=[6,6,6];a.talents=[];}
 m[0].country='US';m[0].stats[0]=10;m[1].task=null;return {s,f,a:m[1],t};
}
test('Easy and Normal spend diplomacy on an advanced usable dossier; Expert retains published policy',()=>{
 for(const level of ['easy','normal','expert']){const {s,f}=fixture(level);E.planFaction(s,'US');assert.equal(f.cooperation.DE,level==='expert'?0:1);assert.equal(f.confidence,level==='expert'?30:10);}
});
test('Diplomacy respects reserves and avoids unready, already ordered or capped actions',()=>{
 for(const kind of ['reserve','unready','ordered','capped']){const {s,f,a}=fixture();if(kind==='reserve')f.confidence=29;if(kind==='unready')f.evidence=[];if(kind==='ordered')a.task={type:'rest',remaining:1};if(kind==='capped'){f.cooperation.DE=3;f.authorized.DE=true;a.stats=[10,10,10];a.talents=['combat','surveillance'];}const before=f.cooperation.DE;E.planFaction(s,'US');assert.equal(f.cooperation.DE,before,kind);assert.equal(f.lastFavor,null,kind);}
});
test('Easy and Normal prefer collection at equal chances while Expert retains its intrusion preference',()=>{
 for(const level of ['easy','normal','expert']){const {s,f,a,t}=fixture(level);f.confidence=0;f.known[t.id].prepared=false;f.evidence=f.evidence.slice(0,1);f.authorized.DE=true;a.stats=[7,7,7];a.templateId='p14';assert.equal(E.options(s,a.id,'collect',t.id).chance,E.options(s,a.id,'hack',t.id).chance);E.planFaction(s,'US');assert.equal(a.task.type,level==='expert'?'hack':'collect',level);}
});

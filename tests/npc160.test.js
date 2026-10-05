import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
function fixture(level='expert'){
 const s=E.createGame('FR',['p0','p12','p13','p14'],42,level),f=s.factions.US,m=E.team(s,'US'),t=s.suspects[0];
 s.plots=[];s.threatReports=[];f.known={};f.budget=0;f.confidence=0;f.access.DE=f.authorized.DE=true;t.country='DE';
 f.known[t.id]={country:'DE',identified:true,locationUntil:20};
 for(const a of m){a.country='DE';a.task=null;a.chief=false;a.stats=[6,6,6];a.fatigue=a.exposure=0;a.status='ready';a.talents=['combat','contacts','enquete'];}
 m[0].country='US';m[0].stats=[10,5,5];
 return {s,f,m,t};
}
test('Expert assigns a verified preparation to the tactician before an equally capable teammate',()=>{
 const {s,f,m,t}=fixture();m[2].talents=['tactique','contacts','enquete'];f.evidence=s.proofs.filter(p=>p.suspect===t.id).slice(0,2).map(p=>({id:p.id,verified:true,contested:false}));
 E.planFaction(s,'US');assert.equal(m[2].task?.type,'prepare');assert.equal(m.filter(a=>a.task?.type==='prepare').length,1);
});
test('An injured agent stays with an available local medic instead of wasting a return trip',()=>{
 const {s,m}=fixture();m[1].status='injured';m[1].fatigue=45;m[2].talents=['secours','contacts','enquete'];
 E.planFaction(s,'US');assert.ok(['hide','fieldRest'].includes(m[1].task?.type));assert.equal(m[1].country,'DE');
});
test('NPC decisions do not inspect hidden proof authenticity or hidden current suspect location',()=>{
 const {s}=fixture(),other=structuredClone(s);for(const p of other.proofs)p.authentic=!p.authentic;for(const t of other.suspects)t.country='JP';
 E.planFaction(s,'US');E.planFaction(other,'US');assert.deepEqual(E.team(other,'US').map(a=>a.task),E.team(s,'US').map(a=>a.task));
});

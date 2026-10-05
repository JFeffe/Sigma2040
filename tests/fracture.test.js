import {SUSPECTS} from '../dist/client/data.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {tickFracture,observeFracture,observeProtection,plotStage} from '../dist/client/fracture.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p1','p2','p3'],41);for(const t of s.suspects)t.country=SUSPECTS.find(x=>x.id===t.id).country;for(const f of Object.values(s.factions))for(const [id,k] of Object.entries(f.known))k.country=s.suspects.find(t=>t.id===id).country;return s;};
const tick=s=>tickFracture(s,E.random,E.log);
const target=s=>s.suspects.find(t=>t.id==='s0');
test('Fracture does not inspect secret orders, hidden evidence or unobserved protection',()=>{
 const a=fresh(),b=structuredClone(a);b.agents[0].task={type:'arrest',target:'s0'};b.factions.FR.evidence=[{id:'s0-e0',verified:true}];b.factions.FR.defense.DE=40;
 a.turn=b.turn=5;tick(a);tick(b);assert.deepEqual(a.fracture,b.fracture);assert.deepEqual(a.plots,b.plots);assert.equal(a.rng,b.rng);
});
test('Flight warns known factions, costs resources, preserves dossier and cannot repeat',()=>{
 const s=fresh(),k=s.factions.FR.known.s0;k.prepared=true;k.identified=true;k.locationUntil=8;
 observeFracture(s,0,3);tick(s);assert.equal(target(s).country,'DE');assert.equal(k.flightUntil,3);assert.equal(s.fracture.cells[0].resources,2);assert.equal(s.fracture.flights.length,1);
 assert.equal(E.visibleLogs(s).some(l=>l.text.includes('Départ en préparation')),true);
 s.turn=3;tick(s);assert.notEqual(target(s).country,'DE');assert.equal(k.country,target(s).country);assert.equal(k.prepared,true);assert.equal(k.locationUntil,0);assert.equal(k.flightUntil,undefined);
 s.turn=8;observeFracture(s,0,3);tick(s);assert.equal(s.fracture.flights.some(x=>x.id==='s0'),false);
 assert.ok(s.plots.every(p=>(p.fractureDelay||0)<=2));
});
test('An arrest on the announced departure turn stops flight',()=>{
 const s=fresh();observeFracture(s,0,3);tick(s);const a=s.agents[1],t=target(s),k=s.factions.FR.known.s0;
 s.turn=3;a.country='DE';k.identified=true;k.prepared=true;k.locationUntil=8;s.factions.FR.evidence=[{id:'s0-e0',verified:true,contested:false},{id:'s0-e1',verified:true,contested:false}];E.assign(s,a.id,'arrest','s0');a.task.chance=100;E.advance(s);
 assert.equal(t.arrested,true);assert.equal(t.country,'DE');assert.equal(s.fracture.flights.some(x=>x.id==='s0'),false);assert.equal(k.flightUntil,undefined);
});
test('Established defense can delay once; announced threat remains visible',()=>{
 const s=fresh(),p=s.plots[0];s.plots=[p];p.turn=7;p.country='DE';s.turn=4;observeProtection(s,'DE',10);tick(s);
 assert.equal(p.turn,9);assert.equal(p.adapted,true);assert.equal(p.fractureDelay,2);assert.ok(E.visiblePlots(s).includes(p));assert.equal(plotStage(s,p),'Préparation');
 s.turn=7;tick(s);assert.equal(p.turn,9);assert.equal(s.fracture.cells[0].resources,3);
});
test('PRISME reroutes with warning and cost, never relocates paid protection',()=>{
 const s=fresh(),p=s.plots[1];s.plots=[p];s.turn=8;p.turn=12;p.country='DE';s.factions.US.defense.DE=12;observeProtection(s,'DE',12);s.requests=[{plot:p.id,from:'US',status:'pending'}];tick(s);
 assert.notEqual(p.country,'DE');assert.equal(p.turn,13);assert.equal(s.fracture.cells[1].resources,2);assert.equal(s.factions.US.defense.DE,12);assert.equal(s.factions.US.defense[p.country],undefined);assert.equal(s.requests[0].status,'expired');assert.equal(s.requests[0].country,'DE');
 assert.ok(s.logs.some(l=>l.text.includes('Transfert logistique')));
});
test('Moved target cannot be collected or arrested remotely by an old mission',()=>{
 const s=fresh(),a=s.agents[1];a.country='DE';s.factions.FR.access.DE=true;E.assign(s,a.id,'collect','s0');a.task.remaining=1;a.task.chance=100;target(s).country='TR';E.advance(s);
 assert.equal(s.factions.FR.evidence.length,0);assert.equal(s.operationReports.find(r=>r.agentId===a.id).status,'INTERROMPUE');
});
test('Save migration preserves campaign, pending flight reload is deterministic and malformed state rejected',()=>{
 const s=fresh();delete s.fracture;const before=s.rng;E.validateSave(s);assert.equal(s.rng,before);assert.equal(s.fracture.cells[0].resources,4);
 observeFracture(s,0,3);tick(s);const copy=E.validateSave(structuredClone(s));s.turn=copy.turn=3;tick(s);tick(copy);assert.deepEqual(s,copy);
 const broken=structuredClone(s);broken.fracture.flights=[{id:'s6',to:'DE',turn:9}];assert.throws(()=>E.validateSave(broken));
});

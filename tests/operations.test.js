import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {CASES,OUTCOMES} from '../dist/client/intelligence.js';
import {ACTIONS} from '../dist/client/data.js';
const fresh=()=>E.createGame('FR',['p0','p1','p2','p3'],17);
const advance=s=>{if(s.event)E.answerEvent(s,1);E.advance(s);};
const proof=(s,id,verified=true)=>{s.proofs.find(p=>p.id===id).foundBy='FR';s.factions.FR.evidence.push({id,verified,contested:false});};
test('Forecast covers every action and predicts cost, end turn and actual capped fatigue',()=>{
 assert.deepEqual(Object.keys(OUTCOMES).sort(),Object.keys(ACTIONS).sort());const s=fresh();const a=s.agents[1];a.fatigue=98;
 const forecast=E.operationForecast(s,a.id,'travel','JP');assert.equal(forecast.end,2);assert.equal(forecast.fatigue,12);
 E.assign(s,a.id,'travel','JP');advance(s);advance(s);const report=s.operationReports.find(r=>r.agent===a.name);assert.equal(report.status,'RÉUSSITE');assert.equal(report.fatigue,2);assert.equal(report.cost,0);assert.equal(report.duration,2);assert.match(report.notes.join(' '),/arrivé/);
 E.validateSave(JSON.parse(JSON.stringify(s)));
});
test('Two verified independent pieces reveal a linked dossier once, raw/forged evidence does not',()=>{
 const s=fresh();s.factions.FR.known.s0={country:s.suspects[0].country,identified:false,locationUntil:0,prepared:false};delete s.factions.FR.known.s1;proof(s,'s0-e0');proof(s,'s0-e1',false);E.deduce(s,'FR');assert.equal(s.factions.FR.known.s1,undefined);
 s.factions.FR.evidence[1].verified=true;E.deduce(s,'FR');assert.ok(s.factions.FR.known.s1);assert.equal(s.factions.FR.known.s0.deduced,true);const id=s.logId;E.deduce(s,'FR');assert.equal(s.logId,id);assert.ok(CASES.s0.deduction);
});
test('Analysis rejects a forged piece and recommends new evidence; no phantom success for a second analyst',()=>{
 const s=fresh();s.proofs.find(p=>p.id==='s2-e2').authentic=false;s.factions.FR.known.s2={country:'JP',identified:true,locationUntil:0,prepared:false};s.factions.FR.access.JP=true;proof(s,'s2-e2',false);
 E.assign(s,'p0','analyze');s.agents[0].task.chance=100;assert.throws(()=>E.assign(s,'p1','analyze'));s.agents[1].task=structuredClone(s.agents[0].task);
 advance(s);assert.equal(s.factions.FR.evidence[0].contested,true);assert.equal(E.evidenceFor(s,'FR','s2').length,0);assert.equal(E.nextOperation(s,E.knownTargets(s).find(t=>t.id==='s2')).type,'collect');assert.match(s.operationReports.find(r=>r.agent==='IRIS').notes.join(' '),/Falsification/);assert.equal(s.operationReports.find(r=>r.agent==='SABLE').status,'INTERROMPUE');
});
test('Cooperation requests no longer generate or grant protection',()=>{const s=fresh();E.updateRequests(s);assert.equal((s.requests||[]).length,0);const before=JSON.stringify(s);assert.throws(()=>E.answerRequest(s,'joint',true),/désactivées/);assert.equal(JSON.stringify(s),before);});
test('Counter-intelligence reveals presence without revealing orders; old saves remain compatible',()=>{
 const s=fresh(),foreign=s.agents.find(a=>a.faction==='US');foreign.country='FR';foreign.exposure=20;foreign.cover='Clandestine';E.assign(s,'p0','counter');s.agents[0].task.chance=100;advance(s);
 assert.ok(s.factions.FR.publicAgents[foreign.id]);assert.equal(s.factions.FR.publicAgents[foreign.id].task,undefined);assert.match(s.operationReports[0].notes.join(' '),/mission inconnue/);
 delete s.requests;delete s.operationReports;E.validateSave(JSON.parse(JSON.stringify(s)));const bad=structuredClone(s);bad.requests=[{plot:'missing',from:'US',status:'pending'}];assert.throws(()=>E.validateSave(bad));
});

test('Country Hack rejects superpowers without changing state and accepts secondary countries',()=>{
 for(const country of ['FR','US','CN','IN','RU','GB']){const s=fresh();const before=JSON.stringify(s);assert.throws(()=>E.assign(s,'p0','cyberSupport',country),/pays secondaire/);assert.equal(JSON.stringify(s),before);}
 for(const country of ['CA','BR','DE','TR','ZA','JP']){const s=fresh();E.assign(s,'p0','cyberSupport',country);assert.equal(s.agents[0].task.target,country);}
});

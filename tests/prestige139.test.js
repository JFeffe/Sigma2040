import test from 'node:test';import assert from 'node:assert/strict';import * as E from '../dist/client/engine.js';
test('Each verifier earns two prestige independently of the first collector, once per country',()=>{
 let s=E.createGame('FR',['p0','p12','p13','p14'],42);s.humanFactions=Object.keys(s.factions);const p=s.proofs.find(p=>p.authentic);p.foundBy='CN';
 for(const f of ['FR','US']){const a=E.team(s,f)[0];s.factions[f].evidence=[{id:p.id,verified:false,contested:false}];E.assign(s,a.id,'analyze',p.id);a.task.chance=100;a.task.remaining=1;}
 E.advance(s);for(const f of ['FR','US']){assert.equal(s.factions[f].score,2);assert.equal(s.factions[f].confidence,25);}assert.equal(s.factions.CN.score,0);
 s=E.validateSave(structuredClone(s));const a=E.team(s)[0];s.factions.FR.evidence[0].verified=false;E.assign(s,a.id,'analyze',p.id);a.task.chance=100;E.advance(s);assert.equal(s.factions.FR.score,2);
});

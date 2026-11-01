import * as E from '../dist/client/engine.js';import * as D from '../dist/client/game-setup.js';import test from 'node:test';import assert from 'node:assert/strict';
export function fixture(){const d=D.createDraft(['FR','US'],42,'cooperative');d.humans=[];D.advanceNpcDraft(d);const s=E.createGame('FR',d.teams.FR,42,'bb2',{gameMode:'cooperative',participants:d.countries,teams:d.teams});s.humanFactions=['FR','US'];s.plots.forEach(p=>p.resolved=true);const f=s.factions.FR,m=E.team(s,'FR');for(const ff of Object.values(s.factions)){ff.budget=0;ff.confidence=0;ff.evidence.splice(0);for(const k of Object.keys(ff.known))delete ff.known[k];}for(const a of s.agents){a.task=null;a.fatigue=a.exposure=0;a.chief=false;a.weapon=false;a.country=a.faction;a.status='ready';}return {s,f,m};}
export function dossier(s,f,t,c='DE'){t.country=c;f.known[t.id]={country:c,identified:true,intimidated:true,prepared:true,locationUntil:40};f.access[c]=f.authorized[c]=true;f.cooperation[c]=2;for(const p of s.proofs.filter(p=>p.suspect===t.id&&p.authentic).slice(0,2))f.evidence.push({id:p.id,verified:true,contested:false});}



test('BB2 skips redundant verification and does not buy AI for that redundant batch',()=>{
 const {s,f,m}=fixture();dossier(s,f,s.suspects[0]);f.evidence[1].verified=false;f.budget=20;f.leadResearch.progress=0;
 for(const a of m.slice(1))E.assign(s,a.id,'rest');E.planFaction(s,'FR');
 assert.notEqual(m[0].task?.type,'analyze');assert.equal(f.tech.some(t=>t.type==='ai'),false);
});
test('BB2 still verifies a replacement when a forged proof was discarded',()=>{
 const {s,f,m}=fixture();dossier(s,f,s.suspects[0]);f.evidence[0].verified=false;f.evidence[0].contested=true;f.evidence[1].verified=false;
 for(const a of m.slice(1))E.assign(s,a.id,'rest');E.planFaction(s,'FR');
 assert.equal(m[0].task?.type,'analyze');assert.equal(m[0].task.target,f.evidence[1].id);
});
test('Cooperative BB2 elects exactly one standing verifier regardless of planning order',()=>{
 for(const order of [['FR','US'],['US','FR']]){const {s}=fixture();for(const a of s.agents){a.stats=[5,5,5];a.talents=[];}const best=E.team(s,'US')[0];best.stats[0]=10;best.talents=['enquete'];
 for(const id of order)E.planFaction(s,id);assert.equal(s.factions.FR.bb2.analyst,undefined);assert.equal(s.factions.US.bb2.analyst,best.id);}
});
test('Cooperative BB2 replaces its verifier when that agent is captured',()=>{
 const {s}=fixture();const lost=E.team(s,'US')[0];lost.stats=[10,10,10];lost.talents=['enquete','informatique'];lost.status='captured';
 for(const id of ['FR','US'])E.planFaction(s,id);const chosen=Object.values(s.factions).map(f=>f.bb2?.analyst).filter(Boolean);assert.equal(chosen.length,1);assert.notEqual(chosen[0],lost.id);
});

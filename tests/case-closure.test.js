import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {locationActions} from '../dist/client/presentation.js';

const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);
const entry=(id,verified=false,contested=false)=>({id,verified,contested,collectedBy:'FR',verifiedBy:verified?'FR':null});

test('A fully collected case cannot reserve another collection or silently turn collection into surveillance',()=>{
 const s=fresh(),a=s.agents[0],t=s.suspects.find(t=>t.id==='s0');a.country=t.country;s.factions.FR.access[t.country]=true;
 s.factions.FR.evidence=['s0-e0','s0-e1','s0-e2'].map(id=>entry(id));
 assert.match(E.options(s,a.id,'collect','s0').error,/déjà été recueillies/);
 assert.throws(()=>E.assign(s,a.id,'collect','s0'));
 // Other local dossiers, when present, can still make the action useful.
 for(const x of s.suspects.filter(x=>x.id!=='s0'))x.country='JP';
 assert.equal(locationActions(a,s).some(([id])=>id==='collect'),true);
});

test('An arrest removes unverified pieces for every country and old saves reconcile the closed case',()=>{
 const s=fresh(),a=s.agents[0],t=s.suspects.find(t=>t.id==='s0'),k=s.factions.FR.known.s0;a.country=t.country;
 Object.assign(k,{country:t.country,identified:true,prepared:true,locationUntil:5});
 s.factions.FR.evidence=[entry('s0-e0',true),entry('s0-e1'),entry('s0-e2',false,true)];
 s.factions.US.evidence=[entry('s0-e1')];
 E.assign(s,a.id,'arrest','s0');a.task.chance=100;E.advance(s);
 assert.equal(t.arrested,true);
 assert.deepEqual(s.factions.FR.evidence.map(e=>e.id),['s0-e0']);
 assert.equal(s.factions.US.evidence.some(e=>e.id==='s0-e1'),false);
 assert.equal(E.evidenceQueue(s,'FR').length,0);
 const old=structuredClone(s);old.factions.FR.evidence.push(entry('s0-e1'));
 assert.deepEqual(E.validateSave(old).factions.FR.evidence.map(e=>e.id),['s0-e0']);
});

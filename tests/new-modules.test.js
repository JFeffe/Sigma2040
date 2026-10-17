import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {playerView} from '../dist/client/multiplayer-core.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.humanFactions=Object.keys(s.factions);s.factions.FR.budget=18;return s;};
test('Localization always takes one turn; relay only prolongs valid positions',()=>{
 const s=fresh(),agents=E.team(s),t=s.suspects[0];for(const a of agents)a.country=t.country;s.factions.FR.access[t.country]=true;
 E.assign(s,agents[0].id,'surveil',t.id);const relay=E.activateTech(s,'relay');assert.equal(relay.until,2);assert.equal(agents[0].task.total,1);
 for(const a of agents.slice(1,3)){assert.equal(E.options(s,a.id,'surveil',t.id).duration,1);E.assign(s,a.id,'surveil',t.id);assert.equal(a.task.total,1);}
 assert.equal(E.options(s,agents[3].id,'hack',t.id).duration,2);assert.equal(E.options(s,agents[3].id,'drone',t.id).duration,1);assert.equal(E.techRefund(s,relay),3);
 const loaded=E.validateSave(structuredClone(s));assert.equal(loaded.agents.find(a=>a.id===agents[1].id).task.total,1);assert.equal(playerView({game:s,offers:[]},'US').factions.FR.tech.length,0);
 E.cancelTech(s,relay.id);assert.equal(agents[1].task.total,1);assert.equal(E.options(s,agents[3].id,'surveil',t.id).duration,1);assert.equal(s.factions.FR.budget,18);
});
test('Relay extends active signals once per activation and expires after two turns',()=>{
 const s=fresh(),a=E.team(s)[0],t=s.suspects[0];a.country=t.country;s.factions.FR.known[t.id].locationUntil=1;
 const r=E.activateTech(s,'relay');assert.equal(E.locationExpiry(s,'FR',t.id),3);E.cancelTech(s,r.id);assert.equal(s.factions.FR.budget,18);assert.throws(()=>E.cancelTech(s,r.id));
 const next=E.activateTech(s,'relay');s.turn=2;assert.equal(E.options(s,a.id,'surveil',t.id).duration,1);s.turn=3;assert.equal(E.options(s,a.id,'surveil',t.id).duration,1);
 next.targets={[t.id]:{country:t.country,until:1}};assert.equal(E.locationExpiry(E.validateSave(structuredClone(s)),'FR',t.id),3);
});
test('Logistics affects new passport journeys only; cancellation refunds and cancels dependent queued orders',()=>{
 const s=fresh();const base=E.options(s,'p0','travel','JP').duration;assert.ok(base>1);E.assign(s,'p0','travel','JP');const t=E.activateTech(s,'logistics');assert.equal(t.until,2);assert.equal(s.agents[0].task.total,base);assert.equal(E.options(s,'p12','sneak','JP').duration,base);for(const id of ['p12','p13']){E.assign(s,id,'travel','JP');assert.equal(s.agents.find(a=>a.id===id).task.total,base-1);}assert.equal(E.techRefund(s,t),3);E.cancelTech(s,t.id);assert.equal(s.agents.find(a=>a.id==='p12').task,null);assert.equal(E.options(s,'p14','travel','JP').duration,base);assert.equal(s.factions.FR.budget,18);
});
test('AI costs two, lasts three turns, disallows duplicates and refunds only before assignment or research effect',()=>{
 const s=fresh();const t=E.activateTech(s,'ai');assert.equal(t.cost,2);assert.equal(t.until,3);assert.throws(()=>E.activateTech(s,'ai'),/déjà actif/);E.cancelTech(s,t.id);assert.equal(s.factions.FR.budget,18);const u=E.activateTech(s,'ai');E.advance(s);assert.equal(E.techRefund(s,u),0);const loaded=E.validateSave(structuredClone(s));assert.equal(E.techRefund(loaded,loaded.factions.FR.tech[0]),0);E.advance(s);E.advance(s);assert.equal(E.getTechSlots(s,'FR'),0);
});

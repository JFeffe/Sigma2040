import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {tickFracture,observeProtection} from '../dist/client/fracture.js';
import {playerView} from '../dist/client/multiplayer-core.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.humanFactions=Object.keys(s.factions);s.turn=8;s.crisis=0;s.plots=[{id:'timing',cell:1,country:'DE',turn:12,resolved:false,kind:'Test'}];return s;};
test('Visibility opens exactly five turns ahead, including multiplayer',()=>{
 const s=fresh(),p=s.plots[0];s.turn=6;
 assert.equal(E.visiblePlots(s).length,0);assert.equal(playerView({game:s,offers:[]},'US').plots.length,0);
 s.turn=7;assert.equal(E.visiblePlots(s)[0].id,p.id);assert.equal(playerView({game:s,offers:[]},'US').plots[0].id,p.id);
 p.turn=15;p.announced=true;assert.equal(E.visiblePlots(s)[0].id,p.id);
});
test('Late protections may delay an attack, but never change its country at one to three turns',()=>{
 for(const remaining of [1,2,3]){const s=fresh(),p=s.plots[0];p.turn=s.turn+remaining;observeProtection(s,'DE',30);tickFracture(s,E.random,E.log);assert.equal(p.country,'DE');assert.equal(p.turn,8+remaining+2);}
});
test('Rerouting remains possible at four and five turns, not before announcement',()=>{
 for(const remaining of [4,5,6]){const s=fresh(),p=s.plots[0];p.turn=s.turn+remaining;observeProtection(s,'DE',s.turn+3);tickFracture(s,E.random,E.log);if(remaining<=5){assert.notEqual(p.country,'DE');assert.equal(p.adapted,true);}else assert.equal(p.country,'DE');}
});
test('Full turn transition preserves reaction time, original protection and one-time rerouting',()=>{
 const s=fresh(),p=s.plots[0];s.factions.FR.defenseBase={DE:11};s.factions.FR.defense.DE=11;observeProtection(s,'DE',11);
 E.advance(s);assert.equal(s.turn,9);assert.notEqual(p.country,'DE');assert.ok(p.turn-s.turn>=3);assert.equal(s.factions.FR.defense.DE,11);
 const dest=p.country,when=p.turn;observeProtection(s,dest,30);E.advance(s);assert.equal(p.country,dest);assert.equal(p.turn,when);
});

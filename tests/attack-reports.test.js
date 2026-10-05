import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import * as E from '../dist/client/engine.js';
import {missionCards,missionRevealMarkup,revealDelay} from '../dist/client/mission-reveal.js';
import {playerView} from '../dist/client/multiplayer-core.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p1','p2','p3'],17);s.humanFactions=Object.keys(s.factions);s.plots=[{id:'attack-test',country:'DE',turn:1,cell:0,kind:'Attaque d’infrastructure',resolved:false}];return s;};
test('Intercepted attack records exact defenders, target and image for every player, survives reload, then clears',()=>{
 const s=fresh();s.factions.FR.defense.DE=1;s.factions.US.defense.DE=1;E.advance(s);const r=s.attackReports[0];assert.equal(r.status,'INTERCEPTÉE');assert.deepEqual(r.participants,['FR','US']);assert.equal(r.country,'DE');assert.equal(r.crisisDelta,-5);assert.equal(revealDelay(r),0);
 for(const country of s.humanFactions){const view=playerView({game:s,offers:[]},country);assert.deepEqual(missionCards(view).at(-1),r);}
 const html=missionRevealMarkup(r,0,1);assert.match(html,/attack-intercepted.webp/);assert.match(html,/Allemagne/);assert.match(html,/États-Unis/);assert.doesNotMatch(html,/Chance de réussite/);
 const copy=E.validateSave(structuredClone(s));assert.deepEqual(copy.attackReports,s.attackReports);E.advance(copy);assert.deepEqual(copy.attackReports,[]);
});
test('Unprotected attacks get their own damage image, including simultaneous attacks',()=>{
 const s=fresh();s.plots.push({...s.plots[0],id:'second',country:'JP'});E.advance(s);assert.equal(s.attackReports.length,2);for(const r of s.attackReports){assert.equal(r.status,'RÉUSSIE');assert.deepEqual(r.participants,[]);assert.equal(r.crisisDelta,30);assert.match(missionRevealMarkup(r,0,2),/attack-hit.webp/);}E.validateSave(structuredClone(s));
 for(const name of ['attack-hit','attack-intercepted'])assert.ok(existsSync(new URL('../dist/client/assets/missions/'+name+'.webp',import.meta.url)));
});
test('Dismantled cells produce no false attack report; old saves and invalid reports handled',()=>{
 const s=fresh();s.suspects.filter(t=>t.cell===0).forEach(t=>t.arrested=true);E.advance(s);assert.deepEqual(s.attackReports,[]);delete s.attackReports;E.validateSave(structuredClone(s));s.attackReports=[{type:'attack',participants:['bad']}];assert.throws(()=>E.validateSave(s));
});

test('Interception displays actual prestige share for one to six countries',()=>{for(let n=1;n<=6;n++){const s=fresh();Object.values(s.factions).slice(0,n).forEach(f=>f.defense.DE=1);E.advance(s);const r=s.attackReports[0],html=missionRevealMarkup(r,0,1);assert.equal(r.participants.length,n);assert.ok(html.includes('+'+String(6/n)+' point'));for(const f of r.participants)assert.equal(s.prestigeLedger.find(e=>e.faction===f).points,6/n);}});

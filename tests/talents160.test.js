import {esc} from '../dist/client/ui.js';
import test from 'node:test';import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ACTIONS,DISPLAY_ROSTER} from '../dist/client/data.js';
import {recruitDetails,recruitCard} from '../dist/client/recruit-selection.js';
import {missionCostsMarkup} from '../dist/client/operations-ui.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.humanFactions=Object.keys(s.factions);s.plots=[];for(const c of s.fracture.cells)c.resources=0;return s;};
const caseReady=s=>{const [a,b]=E.team(s),t=s.suspects[0],f=s.factions.FR;t.country=a.country=b.country='DE';f.access.DE=f.authorized.DE=true;f.known[t.id]={country:'DE',identified:true,prepared:false,locationUntil:20};f.evidence=s.proofs.filter(p=>p.suspect===t.id).slice(0,2).map(p=>({id:p.id,verified:true,contested:false}));return {a,b,t,f};};
test('Endurance reduces every positive mission energy expense and does not change recovery; old remaining missions migrate once',()=>{
 const s=fresh(),a=E.team(s)[0];a.talents=['endurance','enquete','combat'];
 for(const [type,d] of Object.entries(ACTIONS))assert.equal(E.missionFatigue(a,type),Math.ceil(d.fatigue*.75),type);
 E.assign(s,a.id,'counter');const before=a.task.fatigue;E.advance(s);assert.equal(a.fatigue,before);
 a.fatigue=70;E.assign(s,a.id,'rest');E.advance(s);assert.equal(a.fatigue,20);
 E.assign(s,a.id,'counter');a.task.fatigue=8;delete a.task.energyRules;a.task.fatigueSpent=8;
 const loaded=E.validateSave(structuredClone(s)),b=loaded.agents.find(b=>b.id===a.id);assert.equal(b.task.fatigue,6);assert.equal(b.task.fatigueSpent,8);assert.equal(E.validateSave(loaded).agents.find(b=>b.id===a.id).task.fatigue,6);
});
test('Infiltration reduces every positive mission exposure gain, including automatic travel, intimidation and failure, but never recovery',()=>{
 const s=fresh(),{a,t}=caseReady(s);a.talents=['infiltration','endurance','combat'];
 for(const type of Object.keys(ACTIONS))for(const success of [true,false]){const plain=E.missionExposure({...a,talents:[]},type,success);assert.equal(E.missionExposure(a,type,success),plain>0?Math.ceil(plain*.8):plain,type);}
 E.assign(s,a.id,'intimidate',t.id);a.task.chance=0;E.advance(s);assert.equal(a.exposure,16);assert.match(missionCostsMarkup(s,a.id,'intimidate',t.id),/\+16/);
 E.assign(s,a.id,'intimidate',t.id);a.task.chance=100;E.advance(s);assert.equal(a.exposure,32);
 E.assign(s,a.id,'travel','FR');E.advance(s);assert.equal(a.exposure,40);
});
test('Languages stacks five points with other talents for safehouse and weapon only; cap stays ninety',()=>{
 const s=fresh(),a=E.team(s)[0];a.country='DE';a.stats=[5,5,5];a.cover='Clandestine';a.weapon=false;a.talents=['contacts','combat','endurance'];
 for(const type of ['findSafehouse','equip']){const base=E.options(s,a.id,type).chance;a.talents[2]='langues';assert.equal(E.options(s,a.id,type).chance,base+5);a.talents[2]='endurance';}
 a.talents=['contacts','infiltration','langues'];a.stats[2]=10;a.cover='Légale';assert.equal(E.options(s,a.id,'findSafehouse').chance,90);
});
test('Tactical preparation bonus is team-specific, one-use, cancellable, saveable, and consumed on a failed roll',()=>{
 const s=fresh(),{a,b,t,f}=caseReady(s);a.talents=['tactique','enquete','endurance'];b.stats=[5,5,5];
 E.assign(s,a.id,'prepare',t.id);a.task.chance=100;E.advance(s);assert.equal(f.known[t.id].tacticalArrestBonus,true);
 const o=E.options(s,b.id,'arrest',t.id);assert.equal(o.tacticalBonus,5);E.assign(s,b.id,'arrest',t.id);assert.equal(E.options(s,a.id,'arrest',t.id).tacticalBonus,0);
 E.cancel(s,b.id);assert.equal(E.options(s,a.id,'arrest',t.id).tacticalBonus,5);
 E.assign(s,b.id,'arrest',t.id);const loaded=E.validateSave(structuredClone(s));assert.equal(loaded.agents.find(x=>x.id===b.id).task.tacticalBonus,5);
 b.task.chance=0;E.advance(s);assert.equal(f.known[t.id].tacticalArrestBonus,false);assert.equal(E.options(s,a.id,'arrest',t.id).tacticalBonus,0);
 assert.equal(E.knownTargets(s,'US').find(x=>x.id===t.id)?.tacticalArrestBonus,undefined);
});
test('Interrupted tactical arrest retains the bonus; preparation failure does not grant it',()=>{
 const s=fresh(),{a,b,t,f}=caseReady(s);a.talents=['tactique','combat','endurance'];E.assign(s,a.id,'prepare',t.id);a.task.chance=0;E.advance(s);assert.ok(!f.known[t.id].tacticalArrestBonus);
 E.assign(s,a.id,'prepare',t.id);a.task.chance=100;E.advance(s);E.assign(s,b.id,'arrest',t.id);t.country='JP';E.advance(s);assert.equal(f.known[t.id].tacticalArrestBonus,true);
});
test('Every recruit has independent info buttons on both faces and a dossier with original biography and talents',()=>{
 for(const a of DISPLAY_ROSTER){const card=recruitCard(a,[]),html=recruitDetails(a.id);assert.equal((card.match(/data-cmd="recruit-details"/g)||[]).length,2);assert.ok(html.includes('recruit-dossier-art'));assert.ok(html.includes('recruit-dossier-lore'));assert.ok(html.includes(esc(a.bio)));assert.equal((html.match(/class="recruit-dossier-talent"/g)||[]).length,3);}
 assert.equal(recruitDetails('invalid'),'');
});

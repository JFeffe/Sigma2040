import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {mainMenu} from '../dist/client/main-menu.js';
function scenario(chances,cool=[5,5],seed=42){
 const s=E.createGame('FR',['p0','p1','p2','p3'],seed);s.humanFactions=Object.keys(s.factions);
 const t=s.suspects[0],agents=s.agents.slice(0,2);s.factions.FR.known[t.id]={country:t.country,identified:true,prepared:true,locationUntil:20};
 s.factions.FR.authorized[t.country]=true;
 agents.forEach((a,i)=>{a.country=t.country;a.stats[2]=cool[i];a.task={nationalityRules:1,type:'arrest',target:t.id,remaining:1,total:1,cost:6,bonusCredits:6,chance:chances[i],fatigue:8,origin:t.country,clandestine:false};});
 return {s,t,agents};
}
test('Higher chance acts first, unused boost refunded without failure; agent order preserved',()=>{
 const {s,t,agents}=scenario([80,100],[10,1]),ids=s.agents.map(a=>a.id);E.advance(s);
 const reports=s.operationReports.filter(r=>r.type==='arrest');assert.equal(t.arrested,true);assert.equal(reports.find(r=>r.agentId===agents[1].id).status,'RÉUSSITE');
 const skipped=reports.find(r=>r.agentId===agents[0].id);assert.equal(skipped.status,'INTERROMPUE');assert.equal(skipped.withoutObject,true);assert.match(skipped.notes.join(' '),/6 crédits/);assert.equal(skipped.fatigue,8);assert.deepEqual(s.agents.map(a=>a.id),ids);
});
test('Sang-froid breaks equal chances',()=>{const {s,agents}=scenario([100,100],[3,9]);E.advance(s);assert.equal(s.operationReports.find(r=>r.agentId===agents[1].id).status,'RÉUSSITE');});
test('Failed first arrest lets the next attempt resolve',()=>{const {s}=scenario([0,0]);E.advance(s);assert.equal(s.operationReports.filter(r=>r.type==='arrest'&&r.status==='ÉCHEC').length,2);});
test('Complete tie is seeded, reproducible and varies across games',()=>{const winners=new Set();for(let seed=1;seed<=20;seed++){const a=scenario([100,100],[5,5],seed),b=scenario([100,100],[5,5],seed);E.advance(a.s);E.advance(b.s);const winner=s=>s.operationReports.find(r=>r.type==='arrest'&&r.status==='RÉUSSITE').agentId;assert.equal(winner(a.s),winner(b.s));winners.add(winner(a.s));}assert.equal(winners.size,2);});
test('Menu exposes Mods and campaign information within Continue',()=>{const {s}=scenario([100,100]);const html=mainMenu(s);assert.match(html,/data-cmd="mods"/);assert.match(html,/data-cmd="continue-game"[^>]*>[\s\S]*France · IA Normal · Tour 1 \/ 30<\/small><\/button>/);assert.doesNotMatch(html,/Le monde tient|Six puissances|menu-save/);});

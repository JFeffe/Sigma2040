import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ACTIONS,COUNTRY,TECH} from '../dist/client/data.js';
import {agentMenuActions,locationActions} from '../dist/client/presentation.js';
import {technologyCancellationMarkup} from '../dist/client/technology-ui.js';
import {campaignSummary,operationTotals} from '../dist/client/campaign-stats.js';
import {playerView} from '../dist/client/multiplayer-core.js';
import {threatPanel} from '../dist/client/threats-ui.js';
import {countryPin} from '../dist/client/globe.js';
import {endingScreen,mountEnding} from '../dist/client/ending-ui.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p12','p13','p14'],194);s.humanFactions=Object.keys(s.factions);s.factions.FR.budget=30;s.plots=[];s.threatReports=[];for(const c of s.fracture.cells)c.resources=0;return s;};
const tick=s=>{s.event=null;E.advance(s);};

test('Weapon adds ten uncapped arrest points, localization takes one turn with or without relay',()=>{
 const s=fresh(),a=E.team(s)[0],t=s.suspects[0];a.country=t.country;a.stats=[5,5,5];a.talents=[];s.factions.FR.known[t.id]={country:t.country,identified:true,prepared:true,locationUntil:10};s.factions.FR.authorized[t.country]=true;
 a.weapon=false;const base=E.options(s,a.id,'arrest',t.id).chance;a.weapon=true;assert.equal(E.options(s,a.id,'arrest',t.id).chance,base+10);
 assert.equal(ACTIONS.surveil.duration,1);assert.equal(E.options(s,a.id,'surveil',t.id).duration,1);const relay=E.activateTech(s,'relay');assert.equal(E.options(s,a.id,'surveil',t.id).duration,1);E.cancelTech(s,relay.id);assert.equal(E.options(s,a.id,'surveil',t.id).duration,1);assert.doesNotMatch(TECH.relay.effect,/1 tour/);
});
test('Authentic and forged verification each award exactly two prestige; interrupted duplicate gets none',()=>{
 for(const authentic of [true,false]){const s=fresh(),[a,b]=E.team(s),p=s.proofs[0];p.authentic=authentic;s.factions.FR.evidence=[{id:p.id,verified:false,contested:false}];E.assign(s,a.id,'analyze',p.id);a.task.chance=100;b.task=structuredClone(a.task);tick(s);assert.equal(s.factions.FR.score,2);assert.equal(s.prestigeLedger.filter(e=>e.key.startsWith('proof:')).length,1);assert.equal(s.factions.FR.evidence[0].contested,!authentic);assert.equal(s.operationReports.filter(r=>r.status==='INTERROMPUE').length,1);}
});
test('Same-turn logistics rollback lists only affected agents, refunds once, frees slot, survives reload',()=>{
 let s=fresh();const [a,b,c,d]=E.team(s);E.assign(s,a.id,'travel','JP');const t=E.activateTech(s,'logistics');E.assign(s,b.id,'travel','JP');E.assign(s,c.id,'travel','JP');const near=Object.keys(COUNTRY).find(id=>id!=='FR'&&E.travelTurns('FR',id)===1);E.assign(s,d.id,'travel',near);
 assert.deepEqual(E.logisticsCancellationAgents(s,t).map(a=>a.id),[b.id,c.id]);const html=technologyCancellationMarkup(s,t);assert.ok(html.includes(b.name)&&html.includes(c.name));assert.ok(!html.includes(`<strong>${a.name}</strong>`));assert.match(html,/Conserver le module|Confirmer et annuler les voyages/);
 const before=JSON.stringify(s);technologyCancellationMarkup(s,t);assert.equal(JSON.stringify(s),before);
 s=E.validateSave(structuredClone(s));E.cancelTech(s,t.id);assert.equal(s.factions.FR.budget,30);assert.equal(E.team(s)[1].task,null);assert.equal(E.team(s)[2].task,null);assert.equal(E.team(s)[0].task.total,2);assert.ok(E.team(s)[3].task);assert.equal(E.getTechSlots(s,'FR'),0);E.assign(s,b.id,'protect','FR');assert.ok(E.team(s)[1].task);assert.throws(()=>E.cancelTech(s,t.id));E.validateSave(structuredClone(s));
});
test('Relay cannot stack free extensions by repeated activation and cancellation, and preserves newer independent fixes',()=>{
 let s=fresh(),f=s.factions.FR,t=s.suspects[0];f.known[t.id]={country:t.country,identified:true,locationUntil:3};
 for(let i=0;i<3;i++){const relay=E.activateTech(s,'relay');assert.equal(f.known[t.id].locationUntil,5);s=E.validateSave(structuredClone(s));f=s.factions.FR;E.cancelTech(s,relay.id);assert.equal(f.known[t.id].locationUntil,3);assert.equal(f.budget,30);}
 const relay=E.activateTech(s,'relay');f.known[t.id].locationUntil=12;E.cancelTech(s,relay.id);assert.equal(f.known[t.id].locationUntil,12);
});
test('AI rollback refunds its cost and removes bonus plus pending research; later cancellation does not refund',()=>{
 const s=fresh(),a=E.team(s)[0],p=s.proofs[0];s.factions.FR.evidence=[{id:p.id,verified:false,contested:false}];a.stats=[5,5,5];a.talents=[];const base=E.options(s,a.id,'analyze',p.id).chance;
 const ai=E.activateTech(s,'ai');E.assign(s,a.id,'analyze',p.id);assert.equal(a.task.chance,base+10);E.cancelTech(s,ai.id);assert.equal(a.task.chance,base);assert.equal(s.factions.FR.budget,30);E.cancel(s,a.id);tick(s);assert.equal(E.leadResearch(s).progress,0);
 const logistics=E.activateTech(s,'logistics');tick(s);const budget=s.factions.FR.budget;E.cancelTech(s,logistics.id);assert.equal(s.factions.FR.budget,budget);
});
test('Travel distance and logistics breakdown records resolved trips once and stays private until game end',()=>{
 let s=fresh();const [a,b,c,d]=E.team(s),near=Object.keys(COUNTRY).find(id=>id!=='FR'&&E.travelTurns('FR',id)===1);E.assign(s,a.id,'travel','JP');E.assign(s,b.id,'travel',near);E.activateTech(s,'logistics');E.assign(s,c.id,'travel','JP');E.assign(s,d.id,'travel','JP');E.cancel(s,d.id);tick(s);tick(s);
 const rows=s.campaignStats.travel.FR;assert.equal(rows['travel:1:standard'].count,1);assert.equal(rows['travel:2:standard'].count,1);assert.equal(rows['travel:2:priority'].count,1);assert.equal(operationTotals(s,'FR').count,3);assert.equal(s.campaignStats.agents.FR[c.id].travel['travel:2:priority'].count,1);
 s=E.validateSave(structuredClone(s));assert.equal(s.campaignStats.travel.FR['travel:2:priority'].count,1);assert.deepEqual(playerView({game:s,offers:[]},'US').campaignStats.travel,{});s.ended='victory';assert.equal(playerView({game:s,offers:[]},'US').campaignStats.travel.FR['travel:2:priority'].count,1);assert.match(campaignSummary(s,{tab:'operations'}),/Voyager 2 cases · avec logistique prioritaire/);
});
test('Chief counts actual assisted attempts, including failures, excluding cancelled and automatic actions',()=>{
 let s=fresh();const [chief,a,b,c]=E.team(s);E.assign(s,a.id,'counter');a.task.chance=100;E.assign(s,b.id,'counter');b.task.chance=0;E.assign(s,c.id,'counter');E.cancel(s,c.id);E.assign(s,chief.id,'rest');tick(s);
 assert.equal(s.campaignStats.agents.FR[chief.id].coordinationBuffs,2);assert.equal(s.campaignStats.agents.FR[a.id].coordinationBuffs,undefined);s=E.validateSave(structuredClone(s));assert.equal(s.campaignStats.agents.FR[chief.id].coordinationBuffs,2);assert.match(campaignSummary(s,{tab:'agents'}),/opération\(s\) de coéquipiers soutenue/);
});
test('Generic agent menu omits contextual actions even with a local target; dedicated mission eligibility remains',()=>{
 const s=fresh(),a=E.team(s)[0],t=s.suspects[0];a.country=t.country;s.factions.FR.known[t.id]={country:t.country,identified:true,locationUntil:0};const generic=agentMenuActions(a,s).map(([id])=>id),full=locationActions(a,s).map(([id])=>id);for(const type of ['collect','surveil','prepare','arrest','hack','intimidate','protect']){assert.ok(!generic.includes(type));assert.ok(full.includes(type));}assert.ok(generic.includes('contacts'));assert.ok(generic.includes('influence'));assert.ok(generic.includes('travel'));
});
test('Threat cards expose public allied coverage at attack date and shields show remaining protection',()=>{
 const s=fresh(),country=s.suspects[0].country;s.plots=[{id:'test',country,turn:3,cell:0,kind:'Test',resolved:false}];s.factions.US.defense[country]=3;s.factions.FR.defense[country]=1;let html=threatPanel(s);assert.match(html,/Déjà couverte par États-Unis · jusqu’à T3/);const privateState=playerView({game:s,offers:[]},'FR');assert.match(threatPanel(privateState),/Déjà couverte/);assert.match(countryPin(s,COUNTRY[country],[],[]),/Protection : actif · 3 tour/);s.factions.US.defense[country]=2;html=threatPanel(s);assert.doesNotMatch(html,/Déjà couverte/);
});
test('Final panel handles shared winners, defeat, animated scores and reduced motion',()=>{
 const s=fresh();s.ended='victory';s.factions.FR.score=s.factions.US.score=12;let html=endingScreen(s);assert.match(html,/ending-ceremony is-victory/);assert.match(html,/VICTOIRE NATIONALE PARTAGÉE/);assert.match(html,/data-ending-score="12"/);assert.match(html,/Évolution du prestige/);assert.match(html,/ending-report/);s.ended='defeat';html=endingScreen(s);assert.match(html,/Aucun pays vainqueur/);assert.doesNotMatch(html,/class="ending-winners"/);
 let focused=false;const score={textContent:'12',dataset:{endingScore:'12'}},root={querySelectorAll:()=>[score],querySelector:()=>({focus:()=>{focused=true;}})};const stop=mountEnding(root,{reducedMotion:true});assert.equal(score.textContent,'12');assert.equal(focused,true);stop();
});

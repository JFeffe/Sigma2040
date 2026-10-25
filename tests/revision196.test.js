import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as E from '../dist/client/engine.js';
import {COOPERATION} from '../dist/client/cooperation.js';
import {TECH} from '../dist/client/data.js';
import {threatProtection,threatProtectionText} from '../dist/client/threat-status.js';
import {threatPanel} from '../dist/client/threats-ui.js';
import {missionCards,missionRevealMarkup,revealDelay,groupAutomaticReports} from '../dist/client/mission-reveal.js';
import {contributionBreakdown,protectionScoreBreakdown} from '../dist/client/campaign-stats.js';
import {endingScreen} from '../dist/client/ending-ui.js';
import {playerView} from '../dist/client/multiplayer-core.js';
const fresh=()=>{const s=E.createGame('FR',['p0','p12','p13','p14'],196);s.humanFactions=Object.keys(s.factions);s.plots=[];s.threatReports=[];s.fracture.cells.forEach(c=>c.resources=0);s.factions.FR.budget=18;return s;};
test('All cooperation tiers resolve to 2/2/3/3/4 subsequent turns, with +2 only for an active relay',()=>{
 assert.deepEqual(COOPERATION.map(c=>c.location),[2,2,3,3,4]);
 for(let tier=0;tier<5;tier++)for(const relay of [false,true]){const s=fresh(),a=E.team(s)[0],t=s.suspects[0],f=s.factions.FR;a.country=t.country;f.known[t.id]={country:t.country,identified:true,locationUntil:0};f.cooperation[t.country]=tier;if(relay)E.activateTech(s,'relay');
 const forecast=E.operationForecast(s,a.id,'surveil',t.id);const expected=1+[2,2,3,3,4][tier]+(relay?2:0);assert.match(forecast.warnings.join(' '),new RegExp('fin T'+expected));E.assign(s,a.id,'surveil',t.id);assert.equal(a.task.total,1);a.task.chance=100;E.advance(s);assert.equal(f.known[t.id].locationUntil,expected);assert.equal(E.validateSave(structuredClone(s)).factions.FR.known[t.id].locationUntil,expected);}
});
test('Localization uses cooperation at resolution; new position expires after final inclusive turn',()=>{
 const s=fresh(),a=E.team(s)[0],t=s.suspects[0],f=s.factions.FR;a.country=t.country;f.known[t.id]={country:t.country,identified:true,prepared:true,locationUntil:0};f.evidence=s.proofs.filter(p=>p.suspect===t.id).slice(0,2).map(p=>({id:p.id,verified:true,contested:false}));f.cooperation[t.country]=4;E.assign(s,a.id,'surveil',t.id);a.task.chance=100;f.cooperation[t.country]=0;E.advance(s);assert.equal(f.known[t.id].locationUntil,3);s.turn=3;assert.equal(E.options(s,a.id,'arrest',t.id).error,null);s.turn=4;assert.match(E.options(s,a.id,'arrest',t.id).error,/localisation fraîche/);
});
test('Relay costs and refunds two; legacy three-credit modules keep their exact refund after reload',()=>{
 assert.equal(TECH.relay.cost,2);let s=fresh();const r=E.activateTech(s,'relay');assert.equal(s.factions.FR.budget,16);s=E.validateSave(structuredClone(s));E.cancelTech(s,r.id);assert.equal(s.factions.FR.budget,18);
 s=fresh();const old=E.activateTech(s,'relay');old.cost=3;s.factions.FR.budget=15;s=E.validateSave(structuredClone(s));E.cancelTech(s,old.id);assert.equal(s.factions.FR.budget,18);
});
test('Threat forecast separates current, pending and guaranteed coverage at both inclusive boundaries',()=>{
 const s=fresh(),a=E.team(s)[0],p={id:'test',country:'DE',turn:3,cell:0,kind:'Test',resolved:false};s.plots=[p];a.country='DE';E.assign(s,a.id,'protect');let c=threatProtection(s,p);assert.equal(c.active,false);assert.equal(c.covered,false);assert.equal(c.projected,true);assert.equal(c.planned[0].start,2);assert.equal(c.planned[0].until,5);assert.match(threatPanel(s),/couverture prévue si la mission réussit/);
 for(const [turn,expected] of [[1,false],[2,true],[5,true],[6,false]]){p.turn=turn;assert.equal(threatProtection(s,p).projected,expected);}
 p.turn=3;s.factions.FR.defense.DE=2;c=threatProtection(s,p);assert.equal(c.active,true);assert.equal(c.covered,false);assert.match(threatProtectionText(s,p).current,/fin T2 inclus/);s.factions.US.defense.DE=4;assert.match(threatPanel(s),/Déjà couverte par États-Unis/);E.cancel(s,a.id);assert.equal(threatProtection(s,p).projected,false);assert.match(threatPanel(s),/non couverte par votre pays/);s.factions.FR.defense.DE=3;assert.equal(threatProtection(s,p).covered,true);
 const view=playerView({game:s,offers:[]},'US');assert.ok(!threatProtection(view,p).planned.some(r=>r.agentId===a.id));
});
test('Real automatic resolutions form one private popup with individual outcomes; failures and alerts stay separate',()=>{
 const s=fresh(),[a,b,c,d]=E.team(s);for(const x of [a,b,c]){x.fatigue=70;x.exposure=40;}E.assign(s,a.id,'rest');b.country='DE';E.assign(s,b.id,'hide');E.assign(s,c.id,'rest');E.assign(s,d.id,'counter');d.task.chance=0;E.advance(s);const before=JSON.stringify(s),cards=missionCards(s),group=cards.find(r=>r.type==='automatic-summary');assert.equal(group.reports.length,3);assert.equal(revealDelay(group),0);assert.equal(cards.filter(r=>r.status==='ÉCHEC').length,1);const html=missionRevealMarkup(group,0,cards.length,true,null,s);for(const x of [a,b,c])assert.ok(html.includes(x.name));assert.match(html,/Énergie <b>\+50/);assert.match(html,/Exposition <b>-35/);assert.equal(JSON.stringify(s),before);
 const view=playerView({game:s,offers:[]},'US');assert.ok(!missionCards(view).some(r=>r.type==='automatic-summary'&&r.reports.some(x=>x.faction==='FR')));
 const success=group.reports[0];assert.equal(groupAutomaticReports([success])[0],success);assert.equal(groupAutomaticReports([success,{...success,turn:success.turn+1}]).length,2);assert.equal(groupAutomaticReports([success,{...success,faction:'US'}]).length,2);const death={type:'death',turn:success.turn};assert.equal(groupAutomaticReports([success,death,group.reports[1]])[1],death);
});
test('Protection points reconcile across fractional shares, historical awards, score screen and attack detail',()=>{
 const s=fresh();s.plots=[{id:'test',country:'DE',turn:1,cell:0,kind:'Attaque test',resolved:false}];Object.values(s.factions).slice(0,3).forEach(f=>f.defense.DE=1);E.advance(s);assert.equal(s.attackReports[0].prestigeTotal,4);assert.equal(contributionBreakdown(s,'FR').protection,4/3);assert.match(missionRevealMarkup(s.attackReports[0],0,1),/4 points partagés/);s.ended='victory';assert.match(endingScreen(s),/Protection : 1\.3 pts/);assert.match(protectionScoreBreakdown(s,'FR'),/Attaque test/);assert.match(protectionScoreBreakdown(s,'FR'),/France, États-Unis, Chine/);
 const old={...s.attackReports[0]};delete old.prestigeTotal;assert.match(missionRevealMarkup(old,0,1),/6 points partagés/);const saved=E.validateSave(structuredClone(s));assert.equal(saved.attackReports[0].prestigeTotal,4);
});
test('Entering the full report closes the old modal and clears cinematic/reveal callbacks before focus',()=>{
 const app=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8');const code=app.slice(app.indexOf(" case 'ending-report':"),app.indexOf(" case 'ending':"));let closed=false,focused=false,cleared=false;const ctx={revealSession:{},cinematic:{},showReveals:{timer:12},clearTimeout:id=>{assert.equal(id,12);cleared=true;},modal:{close:()=>{assert.equal(ctx.revealSession,null);assert.equal(ctx.cinematic,null);closed=true;}},$:()=>({scrollIntoView:()=>{assert.ok(closed);},focus:()=>{focused=true;}})};runInNewContext(`switch('ending-report'){${code}}`,ctx);assert.ok(closed&&focused&&cleared);
});

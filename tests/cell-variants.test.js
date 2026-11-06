import {campaignSummary,contributionBreakdown} from '../dist/client/campaign-stats.js';
import {ACTIONS} from '../dist/client/data.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {CELL_RULES,selectCells,activeCaptives,captivityTick,cellKnown} from '../dist/client/cell-variants.js';
import {cellInfoMarkup} from '../dist/client/cell-info.js';
import {threatPanel} from '../dist/client/threats-ui.js';
import {locationActions} from '../dist/client/presentation.js';
import {playerView} from '../dist/client/multiplayer-core.js';
const participants=['FR','US','CN','RU'];
function fresh(seed=1){const s=E.createGame('FR',['p0','p1','p2','p3'],seed,'bb2',{gameMode:'regular',participants,cellVariants:true});s.humanFactions=participants;return s;}
function eclipse(){for(let seed=1;;seed++){const s=fresh(seed);if(s.activeCells.includes(4)){const p=s.plots.find(p=>p.cell===4);p.turn=1;p.country='DE';p.announced=true;s.plots=[p];return s;}}}
test('1000 seeded draws: 3 distinct cells, all combinations, counts, types, damage and save round-trip',()=>{
 const counts={};for(let seed=1;seed<=1000;seed++){
  const s=fresh(seed),key=s.activeCells.join(',');counts[key]=(counts[key]||0)+1;assert.deepEqual(selectCells(seed),s.activeCells);assert.equal(s.suspects.length,7);
  for(const cell of s.activeCells){assert.equal(s.suspects.filter(t=>t.cell===cell).length,2);const plots=s.plots.filter(p=>p.cell===cell);assert.equal(plots.length,CELL_RULES[cell].count);for(const p of plots){assert.equal(E.attackDamage(s,p),CELL_RULES[cell].damage);assert.ok(CELL_RULES[cell].kinds.includes(p.kind));}}
  assert.deepEqual(E.validateSave(structuredClone(s)).activeCells,s.activeCells);
 }assert.equal(Object.keys(counts).length,4);for(const n of Object.values(counts))assert.ok(n>180&&n<320,JSON.stringify(counts));
});
test('Eclipse: +20 immediately and +3 at same end of turn, external roster unchanged',()=>{
 const s=eclipse(),n=s.agents.length;E.advance(s);assert.equal(s.crisis,12+20+3+3);assert.equal(activeCaptives(s).length,1);assert.equal(s.captives[0].country,'DE');assert.equal(s.agents.length,n);
 const crisis=s.crisis;captivityTick(s,()=>{});assert.equal(s.crisis,crisis+3);captivityTick(s,()=>{});assert.equal(s.crisis,crisis+3);
 assert.doesNotThrow(()=>E.validateSave(structuredClone(s)));
});
test('Protection prevents both capture and its recurring crisis',()=>{const s=eclipse();s.factions.FR.defense.DE=10;E.advance(s);assert.equal(s.captives.length,0);assert.equal(s.crisis,10);});
test('Two simultaneous kidnappings stack +6; dismantling cancels future plots but does not free prisoners',()=>{
 const s=eclipse();s.plots.push({...s.plots[0],id:'second',country:'BR'});E.advance(s);assert.equal(activeCaptives(s).length,2);assert.equal(s.crisis,12+40+6+3);
 s.suspects.filter(t=>t.cell===4).forEach(t=>t.arrested=true);const before=s.crisis;E.advance(s);assert.equal(s.crisis,before+6+3);assert.equal(activeCaptives(s).length,2);
});
test('All teams can rescue; no recruitment; simultaneous rescues award once and stop recurring crisis before tick',()=>{
 const s=eclipse();E.advance(s);const c=s.captives[0],n=s.agents.length;const rescuers=['FR','US'].map(f=>s.agents.find(a=>a.faction===f));
 for(const a of rescuers){a.country='DE';a.stats[2]=5;a.fatigue=0;assert.equal(E.options(s,a.id,'rescue',c.id).error,null);assert.ok(locationActions(a,s).some(([id])=>id==='rescue'));E.assign(s,a.id,'rescue',c.id,true);a.task.remaining=1;a.task.chance=100;}
 const before=s.crisis,score=Object.values(s.factions).reduce((n,f)=>n+f.score,0);E.advance(s);
 assert.equal(c.status,'released');const points=contributionBreakdown(s,c.releasedBy);assert.equal(points.rescues,2);assert.equal(points.rescued,1);assert.equal(points.other,0);assert.match(campaignSummary(s,{country:c.releasedBy}),/Agents neutres libérés/);assert.match(campaignSummary(s,{country:c.releasedBy}),/Points de libération/);assert.equal(ACTIONS.rescue.name,'Extraire un agent');assert.equal(s.crisis,before-10+3);assert.equal(s.agents.length,n);assert.equal(Object.values(s.factions).reduce((n,f)=>n+f.score,0),score+2);
 const reports=s.operationReports.filter(r=>r.type==='rescue');assert.equal(reports.filter(r=>r.status==='RÉUSSITE').length,1);assert.equal(reports.filter(r=>r.status==='INTERROMPUE').length,1);
 assert.equal(s.prestigeLedger.filter(e=>e.key==='rescue:'+c.id).length,1);
});
test('Failed rescue leaves captivity active; save validation rejects malformed captive and draw',()=>{
 const s=eclipse();E.advance(s);const a=s.agents[0];a.country='DE';E.assign(s,a.id,'rescue',s.captives[0].id);a.task.remaining=1;a.task.chance=0;const before=s.crisis;E.advance(s);assert.equal(activeCaptives(s).length,1);assert.equal(s.crisis,before+6);
 assert.doesNotThrow(()=>E.validateSave(structuredClone(s)));for(const mutate of [s=>s.activeCells.push(4),s=>s.captives[0].country='FR',s=>s.captives[0].lastCrisisTurn=100]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>E.validateSave(bad));}
});
test('Unknown cells stay hidden in popup; threats show type; public views share captives and no active-cell list',()=>{
 const s=eclipse();for(const f of Object.values(s.factions))f.known={};s.plots[0].turn=20;assert.equal(cellKnown(s,4),true);delete s.plots[0].announced;assert.equal(cellKnown(s,4),false);assert.doesNotMatch(cellInfoMarkup(s,4),/ÉCLIPSE|Enlèvements/);
 s.plots[0].turn=1;assert.match(threatPanel(s),/Enlèvement/);E.advance(s);for(const country of participants){const v=playerView({game:s,members:[]},country);assert.equal(v.activeCells,undefined);assert.deepEqual(v.captives,s.captives);assert.equal(E.rescueTargets(v,country).filter(c=>c.id.startsWith('captive')).length,1);assert.doesNotThrow(()=>threatPanel(v));}
});
test('Legacy games remain at +30 and have no experimental roster',()=>{const s=E.createGame('FR',['p0','p1','p2','p3'],42);assert.equal(s.cellVariantRules,undefined);assert.equal(s.plots.length,17);for(const p of s.plots)assert.equal(E.attackDamage(s,p),30);});

test('Configured base games enable three random cells without a URL switch',()=>{const s=E.createConfiguredGame('FR',['p0','p1','p2','p3'],42);assert.equal(s.cellVariantRules,1);assert.equal(s.activeCells.length,3);assert.doesNotThrow(()=>E.validateSave(structuredClone(s)));});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DEFAULT_TEAM_IDS,DISPLAY_ROSTER} from '../dist/client/data.js';
import {formatScore} from '../dist/client/ui.js';
import {outcomeMetrics,missionRevealMarkup} from '../dist/client/mission-reveal.js';
import {reportCards} from '../dist/client/operations-ui.js';
import {createDraft,pickDraftAgent,draftCountry} from '../dist/client/game-setup.js';
import {draftScreen} from '../dist/client/draft-ui.js';
import {BUILD_VERSION} from '../dist/client/build-version.js';
const {setRecruitFilter,resetRecruitFilters,visibleRecruits,recruitControls}=await import(`../dist/client/recruit-selection.js?v=${BUILD_VERSION}`);
const fresh=()=>{const s=E.createGame('FR',DEFAULT_TEAM_IDS,17);s.humanFactions=Object.keys(s.factions);s.plots=[];return s;};

test('Shared protection awards integers; three countries earn three total and reload without drift',()=>{
 const s=fresh();s.plots=[{id:'rounding-test',country:'DE',turn:1,cell:0,kind:'Test',resolved:false}];
 for(const c of ['FR','US','CN'])s.factions[c].defense.DE=1;
 E.advance(s);
 assert.equal(s.attackReports[0].prestigeTotal,3);
 for(const c of ['FR','US','CN'])assert.equal(s.factions[c].score,1);
 assert.equal(s.prestigeLedger.reduce((n,e)=>n+e.points,0),3);
 assert.match(missionRevealMarkup(s.attackReports[0],0,1),/\+1 point/);
 assert.deepEqual(E.validateSave(structuredClone(s)).prestigeLedger,s.prestigeLedger);
});

test('Old fractional protection saves reconcile score, ledger, reports and logs idempotently',()=>{
 const s=fresh();s.plots=[{id:'old',country:'DE',turn:1,cell:0,kind:'Test',resolved:false}];
 for(const c of ['FR','US','CN'])s.factions[c].defense.DE=1;
 E.advance(s);
 for(const e of s.prestigeLedger)e.points=4/3;
 for(const c of ['FR','US','CN'])s.factions[c].score=4/3;
 s.attackReports[0].prestigeTotal=4;
 s.factions.FR.score+=6;
 s.prestigeLedger.push({key:'legacy-test',faction:'FR',turn:1,points:6,reason:'Arrestation'});
 const saved=E.validateSave(s);
 assert.equal(saved.factions.FR.score,7);assert.equal(saved.factions.US.score,1);
 assert.equal(saved.attackReports[0].prestigeTotal,3);
 assert.ok(saved.prestigeLedger.every(e=>Number.isInteger(e.points)));
 for(const f of Object.values(saved.factions))assert.equal(f.score,saved.prestigeLedger.filter(e=>e.faction===f.id).reduce((n,e)=>n+e.points,0));
 assert.deepEqual(E.validateSave(structuredClone(saved)),saved);
});

test('Arrest gains stay exactly six after a fractional legacy total; every result display uses integers',()=>{
 const s=fresh(),f=s.factions.FR,[a]=E.team(s),t=s.suspects[0];f.score=4/3;
 a.country=t.country;f.known[t.id]={country:t.country,identified:true,prepared:true,locationUntil:10};f.evidence=[0,1].map(i=>({id:t.id+'-e'+i,verified:true,contested:false}));
 E.assign(s,a.id,'arrest',t.id);a.task.chance=100;a.task.remaining=1;E.advance(s);
 const report=s.operationReports.find(r=>r.agentId===a.id);assert.equal(report.prestige,6);
 assert.equal(formatScore(5.999999999999999),6);
 report.prestige=5.999999999999999;
 assert.match(outcomeMetrics(report),/Prestige <b>\+6<\/b>/);
 assert.match(reportCards(s),/\+6 prestige/);assert.doesNotMatch(reportCards(s),/999999/);
});

test('Draft availability checkbox hides picked agents for solo and multiplayer without altering picks or preview',()=>{
 for(const mode of ['solo','multi']){
  resetRecruitFilters(mode);const d=createDraft(['FR','US'],7),c=draftCountry(d),picked=DISPLAY_ROSTER[0].id;pickDraftAgent(d,c,picked);
  const current=draftCountry(d),candidate=DISPLAY_ROSTER[1].id,before=structuredClone(d);
  let html=draftScreen(d,current,{multi:mode==='multi',candidate});assert.ok(html.includes(`data-recruit-id="${picked}"`));
  setRecruitFilter(mode,'availableOnly',true);html=draftScreen(d,current,{multi:mode==='multi',candidate});
  assert.ok(!html.includes(`data-recruit-id="${picked}"`));assert.ok(html.includes(`data-recruit-id="${candidate}"`));assert.match(html,/Confirmer l’agent/);assert.match(html,/Agents disponibles uniquement/);
  assert.deepEqual(d,before);
  setRecruitFilter(mode,'talent',DISPLAY_ROSTER[1].talents[0]);assert.ok(visibleRecruits(mode,new Map([[picked,c]])).every(a=>a.id!==picked&&a.talents.includes(DISPLAY_ROSTER[1].talents[0])));
  resetRecruitFilters(mode);assert.ok(!recruitControls(mode).includes('availableOnly'));assert.equal(visibleRecruits(mode).length,20);
 }
});

test('Find weapon explains the 78 percent base, modifiers and cap without changing success odds',()=>{
 const s=fresh(),[a]=E.team(s);a.country='DE';a.weapon=false;a.stats[2]=9;a.talents=[];a.fatigue=0;a.exposure=0;
 let o=E.options(s,a.id,'equip');assert.equal(o.chance,78);assert.ok(o.explanations.some(x=>x.includes('50 + 7 × (9 − 5) = 78 %')));
 a.fatigue=50;o=E.options(s,a.id,'equip');assert.equal(o.chance,68);assert.ok(o.explanations.includes('Fatigue −10'));
 a.fatigue=0;a.talents=['contacts','langues'];o=E.options(s,a.id,'equip');assert.equal(o.chance,90);assert.ok(o.explanations.some(x=>x.includes('93 % · plafond 90 %')));
});

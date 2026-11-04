import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DEFAULT_TEAM_IDS,COUNTRIES} from '../dist/client/data.js';
import {countryOperationModel,countryOperationTypes,countryOperationTargets} from '../dist/client/country-operations.js';
import {quickActionMarkup} from '../dist/client/quick-actions.js';
import {agentLocation} from '../dist/client/agent-location.js';
import {attackDelayBanner} from '../dist/client/attack-delay-ui.js';
import {endingScreen} from '../dist/client/ending-ui.js';
import {campaignSummary} from '../dist/client/campaign-stats.js';
const fresh=()=>E.createGame('FR',DEFAULT_TEAM_IDS,216,'bb2');
test('Country verification is offered only at own HQ with all pending evidence',()=>{
 const s=fresh(),a=E.team(s)[0],target=E.knownTargets(s)[0],p=s.proofs.find(p=>p.suspect===target.id);
 s.factions.FR.evidence.push({id:p.id,verified:false,contested:false});
 for(const c of COUNTRIES){assert.equal(countryOperationTypes(s,c.id).includes('analyze'),c.id==='FR');if(c.id!=='FR')assert.deepEqual(countryOperationTargets(s,c.id,'analyze'),[]);}
 const m=countryOperationModel(s,'FR',{type:'analyze',agent:a.id});assert.equal(m.target,p.id);assert.equal(m.selected.a.country,'FR');assert.equal(m.selected.reason,'');
 E.assign(s,a.id,m.type,m.target);assert.equal(a.task.target,p.id);assert.ok(countryOperationModel(s,'FR',{type:'analyze'}).rows.every(r=>r.reason));
});
test('HQ quick hack opens while available and disables occupied agents; field agents do not get HQ hack',()=>{
 const s=fresh(),a=E.team(s)[0];assert.match(quickActionMarkup(s,a),/data-type="cyberSupport"/);
 const m=countryOperationModel(s,'DE',{type:'cyberSupport',agent:a.id});assert.equal(m.type,'cyberSupport');assert.equal(m.selected.reason,'');E.assign(s,a.id,m.type,m.target);
 assert.match(quickActionMarkup(s,a),/data-type="cyberSupport"[^>]*disabled/);a.task=null;a.country='DE';assert.doesNotMatch(quickActionMarkup(s,a),/data-type="cyberSupport"/);
});
test('Location separates current country, HQ, queued and active travel',()=>{
 const s=fresh(),a=E.team(s)[0];assert.match(agentLocation(a),/Position · France · QG/);E.assign(s,a.id,'travel','DE');assert.match(agentLocation(a),/Position · France/);a.task.queued=false;assert.match(agentLocation(a),/En transit depuis · France → Allemagne/);
});
test('Protection delay remains visible after debrief, excludes resolved and secret plots',()=>{
 const s=fresh(),p=s.plots[0];p.announced=true;p.turn=5;s.attackDelayReports=[{plotId:p.id,reason:'protection',country:p.country,cell:p.cell,oldTurn:3,attackTurn:5}];
 assert.match(attackDelayBanner(s),/ATTAQUE REPORTÉE PAR LA PROTECTION ACTIVE/);assert.match(attackDelayBanner(s),/Fin T3 → fin T5/);p.resolved=true;assert.equal(attackDelayBanner(s),'');
});
test('Ending archives point to individual stats with all agents preserved after retirement',()=>{
 const s=fresh();s.humanFactions=Object.keys(s.factions);const a=E.team(s)[0];a.fatigue=30;E.assign(s,a.id,'rest');E.advance(s);a.status='retired';s.ended='defeat';
 assert.match(endingScreen(s),/data-cmd="campaign-archives"/);const html=campaignSummary(s,{tab:'agents'});assert.match(html,/data-report-panel="agents" >/);assert.ok(html.includes(`data-report-agent="${a.id}"`));assert.ok(html.includes(`data-agent-report="${a.id}"`));
});

test('Coop Eclipse dossier names render for either allied player',async()=>{
 const D=await import('../dist/client/game-setup.js'),{makeScreens}=await import('../dist/client/screens.js'),{playerView}=await import('../dist/client/multiplayer-core.js');
 const d=D.createDraft(['FR','US'],216,'cooperative');d.humans=[];D.advanceNpcDraft(d);
 const s=E.createGame('FR',d.teams.FR,216,'bb2',{gameMode:'cooperative',participants:d.countries,teams:d.teams});
 for(const t of s.suspects.filter(t=>t.cell===4))s.factions.FR.known[t.id]={country:t.country,locationUntil:0,prepared:false,identified:true};
 for(const player of ['FR','US']){const v=playerView({game:s,members:[]},player),html=makeScreens(v,'FR',null,null,{}).inquiry();assert.match(html,/Cellule ÉCLIPSE/);assert.doesNotMatch(html,/undefined/);}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import * as D from '../dist/client/game-setup.js';
import {DEFAULT_TEAM_IDS,regularCells} from '../dist/client/data.js';
import {countryOperationModel,floatingAgentMarkup} from '../dist/client/country-operations.js';
import {countryThreatButtons} from '../dist/client/country-inquiry.js';
import {threatPanel} from '../dist/client/threats-ui.js';
import {observeFracture} from '../dist/client/fracture.js';
import {readFileSync} from 'node:fs';
function coop(seed=123){const d=D.createDraft(['FR','US'],seed,'cooperative');while(D.draftCountry(d))D.pickDraftAgent(d,D.draftCountry(d),D.availableDraftAgents(d)[0].id);const s=E.createGame('FR',d.teams.FR,seed,'normal',{gameMode:'cooperative',participants:d.countries,teams:d.teams});s.humanFactions=d.countries;return s;}
test('New coop cell has unique identities, valid placements, five attacks, four forgeries and save roundtrips',()=>{
 for(let seed=1;seed<=50;seed++){const s=coop(seed);assert.equal(s.suspects.length,9);assert.equal(new Set(s.suspects.filter(t=>t.id!=='s6').map(t=>t.templateId)).size,8);assert.deepEqual(regularCells(s),[0,1,2,4]);assert.equal(s.proofs.filter(p=>!p.authentic).length,4);assert.equal(s.plots.filter(p=>p.cell===4).length,5);assert.equal(s.plots.length,22);assert.ok(s.suspects.every(t=>t.country));for(const p of s.plots)for(const q of s.plots)if(p.id!==q.id&&p.country===q.country)assert.ok(Math.abs(p.turn-q.turn)>=6);E.validateSave(JSON.parse(JSON.stringify(s)));}
});
test('Fourth cell responds to pressure and its dismantling cancels its future attacks',()=>{const s=coop();observeFracture(s,4,3);assert.equal(s.fracture.cells[4].pressure,3);for(const t of s.suspects.filter(t=>t.cell===4))t.arrested=true;E.advance(s);assert.ok(E.cellsDone(s).includes(4));assert.ok(s.plots.filter(p=>p.cell===4).every(p=>p.resolved));E.validateSave(JSON.parse(JSON.stringify(s)));});
test('Coop Architect requires authentic verified evidence from four distinct suspects',()=>{
 const s=coop(),f=s.factions.FR,a=E.team(s)[0];for(const t of s.suspects.filter(t=>t.cell!==3).slice(0,4)){const proof=s.proofs.find(p=>p.suspect===t.id&&p.authentic);f.evidence.push({id:proof.id,verified:false,contested:false});E.assign(s,a.id,'analyze',proof.id);a.task.chance=100;E.advance(s);if(f.evidence.filter(e=>e.verified).length<4)assert.ok(!f.known.s6);}
 assert.ok(f.known.s6);
});
test('Legacy coop network still loads with seven suspects',()=>{const s=coop();delete s.coopNetworkRules;delete s.coopCampaignRules;s.suspects=s.suspects.filter(t=>t.cell!==4);s.proofs=s.proofs.filter(p=>s.suspects.some(t=>t.id===p.suspect));s.plots=s.plots.filter(p=>p.cell!==4);s.fracture.cells.length=3;s.threatReports=s.threatReports.filter(r=>r.cell!==4);for(const f of Object.values(s.factions))for(const id of ['s7','s8'])delete f.known[id];assert.equal(E.validateSave(JSON.parse(JSON.stringify(s))).suspects.length,7);});
test('Country hack selects HQ agents and keeps selected target; agent actions stay disabled during the order',()=>{const s=E.createGame('FR',DEFAULT_TEAM_IDS,42),a=E.team(s)[0];const m=countryOperationModel(s,'DE',{type:'cyberSupport',agent:a.id});assert.equal(m.type,'cyberSupport');assert.equal(m.target,'DE');assert.equal(m.selected.a.id,a.id);E.assign(s,a.id,m.type,m.target);assert.equal(a.task.target,'DE');const html=floatingAgentMarkup(s,a.id);assert.doesNotMatch(html,/workspace-inquiry/);assert.match(html,/Se reposer au QG/);assert.match(html,/data-type="rest"[^>]*disabled/);assert.doesNotMatch(html,/data-type="protect"/);});
test('Ally protection is green with explicit ownership and only covers the attack while unexpired',()=>{const s=coop(),p=E.visiblePlots(s)[0];s.factions.US.defense[p.country]=p.turn;assert.match(countryThreatButtons(s,p.country),/threat-covered/);assert.match(countryThreatButtons(s,p.country),/other-coverage.*Couverte par une autre équipe/);assert.match(threatPanel(s),/threat-covered/);s.factions.US.defense[p.country]=p.turn-1;assert.doesNotMatch(countryThreatButtons(s,p.country),/threat-covered/);});
test('Terminal local and synchronized turns reach resolution before final campaign view',()=>{const app=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8');const finish=app.slice(app.indexOf('function finishTurn()'),app.indexOf('function finishTurn()')+900);assert.ok(finish.includes('showReveals('));assert.ok(!finish.includes('ending();return;'));assert.ok(!app.includes('if(next.ended&&(!previous||next.ended!==previous.ended))'));});

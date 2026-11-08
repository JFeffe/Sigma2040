import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {countryOperationTypes,countryOperationModel,countryOperationsMarkup,countrySidebarActions,floatingAgentMarkup} from '../dist/client/country-operations.js';
import {createCountryInquiryController} from '../dist/client/country-inquiry.js';
import {clampWindowPosition} from '../dist/client/floating-windows.js';
const fresh=()=>{const s=E.createGame('FR',DEFAULT_TEAM_IDS,42);s.humanFactions=Object.keys(s.factions);return s;};

test('Country operations expose general actions only and list exclusively own available agents already there',()=>{
 const s=fresh(),[a,b,c,d]=E.team(s);a.country=b.country=c.country='DE';a.weapon=false;b.task={type:'hide',remaining:1,total:1};c.status='captured';d.country='FR';s.agents.find(a=>a.faction==='US').country='DE';
 const types=countryOperationTypes(s,'DE');assert.ok(!types.includes('analyze')); assert.ok(types.includes('equip')&&types.includes('findSafehouse'));
 for(const type of ['collect','prepare','arrest','surveil','hack','travel','sneak'])assert.ok(!types.includes(type));
 const m=countryOperationModel(s,'DE',{type:'equip'});assert.deepEqual(m.rows.map(r=>r.a.id),[a.id]);assert.equal(m.selected.o.chance,E.options(s,a.id,'equip').chance);
 const html=countryOperationsMarkup(s,'DE',{type:'equip'});assert.match(html,/Déployer un agent/);assert.match(html,/Agents disponibles sur place/);assert.ok(html.includes(m.selected.o.chance+' %'));
});

test('Captured agents get a contextual extraction button and equipment respects boosts and availability',()=>{
 const s=fresh(),[a,b]=E.team(s);a.country=b.country='DE';a.weapon=false;b.status='captured';
 assert.match(countrySidebarActions(s,'DE'),new RegExp('data-cmd="rescue-captive"[^>]*data-id="'+b.id+'"'));
 assert.equal(E.options(s,a.id,'rescue',b.id).error,null);
 let m=countryOperationModel(s,'DE',{type:'equip',agent:a.id,boost:true});assert.equal(m.selected.o.chance,E.options(s,a.id,'equip',null,true).chance);
 E.assign(s,a.id,'equip');assert.equal(countryOperationModel(s,'DE',{type:'equip'}).rows.length,0);
 a.task=null;a.weapon=true;assert.ok(countryOperationModel(s,'DE',{type:'equip'}).rows[0].reason);
});

test('Agent sheets offer local actions, preserve mission cancellation and keep allied controls read-only',()=>{
 const s=fresh(),[a]=E.team(s);let html=floatingAgentMarkup(s,a.id);assert.doesNotMatch(html,/data-cmd="(?:agent-rest|confirm-order|pick-agent)"|Affecter une opération/);assert.match(html,/workspace-country/);
 E.assign(s,a.id,'rest');html=floatingAgentMarkup(s,a.id);assert.match(html,/data-cmd="cancel"/);
 const ally=s.agents.find(x=>x.faction==='US');ally.task={...a.task};html=floatingAgentMarkup(s,ally.id);assert.match(html,/consultation uniquement/);assert.doesNotMatch(html,/data-cmd="cancel"/);
});

test('Independent dossier and threat controllers retain their own agent, action and boost across refresh and assignments',async()=>{
 const s=fresh(),[a,b]=E.team(s),targets=E.knownTargets(s);assert.ok(targets.length>=2);const [t,u]=targets;
 a.country=t.country;b.country=u.country;s.factions.FR.access[t.country]=true;s.factions.FR.access[u.country]=true;
 const previous=globalThis.document;globalThis.document={activeElement:null};
 function pane(){let html='';const modal={open:false,className:'country-inquiry-modal',classList:{contains:c=>c==='country-inquiry-modal'},close(){this.open=false;},querySelector(q){return q==='.inquiry-body'?{scrollTop:0}:q==='.country-inquiry'?{remove(){html='';}}:null;},insertAdjacentHTML(_,v){html+=v;}};const controller=createCountryInquiryController({state:()=>s,modal,showModal(h){html=h;modal.open=true;},notify(){},readOnlyReason:()=>'',openAgent(){},async assign(p){E.assign(s,p.id,p.type,p.target,p.useCredits);}});return {controller,modal,html:()=>html};}
 try{
  const first=pane(),second=pane();first.controller.openCountryInquiry(t.id);second.controller.openCountryInquiry(u.id);
  await first.controller.handleInquiryCommand('inquiry-action','collect');await first.controller.handleInquiryCommand('inquiry-agent',a.id);
  await second.controller.handleInquiryCommand('inquiry-action','surveil');await second.controller.handleInquiryCommand('inquiry-agent',b.id);
  first.controller.refreshCountryInquiry();second.controller.refreshCountryInquiry();
  await first.controller.handleInquiryCommand('inquiry-confirm');await second.controller.handleInquiryCommand('inquiry-confirm');
  assert.equal(a.task.type,'collect');assert.equal(a.task.target,t.id);assert.equal(b.task.type,'surveil');assert.equal(b.task.target,u.id);assert.ok(first.modal.open&&second.modal.open);
  first.modal.close();second.controller.refreshCountryInquiry();assert.ok(second.modal.open);assert.match(second.html(),/Missions affectées/);
  const threat=pane(),plot=E.visiblePlots(s)[0];threat.controller.openCountryInquiry(plot.id,true);assert.match(threat.html(),/MENACE/);assert.doesNotMatch(threat.html(),/data-cmd="inquiry-action"/);
 }finally{globalThis.document=previous;}
});

test('Window positions remain reachable after dragging offscreen or resizing to mobile',()=>{
 assert.deepEqual(clampWindowPosition(-50,-60,520,800,1360,900),{x:8,y:8});
 const mobile=clampWindowPosition(1200,850,359,800,375,667);assert.equal(mobile.x,8);assert.ok(mobile.y<=607);
 const p=clampWindowPosition(130,170,440,600,1360,900);assert.deepEqual(p,{x:130,y:170});
});

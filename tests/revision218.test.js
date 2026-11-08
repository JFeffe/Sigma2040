import test from 'node:test';import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {countryOperationTypes,countryOperationTargets,countryOperationModel,countryOperationsMarkup,countrySidebarActions,floatingAgentMarkup} from '../dist/client/country-operations.js';
test('Each player can select a secondary hack destination at HQ or open a country hack directly',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,218);
 for(const player of COUNTRIES.filter(c=>c.power)){
  s.player=player.id;
  for(const c of COUNTRIES){
   const types=countryOperationTypes(s,c.id),destinations=COUNTRIES.filter(x=>!x.power&&!x.expansion).map(x=>[x.id,x.name]);
   assert.equal(types.includes('analyze'),c.id===player.id);
   assert.equal(types.includes('cyberSupport'),c.id===player.id||!c.power&&!c.expansion);
   assert.deepEqual(countryOperationTargets(s,c.id,'cyberSupport'),c.id===player.id?destinations:destinations.filter(([id])=>id===c.id));
   if(types.includes('cyberSupport')){
    const m=countryOperationModel(s,c.id,{type:'cyberSupport',target:'DE'});
    assert.equal(m.target,c.id===player.id?'DE':c.id);
    assert.ok(m.rows.every(r=>r.a.country===player.id&&r.a.faction===player.id));
   }
  }
 }
});
test('Country popup puts deployment in actions, omits the removed summary and keeps agent flags by the name',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,218),a=E.team(s)[0];a.country='TR';a.weapon=false;
 const html=countryOperationsMarkup(s,'TR',{type:'equip'});
 assert.doesNotMatch(html,/country-title-signals|country-authorities|country-operations-cases|équipe sur place/);
 assert.match(html,/class="country-operation-types">.*data-cmd="workspace-deploy"/);
 assert.match(html,/workspace-confirm/);
 const agent=floatingAgentMarkup(s,a.id);assert.doesNotMatch(agent,/Nat\./);assert.match(agent,/<h2>[^<]+ <span class="agent-nationality">/);assert.match(agent,/Nationalité :/);assert.match(agent,/Pays actuel/);
});

function actions(html,scope){
 const group=html.split(`class="${scope}"`)[1].split('</div>')[0];
 return [...group.matchAll(/<button\b([^>]*)>/g)].map(([,attributes])=>[
  attributes.includes('workspace-deploy')?'deploy':(attributes.match(/data-type="([^"]+)"/)||attributes.match(/data-id="([^"]+)"/))[1],
  !/\bdisabled$/.test(attributes.trim())
 ]);
}
const sidebar=(s,country)=>actions(countrySidebarActions(s,country),'country-sidebar-actions');
const popup=(s,country,selection)=>actions(countryOperationsMarkup(s,country,selection),'country-operation-types');

test('HQ action order and disabled states are identical in both menus',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,218),[a,b]=E.team(s);
 const expected=[['deploy',false],['rest',true],['cyberSupport',true],['counter',true],['analyze',false],['heal',false]];
 assert.deepEqual(sidebar(s,'FR'),expected);
 assert.deepEqual(popup(s,'FR'),expected);
 const suspect=E.knownTargets(s)[0],proof=s.proofs.find(p=>p.suspect===suspect.id);
 s.factions.FR.evidence.push({id:proof.id,verified:false,contested:false});
 a.status='injured';b.country='DE';
 expected[0][1]=expected[4][1]=expected[5][1]=true;
 assert.deepEqual(sidebar(s,'FR'),expected);
 assert.deepEqual(popup(s,'FR'),expected);
 const html=countryOperationsMarkup(s,'FR',{type:'analyze'});
 assert.ok(html.includes(`<strong>${suspect.name}</strong><small>`));
 assert.match(html,/data-cmd="workspace-proof"/);
 E.assign(s,a.id,'analyze',proof.id);
 expected[4][1]=expected[5][1]=false;
 assert.deepEqual(sidebar(s,'FR'),expected);
 for(const agent of E.team(s))agent.country='DE';
 assert.deepEqual(popup(s,'FR'),[['deploy',true],['rest',false],['cyberSupport',false],['counter',false],['analyze',false],['heal',false]]);
});

test('Field action menus react to HQ availability, arms and a shared team safehouse',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,218),[a,b]=E.team(s);
 const expected=[['deploy',true],['cyberSupport',true],['equip',false],['findSafehouse',false],['fieldRest',false],['hide',false]];
 assert.deepEqual(sidebar(s,'DE'),expected);
 assert.deepEqual(popup(s,'DE'),expected);
 a.country='DE';a.weapon=false;
 expected[2][1]=expected[3][1]=expected[5][1]=true;
 assert.deepEqual(sidebar(s,'DE'),expected);
 a.weapon=true;b.safehouses=['DE'];
 expected[2][1]=expected[3][1]=false;expected[4][1]=true;
 assert.deepEqual(popup(s,'DE'),expected);
 for(const agent of E.team(s))agent.country='DE';
 expected[0][1]=expected[1][1]=false;
 assert.deepEqual(sidebar(s,'DE'),expected);
});

test('Access actions replace an empty dossier slot with or without a threat',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,218),[a]=E.team(s),f=s.factions.FR;
 const [plot]=E.visiblePlots(s),country=plot.country;
 f.known={};
 assert.match(countrySidebarActions(s,country),/data-group="access"/);
 assert.match(countrySidebarActions(s,country),/data-cmd="country-threat"/);
 plot.resolved=true;
 assert.match(countrySidebarActions(s,country),/data-group="access"/);
 const expected=[['contacts',false],['influence',false],['drone',false],['authorize',false]];
 assert.deepEqual(popup(s,country,{group:'access'}),expected);
 a.country=country;
 for(const action of expected)action[1]=true;
 assert.deepEqual(popup(s,country,{group:'access'}),expected);
 f.access[country]=f.authorized[country]=true;
 f.tech=[{type:'relay',until:s.turn},{type:'ai',until:s.turn}];
 expected[0][1]=expected[2][1]=expected[3][1]=false;
 assert.deepEqual(popup(s,country,{group:'access'}),expected);
 const targets=s.suspects.slice(0,2);
 for(const t of targets)f.known[t.id]={country,identified:true,locationUntil:0};
 assert.doesNotMatch(countrySidebarActions(s,country),/data-group="access"/);
 const html=floatingAgentMarkup(s,a.id,{sidebar:true});
 assert.equal((html.match(/data-cmd="country-inquiry"/g)||[]).length,2);
 assert.doesNotMatch(html,/workspace-inquiry|<h2>/);
});

test('The agent menu shares the country actions but evaluates and assigns them to the selected agent only',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,218),[a,b]=E.team(s);
 a.country=b.country='DE';a.weapon=true;b.weapon=false;
 let html=floatingAgentMarkup(s,a.id,{sidebar:true});
 assert.match(html,/data-cmd="workspace-travel"[^>]*>[\s\S]*?Voyager<\/button>/);
 assert.match(html,/data-type="equip"[^>]*disabled>/);
 assert.match(html,/data-type="cyberSupport"[^>]*disabled>/);
 assert.match(html,/data-type="fieldRest"[^>]*disabled>/);
 assert.doesNotMatch(html,/floating-agent-role/);
 assert.equal(new Map(sidebar(s,'DE')).get('equip'),true);
 const pinned=countryOperationModel(s,'DE',{type:'equip',agentId:a.id});
 assert.deepEqual(pinned.rows.map(r=>r.a.id),[a.id]);
 assert.equal(pinned.selected,null);
 a.weapon=false;
 html=floatingAgentMarkup(s,a.id,{sidebar:true});
 assert.doesNotMatch(html,/data-type="equip"[^>]*disabled>/);
 assert.equal(countryOperationModel(s,'DE',{type:'equip',agentId:a.id}).selected.a.id,a.id);
 assert.equal(countryOperationModel(s,'DE',{type:'equip',agentId:'invalid'}).selected,null);
});

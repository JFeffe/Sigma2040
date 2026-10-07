import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {icon} from '../dist/client/ui.js';
import {makeScreens} from '../dist/client/screens.js';
import {actionResources} from '../dist/client/presentation.js';
import {initCountryInquiry,openCountryInquiry,handleInquiryCommand,refreshCountryInquiry} from '../dist/client/country-inquiry.js';

const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);
function dialog(s){
 let html='',locked='';const body={scrollTop:0};
 const modal={open:false,className:'',classList:{contains:c=>modal.className===c},close(){this.open=false;},querySelector(q){return q==='.inquiry-body'?body:q==='.country-inquiry'?{remove(){html='';}}:null;},insertAdjacentHTML(_,value){html+=value;}};
 const previous=globalThis.document;globalThis.document={activeElement:null};
 initCountryInquiry({state:()=>s,modal,readOnlyReason:()=>locked,notify(){},showModal(h,c){html=h;modal.className=c;modal.open=true;},openAgent(){},async assign(p){E.assign(s,p.id,p.type,p.target,p.useCredits);}});
 return {modal,body,html:()=>html,lock(value){locked=value;},restore(){globalThis.document=previous;}};
}
const buttonTag=(html,id)=>html.match(new RegExp('<button[^>]*id="'+id+'"[^>]*>'))?.[0];

test('Dossier separates mechanical effects from stat, talent, hack and Research; disclosure stays open during selection',async()=>{
 const s=fresh(),a=E.team(s)[0],b=E.team(s)[1],t=E.knownTargets(s)[0];a.country=b.country=t.country;a.stats=[5,5,5];a.talents=['informatique'];s.factions.FR.access[t.country]=true;
 const d=dialog(s);
 try{
  openCountryInquiry(t.id);await handleInquiryCommand('inquiry-action','hack');await handleInquiryCommand('inquiry-agent',a.id);
  assert.match(buttonTag(d.html(),'inquiryEffects'),/aria-expanded="false"/);
  assert.match(d.html(),/Habileté 5/);assert.match(d.html(),/Informatique \+10/);assert.ok(d.html().includes(icon('research')));assert.match(d.html(),/Hack \+1 tour/);
  const mechanics=d.html().match(/<p id="inquiryMechanics"[^>]*>(.*?)<\/p>/s)[1];
  assert.match(mechanics,/preuve brute/);assert.doesNotMatch(mechanics,/Habileté|Informatique|talent/i);
  await handleInquiryCommand('inquiry-effects');d.body.scrollTop=125;await handleInquiryCommand('inquiry-agent',b.id);
  assert.match(buttonTag(d.html(),'inquiryEffects'),/aria-expanded="true"/);assert.equal(d.body.scrollTop,125);assert.match(d.html(),/Informatique · absent/);
  await handleInquiryCommand('inquiry-action','drone');assert.ok(d.html().includes(icon('module')));assert.match(d.html(),/Module · 1 place/);
  assert.doesNotMatch(d.html().match(/<p id="inquiryMechanics"[^>]*>(.*?)<\/p>/s)[1],/Habileté|Drones|talent/i);
 }finally{d.restore();}
});

test('Boost sits above agent chances, toggles both ways and charges only the confirmed boosted order',async()=>{
 const s=fresh(),a=E.team(s)[0],t=E.knownTargets(s)[0],f=s.factions.FR;a.country=t.country;a.stats=[5,5,5];a.talents=[];f.access[t.country]=true;
 const base=E.options(s,a.id,'collect',t.id),boosted=E.options(s,a.id,'collect',t.id,true),budget=f.budget,d=dialog(s);
 try{
  openCountryInquiry(t.id);await handleInquiryCommand('inquiry-action','collect');
  assert.ok(d.html().indexOf('id="inquiryBoost"')<d.html().indexOf('<div class="inquiry-agents">'));assert.ok(d.html().includes(icon('boost')));assert.match(d.html(),new RegExp('\\+10% -6cr/<b[^>]*>'+budget+'</b>'));assert.doesNotMatch(d.html(),/crédits disponibles/);
  await handleInquiryCommand('inquiry-boost');assert.match(buttonTag(d.html(),'inquiryBoost'),/aria-pressed="true"/);assert.match(d.html(),new RegExp('<b>'+boosted.chance+' %</b>'));assert.equal(f.budget,budget);
  await handleInquiryCommand('inquiry-boost');assert.match(buttonTag(d.html(),'inquiryBoost'),/aria-pressed="false"/);await handleInquiryCommand('inquiry-confirm');assert.equal(a.task.chance,base.chance);assert.equal(a.task.bonusCredits,0);assert.equal(f.budget,budget);
  E.cancel(s,a.id);openCountryInquiry(t.id);await handleInquiryCommand('inquiry-action','collect');await handleInquiryCommand('inquiry-boost');await handleInquiryCommand('inquiry-confirm');assert.equal(a.task.chance,boosted.chance);assert.equal(a.task.bonusCredits,6);assert.equal(f.budget,budget-6);
 }finally{d.restore();}
});

test('Budget loss clears and disables boost without blocking a free base action; caps, read-only and prerequisites retain their reasons',async()=>{
 const s=fresh(),a=E.team(s)[0],t=E.knownTargets(s)[0],f=s.factions.FR;a.country=t.country;a.stats=[5,5,5];a.talents=[];f.access[t.country]=true;
 const d=dialog(s);
 try{
  openCountryInquiry(t.id);await handleInquiryCommand('inquiry-action','collect');await handleInquiryCommand('inquiry-boost');f.budget=0;refreshCountryInquiry();
  assert.match(buttonTag(d.html(),'inquiryBoost'),/disabled/);assert.match(buttonTag(d.html(),'inquiryBoost'),/aria-pressed="false"/);assert.match(d.html(),/inquiry-boost-balance is-insufficient">0<\/b>/);assert.match(d.html(),/Budget insuffisant/);await handleInquiryCommand('inquiry-boost');assert.equal(a.task,null);await handleInquiryCommand('inquiry-confirm');assert.equal(a.task.bonusCredits,0);assert.equal(f.budget,0);E.cancel(s,a.id);
  f.budget=18;a.stats[0]=10;a.talents=['enquete'];refreshCountryInquiry();assert.match(buttonTag(d.html(),'inquiryBoost'),/disabled/);assert.match(d.html(),/plafond de 90 %/);await handleInquiryCommand('inquiry-boost');await handleInquiryCommand('inquiry-confirm');assert.equal(a.task.bonusCredits,0);assert.equal(f.budget,18);
  E.cancel(s,a.id);f.access[t.country]=false;openCountryInquiry(t.id);await handleInquiryCommand('inquiry-action','collect');assert.match(d.html(),/accès local/i);assert.match(d.html(),/is-missing/);
  d.lock('Tour confirmé');refreshCountryInquiry();assert.match(d.html(),/Tour confirmé/);assert.match(buttonTag(d.html(),'inquiryBoost'),/disabled/);await handleInquiryCommand('inquiry-confirm');assert.equal(a.task,null);
 }finally{d.restore();}
});

test('Threat boost shows only the current balance, disables below six and re-enables at six without charging the preview',async()=>{
 const s=fresh(),a=E.team(s)[0],p=E.visiblePlots(s)[0],f=s.factions.FR;
 a.country=p.country;a.stats=[5,5,5];a.talents=[];f.budget=5;
 const d=dialog(s);
 try{
  await handleInquiryCommand('country-threat',p.id);await handleInquiryCommand('inquiry-agent',a.id);
  assert.match(d.html(),/\+10% -6cr\/<b class="inquiry-boost-balance is-insufficient">5<\/b>/);
  assert.match(buttonTag(d.html(),'inquiryBoost'),/disabled/);assert.doesNotMatch(d.html(),/crédits disponibles/);
  await handleInquiryCommand('inquiry-boost');assert.match(buttonTag(d.html(),'inquiryBoost'),/aria-pressed="false"/);assert.equal(f.budget,5);
  f.budget=6;refreshCountryInquiry();assert.doesNotMatch(buttonTag(d.html(),'inquiryBoost'),/disabled/);assert.doesNotMatch(d.html(),/inquiry-boost-balance is-insufficient/);
  const boosted=E.options(s,a.id,'protect',p.country,true).chance;
  await handleInquiryCommand('inquiry-boost');assert.match(buttonTag(d.html(),'inquiryBoost'),/aria-pressed="true"/);assert.equal(f.budget,6);
  await handleInquiryCommand('inquiry-confirm');assert.equal(a.task.type,'protect');assert.equal(a.task.chance,boosted);assert.equal(a.task.bonusCredits,6);assert.equal(f.budget,0);
 }finally{d.restore();}
});

test('Energy and exposure are below the agents and distinguish both outcomes using actual talent reductions',async()=>{
 const s=fresh(),a=E.team(s)[0],t=E.knownTargets(s)[0];a.country=t.country;a.talents=['endurance','infiltration'];
 const d=dialog(s);
 try{
  openCountryInquiry(t.id);await handleInquiryCommand('inquiry-action','drone');
  const html=d.html(),costs=html.slice(html.indexOf('<div class="inquiry-costs"'));
  assert.ok(html.indexOf('class="inquiry-costs"')>html.indexOf('class="inquiry-agents"'));assert.match(costs,/<b>−9<\/b> · réussite ou échec/);assert.match(costs,/Réussite <b>\+8<\/b>/);assert.match(costs,/Échec <b>\+15<\/b>/);
 }finally{d.restore();}
});

test('Operation screen keeps slots, blocked reasons and cancellation while removing the requested explanatory blocks and orders box',()=>{
 const s=fresh(),a=E.team(s)[0];E.assign(s,a.id,'protect',s.player);E.activateTech(s,'ai');
 const html=makeScreens(s,s.player,null,[],{}).operations();
 assert.match(html,/Modules d’opération/);assert.ok(html.includes(icon('module')));assert.match(html,/console-capacity is-full/);assert.match(html,/Capacité des Modules : 2 \/ 2/);assert.equal((html.match(/Les deux places sont occupées/g)||[]).length,1);assert.match(html,/data-cmd="cancel"/);assert.match(html,/data-cmd="cancel-tech"/);assert.match(html,/Les deux places sont occupées/);
 assert.doesNotMatch(html,/Ordres de l’unité|opération\(s\) en cours|Les ordres se résolvent|CONFIRMER SUR LA CARTE|console-instructions|console-cancel-rule|console-orders/);
 for(const type of ['protect','drone'])assert.match(actionResources(type),/Module · 1 place/);
 assert.match(actionResources('counter'),/Recherche \+2/);
});

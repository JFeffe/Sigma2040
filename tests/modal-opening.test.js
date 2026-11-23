import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as E from '../dist/client/engine.js';
import {readPreference} from '../dist/client/browser-preferences.js';
import * as tutorialMode from '../dist/client/tutorial-mode.js';
import * as tutorial from '../dist/client/tutorial.js';
import * as ui from '../dist/client/ui.js';
import * as data from '../dist/client/data.js';
import {mapCountries} from '../dist/client/operation-map.js';
import * as presentation from '../dist/client/presentation.js';
import * as operations from '../dist/client/operations-ui.js';
import {energyHelp,exposureMarkup} from '../dist/client/command-ui.js';
import {selectOrderTarget} from '../dist/client/order-targets.js';
import {patchOrderDialog} from '../dist/client/order-dialog.js';
import {localizeContent} from '../dist/client/localization.js';
import {initCountryInquiry,openCountryInquiry,handleInquiryCommand} from '../dist/client/country-inquiry.js';
const source=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8');
function applicationDialog(){
 const modal={open:false,dataset:{},className:'',innerHTML:'',classList:{contains:c=>modal.className===c},showModal(){this.open=true;},close(){this.open=false;},insertAdjacentHTML(_,html){this.innerHTML=html;},querySelector(q){return q==='.inquiry-body'?{scrollTop:0}:null;}};
 const context=vm.createContext({...ui,...data,mapCountries,...presentation,...operations,...tutorial,...tutorialMode,inquiryStorage:null,readPreference,E,energyHelp,exposureMarkup,selectOrderTarget,patchOrderDialog,localizeContent,modal,render(){},multiplayer:{observer:false}});
 // Execute the actual top-level state declarations and dialog functions from the application.
 vm.runInContext(source.match(/^let [^;\n]*;/gm).join('\n')+'\n'+source.match(/^function showModal[^\n]*/m)[0]+'\n'+source.slice(source.indexOf('function agentPager('),source.indexOf('let lastAgentClick=')),context);
 vm.runInContext("state=E.createGame('FR',['p0','p12','p13','p14'],42);",context);
 return {context,modal,state:vm.runInContext('state',context)};
}
test('A selected agent opens the express order with a collapsed briefing and visible confirmation',()=>{
 const {context,modal,state}=applicationDialog();context.openOrder(E.team(state)[0].id,'counter');
 assert.equal(modal.open,true);
 assert.match(modal.innerHTML,/Ordre express/);
 assert.match(modal.innerHTML,/<details class="mission-briefing" id="orderDetails">/);
 assert.match(modal.innerHTML,/<summary[^>]*>Détails<\/summary>[\s\S]*<strong>Risques<\/strong>[\s\S]*<\/details>/);
 assert.match(modal.innerHTML,/<footer class="express-order-footer">[\s\S]*class="mission-timing"[\s\S]*id="orderCredits"[\s\S]*data-cmd="confirm-order"/);
 assert.match(modal.innerHTML,/data-cmd="close"/);
});
test('Dossier popup opens through the application dialog, and its portrait opens a separate agent without replacing the dossier',async()=>{
 const {context,modal,state}=applicationDialog(),t=E.knownTargets(state)[0],a=E.team(state)[0];a.country=t.country;
 const previous=globalThis.document;globalThis.document={activeElement:null};
 try{
 let opened=null;initCountryInquiry({state:()=>state,modal,showModal:context.showModal,openAgent:id=>{opened=id;},readOnlyReason:()=>'',notify(){}});
 openCountryInquiry(t.id);assert.equal(modal.open,true);assert.match(modal.innerHTML,/inquiry-step-rail/);
 await handleInquiryCommand('inquiry-open-agent',a.id);assert.equal(modal.open,true);assert.equal(modal.className,'country-inquiry-modal');assert.equal(opened,a.id);assert.match(modal.innerHTML,/inquiry-step-rail/);
 }finally{globalThis.document=previous;}
});

test('A dossier prepares the express order for the same agent, target and boost selection',async()=>{
 const {context,modal,state}=applicationDialog(),t=E.knownTargets(state)[0],a=E.team(state)[1];
 a.country=t.country;state.factions.FR.access[t.country]=true;
 const previous=globalThis.document;globalThis.document={activeElement:null};
 try{
  let prepared=null;
  initCountryInquiry({state:()=>state,modal,showModal:context.showModal,openAgent:(...args)=>{prepared=args;},readOnlyReason:()=>'',notify(){}});
  openCountryInquiry(t.id,false,a.id);
  assert.match(modal.innerHTML,/data-cmd="inquiry-express"/);
  assert.doesNotMatch(modal.innerHTML,/data-cmd="inquiry-agent"/);
  assert.match(modal.innerHTML,/<footer class="inquiry-footer">[\s\S]*data-cmd="inquiry-boost"/);
  const budget=state.factions.FR.budget;
  await handleInquiryCommand('inquiry-boost');
  await handleInquiryCommand('inquiry-express');
  assert.deepEqual(prepared,[a.id,'collect',t.id,true]);
  assert.equal(state.factions.FR.budget,budget);
  assert.equal(a.task,null);
 }finally{globalThis.document=previous;}
});

test('Training opens the same dialog with honest guaranteed odds and the regular action menu',()=>{
 const {context,modal}=applicationDialog();vm.runInContext("state=createTutorialGame('contact');",context);context.openOrder('p0');
 assert.equal(modal.open,true);assert.equal(modal.className,'order-modal');assert.match(modal.innerHTML,/Formation scénarisée/);assert.match(modal.innerHTML,/Chances de réussite : 100 %/);assert.doesNotMatch(modal.innerHTML,/id="orderCredits"/);assert.match(modal.innerHTML,/<option value="travel"/);assert.match(modal.innerHTML,/<option value="counter"/);
});

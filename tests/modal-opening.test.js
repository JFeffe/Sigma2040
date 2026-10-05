import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as E from '../dist/client/engine.js';
import * as ui from '../dist/client/ui.js';
import * as data from '../dist/client/data.js';
import * as presentation from '../dist/client/presentation.js';
import * as operations from '../dist/client/operations-ui.js';
import {energyHelp,exposureMarkup} from '../dist/client/command-ui.js';
import {selectOrderTarget} from '../dist/client/order-targets.js';
import {patchOrderDialog} from '../dist/client/order-dialog.js';
import {initCountryInquiry,openCountryInquiry,handleInquiryCommand} from '../dist/client/country-inquiry.js';
const source=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8');
function applicationDialog(){
 const modal={open:false,dataset:{},className:'',innerHTML:'',classList:{contains:c=>modal.className===c},showModal(){this.open=true;},close(){this.open=false;},querySelector(q){return q==='.inquiry-body'?{scrollTop:0}:null;}};
 const context=vm.createContext({...ui,...data,...presentation,...operations,E,energyHelp,exposureMarkup,selectOrderTarget,patchOrderDialog,modal,closeBureau(){},render(){},multiplayer:{observer:false}});
 // Execute the actual top-level state declarations and dialog functions from the application.
 vm.runInContext(source.match(/^let [^;\n]*;/gm).join('\n')+'\n'+source.match(/^function showModal[^\n]*/m)[0]+'\n'+source.slice(source.indexOf('function agentPager('),source.indexOf('let lastAgentClick=')),context);
 vm.runInContext("state=E.createGame('FR',['p0','p12','p13','p14'],42);",context);
 return {context,modal,state:vm.runInContext('state',context)};
}
test('Agent action popup opens through the real shared application dialog',()=>{
 const {context,modal,state}=applicationDialog();context.openAgent(E.team(state)[0].id);
 assert.equal(modal.open,true);assert.match(modal.innerHTML,/Affecter une opération/);assert.match(modal.innerHTML,/data-cmd="close"/);
});
test('Dossier popup opens through the application dialog, then its portrait opens the agent action popup',async()=>{
 const {context,modal,state}=applicationDialog(),t=E.knownTargets(state)[0],a=E.team(state)[0];a.country=t.country;
 const previous=globalThis.document;globalThis.document={activeElement:null};
 try{
 initCountryInquiry({state:()=>state,modal,showModal:context.showModal,openAgent:context.openAgent,readOnlyReason:()=>'',notify(){}});
 openCountryInquiry(t.id);assert.equal(modal.open,true);assert.match(modal.innerHTML,/inquiry-step-rail/);
 await handleInquiryCommand('inquiry-open-agent',a.id);assert.equal(modal.open,true);assert.equal(modal.className,'order-modal');assert.match(modal.innerHTML,/Affecter une opération/);
 }finally{globalThis.document=previous;}
});

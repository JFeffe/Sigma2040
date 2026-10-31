import test from 'node:test';
import assert from 'node:assert/strict';
import {resizeWindowRect} from '../dist/client/floating-windows.js';
import {reportCards} from '../dist/client/operations-ui.js';
import * as E from '../dist/client/engine.js';
import {DEFAULT_TEAM_IDS} from '../dist/client/data.js';
test('Resizing every side keeps the opposite edge fixed; corners combine both axes',()=>{
 const r={x:200,y:100,width:500,height:400};
 assert.deepEqual(resizeWindowRect(r,'w',-100,0,1200,900),{x:100,y:100,width:600,height:400});
 assert.deepEqual(resizeWindowRect(r,'n',0,50,1200,900),{x:200,y:150,width:500,height:350});
 assert.deepEqual(resizeWindowRect(r,'se',100,50,1200,900),{x:200,y:100,width:600,height:450});
 for(const edge of ['n','s','e','w','ne','nw','se','sw'])for(const d of [-10000,10000]){
  const q=resizeWindowRect(r,edge,d,d,1200,900);assert.ok(q.x>=8&&q.y>=8&&q.width>=300&&q.height>=180);assert.ok(q.x+q.width<=1192&&q.y+q.height<=892);
 }
 const q=resizeWindowRect({x:8,y:8,width:304,height:224},'se',1000,1000,320,240);assert.deepEqual(q,{x:8,y:8,width:304,height:224});
});
test('Compact turn results retain outcomes, prestige, detailed notes and next steps without portraits',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,42),a=E.team(s)[0];
 s.operationReports=[{agentId:a.id,agent:a.name,faction:'FR',turn:1,type:'equip',country:'FR',status:'RÉUSSITE',duration:1,cost:2,fatigue:10,exposure:0,prestige:2,crisis:0,notes:['Arme récupérée.'],next:'Poursuivre le dossier.'}];
 const h=reportCards(s,1,true);assert.match(h,/compact-mission-reports/);assert.match(h,/RÉUSSITE/);assert.match(h,/2 prestige/);assert.match(h,/Arme récupérée/);assert.match(h,/Poursuivre le dossier/);assert.doesNotMatch(h,/<img/);assert.equal(reportCards(s,2,true),'');
});

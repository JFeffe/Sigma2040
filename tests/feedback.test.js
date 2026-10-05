import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {feedbackSnapshot,feedbackDiff,transmission,trackExperience,resetExperience,feedbackNotices,dismissNotices,activityLinks} from '../dist/client/experience.js';
const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],17);
test('Feedback only uses the player evidence state; hidden authenticity cannot change it',()=>{
 const s=fresh(),before=feedbackSnapshot(s);s.factions.FR.evidence.push({id:'s2-e2',verified:false,contested:false});
 const after=feedbackSnapshot(s),diff=feedbackDiff(before,after);assert.deepEqual(diff.proofs,[{id:'s2-e2',status:'pending',fresh:true}]);s.proofs.find(p=>p.id==='s2-e2').authentic=true;assert.deepEqual(feedbackSnapshot(s),after);
 s.factions.FR.evidence[0].contested=true;assert.equal(feedbackDiff(after,feedbackSnapshot(s)).proofs[0].status,'discarded');
 assert.deepEqual(feedbackDiff(feedbackSnapshot(s),feedbackSnapshot(s)).proofs,[]);
});
test('Exposure alerts follow actual penalty crossings and do not repeat when browsing',()=>{
 const s=fresh(),a=s.agents.find(a=>a.id==='p0');a.exposure=39;const before=feedbackSnapshot(s);a.exposure=40;const after=feedbackSnapshot(s);assert.match(feedbackDiff(before,after).alerts[0].text,/−6/);a.exposure=59;assert.equal(feedbackDiff(after,feedbackSnapshot(s)).alerts.length,0);const near=feedbackSnapshot(s);a.exposure=60;assert.match(feedbackDiff(near,feedbackSnapshot(s)).alerts[0].text,/−9/);
 resetExperience();trackExperience(s);a.exposure=80;trackExperience(s);assert.match(feedbackNotices(),/−12/);dismissNotices();trackExperience(s);assert.equal(feedbackNotices(),'');
});
test('Visual feedback neither mutates the campaign nor speaks for a lost agent',()=>{
 const s=fresh(),before=JSON.stringify(s);resetExperience();trackExperience(s);assert.equal(JSON.stringify(s),before);
 for(const condition of ['dead','captured'])assert.equal(transmission({condition,status:'ÉCHEC',type:'arrest'}),'');
 assert.match(transmission({condition:'ready',status:'INTERROMPUE',type:'arrest'}),/situation a changé/);
 assert.deepEqual(activityLinks(s,{text:'Un événement sans acteur identifié.'}),[]);
});

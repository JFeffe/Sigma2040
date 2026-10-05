import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {newRoom,joinRoom,startRoom,execute,restoreRoom,playerView,PROTOCOL} from '../dist/client/multiplayer-core.js';
import {quickAction} from '../dist/client/quick-actions.js';
import {routeSlots,agentMapMarkers} from '../dist/client/map-markers.js';
import {campaignSummary} from '../dist/client/campaign-stats.js';
import {missionCards,missionRevealMarkup,MISSION_IMAGES,revealDelay} from '../dist/client/mission-reveal.js';
import {setupScreen} from '../dist/client/screens.js';
import {teamBalance} from '../dist/client/team-balance.js';
import {existsSync} from 'node:fs';
const host='host-token-000000000000',guest='guest-token-000000000000',invite='invite-token-0000000000';
const lobby=()=>{const r=newRoom('room-000000000000000000',invite,host,'Hôte');joinRoom(r,{token:guest,invite,name:'Invité'});return r;};
const cmd=(r,token,kind,payload={})=>execute(r,token,{protocol:PROTOCOL,seq:r.members.find(m=>m.token===token).lastSeq+1,turn:r.game?.turn,kind,payload});
const confirmAll=r=>r.members.forEach(m=>cmd(r,m.token,'team',{agents:m.agents.length?m.agents:['p0','p12','p13','p14']}));
const entry=(id,f='US')=>({id,verified:true,contested:false,collectedBy:f,verifiedBy:f});
const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);
test('Unconfirmed teams block both direct and command starts; editing and restoring lobby revoke confirmation',()=>{
 const r=lobby();assert.throws(()=>startRoom(r),/confirmer/);cmd(r,host,'team',{agents:r.members[0].agents.length?r.members[0].agents:['p0','p12','p13','p14']});assert.throws(()=>cmd(r,host,'start'),/confirmer/);confirmAll(r);cmd(r,guest,'country',{country:'CN'});assert.throws(()=>cmd(r,host,'start'),/confirmer/);confirmAll(r);cmd(r,guest,'unconfirm');assert.equal(r.members[1].confirmed,false);confirmAll(r);assert.ok(restoreRoom(r).members.every(m=>!m.confirmed));cmd(r,host,'start');assert.equal(r.phase,'playing');
});
test('Mantis verified pieces survive another target arrested in Japan, private views, export and reconnection',()=>{
 const r=lobby();confirmAll(r);startRoom(r,42);const s=r.game,owner=r.members[1].country,mantis=s.suspects.find(t=>t.id==='s2'),other=s.suspects.find(t=>t.id==='s0');
 mantis.country=other.country='JP';for(const f of ['FR',owner]){s.factions[f].known.s2={country:'JP',identified:true,prepared:false,locationUntil:5};s.factions[f].evidence=[entry('s2-e0',f),entry('s2-e1',f)];}
 const a=E.team(s,'FR')[0];a.country='JP';s.factions.FR.known.s0={country:'JP',identified:true,prepared:true,locationUntil:5};s.factions.FR.evidence.push(entry('s0-e0','FR'),entry('s0-e1','FR'));s.factions.FR.authorized.JP=true;E.assign(s,a.id,'arrest','s0');a.task.chance=100;E.advance(s);assert.equal(other.arrested,true);
 for(const room of [r,restoreRoom(JSON.parse(JSON.stringify(r)))])for(const f of ['FR',owner]){const v=playerView(room,f);assert.equal(E.evidenceFor(v,f,'s2').filter(e=>e.verified).length,2);assert.equal(E.evidenceFor(v,f,'s0').filter(e=>e.verified).length,f==='FR'?2:0);}
 const restored=restoreRoom(JSON.parse(JSON.stringify(r)));joinRoom(restored,{token:guest,invite,name:'Retour'});assert.equal(E.evidenceFor(playerView(restored,owner),owner,'s2').length,2);
});
test('Two pieces disable collection, contested evidence reopens it, concurrent collection cannot overshoot',()=>{
 const s=fresh(),f=s.factions.FR,t=s.suspects.find(t=>t.id==='s0'),agents=E.team(s);f.access[t.country]=true;agents.forEach(a=>a.country=t.country);f.evidence=[entry('s0-e0','FR'),entry('s0-e1','FR')];assert.match(E.options(s,agents[0].id,'collect',t.id).error,/Deux preuves/);
 f.evidence[1].verified=false;f.evidence[1].contested=true;assert.equal(E.options(s,agents[0].id,'collect',t.id).error,null);f.evidence.pop();for(const a of agents.slice(0,2)){E.assign(s,a.id,'collect',t.id);a.task.chance=100;a.task.remaining=1;}E.advance(s);assert.equal(E.evidenceFor(s,'FR',t.id).length,2);assert.equal(s.operationReports.filter(r=>r.type==='collect'&&r.status==='INTERROMPUE').length,1);
});
test('Context suggestions use energy, exposure and known evidence without forcing rest on fresh arrivals',()=>{
 const s=fresh(),a=E.team(s)[0];a.country='JP';a.fatigue=5;a.exposure=5;assert.equal(quickAction(s,a).type,'contacts');a.exposure=60;assert.equal(quickAction(s,a).type,'hide');a.exposure=5;a.fatigue=65;s.factions.FR.safehouses=['JP'];assert.equal(quickAction(s,a).type,'fieldRest');a.task={type:'travel'};assert.equal(quickAction(s,a),null);
});
test('Same and opposite routes have distinct stable portrait slots',()=>{
 const s=fresh(),[a,b]=E.team(s);a.task={type:'travel',origin:'FR',target:'JP',queued:false};b.country='JP';b.task={type:'sneak',origin:'JP',target:'FR',queued:false};const slots=routeSlots(s);assert.equal(Math.abs(slots[a.id]-slots[b.id]),60);assert.match(agentMapMarkers(s),/data-route-offset="-30"/);assert.match(agentMapMarkers(s),/data-route-offset="30"/);
});
test('Turn reveal includes completed missions only, stats persist and private snapshots only disclose owner stats',()=>{
 const s=fresh(),a=E.team(s)[0];a.fatigue=60;E.assign(s,a.id,'rest');E.advance(s);assert.equal(s.turnActivities.length,4);assert.equal(missionCards(s).filter(r=>r.agentId).length,1);const completed=missionCards(s).find(r=>r.agentId===a.id);assert.equal(completed.status,'RÉUSSITE');assert.match(missionRevealMarkup(completed,0,4),/rest.webp/);assert.match(missionRevealMarkup(completed,0,4,true),/RÉUSSITE/);assert.equal(s.campaignStats.factions.FR.rest.count,1);assert.equal(s.campaignStats.factions.FR.rest.fatigue,-50);E.validateSave(structuredClone(s));s.operationReports=[];assert.match(campaignSummary(s),/Se reposer au QG/);
 const r=lobby();r.game=s;assert.deepEqual(Object.keys(playerView(r,'FR').campaignStats.factions),['FR']);assert.ok(playerView(r,'FR').turnActivities.every(x=>x.faction==='FR'));const old=structuredClone(s);delete old.campaignStats;assert.equal(E.validateSave(old).campaignStats.partial,true);
 for(const path of Object.values(MISSION_IMAGES))assert.ok(existsSync(new URL('../dist/client/'+path,import.meta.url)));
});
test('Shared multiplayer composition has the full roster, country controls and informative stat totals',()=>{
 const ids=['p0','p12','p13','p14'],rows=teamBalance(ids);assert.equal(rows.length,3);assert.ok(rows.every(r=>r.total<=40));const html=setupScreen('FR',ids,false,{header:'INVITE ACTIONS',taken:['US']});assert.match(html,/mp-country/);assert.match(html,/mp-select/);assert.match(html,/Équilibre de votre équipe/);assert.ok(html.indexOf('INVITE ACTIONS')<html.indexOf('Choisir votre pays'));assert.doesNotMatch(html,/data-cmd="start"/);
});

test('Reveal skips unfinished and idle agents, preserves private results and removes guaranteed-action suspense',()=>{
 const rows=['EN COURS','SANS ORDRE','EN DÉTENTION','RÉUSSITE','ÉCHEC','INTERROMPUE'].map(status=>({faction:'FR',type:'travel',status,agent:'Test',country:'JP',notes:[]}));
 const s={player:'FR',turnActivities:[...rows,{...rows[3],faction:'US'}]};
 assert.deepEqual(missionCards(s).map(r=>r.status),['RÉUSSITE','ÉCHEC','INTERROMPUE']);
 assert.deepEqual(missionCards({...s,turnActivities:rows.slice(0,3)}),[]);
 for(const type of ['travel','hide','fieldRest','rest','heal'])assert.equal(revealDelay({type,status:'RÉUSSITE'}),0);
 assert.equal(revealDelay({type:'arrest',status:'RÉUSSITE'}),850);
 assert.equal(revealDelay({type:'arrest',status:'ÉCHEC'}),850);
 assert.equal(revealDelay({type:'arrest',status:'INTERROMPUE'}),0);
 assert.match(missionRevealMarkup(rows[3],0,3,true),/outcome-success/);
 assert.match(missionRevealMarkup(rows[4],1,3,true),/outcome-failure/);
});

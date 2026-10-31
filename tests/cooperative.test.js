import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import * as D from '../dist/client/game-setup.js';
import * as M from '../dist/client/multiplayer-core.js';
import {mapAgents,agentMapMarkers} from '../dist/client/map-markers.js';
import {personnelPanel} from '../dist/client/personnel-ui.js';
import {endingScreen} from '../dist/client/ending-ui.js';
import {campaignSummary} from '../dist/client/campaign-stats.js';
const draft=(humans=['FR'],seed=123)=>{const d=D.createDraft(humans,seed,'cooperative');while(D.draftCountry(d))D.pickDraftAgent(d,D.draftCountry(d),D.availableDraftAgents(d)[0].id);return d;};
const fresh=(seed=123,humans=['FR','US'])=>{const d=draft(humans,seed);const s=E.createGame('FR',d.teams.FR,seed,'bb1',{gameMode:'cooperative',participants:d.countries,teams:d.teams});s.humanFactions=humans;return s;};
const reload=s=>E.validateSave(JSON.parse(JSON.stringify(s)));
const cmd=(r,m,kind,payload={})=>M.execute(r,m.token,{protocol:M.PROTOCOL,seq:m.lastSeq+1,turn:r.game?.turn,kind,payload});
const room=(two=true)=>{const r=M.newRoom('r'.repeat(24),'i'.repeat(24),'h'.repeat(24),'Hôte'),h=r.members[0];cmd(r,h,'game-mode',{mode:'cooperative'});if(two)M.joinRoom(r,{invite:r.invite,token:'g'.repeat(24),name:'Allié'});for(const m of r.members)cmd(r,m,'confirm-country');cmd(r,h,'begin-draft');while(r.phase==='draft'){const c=D.draftCountry(r.draft),m=r.members.find(m=>m.country===c);cmd(r,m,'draft-pick',{id:D.availableDraftAgents(r.draft)[0].id});}for(const m of r.members)cmd(r,m,'team',{agents:m.agents});cmd(r,h,'start');return r;};

test('Coop drafts eight unique agents in two-country snake order; unchanged enemy count and 30-turn clock',()=>{
 const d=draft();D.validateDraft(d);assert.equal(d.picks.length,8);assert.deepEqual(d.picks.map(p=>p.country),[d.order[0],d.order[1],d.order[1],d.order[0],d.order[0],d.order[1],d.order[1],d.order[0]]);
 assert.throws(()=>D.createDraft(['FR','US','CN'],1,'cooperative'));
 const s=fresh(),normal=E.createGame('FR',d.teams.FR,123);assert.equal(Object.keys(s.factions).length,2);assert.equal(s.agents.length,8);assert.equal(s.suspects.length,normal.suspects.length);assert.equal(s.proofs.length,normal.proofs.length);assert.equal(s.plots.length,normal.plots.length);assert.equal(new Set(s.agents.map(a=>a.templateId||a.id)).size,8);
 s.turn=30;s.crisis=0;s.plots.forEach(p=>p.resolved=true);E.advance(s);assert.equal(s.ended,'defeat');assert.equal(s.turn,30);
 const v=fresh();v.turn=30;v.crisis=0;v.plots.forEach(p=>p.resolved=true);for(const t of v.suspects)if(t.cell<2||t.cell===3)t.arrested=true;E.advance(v);assert.equal(v.ended,'victory');
});

test('Partner plans before the human, once per turn, and reload preserves exact orders and RNG',()=>{
 const d=draft();let s=E.createConfiguredGame('FR',d.teams.FR,123,'bb1',{gameMode:'cooperative',participants:d.countries,teams:d.teams});
 const npc=d.countries.find(c=>c!=='FR');assert.ok(E.team(s,npc).some(a=>a.task));assert.ok(E.team(s).every(a=>!a.task));const before=JSON.stringify(s);E.prepareCooperativeTurn(s);assert.equal(JSON.stringify(s),before);
 const orders=JSON.stringify(E.team(s,npc).map(a=>a.task)),rng=s.rng;s=reload(s);E.prepareCooperativeTurn(s);assert.equal(s.rng,rng);assert.equal(JSON.stringify(E.team(s,npc).map(a=>a.task)),orders);
 E.advance(s);assert.equal(s.coopPlannedTurn,2);assert.ok(E.team(s,npc).some(a=>a.task));
});

test('Shared evidence can be collected by one faction, verified by the other; duplicate analysis blocked; resources isolated',()=>{
 let s=fresh(),[a,b]=[E.team(s,'FR')[0],E.team(s,'US')[0]],t=E.knownTargets(s)[0];a.country=t.country;s.factions.FR.access[t.country]=true;
 const budget=s.factions.US.budget,cooperation=structuredClone(s.factions.US.cooperation);E.activateTech(s,'relay');assert.equal(s.factions.US.budget,budget);assert.equal(s.factions.US.tech.length,0);assert.deepEqual(s.factions.US.cooperation,cooperation);
 E.assign(s,a.id,'collect',t.id);a.task.chance=100;a.task.remaining=1;E.advance(s);const proof=s.factions.US.evidence[0];assert.ok(proof);assert.equal(proof.collectedBy,'FR');
 s=reload(s);b=E.team(s,'US')[0];a=E.team(s,'FR')[1];assert.strictEqual(s.factions.FR.known,s.factions.US.known);assert.strictEqual(s.factions.FR.evidence,s.factions.US.evidence);
 E.assign(s,b.id,'analyze',proof.id);assert.ok(E.options(s,a.id,'analyze',proof.id).error);b.task.chance=100;b.task.remaining=1;E.advance(s);assert.equal(s.factions.FR.evidence[0].verifiedBy,'US');assert.equal(s.factions.US.score,2);assert.equal(s.factions.FR.score,0);
});

test('Shared preparations and positions allow partner arrest and preserve prestige credit and shared evidence after closing',()=>{
 let s=fresh(),t=s.suspects[0],f=s.factions.FR;f.known[t.id]={country:t.country,identified:true,locationUntil:5,locBy:'FR',prepared:true,prepBy:'FR'};f.access[t.country]=true;f.authorized[t.country]=true;f.evidence.push(...s.proofs.filter(p=>p.suspect===t.id).slice(0,2).map(p=>({id:p.id,verified:true,contested:false,collectedBy:'FR',verifiedBy:'FR'})));
 const a=E.team(s,'US')[0];a.country=t.country;E.assign(s,a.id,'arrest',t.id);a.task.remaining=1;a.task.chance=100;E.advance(s);
 assert.equal(t.arrestedBy,'US');assert.equal(t.arrestedTurn,1);assert.equal(s.factions.FR.score,4);assert.equal(s.factions.US.score,2);assert.strictEqual(s.factions.FR.evidence,s.factions.US.evidence);assert.equal(reload(s).suspects[0].arrestedTurn,1);
});

test('Two-human cooperative room enforces capacity, ownership, ready synchronization and secrecy of enemy internals',()=>{
 const r=room(),[h,g]=r.members;assert.equal(Object.keys(r.game.factions).length,2);assert.ok(r.game.agents.every(a=>!a.task));const view=M.playerView(r,h.country);assert.equal(view.agents.length,8);assert.equal(mapAgents(view).length,8);assert.ok(view.proofs.every(p=>!('authentic' in p)));assert.equal(view.rng,undefined);assert.equal(view.fracture,undefined);assert.equal(view.enemyAttacks,undefined);
 const allied=E.team(r.game,g.country)[0];assert.throws(()=>cmd(r,h,'assign',{id:allied.id,type:'rest'}),/appartient/);assert.throws(()=>cmd(r,h,'cancel',{id:allied.id}),/appartient/);
 cmd(r,g,'assign',{id:allied.id,type:'rest'});assert.equal(M.playerView(r,h.country).agents.find(a=>a.id===allied.id).task.type,'rest');cmd(r,h,'ready',{ready:true});assert.equal(r.game.turn,1);cmd(r,g,'ready',{ready:true});assert.equal(r.game.turn,2);
 const saved=M.restoreRoom(JSON.parse(JSON.stringify(r)));assert.strictEqual(saved.game.factions[h.country].evidence,saved.game.factions[g.country].evidence);
 const lobby=M.newRoom('r'.repeat(24),'i'.repeat(24),'h'.repeat(24),'H');cmd(lobby,lobby.members[0],'game-mode',{mode:'cooperative'});M.joinRoom(lobby,{invite:lobby.invite,token:'g'.repeat(24),name:'G'});assert.throws(()=>M.joinRoom(lobby,{invite:lobby.invite,token:'z'.repeat(24),name:'Z'}));
});

test('Single-human room starts with planned NPC, allied cards are read-only, both teams win, enemies appear at the end',()=>{
 const r=room(false),s=r.game,ally=s.agents.find(a=>a.faction!==s.player);assert.ok(s.agents.some(a=>a.faction!==s.player&&a.task));assert.match(agentMapMarkers(s),/coop-ally/);const panel=personnelPanel(s,ally.id);assert.match(panel,/consultation uniquement/);assert.doesNotMatch(panel,/data-cmd="agent"/);assert.match(panel,/data-cmd="workspace-country"/);assert.doesNotMatch(panel,/data-cmd="agent-rest"[^>]*(?<!disabled)>/);
 s.ended='victory';s.enemyAttacks=[{plotId:s.plots[0].id,turn:3,cell:0,country:s.plots[0].country,status:'RÉUSSIE',crisisDelta:30}];s.factions[s.player].score=10;assert.doesNotMatch(endingScreen(s),/PAYS VAINQUEUR|VICTOIRE NATIONALE/);assert.match(campaignSummary(s,{tab:'enemies'}),/Bilan de Fracture/);assert.deepEqual(M.playerView(r,s.player).enemyAttacks,s.enemyAttacks);
});

test('Coop campaigns survive JSON save/load every turn for every NPC level',()=>{
 for(const level of ['easy','normal','expert','bb1'])for(let seed=1;seed<=4;seed++){
  const d=draft(['FR'],seed);let s=E.createConfiguredGame('FR',d.teams.FR,seed,level,{gameMode:'cooperative',participants:d.countries,teams:d.teams});
  while(!s.ended){s=reload(s);E.planFaction(s,'FR');E.advance(s);assert.ok(s.turn<=30);assert.strictEqual(s.factions[d.countries[0]].evidence,s.factions[d.countries[1]].evidence);}
  assert.ok(s.enemyAttacks?.length);assert.doesNotThrow(()=>reload(s));
 }
});

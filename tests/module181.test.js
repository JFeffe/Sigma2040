import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ROSTER,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {createDraft,advanceNpcDraft,draftCountry,pickDraftAgent,availableDraftAgents} from '../dist/client/game-setup.js';
import {newRoom,joinRoom,startRoom,restoreRoom,playerView} from '../dist/client/multiplayer-core.js';
import {gameShell} from '../dist/client/shell.js';
import {makeScreens} from '../dist/client/screens.js';
import {icon} from '../dist/client/ui.js';

test('Mira uses A6 H7 SF7 in new and restored regular and advanced games, preserving confirmed orders',()=>{
 assert.deepEqual(ROSTER.find(a=>a.id==='p16').stats,[6,7,7]);
 const regular=E.createConfiguredGame('FR',['p16',...DEFAULT_TEAM_IDS.slice(0,3)],42);
 const d=advanceNpcDraft(createDraft(['FR'],42));
 while(draftCountry(d)){pickDraftAgent(d,'FR',availableDraftAgents(d)[0].id);advanceNpcDraft(d);}
 const advanced=E.createConfiguredGame('FR',d.teams.FR,42,'normal',{gameMode:'advanced',participants:d.countries,teams:d.teams});
 for(const s of [regular,advanced]){
  const mira=s.agents.find(a=>(a.templateId||a.id)==='p16');assert.deepEqual(mira.stats,[6,7,7]);
  mira.stats=[8,6,7];E.assign(s,mira.id,'counter');
  const order=structuredClone(mira.task),rng=s.rng,budget=s.factions[mira.faction].budget;
  const restored=E.validateSave(structuredClone(s)),loaded=restored.agents.find(a=>a.id===mira.id);
  assert.deepEqual(loaded.stats,[6,7,7]);assert.deepEqual(loaded.task,order);assert.equal(restored.rng,rng);assert.equal(restored.factions[mira.faction].budget,budget);
  assert.deepEqual(E.validateSave(structuredClone(restored)),restored);
 }
 // The migration only touches Mira's published old stats.
 const custom=structuredClone(regular);custom.agents.find(a=>a.id==='p16').stats=[6,6,6];
 assert.deepEqual(E.validateSave(custom).agents.find(a=>a.id==='p16').stats,[6,6,6]);
});

test('Mira migrates by template ID for every multiplayer team and its private view',()=>{
 const r=newRoom('room-000000000000000181','invite-token-0000000181','host-token-000000000001','Hôte','FR');
 joinRoom(r,{invite:'invite-token-0000000181',token:'guest-token-00000000001',name:'Invité'});
 for(const m of r.members){m.agents=['p16',...DEFAULT_TEAM_IDS.slice(0,3)];m.confirmed=true;}
 startRoom(r,42);
 for(const m of r.members){const a=E.team(r.game,m.country).find(a=>a.templateId==='p16');assert.deepEqual(a.stats,[6,7,7]);a.stats=[8,6,7];}
 const restored=restoreRoom(structuredClone(r));
 for(const m of restored.members){const a=E.team(restored.game,m.country).find(a=>a.templateId==='p16');assert.deepEqual(a.stats,[6,7,7]);assert.deepEqual(playerView(restored,m.country).agents.find(b=>b.id===a.id).stats,[6,7,7]);}
});

test('Module page has one global capacity status that updates after activation, cancellation and expiry',()=>{
 const s=E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,42),a=E.team(s)[0];
 const render=()=>makeScreens(s,s.player,null,[],{}).operations();
 let html=render();assert.match(html,/<h1>Module<\/h1>/);assert.match(html,/console-capacity is-available/);assert.match(html,/2 places disponibles/);
 E.activateTech(s,'ai');html=render();assert.match(html,/1 place disponible/);assert.match(html,/Ce module est déjà actif/);
 E.assign(s,a.id,'protect',s.player);html=render();assert.match(html,/console-capacity is-full/);
 assert.equal((html.match(/Les deux places sont occupées/g)||[]).length,1);assert.doesNotMatch(html,/console-full|console-warning/);
 assert.equal((html.match(/aria-describedby="moduleCapacity"/g)||[]).length,3);
 assert.match(html,/data-cmd="cancel"/);assert.match(html,/data-cmd="cancel-tech"/);
 E.cancel(s,a.id);html=render();assert.match(html,/console-capacity is-available/);assert.match(html,/1 place disponible/);
 s.turn=4;s.factions.FR.budget=0;html=render();assert.match(html,/2 places disponibles/);assert.match(html,/Crédits insuffisants/);assert.doesNotMatch(html,/Les deux places sont occupées/);
 s.ended='defeat';assert.match(render(),/Campagne terminée/);
});

test('Module navigation retains its route and free-place badge with the common module icon',()=>{
 const s=E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,42),html=gameShell(s,'operations','');
 const tab=html.match(/<button[^>]*data-id="operations"[^>]*>[^]*?<\/button>/)[0];
 assert.match(tab,/<span>Module<\/span>/);assert.match(tab,/aria-current="page"/);assert.match(tab,/nav-availability-badge/);assert.ok(tab.includes(icon('module')));
 assert.doesNotMatch(tab,/Opérations|Opération<\/span>/);
});

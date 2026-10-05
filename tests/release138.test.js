import test from 'node:test';import assert from 'node:assert/strict';
import {relayPackets,RelayAssembler} from '../dist/client/relay-packets.js';
import * as E from '../dist/client/engine.js';
import {playerView} from '../dist/client/multiplayer-core.js';
import {endingScreen} from '../dist/client/ending-ui.js';
import {unreadPatchCount,patchNotesPage,PATCH_NOTES} from '../dist/client/patch-notes.js';
test('Large final report crosses the relay in bounded fragments and renders for every player',()=>{
 const s=E.createGame('FR',['p0','p12','p13','p14'],42,'expert');s.ended='victory';
 s.campaignStats.events=Array.from({length:500},(_,i)=>({turn:1,faction:'FR',agentId:'p0',templateId:'p0',agent:'IRIS',type:'analyze',status:'RÉUSSITE',country:'FR',targetName:'Test',chance:70,notes:['É'.repeat(1000)]}));
 for(const country of ['FR','US']){const value={kind:'snapshot',value:{game:playerView({game:s},country)}};assert.ok(JSON.stringify(value).length>300000);const packets=relayPackets(value,'test'),assembler=new RelayAssembler();let result;
 for(const packet of [...packets].reverse()){assert.ok(new TextEncoder().encode(JSON.stringify(packet)).length<290000);const v=assembler.accept(packet);if(v)result=v;}
 assert.deepEqual(result,value);assert.equal(result.value.game.aiDifficulty,'expert');assert.equal(result.value.game.agents.length,s.agents.length);assert.match(endingScreen(result.value.game),/BILAN/);
 }
});
test('Patch notes read marker survives visits and storage failures do not break the page',()=>{
 const values=new Map();globalThis.localStorage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 assert.equal(unreadPatchCount(),PATCH_NOTES.length);assert.match(patchNotesPage(),/NON LUE/);assert.equal(unreadPatchCount(),0);assert.doesNotMatch(patchNotesPage(),/NON LUE/);
 globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.doesNotThrow(patchNotesPage);delete globalThis.localStorage;
});
test('Dismantling hides future plans but cancels active threats from the threats tab',()=>{
 const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.humanFactions=Object.keys(s.factions);s.suspects.filter(t=>t.cell===0).forEach(t=>t.arrested=true);
 const plots=s.plots.filter(p=>p.cell===0);plots[0].turn=3;plots[1].turn=20;plots[1].announced=false;E.advance(s);
 const report=s.cellReports.find(r=>r.cell===0);assert.ok(report.attacks.some(p=>p.plotId===plots[0].id));assert.ok(!report.attacks.some(p=>p.plotId===plots[1].id));assert.ok(!E.visiblePlots(s).some(p=>p.cell===0));assert.ok(plots.every(p=>p.resolved&&p.cancelled));
});

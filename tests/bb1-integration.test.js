import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as E from '../dist/client/engine.js';
import {AI_LEVELS,aiDifficultyControl} from '../dist/client/ai-difficulty.js';
import {newRoom,joinRoom,startRoom,execute,roomView,PROTOCOL} from '../dist/client/multiplayer-core.js';
const ids=['p15','p12','p0','p20'];
test('BB1 is an additional explicit option; Normal remains the default',()=>{
 assert.deepEqual(Object.keys(AI_LEVELS),['easy','normal','expert','bb1']);
 assert.equal(AI_LEVELS.bb1,'BotBrillant1 (BB1)');
 assert.equal(E.createGame('FR',ids,55).aiDifficulty,'normal');
 assert.match(aiDifficultyControl('bb1'),/data-id="bb1" aria-pressed="true"/);
 assert.match(aiDifficultyControl('bb1',true,false),/data-cmd="mp-ai-difficulty" data-id="bb1" aria-pressed="true" disabled/);
 const s=E.createGame('FR',ids,55);delete s.aiDifficulty;assert.equal(E.validateSave(s).aiDifficulty,'normal');
});
test('Easy, Normal and Expert reproduce the complete build-173 campaign states',()=>{
 const {results}=JSON.parse(readFileSync(new URL('./fixtures/build173-legacy-bots.json',import.meta.url)));
 for(const {level,seed,hash} of results){const s=E.createGame('FR',ids,seed,level);s.humanFactions=[];while(!s.ended)E.advance(s);assert.equal(createHash('sha256').update(JSON.stringify(s)).digest('hex'),hash,level+' '+seed);assert.ok(Object.values(s.factions).every(f=>!f.bb1));}
});
test('Only the multiplayer host selects BB1, the room propagates it and humans stay manual',()=>{
 const room=newRoom('bb1-test','invite','host-token-000000000001','Hôte','FR'),guest=joinRoom(room,{invite:'invite',token:'guest-token-00000000001',name:'Invité'});
 assert.throws(()=>execute(room,guest.token,{protocol:PROTOCOL,seq:1,kind:'ai-difficulty',payload:{level:'bb1'}}));
 execute(room,room.members[0].token,{protocol:PROTOCOL,seq:1,kind:'ai-difficulty',payload:{level:'bb1'}});
 for(const m of room.members){m.agents=ids;m.confirmed=true;}
 startRoom(room,55);assert.equal(room.game.aiDifficulty,'bb1');assert.equal(roomView(room,guest.token).aiDifficulty,'bb1');
 E.advance(room.game);
 for(const h of room.game.humanFactions)assert.equal(room.game.factions[h].bb1,undefined);
 for(const [id,f] of Object.entries(room.game.factions))if(!room.game.humanFactions.includes(id))assert.ok(f.bb1);
 assert.equal(E.validateSave(structuredClone(room.game)).aiDifficulty,'bb1');
 assert.throws(()=>execute(room,room.members[0].token,{protocol:PROTOCOL,seq:2,kind:'ai-difficulty',payload:{level:'normal'}}));
});

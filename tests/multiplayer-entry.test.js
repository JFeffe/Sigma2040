import test from 'node:test';
import assert from 'node:assert/strict';
import {Multiplayer} from '../dist/client/multiplayer.js';
test('Multiplayer entry opens and switches join/host without a lobby snapshot',()=>{
 globalThis.document={querySelector:()=>null};
 globalThis.location={hash:'#sigma=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'};
 globalThis.localStorage={getItem:()=>null};
 let html='';const mp=new Multiplayer({modal:value=>{html=value;}});
 try{
  mp.entry();assert.match(html,/id="mpInvite"/);assert.match(html,/aaaaaaaa-aaaa/);assert.doesNotMatch(html,/mp-ai-difficulty/);
  mp.entry('host');assert.match(html,/data-cmd="mp-create"/);assert.doesNotMatch(html,/id="mpInvite"/);
  mp.entry('join');assert.match(html,/data-cmd="mp-join"/);
 }finally{clearInterval(mp.timer);}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {Multiplayer} from '../dist/client/multiplayer.js';
import {newRoom} from '../dist/client/multiplayer-core.js';
test('Multiplayer entry opens and switches join/host without a lobby snapshot',()=>{
 globalThis.document={querySelector:()=>null};
 globalThis.location={hash:'#shadow-mandate=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'};
 globalThis.localStorage={getItem:()=>null};
 let html='';const mp=new Multiplayer({modal:value=>{html=value;}});
 try{
  mp.entry();assert.match(html,/id="mpInvite"/);assert.match(html,/aaaaaaaa-aaaa/);assert.doesNotMatch(html,/mp-ai-difficulty/);assert.match(html,/data-cmd="main-menu"/);
  mp.entry('host');assert.match(html,/data-cmd="mp-create"/);assert.match(html,/id="mpEntryGameMode"/);assert.doesNotMatch(html,/id="mpInvite"/);assert.match(html,/data-cmd="main-menu"/);
  mp.entry('join');assert.match(html,/data-cmd="mp-join"/);
 }finally{clearInterval(mp.timer);}
});

test('Leaving a pending invitation returns to the menu and ignores late connection errors',async()=>{
 const originalConfirm=globalThis.confirm;
 globalThis.confirm=()=>assert.fail('A pending invitation has no seat to confirm leaving');
 const link=new EventEmitter();
 let left=0,closed=0,rendered=0,html='';
 const mp=new Multiplayer({lobby:value=>{html=value;rendered++;},close:()=>closed++,leave:()=>left++});
 try{
  mp.active=true;
  mp.details={id:'room',invite:'invite'};
  mp.peer={connect:()=>link,destroy:()=>link.emit('close')};
  mp.connectGuest();
  mp.panel();
  assert.match(html,/data-cmd="mp-leave"/);
  await mp.handle('mp-leave');
  assert.equal(mp.active,false);
  assert.equal(mp.connection,null);
  assert.equal(closed,1);
  assert.equal(left,1);
  link.emit('error',new Error('Late connection error'));
  assert.equal(rendered,1);
  assert.equal(mp.status,'');
 }finally{clearInterval(mp.timer);globalThis.confirm=originalConfirm;}
});

test('Hosting applies the selected mode before the first lobby snapshot',async()=>{
 const previous=globalThis.document;
 const fields={'#mpName':{value:'Hôte'},'#mpEntryGameMode':{value:'cooperative'}};
 globalThis.document={querySelector:selector=>fields[selector]};
 const mp=new Multiplayer({});
 let created;
 try{
  mp.connect=async room=>{created=room;};
  await mp.handle('mp-create');
  assert.equal(created.phase,'lobby');
  assert.equal(created.gameMode,'cooperative');
  assert.throws(()=>newRoom('test','invite','host','Hôte','FR','invalid'),/Mode de jeu invalide/);
 }finally{clearInterval(mp.timer);globalThis.document=previous;}
});

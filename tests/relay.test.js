import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.js';
import {Multiplayer} from '../dist/client/multiplayer.js';

const migration=readFileSync(new URL('../drizzle/0000_yielding_stingray.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint','');
const waitFor=async(check)=>{for(let i=0;i<80;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Timed out waiting for relay');};

test('host and invited guest exchange private snapshots and orders through the hosted relay',async()=>{
 const db=new DatabaseSync(':memory:');db.exec(migration);
 const env={DB:{prepare(sql){return {bind(...args){const statement=db.prepare(sql);return {first:()=>statement.get(...args),all:()=>({results:statement.all(...args)}),run:()=>statement.run(...args)};}}}},ASSETS:{fetch:()=>new Response('site')}};
 const originalFetch=globalThis.fetch;
 globalThis.fetch=(path,init)=>worker.fetch(new Request(new URL(path,'https://sigma.example'),{...init,headers:{...init.headers,origin:'https://sigma.example'}}),env);
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.sessionStorage={...globalThis.localStorage};globalThis.document={querySelector:()=>null,querySelectorAll:()=>[]};globalThis.location={href:'https://sigma.example/',hash:''};
 const hooks=()=>({modal(){},toast(){},render(){},close(){},state(){},leave(){}});
 const host=new Multiplayer(hooks()),guest=new Multiplayer(hooks());
 try{
  await host.create('Hôte','FR');await waitFor(()=>host.peer?.open);
  await guest.connect(null,host.details,'Invité');await waitFor(()=>guest.snapshot?.members.length===2);
  assert.equal(guest.snapshot.game,null);
  await host.command('team',{agents:['p0','p12','p13','p14']});await guest.command('team',{agents:['p0','p12','p13','p14']});await host.command('start');await waitFor(()=>guest.snapshot.game?.player==='US');
  assert.equal(guest.snapshot.game.rng,undefined);
  const id=guest.snapshot.game.agents[0].id;
  await Promise.race([guest.command('assign',{id,type:'travel',target:'JP'}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Command timeout: '+JSON.stringify({host:host.status,guest:guest.status,members:host.snapshot?.members,links:host.links.size}))),5000))]);
  assert.equal(host.room.game.agents.find(a=>a.id===id).task.target,'JP');
  await host.command('ready',{ready:true});await guest.command('ready',{ready:true});
  await waitFor(()=>guest.snapshot.game.turn===2);
  assert.equal(host.room.game.turn,2);
  host.room.game.ended='victory';host.room.game.aiDifficulty='expert';host.room.game.campaignStats.events=Array.from({length:400},()=>({turn:2,faction:'FR',agentId:'p0',templateId:'p0',agent:'IRIS',type:'analyze',status:'RÉUSSITE',country:'FR',targetName:'Test',chance:70,notes:['Rapport '.repeat(150)]}));host.room.revision++;
  assert.ok(JSON.stringify(host.room.game.campaignStats).length>300000);host.publish();
  await waitFor(()=>guest.snapshot.game?.ended==='victory');assert.equal(guest.snapshot.game.campaignStats.events.length,400);assert.equal(guest.snapshot.game.aiDifficulty,'expert');assert.equal(guest.connection.open,true);
  const invalid=await worker.fetch(new Request('https://sigma.example/api/relay',{method:'POST',headers:{origin:'https://sigma.example'},body:JSON.stringify({action:'poll',id:host.details.id,invite:'x'.repeat(36),peerId:crypto.randomUUID(),cursor:0})}),env);
  assert.equal(invalid.status,404);
 }finally{host.leave();guest.leave();clearInterval(host.timer);clearInterval(guest.timer);await new Promise(resolve=>setTimeout(resolve,100));db.close();globalThis.fetch=originalFetch;for(const name of ['document','location','localStorage','sessionStorage'])delete globalThis[name];}
});

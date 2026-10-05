import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {Multiplayer} from '../dist/client/multiplayer.js';
// An in-memory, asynchronous transport exercises the exact browser controller without claiming a WebRTC integration test.
class Link extends EventEmitter{
 constructor(){super();this.open=false;}
 send(data){if(!this.open)throw Error('Closed link');const value=structuredClone(data);queueMicrotask(()=>{if(this.other.open)this.other.emit('data',value);});}
 close(){this.open=false;this.emit('close');if(this.other?.open){this.other.open=false;this.other.emit('close');}}
}
class Peer extends EventEmitter{
 static peers=new Map();
 constructor(id){super();this.id=id||crypto.randomUUID();this.open=false;this.connections=[];Peer.peers.set(this.id,this);queueMicrotask(()=>{this.open=true;this.emit('open',this.id);});}
 connect(id){const a=new Link(),b=new Link();a.other=b;b.other=a;this.connections.push(a);queueMicrotask(()=>{const other=Peer.peers.get(id);if(!other){this.emit('error',{type:'peer-unavailable'});return;}other.connections.push(b);other.emit('connection',b);a.open=b.open=true;b.emit('open');a.emit('open');});return a;}
 destroy(){this.destroyed=true;this.open=false;for(const c of this.connections)c.close();Peer.peers.delete(this.id);}
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('Host and guest controllers exchange commands, private snapshots, acknowledgements and resume',async()=>{
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.sessionStorage={...globalThis.localStorage};globalThis.document={querySelector:()=>null,querySelectorAll:()=>[]};globalThis.location={href:'https://example.test/',hash:''};globalThis.Peer=Peer;
 const hooks=()=>({modal(){},toast(){},render(){},close(){},state(){},leave(){}});
 const h=new Multiplayer(hooks()),g=new Multiplayer(hooks());let r;
 try{
  await h.create('Hôte','FR');await settle();await g.connect(null,h.details,'Invité');await settle();assert.equal(h.snapshot.members.length,2);assert.equal(g.snapshot.members.length,2);
  await h.command('team',{agents:['p0','p12','p13','p14']});await g.command('team',{agents:['p0','p12','p13','p14']});await h.command('start');await settle();assert.equal(g.snapshot.game.player,'US');assert.equal(g.snapshot.game.rng,undefined);
  const id=g.snapshot.game.agents[0].id;await g.command('assign',{id,type:'travel',target:'JP'});assert.equal(h.room.game.agents.find(a=>a.id===id).task.target,'JP');assert.equal(g.pending,null);assert.equal(g.snapshot.game.factions.US.budget,6);
  await h.command('ready',{ready:true});await settle();assert.equal(g.snapshot.game.turn,1);await g.command('ready',{ready:true});await settle();assert.equal(g.snapshot.game.turn,2);assert.equal(h.snapshot.game.turn,2);
  const reserved=g.snapshot.country;g.connection.close();await settle();assert.equal(h.snapshot.members.find(m=>m.country===reserved).connected,false);
  g.retryPaused=false;g.connectGuest();await settle();assert.equal(g.snapshot.country,reserved);assert.equal(h.snapshot.members.find(m=>m.country===reserved).connected,true);
  const saved=JSON.parse(storage.get('sigma2040-multiplayer-v1'));h.leave();await settle();r=new Multiplayer(hooks());await r.resume(saved);await settle();g.connectGuest();await settle();assert.equal(g.snapshot.game.turn,2);assert.equal(r.snapshot.members.length,2);
 }finally{for(const c of [h,g,r].filter(Boolean)){c.leave();clearInterval(c.timer);}for(const name of ['Peer','document','location','localStorage','sessionStorage'])delete globalThis[name];}
});

test('Observer host tracks two guests, switches perspective locally and resumes without claiming a country',async()=>{
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.sessionStorage={...globalThis.localStorage};globalThis.document={querySelector:()=>null,querySelectorAll:()=>[]};globalThis.location={href:'https://example.test/',hash:''};globalThis.Peer=Peer;
 const hooks=()=>({modal(){},toast(){},render(){},close(){},state(){},leave(){}});const h=new Multiplayer(hooks()),a=new Multiplayer(hooks()),b=new Multiplayer(hooks());let resumed;
 try{
  await h.create('Observateur','FR');await settle();await h.command('observer',{observer:true});await a.connect(null,h.details,'Alice');await settle();storage.delete('sigma-seat-'+h.details.id);await b.connect(null,h.details,'Benoît');await settle();
  for(const g of [a,b])await g.command('team',{agents:['p0','p12','p13','p14']});await h.command('start');await settle();assert.equal(h.me.observer,true);assert.equal(h.snapshot.country,null);assert.equal(a.snapshot.game.agents.length,4);assert.equal(h.snapshot.game.agents.length,8);
  h.observe(b.snapshot.country);await b.command('assign',{id:b.snapshot.game.agents[0].id,type:'travel',target:'JP'});assert.equal(h.snapshot.game.player,b.snapshot.country);assert.equal(h.snapshot.game.agents.find(x=>x.id===b.snapshot.game.agents[0].id).task.target,'JP');await assert.rejects(h.command('ready',{ready:true}),/consultation/);
  await a.command('ready',{ready:true});await b.command('ready',{ready:true});await settle();assert.equal(h.snapshot.game.turn,2);assert.equal(h.snapshot.game.player,b.snapshot.country);
  const saved=structuredClone(h.room);h.leave();await settle();resumed=new Multiplayer(hooks());await resumed.resume(saved);await settle();a.connectGuest();b.connectGuest();await settle();assert.equal(resumed.observer,true);assert.equal(resumed.snapshot.game.turn,2);assert.equal(resumed.snapshot.members.filter(m=>!m.observer&&m.connected).length,2);
 }finally{for(const c of [h,a,b,resumed].filter(Boolean)){c.leave();clearInterval(c.timer);}for(const name of ['Peer','document','location','localStorage','sessionStorage'])delete globalThis[name];}
});

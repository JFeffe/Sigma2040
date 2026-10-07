import {relayPackets,RelayAssembler} from './relay-packets.js?v=181';
// Same-origin HTTP relay. Each browser polls only its own addressed messages.
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const uid=()=>crypto.randomUUID();
class Events{
 constructor(){this.listeners=new Map();}
 on(name,fn){const list=this.listeners.get(name)||[];list.push(fn);this.listeners.set(name,list);return this;}
 emit(name,...args){for(const fn of this.listeners.get(name)||[])fn(...args);}
}
class RelayConnection extends Events{
 constructor(peer,remote){super();this.owner=peer;this.peer=remote;this.open=true;this.outgoing=Promise.resolve();this.assembler=new RelayAssembler();}
 send(value){if(!this.open)throw Error('Connexion fermée.');this.outgoing=this.outgoing.then(async()=>{for(const packet of relayPackets(value,uid())){if(!this.open)return;await this.owner.request('send',{to:this.owner.host?this.peer:'host',value:packet});}}).catch(e=>{this.emit('error',e);this.close(false);});}
 close(notify=true){if(!this.open)return;this.open=false;this.owner.connections.delete(this.peer);if(notify&&!this.owner.destroyed)this.owner.request('send',{to:this.owner.host?this.peer:'host',value:{kind:'relay-close'}}).catch(()=>{});this.emit('close');}
}
export class RelayPeer extends Events{
 constructor(id,{details,hostToken}={}){
  super();this.id=id||uid();this.details=details;this.host=!!hostToken;this.hostToken=hostToken;this.open=false;this.destroyed=false;this.cursor=0;this.connections=new Map();this.failures=0;
  queueMicrotask(async()=>{
   while(!this.destroyed&&!this.open){
    try{if(this.host)await this.request('open');if(this.destroyed)return;this.open=true;this.emit('open',this.id);this.poll();}
    catch(e){this.emit('error',{type:'network',message:e.message});await pause(3000);}
   }
  });
 }
 async request(action,extra={}){
  const body={action,id:this.details.id,invite:this.details.invite,peerId:this.id,...(this.host?{hostToken:this.hostToken}:{}),...extra};
  const response=await fetch('/api/relay',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Relais indisponible.');return data;
 }
 connect(){
  if(!this.open||this.destroyed)throw Error('Relais non connecté.');
  let conn=this.connections.get('host');if(conn?.open)return conn;
  conn=new RelayConnection(this,'host');this.connections.set('host',conn);
  queueMicrotask(()=>conn.open&&conn.emit('open'));
  return conn;
 }
 async poll(){
  while(!this.destroyed){
   try{
    const data=await this.request('poll',{cursor:this.cursor});
    if(this.failures)this.emit('recovered');
    this.failures=0;
    for(const message of data.messages){
     this.cursor=message.id;
     const remote=this.host?message.sender:'host';
     let conn=this.connections.get(remote);
     if(!conn?.open&&this.host){conn=new RelayConnection(this,remote);this.connections.set(remote,conn);this.emit('connection',conn);}
     if(message.value?.kind==='relay-close'){conn?.close(false);continue;}
     if(conn?.open){const value=conn.assembler.accept(message.value);if(value!==null)conn.emit('data',value);}
    }
    await pause(data.messages.length===50?30:1000);
   }catch(e){
    this.failures++;
    if(/Hôte déconnecté/.test(e.message))for(const conn of [...this.connections.values()])conn.close(false);
    if(this.failures===2)this.emit('error',{type:'network',message:e.message});
    await pause(Math.min(5000,1000*this.failures));
   }
  }
 }
 destroy(){for(const conn of [...this.connections.values()])conn.close();this.destroyed=true;this.open=false;}
}

const CHUNK=24000,MAX=16*1024*1024;
export function relayPackets(value,id){const text=JSON.stringify(value);if(text.length>MAX)throw Error('Bilan trop volumineux. Exportez la sauvegarde.');if(text.length<=CHUNK)return [value];const total=Math.ceil(text.length/CHUNK);return Array.from({length:total},(_,index)=>({kind:'relay-chunk',id,index,total,text:text.slice(index*CHUNK,(index+1)*CHUNK)}));}
export class RelayAssembler{
 constructor(){this.pending=new Map();}
 accept(value,now=Date.now()){
  for(const [id,p] of this.pending)if(now-p.time>120000)this.pending.delete(id);
  if(value?.kind!=='relay-chunk')return value;
  const {id,index,total,text}=value;
  if(typeof id!=='string'||id.length>80||!Number.isInteger(total)||total<1||total>Math.ceil(MAX/CHUNK)||!Number.isInteger(index)||index<0||index>=total||typeof text!=='string'||text.length>CHUNK)throw Error('Fragment réseau invalide.');
  if(!this.pending.has(id)){if(this.pending.size>=8)throw Error('Trop de transferts simultanés.');this.pending.set(id,{time:now,total,parts:new Map()});}
  const p=this.pending.get(id);if(p.total!==total)throw Error('Transfert incohérent.');p.parts.set(index,text);
  if(p.parts.size!==total)return null;
  this.pending.delete(id);const full=Array.from({length:total},(_,i)=>p.parts.get(i)).join('');if(full.length>MAX)throw Error('Transfert trop volumineux.');return JSON.parse(full);
 }
}

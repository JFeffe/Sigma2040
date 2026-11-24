// Small UI preferences only; campaign saves never use this fallback store.
const slot=Symbol.for('sigma2040.browser-preferences');
const memory=globalThis[slot]??=new Map();
function decode(raw){if(raw==null)return null;try{const v=JSON.parse(raw);if(v?.sigmaPreference===1&&typeof v.value==='string'&&Number.isFinite(v.updatedAt))return v;}catch{}return {value:String(raw),updatedAt:0};}
export function readPreference(key,fallback=null){
 if(memory.has(key))return memory.get(key).value;
 const candidates=[];
 for(const name of ['localStorage','sessionStorage'])try{const v=decode(globalThis[name]?.getItem(key));if(v)candidates.push(v);}catch{}
 try{const part=globalThis.document?.cookie?.split('; ').find(p=>p.startsWith(encodeURIComponent(key)+'='));if(part){const v=decode(decodeURIComponent(part.slice(part.indexOf('=')+1)));if(v)candidates.push(v);}}catch{}
 candidates.sort((a,b)=>b.updatedAt-a.updatedAt);
 return candidates[0]?.value??fallback;
}
export function writePreference(key,value){
 const previous=decode(readPreference(key)),record={sigmaPreference:1,value:String(value),updatedAt:Math.max(Date.now(),memory.get(key)?.updatedAt+1||0,previous?.updatedAt+1||0)};
 memory.set(key,record);const raw=JSON.stringify(record);let durable=false;
 try{localStorage.setItem(key,raw);durable=localStorage.getItem(key)===raw;}catch{}
 try{sessionStorage.setItem(key,raw);}catch{}
 try{if(typeof document!=='undefined'){document.cookie=`${encodeURIComponent(key)}=${encodeURIComponent(raw)}; Path=/; Max-Age=31536000; SameSite=Lax${globalThis.location?.protocol==='https:'?'; Secure':''}`;durable ||= document.cookie.split('; ').some(p=>p===encodeURIComponent(key)+'='+encodeURIComponent(raw));}}catch{}
 return durable;
}

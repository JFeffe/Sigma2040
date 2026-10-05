// The host remains the authority for game rules and private state. D1 only relays
// short-lived messages between browsers; it never stores the complete campaign.
const ID=/^[a-zA-Z0-9-]{20,80}$/;
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
function bad(message,status=400){return json({error:message},status);}

async function relay(request,env){
 if(request.method!=='POST')return bad('Méthode non autorisée.',405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return bad('Origine refusée.',403);
 if(Number(request.headers.get('content-length'))>300000)return bad('Message trop volumineux.',413);
 const raw=await request.text();if(raw.length>300000)return bad('Message trop volumineux.',413);
 let data;try{data=JSON.parse(raw);}catch{return bad('Message invalide.');}
 const {action,id,invite,hostToken,peerId}=data||{};
 if(!ID.test(id||'')||!ID.test(invite||'')||!ID.test(peerId||''))return bad('Salon invalide.');
 if(!env.DB)return bad('Service des salons indisponible.',503);
 const now=Date.now(),inviteHash=await sha(invite);
 let room=await env.DB.prepare('SELECT invite_hash, host_hash, host_seen FROM relay_rooms WHERE id = ?').bind(id).first();
 if(action==='open'){
  if(!ID.test(hostToken||''))return bad('Hôte invalide.',403);
  const hostHash=await sha(hostToken);
  if(room&&(room.host_hash!==hostHash||room.invite_hash!==inviteHash))return bad('Ce salon est déjà hébergé ailleurs.',409);
  if(room)await env.DB.prepare('UPDATE relay_rooms SET host_seen = ? WHERE id = ?').bind(now,id).run();
  else await env.DB.prepare('INSERT INTO relay_rooms (id, invite_hash, host_hash, host_seen, created_at) VALUES (?, ?, ?, ?, ?)').bind(id,inviteHash,hostHash,now,now).run();
  await env.DB.prepare('DELETE FROM relay_messages WHERE created_at < ?').bind(now-10*60*1000).run();
  await env.DB.prepare('DELETE FROM relay_rooms WHERE host_seen < ?').bind(now-48*60*60*1000).run();
  return json({ok:true});
 }
 if(!room||room.invite_hash!==inviteHash)return bad('Salon introuvable ou lien invalide.',404);
 const host=!!hostToken&&await sha(hostToken)===room.host_hash;
 if(host)await env.DB.prepare('UPDATE relay_rooms SET host_seen = ? WHERE id = ?').bind(now,id).run();
 if(!host&&now-room.host_seen>20000)return bad('Hôte déconnecté — la partie est en pause.',503);
 if(action==='send'){
  const {to,value}=data;
  if(!value||typeof value!=='object'||Array.isArray(value))return bad('Message invalide.');
  if(host?!ID.test(to||''):to!=='host')return bad('Destinataire invalide.',403);
  await env.DB.prepare('INSERT INTO relay_messages (room_id, target, sender, payload, created_at) VALUES (?, ?, ?, ?, ?)').bind(id,to,host?'host':peerId,JSON.stringify(value),now).run();
  return json({ok:true});
 }
 if(action==='poll'){
  const cursor=data.cursor;
  if(!Number.isSafeInteger(cursor)||cursor<0)return bad('Curseur invalide.');
  const rows=await env.DB.prepare('SELECT id, sender, payload FROM relay_messages WHERE room_id = ? AND target = ? AND id > ? ORDER BY id LIMIT 50').bind(id,host?'host':peerId,cursor).all();
  return json({messages:rows.results.map(row=>({id:row.id,sender:row.sender,value:JSON.parse(row.payload)}))});
 }
 return bad('Action inconnue.');
}

export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/api/relay'){
  try{return await relay(request,env);}catch(error){console.error('relay request failed',error);return bad('Service des salons temporairement indisponible.',503);}
 }
 return env.ASSETS?.fetch(request)??bad('Page introuvable.',404);
}};

import {COUNTRIES,COUNTRY} from './data.js?v=200';
// Geographic distance on a sphere, including routes across the date line.
const distance=(a,b)=>{const rad=Math.PI/180,p=a.pos[1]*rad,q=b.pos[1]*rad;return Math.acos(Math.max(-1,Math.min(1,Math.sin(p)*Math.sin(q)+Math.cos(p)*Math.cos(q)*Math.cos((a.pos[0]-b.pos[0])*rad))));};
export function placeSuspects(s,random){
 const countries=COUNTRIES.filter(c=>!c.power).map(c=>c.id);
 // One regular lead per secondary country guarantees nearby starting dossiers
 // for every power without favouring a country in the random distribution.
 for(let i=countries.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[countries[i],countries[j]]=[countries[j],countries[i]];}
 s.suspects.filter(t=>t.cell!==3).forEach((t,i)=>{t.country=countries[i];});
 for(const t of s.suspects.filter(t=>t.cell===3))t.country=countries[Math.floor(random(s)*countries.length)];
}

export function refuge(s,t,random){
 const available=COUNTRIES.filter(c=>!c.power&&c.id!==t.country&&s.suspects.filter(x=>!x.arrested&&x.country===c.id).length<2);
 return available[Math.floor(random(s)*available.length)].id;
}

// Upgrade only active campaigns; preserve solved cases and all collected evidence.
export function restoreSecondaryCountries(s,write){
 if(s.ended)return;
 const destination=origin=>COUNTRIES.filter(c=>!c.power&&s.suspects.filter(t=>!t.arrested&&t.country===c.id).length<2).sort((a,b)=>distance(COUNTRY[origin],a)-distance(COUNTRY[origin],b))[0].id;
 const moved=new Set();
 for(const t of s.suspects.filter(t=>!t.arrested&&COUNTRY[t.country].power)){
  t.country=destination(t.country);moved.add(t.id);
  for(const f of Object.values(s.factions)){const k=f.known[t.id];if(k){k.country=t.country;k.locationUntil=0;k.prepared=false;write(s,`${t.name} : piste transférée à ${COUNTRY[t.country].city} après la mise à jour. Preuves conservées ; localisation et préparation à refaire.`,'info',f.id);}}
 }
 for(const flight of s.fracture?.flights||[])if(COUNTRY[flight.to].power)flight.to=destination(flight.to);
 for(const a of s.agents)if(a.task&&(moved.has(a.task.target)&&['collect','surveil','hack','prepare','arrest','drone'].includes(a.task.type)||a.country===a.faction&&['drone','rescue'].includes(a.task.type))){
  const f=s.factions[a.faction];f.budget+=a.task.cost;a.task=null;
  write(s,`${a.name} : ordre devenu incompatible annulé et remboursé après la mise à jour.`,'info',a.faction);
 }
}

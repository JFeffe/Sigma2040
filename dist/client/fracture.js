import {threatCountryClear,relocationCountries} from './threat-placement.js?v=196';
import {cellName,namedCells} from './data.js?v=196';
import {campaignRules} from './campaign-rules.js?v=196';
import {refuge} from './placement.js?v=196';
import {COUNTRIES,COUNTRY} from './data.js?v=196';
// Only resolved, observable events enter Fracture's knowledge. Never inspect agent orders.
export function initFracture(s){s.fracture??={version:1,cells:Array.from({length:3},()=>({pressure:0,resources:4,cooldown:0})),flights:[],moved:[],defenses:{}};return s.fracture;}
export function observeFracture(s,cell,amount){if(cell>=0&&cell<3){const f=initFracture(s);f.cells[cell].pressure=Math.min(6,f.cells[cell].pressure+amount);}}
export function observeProtection(s,country,until){initFracture(s).defenses[country]=Math.max(initFracture(s).defenses[country]||0,until);}
export const THREAT_NOTICE_TURNS=5;
export const MIN_RELOCATION_LEAD=4;
export const threatAnnounced=(s,p)=>!!p.announced||p.turn-s.turn<=THREAT_NOTICE_TURNS;
export const plotStage=(s,p)=>p.turn-s.turn>3?'Préparation':p.turn-s.turn>1?'Logistique':'Attaque imminente';
export function tickFracture(s,random,write){
 const f=initFracture(s),say=(text,faction=null)=>write(s,text,'warning',faction);
 const knownMessage=(id,text)=>{for(const nation of Object.values(s.factions))if(nation.known[id])say(text,nation.id);};
 const postpone=(p,n,reason,origin=p.country)=>{const delta=Math.min(n,2-(p.fractureDelay||0),campaignRules(s).maxTurns-p.turn);if(delta>0&&threatCountryClear(s,p,p.country,p.turn+delta)){const oldTurn=p.turn;p.turn+=delta;p.fractureDelay=(p.fractureDelay||0)+delta;p.announced=true;(s.attackDelayReports??=[]).push({type:'postponement',plotId:p.id,cell:p.cell,origin,country:p.country,oldTurn,attackTurn:p.turn,turn:s.turn,kind:p.kind,reason});return delta;}return 0;};
 for(const flight of f.flights)if(s.suspects.find(t=>t.id===flight.id).arrested)for(const nation of Object.values(s.factions))if(nation.known[flight.id])delete nation.known[flight.id].flightUntil;
 // Missions resolve first: an arrest on the advertised departure turn can stop a flight.
 for(const flight of f.flights.filter(x=>x.turn<=s.turn)){
  const t=s.suspects.find(t=>t.id===flight.id);
  if(!t.arrested){const origin=t.country;t.country=flight.to;f.moved.push(t.id);
   for(const nation of Object.values(s.factions)){const k=nation.known[t.id];if(k){if(origin!==t.country)(s.flightReports??=[]).push({type:'flight',faction:nation.id,suspectId:t.id,origin,country:t.country,turn:s.turn});k.country=t.country;k.locationUntil=0;delete k.flightUntil;}}
   knownMessage(t.id,`Fracture — ${t.name} a quitté ${COUNTRY[origin].city}. Une trace mène à ${COUNTRY[t.country].city} : position à confirmer. Preuves et dossier conservés.`);
  }else for(const nation of Object.values(s.factions))if(nation.known[t.id])delete nation.known[t.id].flightUntil;
 }
 f.flights=f.flights.filter(x=>x.turn>s.turn&&!s.suspects.find(t=>t.id===x.id).arrested);
 for(let cell=0;cell<3;cell++){
  const c=f.cells[cell],members=s.suspects.filter(t=>t.cell===cell&&!t.arrested);
  if(!members.length||c.cooldown>s.turn||c.resources<=0)continue;
  const p=s.plots.filter(p=>p.cell===cell&&!p.resolved&&p.turn>s.turn).sort((a,b)=>a.turn-b.turn)[0];
  if(c.pressure>=3&&c.resources>=2){
   const t=members.find(t=>!f.moved.includes(t.id)&&!f.flights.some(x=>x.id===t.id));
   if(t&&s.turn<=36){
    const to=refuge(s,t,random);
    f.flights.push({id:t.id,to,turn:s.turn+2});c.resources-=2;c.pressure=0;c.cooldown=s.turn+4;
    for(const nation of Object.values(s.factions))if(nation.known[t.id])nation.known[t.id].flightUntil=s.turn+2;
    knownMessage(t.id,`Fracture — Départ en préparation : ${t.name} pourrait quitter ${COUNTRY[t.country].city} à la fin du tour ${s.turn+2}. Intervenez avant son départ ou poursuivez sa piste.`);
    if(p){const delay=postpone(p,1,'flight');if(delay)say(`Fracture — La fuite désorganise la ${cellName(cell)}. Attaque à ${COUNTRY[p.country].city} retardée au tour ${p.turn}.`);}
    continue;
   }
  }
  // Only established protections are known, never queued or ongoing protection orders.
  const mayRelocate=p&&cell===1&&c.resources>=2&&p.turn-s.turn>=MIN_RELOCATION_LEAD&&p.turn-s.turn<=THREAT_NOTICE_TURNS&&(f.defenses[p.country]||0)>=s.turn;
  const mayPostpone=p&&p.turn<=s.turn+3&&(f.defenses[p.country]||0)>=p.turn;
  // This runs after orders resolve: a four-turn lead still leaves at least
  // three turns when control returns. React only to established protection,
  // even if it expires before the attack; never inspect planned missions.
  if(p&&!p.adapted&&(mayRelocate||mayPostpone)){
   const old=p.country;let kind='report';
   if(mayRelocate){
    const choices=relocationCountries(s,p,COUNTRIES.filter(x=>x.id!==old&&(f.defenses[x.id]||0)<p.turn+1),p.turn+1);
    if(choices.length){p.country=choices[Math.floor(random(s)*choices.length)].id;kind='cible';}
   }
   if(kind==='report'&&!mayPostpone)continue;
   const delay=postpone(p,kind==='cible'?1:2,kind==='cible'?'relocation':'protection',old);
   if(!delay){p.country=old;continue;}
   c.resources-=kind==='cible'?2:1;c.cooldown=s.turn+3;p.adapted=true;p.announced=true;
   // Keep the paid protection at its original location; do not silently move it.
   for(const r of s.requests||[])if(r.plot===p.id){r.country??=old;r.deadline??=p.turn-delay;if(r.status==='pending')r.status='expired';}
   say(kind==='cible'?`Fracture — Transfert logistique détecté : l’attaque prévue à ${COUNTRY[old].city} vise maintenant ${COUNTRY[p.country].city}, au tour ${p.turn}. La protection reste à ${COUNTRY[old].city}.`:`Fracture — La protection de ${COUNTRY[old].city} perturbe la ${cellName(cell)}. Attaque reportée au tour ${p.turn} ; vérifiez la durée de votre couverture.`);
  }
 }
}
export function validateFracture(s){
 const f=initFracture(s),int=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi,bad=()=>{throw Error('Sauvegarde Fracture incompatible ou endommagée.');};
 if(f.version!==1||!Array.isArray(f.cells)||f.cells.length!==3||f.cells.some(c=>!c||!int(c.pressure,0,6)||!int(c.resources,0,4)||!int(c.cooldown,0,44))||!Array.isArray(f.flights)||f.flights.length>6||!Array.isArray(f.moved)||f.moved.length>6||!f.defenses||typeof f.defenses!=='object'||Array.isArray(f.defenses))bad();
 const valid=id=>s.suspects.some(t=>t.id===id&&t.cell<3);
 if(new Set(f.moved).size!==f.moved.length||f.moved.some(id=>!valid(id))||new Set(f.flights.map(x=>x.id)).size!==f.flights.length||f.flights.some(x=>!valid(x.id)||f.moved.includes(x.id)||!COUNTRY[x.to]||!int(x.turn,1,40)))bad();
 if(Object.entries(f.defenses).some(([id,until])=>!COUNTRY[id]||!int(until,1,44)))bad();
 for(const r of s.requests||[])if(r.country!==undefined&&!COUNTRY[r.country]||r.deadline!==undefined&&!int(r.deadline,1,40))bad();
 for(const p of s.plots)if(p.fractureDelay!==undefined&&!int(p.fractureDelay,0,2)||p.adapted!==undefined&&typeof p.adapted!=='boolean'||p.announced!==undefined&&typeof p.announced!=='boolean')bad();
 for(const nation of Object.values(s.factions))for(const k of Object.values(nation.known))if(k.flightUntil!==undefined&&!int(k.flightUntil,1,40))bad();
 return s;
}

import {COUNTRIES,DISPLAY_ROSTER} from './data.js?v=183';

export const GAME_MODES=Object.freeze({regular:'Régulier',advanced:'Avancé'});
export const PARTICIPANT_COUNT=4;
const powers=COUNTRIES.filter(c=>c.power).map(c=>c.id);
const fail=()=>{throw Error('Repêchage incompatible ou endommagé.');};
const next=s=>{s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;};
function shuffle(list,s){const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(next(s)*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function validHumans(humans){return Array.isArray(humans)&&humans.length>=1&&humans.length<=4&&new Set(humans).size===humans.length&&humans.every(c=>powers.includes(c));}
export function selectParticipants(humans,seed=Date.now()){
 if(!validHumans(humans))throw Error('Choisissez de un à quatre pays distincts.');
 const selected=new Set([...humans,...shuffle(powers.filter(c=>!humans.includes(c)),{rng:(seed^0x6a09e667)>>>0}).slice(0,4-humans.length)]);
 return powers.filter(c=>selected.has(c));
}
export function createDraft(humans,seed=Date.now()){
 const countries=selectParticipants(humans,seed),s={rng:(seed^0xbb67ae85)>>>0};
 const order=shuffle(countries,s);
 return {version:1,seed:seed>>>0,rng:s.rng,humans:[...humans],countries,order,teams:Object.fromEntries(countries.map(c=>[c,[]])),picks:[]};
}
export function draftCountry(d){const n=d.picks.length;if(n>=16)return null;const round=Math.floor(n/4),slot=n%4;return d.order[round%2?3-slot:slot];}
export function availableDraftAgents(d){const used=new Set(d.picks.map(p=>p.id));return DISPLAY_ROSTER.filter(a=>!used.has(a.id));}
export function pickDraftAgent(d,country,id){
 if(draftCountry(d)!==country)throw Error('Attendez le tour de votre pays.');
 if(!availableDraftAgents(d).some(a=>a.id===id))throw Error('Cet agent a déjà été choisi.');
 d.picks.push({country,id});d.teams[country].push(id);return d;
}
export function advanceNpcDraft(d){
 for(let country;(country=draftCountry(d))&&!d.humans.includes(country);){
  const team=d.teams[country].map(id=>DISPLAY_ROSTER.find(a=>a.id===id)),totals=[0,1,2].map(i=>team.reduce((n,a)=>n+a.stats[i],0)),weak=totals.indexOf(Math.min(...totals));
  const pool=availableDraftAgents(d),weights=pool.map(a=>1+(team.length?Math.max(0,a.stats[weak]-5)*2:0));
  let roll=next(d)*weights.reduce((n,v)=>n+v,0);const selected=pool.find((a,i)=>(roll-=weights[i])<0)||pool.at(-1);
  pickDraftAgent(d,country,selected.id);
 }
 return d;
}
export function validateDraft(d){
 const integer=n=>Number.isInteger(n)&&n>=0&&n<=4294967295;
 if(!d||d.version!==1||!integer(d.seed)||!integer(d.rng)||!validHumans(d.humans)||!Array.isArray(d.countries)||d.countries.length!==4||new Set(d.countries).size!==4||d.countries.some(c=>!powers.includes(c))||d.humans.some(c=>!d.countries.includes(c))||!Array.isArray(d.order)||d.order.length!==4||new Set(d.order).size!==4||d.order.some(c=>!d.countries.includes(c))||!Array.isArray(d.picks)||d.picks.length>16||!d.teams||Object.keys(d.teams).length!==4||Object.keys(d.teams).some(c=>!d.countries.includes(c)))fail();
 const teams=Object.fromEntries(d.countries.map(c=>[c,[]])),seen=new Set();
 for(let i=0;i<d.picks.length;i++){const p=d.picks[i],slot=i%4,country=d.order[Math.floor(i/4)%2?3-slot:slot];if(!p||p.country!==country||seen.has(p.id)||!DISPLAY_ROSTER.some(a=>a.id===p.id))fail();seen.add(p.id);teams[country].push(p.id);}
 for(const c of d.countries)if(!Array.isArray(d.teams[c])||d.teams[c].join(',')!==teams[c].join(','))fail();
 return d;
}
export function publicDraft(d){if(!d)return null;const {version,humans,countries,order,teams,picks}=d;return structuredClone({version,humans,countries,order,teams,picks});}
export function sameTeam(ids,owned){return Array.isArray(ids)&&ids.length===4&&new Set(ids).size===4&&owned?.length===4&&ids.every(id=>owned.includes(id));}
export function reorderTeam(ids,id,direction){
 const out=[...ids],i=out.indexOf(id);if(i<0)return out;
 const j=direction==='chief'?0:direction==='before'?i-1:i+1;if(j<0||j>=out.length)return out;
 if(direction==='chief'){out.splice(i,1);out.unshift(id);}else [out[i],out[j]]=[out[j],out[i]];
 return out;
}

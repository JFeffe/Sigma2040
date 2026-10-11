import {SUSPECTS} from './data.js?v=186';
// s0–s5 are stable campaign slots (two per cell); templateId is the drawn identity.
// Keeping slots preserves all mission, evidence and threat rules, including old saves.
export const CRIMINAL_POOL=[
 ...SUSPECTS.filter(t=>t.id!=='s6').map(({id,name,role})=>({id,name,role})),
 {id:'s7',name:'Sable',role:'Transactions clandestines'},
 {id:'s8',name:'Rook',role:'Transport clandestin'},
 {id:'s9',name:'Nyx',role:'Communications chiffrées'},
 {id:'s10',name:'Silas',role:'Blanchiment de capitaux'},
 {id:'s11',name:'Vega',role:'Logistique de terrain'},
 {id:'s12',name:'Onyx',role:'Vol de données sensibles'}
];
export function selectCriminals(s,random){
 // An independent stream changes identities only, never the campaign's gameplay rolls.
 const rng={rng:(s.seed^0x6c8e9cf5)>>>0},pool=[...CRIMINAL_POOL];
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random(rng)*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 s.suspects.filter(t=>t.id!=='s6').forEach((t,i)=>{const p=pool[i];Object.assign(t,{templateId:p.id,name:p.name,role:p.role});});
}

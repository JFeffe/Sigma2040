export const isCooperative=s=>s?.gameMode==='cooperative';
export const visibleTeam=s=>s.agents.filter(a=>(a.faction===s.player||isCooperative(s))&&!['dead','retired'].includes(a.status));
export function bindCooperativeIntel(s){
 if(!isCooperative(s))return s;
 const factions=Object.values(s.factions),shared={known:{},evidence:[],access:{},authorized:{}};
 for(const f of factions){
  for(const field of ['known','access','authorized'])Object.assign(shared[field],f[field]);
  for(const e of f.evidence)if(!shared.evidence.some(p=>p.id===e.id))shared.evidence.push(e);
 }
 for(const f of factions)for(const field of Object.keys(shared))f[field]=shared[field];
 return s;
}

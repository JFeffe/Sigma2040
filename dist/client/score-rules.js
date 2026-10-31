// Discard fractional shared awards, but preserve integer awards despite floating-point noise.
const wholePoints=n=>Math.floor(n+1e-9);
export function normalizePrestige(s){
 const removed={};
 for(const e of s.prestigeLedger||[]){const points=wholePoints(e.points);removed[e.faction]=(removed[e.faction]||0)+e.points-points;e.points=points;}
 for(const f of Object.values(s.factions))f.score=Math.max(0,wholePoints(f.score-(removed[f.id]||0)));
 for(const r of s.attackReports||[]){const count=r.participants.length;if(count)r.prestigeTotal=wholePoints((r.prestigeTotal??6)/count)*count;}
 for(const r of [...(s.operationReports||[]),...(s.turnActivities||[])])if(Number.isFinite(r.prestige))r.prestige=Math.round(r.prestige);
 // Aggregated mission gains were calculated by subtracting fractional faction totals.
 const roundGains=value=>{if(!value||typeof value!=='object')return;for(const [key,v] of Object.entries(value)){if(key==='prestige'&&Number.isFinite(v))value[key]=Math.round(v);else if(v&&typeof v==='object')roundGains(v);}};
 roundGains(s.campaignStats);
 for(const log of s.logs||[])if(log.type==='score')log.text=log.text.replace(/\+([0-9]+(?:\.[0-9]+)?) prestige/g,(_,n)=>`+${wholePoints(Number(n))} prestige`);
 return s;
}

// Seeded BB2-only benchmark. Arguments: mode, count, starting index.
// Example: node scripts/benchmark-bb1-priorities.mjs cooperative 300 300
import * as E from '../dist/client/engine.js';import * as D from '../dist/client/game-setup.js';import {DISPLAY_ROSTER} from '../dist/client/data.js';import {writeFileSync} from 'node:fs';
const [mode='cooperative',nArg='150',startArg='0']=process.argv.slice(2),n=+nArg,start=+startArg;
const rows=[],examples=[];const inc=(o,k,v=1)=>o[k]=(o[k]||0)+v;
for(let i=start;i<start+n;i++){
 const seed=730001+i*7919,humans=['FR'],participants=D.selectParticipants(humans,seed,mode);let teams={};
 if(mode==='cooperative'||mode==='advanced'){const d=D.createDraft(humans,seed,mode);d.humans=[];D.advanceNpcDraft(d);teams=d.teams;}
 else for(let j=0;j<participants.length;j++)teams[participants[j]]=Array.from({length:4},(_,k)=>DISPLAY_ROSTER[(i*7+j*4+k)%DISPLAY_ROSTER.length].id);
 let s=E.createGame('FR',teams.FR,seed,'bb2',{gameMode:mode,participants,teams});s.humanFactions=[...participants];
 const orders={},actionTurns={},decisions={},reasons={},moduleBuys={},favorUses={},metrics={idle:0,slots:0,analystChanges:0,homeAnalystTurns:0,analystForcedReturns:0,extraProofOrders:0,protectionOpportunitiesIgnored:0,plansRedirected:0,techSlotsMax:0};
 const lastAnalyst={},lastPlans={};const traces=[];
 while(!s.ended){const turn=s.turn;
  for(const f of i%2?[...participants].reverse():participants){
   const before=E.team(s,f).filter(a=>!a.task).map(a=>({a:a.id,c:a.country,opps:E.visiblePlots(s).filter(p=>p.country===a.country&&p.turn===turn+1&&!Object.values(s.factions).some(ff=>ff.defense[p.country]>=p.turn)&&!E.options(s,a.id,'protect').error).map(p=>p.id)}));
   const oldTech=new Set(s.factions[f].tech.map(t=>t.id));E.planFaction(s,f);const mem=s.factions[f].bb2;if(!mem)throw Error('Non BB2 planner');
   if(lastAnalyst[f]&&lastAnalyst[f]!==mem.analyst)metrics.analystChanges++;lastAnalyst[f]=mem.analyst;
   const analyst=s.agents.find(a=>a.id===mem.analyst);if(analyst?.country===f)metrics.homeAnalystTurns++;
   for(const t of s.factions[f].tech)if(!oldTech.has(t.id))inc(moduleBuys,t.type);
   for(const d of mem.decisions){inc(decisions,d.type);inc(reasons,d.reason);if(d.type==='government')inc(favorUses,d.target);if(d.reason==='Reconstituer la vérification au QG.')metrics.analystForcedReturns++;}
   metrics.techSlotsMax=Math.max(metrics.techSlotsMax,E.getTechSlots(s,f));
   for(const b of before)if(b.opps.length){const a=s.agents.find(x=>x.id===b.a);if(!['protect'].includes(a.task?.type)&&s.crisis+30+6>=100)metrics.protectionOpportunitiesIgnored++;}
  }
  for(const a of s.agents.filter(a=>!['dead','retired','captured'].includes(a.status))){metrics.slots++;if(!a.task){metrics.idle++;continue;}inc(actionTurns,a.task.type);if(a.task.queued){inc(orders,a.task.type);const plan=s.factions[a.faction].bb2.plans[a.id];if(lastPlans[a.id]&&plan?.key&&lastPlans[a.id]!==plan.key)metrics.plansRedirected++;if(plan?.key)lastPlans[a.id]=plan.key;
    if(mode==='cooperative'&&['collect','hack','intimidate'].includes(a.task.type)){const target=a.task.target,existing=E.evidenceFor(s,a.faction,target).length,pending=s.agents.filter(b=>b.id!==a.id&&b.task?.target===target&&['collect','hack','intimidate'].includes(b.task.type)).length;if(existing+pending>=2)metrics.extraProofOrders++;}
   }
  }
  if(i<3)traces.push({turn,crisis:s.crisis,cells:E.cellsDone(s),agents:s.agents.map(a=>({id:a.id,name:a.name,faction:a.faction,country:a.country,fatigue:a.fatigue,exposure:a.exposure,task:a.task?{type:a.task.type,target:a.task.target,remaining:a.task.remaining,chance:a.task.chance}:null})),decisions:Object.fromEntries(participants.map(f=>[f,s.factions[f].bb2.decisions]))});
  E.advance(s);if(i%15===0)s=E.validateSave(JSON.parse(JSON.stringify(s)));if(s.turn>30)throw Error('Turn overflow');
 }
 E.validateSave(JSON.parse(JSON.stringify(s)));
 const operations=Object.values(s.campaignStats.factions).flatMap(f=>Object.entries(f));const resolved={};for(const [k,v]of operations){resolved[k]??={count:0,success:0,failed:0,stopped:0};for(const key of Object.keys(resolved[k]))resolved[k][key]+=v[key]||0;}
 rows.push({i,seed,mode,participants,win:s.ended==='victory',turn:s.turn,crisis:s.crisis,cause:s.ended==='victory'?'victory':s.crisis>=100?'crisis':'deadline',cells:E.cellsDone(s).length,arrests:s.suspects.filter(t=>t.arrested).length,metrics,orders,actionTurns,decisions,reasons,moduleBuys,favorUses,resolved});if(traces.length)examples.push({i,seed,mode,traces});
 if((i-start+1)%50===0)console.log(mode,(i-start+1)+'/'+n);
}
writeFileSync(new URL(`../benchmarks/bb2-${mode}-${start}.json`,import.meta.url),JSON.stringify({rows,examples},null,2));console.log(JSON.stringify({mode,n,wins:rows.filter(x=>x.win).length,meanTurn:rows.reduce((a,r)=>a+r.turn,0)/n}));

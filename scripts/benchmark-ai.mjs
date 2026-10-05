import * as E from '../dist/client/engine.js';
import {COUNTRIES,ACTIONS} from '../dist/client/data.js';

const reference=process.env.BENCHMARK_REFERENCE?await import(process.env.BENCHMARK_REFERENCE):E;
const powers=COUNTRIES.filter(c=>c.power).map(c=>c.id),results=[];
for(const level of ['easy','normal','expert']){for(const home of powers)for(let seed=Number(process.env.BENCHMARK_START||1);seed<Number(process.env.BENCHMARK_START||1)+50;seed++){
 const s=E.createGame(home,['p0','p12','p13','p14'],seed,level);let intercepted=0,hit=0,npcDefense=0;
 while(!s.ended){s.aiDifficulty='normal';reference.planFaction(s,home);s.aiDifficulty=level;E.advance(s);for(const r of s.attackReports){if(r.status==='INTERCEPTÉE'){intercepted++;if(r.participants.some(f=>f!==home))npcDefense++;}else hit++;}}
 E.validateSave(s);
 const npcs=powers.filter(f=>f!==home),rows=npcs.flatMap(f=>Object.entries(s.campaignStats.factions[f]||{}));
 const sum=k=>rows.reduce((n,[type,r])=>n+(r[k]||0),0),rolls=sum('rolls'),success=rows.filter(([type])=>!ACTIONS[type].safe).reduce((n,[,r])=>n+r.success,0);
 const scores=npcs.map(f=>s.factions[f].score),top=Math.max(...scores,s.factions[home].score);
 results.push({level,home,seed,win:s.ended==='victory',turn:s.turn,crisis:s.crisis,npcScore:scores.reduce((a,b)=>a+b,0)/5,playerScore:s.factions[home].score,npcTop:Math.max(...scores)>s.factions[home].score,tiedTop:Math.max(...scores)===s.factions[home].score,arrests:s.suspects.filter(t=>t.arrested&&t.arrestedBy!==home).length/5,ops:sum('count')/5,rolls,success,expected:sum('chance'),dead:s.agents.filter(a=>a.faction!==home&&a.status==='dead').length/5,captured:s.agents.filter(a=>a.faction!==home&&a.status==='captured').length/5,intercepted,hit,npcDefense,actions:Object.fromEntries([...new Set(rows.map(([k])=>k))].map(k=>[k,rows.filter(([t])=>t===k).reduce((a,[,r])=>a+r.count,0)/5]))});
 }console.log('Completed '+level);}

for(const level of ['easy','normal','expert']){const r=results.filter(x=>x.level===level),mean=k=>r.reduce((a,b)=>a+b[k],0)/r.length,total=k=>r.reduce((a,b)=>a+b[k],0);console.log(JSON.stringify({level,n:r.length,win:mean('win'),turn:mean('turn'),npcScore:mean('npcScore'),playerScore:mean('playerScore'),npcTop:mean('npcTop'),tiedTop:mean('tiedTop'),arrests:mean('arrests'),ops:mean('ops'),success:total('success')/total('rolls'),expected:total('expected')/total('rolls')/100,dead:mean('dead'),captured:mean('captured'),intercepted:mean('intercepted'),hit:mean('hit'),npcDefense:mean('npcDefense'),actions:Object.fromEntries([...new Set(r.flatMap(x=>Object.keys(x.actions)))].map(k=>[k,r.reduce((n,x)=>n+(x.actions[k]||0),0)/r.length]))}));}

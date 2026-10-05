import {pathToFileURL} from 'node:url';
const root=process.argv[2]||process.cwd(), E=await import(pathToFileURL(root+'/dist/client/engine.js')), {COUNTRIES,ACTIONS}=await import(pathToFileURL(root+'/dist/client/data.js'));
const homes=COUNTRIES.filter(c=>c.power).map(c=>c.id),results=[];
for(const level of ['easy','normal','expert']){const rows=[];for(const home of homes)for(let seed=1;seed<=10;seed++){
 const s=E.createGame(home,['p0','p12','p13','p14'],seed,level);let stopped=0,intercepted=0,hits=0;s.humanFactions=homes;
 while(!s.ended){for(const f of homes)E.planFaction(s,f);E.advance(s);for(const x of s.attackReports){if(x.status==='INTERCEPTÉE')intercepted++;else hits++;}stopped+=(s.operationReports||[]).filter(x=>x.turn===s.turn-1&&x.status==='INTERROMPUE').length;}
 E.validateSave(structuredClone(s));const ops=Object.values(s.campaignStats.factions).flatMap(x=>Object.entries(x));const actions={};for(const [k,v] of ops)actions[k]=(actions[k]||0)+v.count;
 rows.push({win:s.ended==='victory'?1:0,turn:s.turn,arrests:s.suspects.filter(t=>t.arrested).length,prestige:Object.values(s.factions).reduce((n,f)=>n+f.score,0)/6,intercepted,hits,stopped,dead:s.agents.filter(a=>a.status==='dead').length,ops:ops.reduce((n,[,r])=>n+r.count,0),failed:ops.reduce((n,[,r])=>n+r.failed,0),actions});
 }const avg=k=>rows.reduce((n,r)=>n+r[k],0)/rows.length;results.push({level,games:rows.length,...Object.fromEntries(['win','turn','arrests','prestige','intercepted','hits','dead','ops','failed'].map(k=>[k,+avg(k).toFixed(3)])),actions:Object.fromEntries([...new Set(rows.flatMap(r=>Object.keys(r.actions)))].sort().map(k=>[k,+(rows.reduce((n,r)=>n+(r.actions[k]||0),0)/rows.length).toFixed(2)]))});}
console.log(JSON.stringify(results,null,2));

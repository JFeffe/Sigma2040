import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

// Usage: node scripts/benchmark-bb1-travel.mjs <baseline-client> [1200] [output.json]
// Both engines run the same fresh seeds, rosters and six BB1 countries.
if(process.argv[2]!=='--worker'){
 const baseline=process.argv[2];
 if(!baseline)throw Error('Provide the baseline dist/client directory.');
 const cases=Number(process.argv[3]||1200);
 if(!Number.isInteger(cases)||cases<6||cases>100000||cases%6)throw Error('Game pairs must be a multiple of six between 6 and 100000.');
 const script=fileURLToPath(import.meta.url),current=fileURLToPath(new URL('../dist/client/',import.meta.url));
 const beforeClient=path.resolve(baseline),output=path.resolve(process.argv[4]||'bb1-travel-results.json');
 const temp=mkdtempSync(path.join(os.tmpdir(),'sigma-bb1-travel-')),workers=6;
 try{
  const outcomes=await Promise.allSettled(Array.from({length:workers},(_,i)=>new Promise((resolve,reject)=>{
   const p=spawn(process.execPath,[script,'--worker',beforeClient,current,path.join(temp,i+'.json'),String(i),String(workers),String(cases)],{stdio:['ignore','inherit','inherit']});
   p.on('error',reject);p.on('close',code=>code===0?resolve():reject(new Error('Worker '+i+' exited '+code)));
  })));
  if(outcomes.some(r=>r.status==='rejected'))throw new AggregateError(outcomes.filter(r=>r.status==='rejected').map(r=>r.reason),'Benchmark failed');
  const shards=Array.from({length:workers},(_,i)=>JSON.parse(readFileSync(path.join(temp,i+'.json'))));
  const rows=shards.flatMap(v=>v.rows).sort((a,b)=>a.scenario-b.scenario);
  const summary=summarizeTravel(rows);
  const hashes=client=>Object.fromEntries(['engine.js','bot-brillant-1.js','data.js','build-version.js'].map(file=>[file,createHash('sha256').update(readFileSync(path.join(client,file))).digest('hex')]));
  const report={method:{difficulty:'bb1',botsPerGame:6,humanFactions:[],pairs:cases,seedStart:2615050001,seedEnd:2615050000+cases,powers:['FR','US','CN','IN','RU','GB'],rosters:'Uniform shuffled focal four; other five seeded engine rosters',bootstrap:{replicates:10000,seed:26151005,unit:'paired campaign',interval:'percentile 95%'},checkedSaves:shards.reduce((n,v)=>n+v.checkedSaves,0),deterministicReplays:12},sourceHashes:{before:hashes(beforeClient),after:hashes(current)},summary,rows};
  writeFileSync(output,JSON.stringify(report));console.log(JSON.stringify({output,...summary}));
 }finally{rmSync(temp,{recursive:true,force:true});}
 process.exit(0);
}

function summarizeTravel(rows){
 const aggregate=mode=>{
  const games=rows.map(r=>r[mode]),sum=key=>games.reduce((n,v)=>n+v[key],0),orders={},resolved={},incidents={},causes={victory:0,crisis:0,turn_30:0};
  for(const g of games){causes[g.cause]++;for(const [k,v]of Object.entries(g.orders))orders[k]=(orders[k]||0)+v;
   for(const [type,stats]of Object.entries(g.resolved))for(const [k,v]of Object.entries(stats))(resolved[type]??={})[k]=((resolved[type]??{})[k]||0)+v;
   for(const [k,v]of Object.entries(g.incidents))incidents[k]=(incidents[k]||0)+v;
  }
  return {games:games.length,causes,victoryRate:sum('victory')/games.length,meanPointsPerCountry:sum('meanScore')/games.length,meanTurn:sum('turn')/games.length,orders,resolved,incidents,gamesWithSneak:games.filter(g=>g.orders.sneak>0).length};
 };
 const score=rows.map(r=>r.after.meanScore-r.before.meanScore),victory=rows.map(r=>r.after.victory-r.before.victory);
 const scoreDraws=[],victoryDraws=[];let rng=26151005;
 for(let b=0;b<10000;b++){let sc=0,vi=0;for(let i=0;i<rows.length;i++){rng=(Math.imul(rng,1664525)+1013904223)>>>0;const k=Math.floor(rng/4294967296*rows.length);sc+=score[k];vi+=victory[k];}scoreDraws.push(sc/rows.length);victoryDraws.push(vi/rows.length);}
 const metric=(d,draws)=>({difference:d.reduce((a,b)=>a+b,0)/d.length,ci95:draws.sort((a,b)=>a-b).filter((_,i)=>i===250||i===9750)});
 const transitions={};for(const r of rows){const key=r.before.cause+'->'+r.after.cause;transitions[key]=(transitions[key]||0)+1;}
 return {before:aggregate('before'),after:aggregate('after'),paired:{pointsPerCountry:metric(score,scoreDraws),victoryRate:metric(victory,victoryDraws),transitions,changedCampaigns:rows.filter(r=>r.before.sha256!==r.after.sha256).length}};
}
const [beforeClient,afterClient,out,shardArg,countArg,casesArg]=process.argv.slice(3);
const before=await import(pathToFileURL(beforeClient+'/engine.js'));
const after=await import(pathToFileURL(afterClient+'/engine.js'));
const {DISPLAY_ROSTER}=await import(pathToFileURL(afterClient+'/data.js'));
const shard=+shardArg,count=+countArg,cases=+casesArg,powers=['FR','US','CN','IN','RU','GB'];
const shuffle=(seed,list)=>{let r=seed>>>0;const a=[...list];for(let i=a.length-1;i>0;i--){r=(Math.imul(r,1664525)+1013904223)>>>0;const j=Math.floor(r/4294967296*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const rows=[],errors=[];let checkedSaves=0;
function run(E,task,checkEveryTurn=false){
 const s=E.createGame(task.home,task.ids,task.seed,'bb1');s.humanFactions=[];
 const orders={travel:0,sneak:0},samples=[];let rounds=0;
 while(!s.ended){
  assert.ok(rounds<30);E.advance(s);rounds++;
  for(const f of Object.values(s.factions)){
   assert.equal(f.bb1?.version,2);assert.ok(f.bb1.decisions.length<=11);
   for(const d of f.bb1.decisions)if(d.type in orders){orders[d.type]++;if(d.type==='sneak'){if(samples.length<8)samples.push({...d,turn:f.bb1.turn,faction:f.id});}}
  }
  if(checkEveryTurn){E.validateSave(structuredClone(s));checkedSaves++;}
 }
 if(task.scenario%50===0){E.validateSave(structuredClone(s));checkedSaves++;}
 assert.equal(s.turn,rounds);assert.deepEqual(s.humanFactions,[]);
 const resolved={};for(const f of powers)for(const type of ['travel','sneak']){const v=s.campaignStats.factions[f]?.[type];if(v)for(const [k,n]of Object.entries(v))if(typeof n==='number')(resolved[type]??={})[k]=((resolved[type]??{})[k]||0)+n;}
 const incidents={death:0,capture:0,injury:0};
 for(const ev of s.campaignStats.events.filter(e=>e.type==='sneak'&&e.status==='ÉCHEC')){
  incidents.death+=+ev.notes.some(n=>n.includes('a été tué'));
  incidents.capture+=+ev.notes.some(n=>n.includes('est détenu'));
  incidents.injury+=+ev.notes.some(n=>n.includes('est blessé'));
 }
 const scores=powers.map(f=>s.factions[f].score);
 return {victory:+(s.ended==='victory'),cause:s.ended==='victory'?'victory':s.crisis>=100?'crisis':'turn_30',turn:s.turn,crisis:s.crisis,scores,meanScore:scores.reduce((a,b)=>a+b,0)/6,orders,resolved,incidents,samples,sha256:createHash('sha256').update(JSON.stringify(s)).digest('hex')};
}
const start=Date.now();
for(let i=shard;i<cases;i+=count){
 const seed=2615050001+i,task={scenario:i,seed,home:powers[i%6],ids:shuffle(seed^0xbeadbeef,DISPLAY_ROSTER.map(a=>a.id)).slice(0,4)};
 try{
  const a=run(before,task,rows.length<2),b=run(after,task,rows.length<2);
  if(rows.length===0){assert.equal(run(before,task).sha256,a.sha256);assert.equal(run(after,task).sha256,b.sha256);}
  rows.push({...task,before:a,after:b});
 }catch(error){errors.push({...task,message:error.message,stack:error.stack});}
 if(rows.length%50===0){writeFileSync(out,JSON.stringify({complete:false,shard,rows,errors,checkedSaves}));console.log(JSON.stringify({shard,done:rows.length,errors:errors.length,seconds:Math.round((Date.now()-start)/1000)}));}
}
writeFileSync(out,JSON.stringify({complete:true,shard,rows,errors,checkedSaves,seconds:(Date.now()-start)/1000}));
if(errors.length)process.exitCode=1;

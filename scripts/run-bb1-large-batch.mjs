import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {E,homes,play} from './build-bot-explorer-data.mjs';
import {DISPLAY_ROSTER} from '../docs/bots/reference/build173/data.js';
const out='docs/bots/explorer',population='bb1-5000';
// Roster randomness is separate from the engine's RNG; no outcome-based selection.
export function simulate(index,seedStart=2401001){
 const seed=seedStart+index,home=homes[index%homes.length];let rng=(seed^0x9e3779b9)>>>0;
 const random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
 const rosters=Object.fromEntries(homes.map(f=>{const pool=[...DISPLAY_ROSTER];for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return [f,pool.slice(0,4).map(a=>a.id)];}));
 const s=E.createGame(home,rosters[home],seed,'normal');s.humanFactions=[];
 for(const f of homes)E.team(s,f).forEach((a,j)=>{const t=DISPLAY_ROSTER.find(t=>t.id===rosters[f][j]);Object.assign(a,structuredClone(t),{id:f+'-'+j,templateId:t.id,faction:f,country:f,nationalities:[...new Set([...t.nationalities,f])]});});
 const row=play(s,{population,seed,profile:'uniform',team:rosters[home],rosters},true);
 assert.equal(row.curve.length,row.turn);assert.equal(Object.keys(row.finalScores).length,6);
 assert.ok(Math.abs(Object.values(row.sources).reduce((a,b)=>a+b,0)-row.score)<1e-7);
 return row;
}
if(!isMainThread){
 const rows=[];for(let i=workerData.offset;i<workerData.count;i+=workerData.workers){rows.push(simulate(i));if(rows.length%100===0)parentPort.postMessage({progress:rows.length});}
 parentPort.postMessage({rows});
}else if(process.argv[1]&&resolve(process.argv[1])===resolve(fileURLToPath(import.meta.url))){
 const count=Number(process.argv[2]||5000),workers=Math.min(3,count);assert.ok(Number.isInteger(count)&&count>0);
 const started=new Date(),progress=Array(workers).fill(0);fs.mkdirSync(out+'/details',{recursive:true});
 const batches=await Promise.all(Array.from({length:workers},(_,offset)=>new Promise((resolve,reject)=>{
  const worker=new Worker(new URL(import.meta.url),{workerData:{offset,count,workers}});let done=false;
  worker.on('message',m=>{if(m.rows){done=true;progress[offset]=m.rows.length;resolve(m.rows);}else{progress[offset]=m.progress;console.log('BB1: '+progress.reduce((a,b)=>a+b,0)+' / '+count+' · '+Math.round((Date.now()-started)/1000)+' s');}});
  worker.on('error',reject);worker.on('exit',code=>{if(code!==0||!done)reject(Error('Worker interrupted: '+code));});
 })));
 const rows=batches.flat().sort((a,b)=>a.seed-b.seed);assert.equal(rows.length,count);assert.equal(new Set(rows.map(r=>r.seed)).size,count);
 fs.writeFileSync(out+'/bb1-5000.json.gz',gzipSync(JSON.stringify(rows)));
 const meta=JSON.parse(fs.readFileSync(out+'/meta.json','utf8'));
 meta.largeBatch={population,total:count,seedStart:2401001,seedEnd:2401000+count,started:started.toISOString(),finished:new Date().toISOString(),policy:'Frozen BB1 / build 173',policySha256:createHash('sha256').update(fs.readFileSync('docs/bots/reference/v3.js')).digest('hex'),rosterProtocol:'All six countries: four distinct visible agents drawn uniformly without replacement per country. Separate seeded roster RNG. Focal country rotates independently of roster selection. No tuning or seed selection based on results.',details:true};
 meta.populations=JSON.parse(fs.readFileSync('tools/bot-explorer/populations.json','utf8'));meta.generated=meta.largeBatch.finished;fs.writeFileSync(out+'/meta.json',JSON.stringify(meta,null,2)+'\n');
 console.log(JSON.stringify({games:count,wins:rows.filter(r=>r.victory).length,minutes:(Date.now()-started)/60000}));
}

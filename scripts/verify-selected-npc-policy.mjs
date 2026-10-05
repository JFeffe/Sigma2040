// Replay: node scripts/verify-selected-npc-policy.mjs dist/client/engine.js easy|normal|expert [OUTPUT]
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const E=await import(pathToFileURL(resolve(process.argv[2])).href),level=process.argv[3],start={easy:30001,normal:10001,expert:100001}[level],powers=['FR','US','CN','IN','RU','GB'];
const r={level,games:1000,start,counts:[0,0,0]};
for(let seed=start;seed<start+1000;seed++){
 const s=E.createGame(powers[seed%6],['p0','p12','p13','p14'],seed,level);s.humanFactions=[];
 while(!s.ended)E.advance(s);E.validateSave(structuredClone(s));r.counts[s.ended==='victory'?0:s.crisis>=100?1:2]++;
 if((seed-start+1)%250===0)console.log(level,seed-start+1);
}
assert.deepEqual(r.counts,{easy:[203,255,542],normal:[339,148,513],expert:[546,98,356]}[level]);
if(process.argv[4])writeFileSync(process.argv[4],JSON.stringify(r,null,2)+'\n');
console.log(JSON.stringify(r));

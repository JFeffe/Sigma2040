import * as E from '../dist/client/engine.js';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
if(!process.argv[2])throw new Error('Usage: node scripts/verify-agent-balance225.mjs /path/to/build224/dist/client/engine.js');
const O=await import(pathToFileURL(resolve(process.argv[2])));
import * as D from '../dist/client/game-setup.js';
import {DISPLAY_ROSTER as R}from '../dist/client/data.js';
import assert from 'node:assert/strict';import fs from 'node:fs';
function apply(s){for(const a of s.agents){const id=a.templateId||a.id;if(id==='p16')a.stats=[6,8,6];if(id==='p17')a.talents=['drones','tactique','enquete'];if(id==='p28')a.talents=['drones','surveillance','langues'];}}
const rows=[];
for(const mode of ['regular','advanced','cooperative'])for(let i=0;i<100;i++){
 const seed=225000+i*7919,participants=D.selectParticipants(['FR'],seed,mode),order=R.map(a=>a.id),teams=Object.fromEntries(participants.map((f,j)=>[f,Array.from({length:4},(_,k)=>order[(i+j*4+k)%20])])),settings={gameMode:mode,participants,teams,cellVariants:mode!=='cooperative'};
 let a=O.createGame('FR',teams.FR,seed,'bb2',settings),b=E.createGame('FR',teams.FR,seed,'bb2',settings);a.humanFactions=[...participants];b.humanFactions=[...participants];apply(a);
 while(!b.ended){for(const f of participants){O.planFaction(a,f);E.planFaction(b,f);}O.advance(a);E.advance(b);apply(a);assert.ok(b.turn<=30);if(b.turn===10){a=O.validateSave(structuredClone(a));b=E.validateSave(structuredClone(b));}}
 assert.deepEqual(b,a);E.validateSave(structuredClone(b));rows.push({mode,i,seed,win:b.ended==='victory',turn:b.turn});
 if((i+1)%50===0)console.log(mode,i+1,'games exact match');
}
const summary={build:225,games:rows.length,comparisonRuns:rows.length*2,modes:Object.fromEntries(['regular','advanced','cooperative'].map(mode=>[mode,{games:100,wins:rows.filter(r=>r.mode===mode&&r.win).length}])),identicalFinalStates:true,midGameSaveRestore:true,rows};fs.writeFileSync(new URL('../benchmarks/agent-balance225.json',import.meta.url),JSON.stringify(summary,null,2));console.log('ALL PASSED');

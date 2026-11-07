import * as V from '../../../dist/client/engine.js?v=228';
import * as D from '../../../dist/client/game-setup.js?v=228';import {DISPLAY_ROSTER as R} from '../../../dist/client/data.js?v=228';import fs from 'node:fs';
const mode=process.argv[2],n=+process.argv[3]||200,rows=[];
for(let i=0;i<n;i++){
 const seed=2277000+(mode==='advanced'?1000000:0)+i*7919,participants=D.selectParticipants(['FR'],seed,mode),teams=Object.fromEntries(participants.map((f,j)=>[f,Array.from({length:4},(_,k)=>R[(i+j*4+k)%20].id)])),settings={gameMode:mode,participants,teams,cellVariants:mode!=='cooperative'};
 for(const [variant,E] of [['updated',V]]){
  let s=E.createGame('FR',teams.FR,seed,process.argv[4]||'bb2',settings);s.humanFactions=[...participants];const orders={},armedOrders={};
  while(!s.ended){for(const f of i%2?[...participants].reverse():participants)E.planFaction(s,f);
   for(const a of s.agents)if(a.task?.queued){const t=a.task.type;orders[t]=(orders[t]||0)+1;if(a.weapon)armedOrders[t]=(armedOrders[t]||0)+1;}
   E.advance(s);if(s.turn>30)throw Error('turn overflow');if(s.turn===10)s=E.validateSave(structuredClone(s));
  }
  E.validateSave(structuredClone(s));const resolved={};for(const acts of Object.values(s.campaignStats.factions))for(const [type,v]of Object.entries(acts)){resolved[type]??={count:0,success:0,failed:0,stopped:0};for(const k of Object.keys(resolved[type]))resolved[type][k]+=v[k]||0;}
  rows.push({i,seed,variant,win:s.ended==='victory',turn:s.turn,crisis:s.crisis,arrests:s.suspects.filter(x=>x.arrested).length,orders,armedOrders,resolved});
 }
 if((i+1)%50===0){fs.writeFileSync(new URL(`./${mode}-${process.argv[4]||'bb2'}.json`,import.meta.url),JSON.stringify(rows));console.log(mode,i+1,'scenarios');}
}
fs.writeFileSync(new URL(`./${mode}-${process.argv[4]||'bb2'}.json`,import.meta.url),JSON.stringify(rows));

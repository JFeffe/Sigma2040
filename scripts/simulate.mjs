import * as E from '../dist/client/engine.js';
import {DISPLAY_ROSTER,COUNTRIES} from '../dist/client/data.js';
import {writeFileSync} from 'node:fs';
const n=Number(process.argv[2]||300),out=process.argv[3],strategy=process.argv[4]||'balanced';
const offset=Number(process.argv[5]||0);
const result={seedStart:offset+1,seedEnd:offset+n,player:{score:0,first:0,arrests:0},points:{protection:0,proofs:0,prepare:0,location:0,arrest:0},defeatCrisis:0,defeatDeadline:0,games:n,strategy,victories:0,turns:0,arrests:0,attacks:0,intercepted:0,cancelled:0,zeroScoreTeams:0,actions:{},countries:{}};
for(let index=1;index<=n;index++){const seed=offset+index;
 const home=COUNTRIES.filter(c=>c.power)[seed%6].id,s=E.createGame(home,DISPLAY_ROSTER.slice(0,4).map(a=>a.id),seed);
 s.humanFactions=[];if(strategy.startsWith('solo-'))s.npcStrategies={[home]:strategy.slice(5)};else s.npcStrategy=strategy;
 while(!s.ended)E.advance(s);
 result.player.score+=s.factions[home].score;result.player.first+=+(s.factions[home].score===Math.max(...Object.values(s.factions).map(f=>f.score)));result.player.arrests+=s.suspects.filter(t=>t.arrestedBy===home).length;
 result.defeatCrisis+=+(s.ended==='defeat'&&s.crisis>=100);result.defeatDeadline+=+(s.ended==='defeat'&&s.crisis<100);for(const e of s.prestigeLedger){const category=e.key.startsWith('proof:')?'proofs':e.key.startsWith('prep:')?'prepare':e.key.startsWith('loc:')?'location':e.key.startsWith('arrest:')?'arrest':'protection';result.points[category]+=e.points;}
 result.victories+=+(s.ended==='victory');result.turns+=s.turn;result.arrests+=s.suspects.filter(t=>t.arrested).length;
 for(const p of s.plots){if(p.cancelled)result.cancelled++;else if(p.resolved){result.attacks++;result.intercepted+=+(s.prestigeLedger.some(e=>e.key.startsWith(p.id+':')));}}
 for(const f of Object.values(s.factions)){result.zeroScoreTeams+=+(f.score===0);const c=result.countries[f.id]??={score:0,arrests:0};c.score+=f.score;c.arrests+=s.suspects.filter(t=>t.arrestedBy===f.id).length;}
 for(const rows of Object.values(s.campaignStats.factions))for(const [key,v] of Object.entries(rows)){const a=result.actions[key]??={count:0,success:0,failed:0,stopped:0,cost:0,prestige:0};for(const k of Object.keys(a))a[k]+=v[k]||0;}
 if(index===1||index===n)E.validateSave(structuredClone(s));
}
result.meanTurns=result.turns/n;result.meanArrests=result.arrests/n;result.winRate=result.victories/n;result.zeroScoreRate=result.zeroScoreTeams/(6*n);
if(out)writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));

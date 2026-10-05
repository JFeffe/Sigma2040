import * as current from '../dist/client/engine.js';
import {COUNTRIES,DISPLAY_ROSTER} from '../dist/client/data.js';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const baseline=await import(pathToFileURL(process.argv[2]).href),count=Number(process.argv[3]||200),out=process.argv[4],rows=[];
const powers=COUNTRIES.filter(c=>c.power).map(c=>c.id);
for(const [version,E] of Object.entries({current,baseline}))for(const policy of ['normal','expert']){
 for(let seed=1;seed<=count;seed++){
  const home=powers[(seed-1)%powers.length],s=E.createGame(home,DISPLAY_ROSTER.slice(0,4).map(a=>a.id),seed,'normal');
  let firstArrest=null;
  while(!s.ended){s.aiDifficulty=policy;E.planFaction(s,home);s.aiDifficulty='normal';E.advance(s);if(firstArrest===null&&s.suspects.some(t=>t.arrested))firstArrest=s.turn-(s.ended?0:1);}
  rows.push({version,policy,seed,home,turn:s.turn,win:s.ended==='victory',reason:s.ended==='victory'?'victory':s.crisis>=100?'crisis':'deadline',arrests:s.suspects.filter(t=>t.arrested).length,ownArrests:s.suspects.filter(t=>t.arrestedBy===home).length,firstArrest});
 }
 console.log(version,policy,'completed',count);
}
const summaries=[];
for(const version of ['current','baseline'])for(const policy of ['normal','expert']){
 const r=rows.filter(x=>x.version===version&&x.policy===policy),wins=r.filter(x=>x.win),turns=wins.map(x=>x.turn).sort((a,b)=>a-b),mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
 summaries.push({version,policy,n:r.length,wins:wins.length,winRate:wins.length/r.length,meanEnd:mean(r.map(x=>x.turn)),meanWin:mean(turns),medianWin:turns.length?turns[Math.floor(turns.length/2)]:null,minWin:turns[0]??null,maxWin:turns.at(-1)??null,winsBy20:wins.filter(x=>x.turn<=20).length,crisisBy20:r.filter(x=>x.reason==='crisis'&&x.turn<=20).length,crisisDefeats:r.filter(x=>x.reason==='crisis').length,deadlines:r.filter(x=>x.reason==='deadline').length,ownArrestsInWins:mean(wins.map(x=>x.ownArrests))});
}
writeFileSync(out,JSON.stringify({count,method:'Solo engine; five opponents in Normal. Focal player automated with Normal or Expert policy; not a human-play estimate. Seeds 1..count, rotating countries, fixed first four agents. Compare v171 and v170 with their own threat calendars.',summaries,rows},null,2));console.log(JSON.stringify(summaries,null,2));

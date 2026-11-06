import * as E from '../dist/client/engine.js';
import * as D from '../dist/client/game-setup.js';
import {DISPLAY_ROSTER} from '../dist/client/data.js';
import {activeCaptives} from '../dist/client/cell-variants.js';
import {writeFileSync} from 'node:fs';
const n=Number(process.argv[2]||200),rows=[];
for(const mode of ['regular','advanced'])for(let i=0;i<n;i++){
 const seed=730001+i*7919,participants=D.selectParticipants(['FR'],seed,mode);let teams={};
 if(mode==='advanced'){const d=D.createDraft(['FR'],seed,mode);d.humans=[];D.advanceNpcDraft(d);teams=d.teams;}
 else for(let j=0;j<participants.length;j++)teams[participants[j]]=Array.from({length:4},(_,k)=>DISPLAY_ROSTER[(i*7+j*4+k)%DISPLAY_ROSTER.length].id);
 for(const cellVariants of [false,true]){
 let s=E.createGame('FR',teams.FR,seed,'bb2',{gameMode:mode,participants,teams,cellVariants});s.humanFactions=participants;
 const metrics={kidnappings:0,releases:0,captiveTurns:0,peakCaptives:0,attacks:0,unprotected:0,damage:0,rescueOrders:0,damageByCell:{},attacksByCell:{},protectedByCell:{}};
 while(!s.ended){
  for(const f of i%2?[...participants].reverse():participants)E.planFaction(s,f);
  metrics.rescueOrders+=s.agents.filter(a=>a.task?.queued&&a.task.type==='rescue'&&a.task.target?.startsWith('captive-')).length;
  E.advance(s);
  const active=activeCaptives(s);metrics.peakCaptives=Math.max(metrics.peakCaptives,active.length);metrics.captiveTurns+=active.length;
  for(const r of s.attackReports||[]){metrics.attacks++;metrics.attacksByCell[r.cell]=(metrics.attacksByCell[r.cell]||0)+1;if(r.status==='RÉUSSIE'){metrics.unprotected++;metrics.damage+=r.crisisDelta;metrics.damageByCell[r.cell]=(metrics.damageByCell[r.cell]||0)+r.crisisDelta;}else metrics.protectedByCell[r.cell]=(metrics.protectedByCell[r.cell]||0)+1;}
  if(i%20===0)s=E.validateSave(JSON.parse(JSON.stringify(s)));
 }
 E.validateSave(structuredClone(s));metrics.kidnappings=s.captives?.length||0;metrics.releases=(s.captives||[]).filter(c=>c.status==='released').length;
 rows.push({seed,mode,variant:cellVariants,cells:s.activeCells||[0,1,2],win:s.ended==='victory',turn:s.turn,crisis:s.crisis,arrests:s.suspects.filter(t=>t.arrested).length,...metrics});
 }
 if((i+1)%25===0)console.log(mode,i+1,'/',n);
}
const summary=[];
for(const mode of ['regular','advanced'])for(const variant of [false,true]){
 const group=rows.filter(r=>r.mode===mode&&r.variant===variant);
 const summarize=(group,label)=>({mode,label,n:group.length,wins:group.filter(r=>r.win).length,winRate:100*group.filter(r=>r.win).length/group.length,meanTurn:group.reduce((n,r)=>n+r.turn,0)/group.length,kidnappings:group.reduce((n,r)=>n+r.kidnappings,0),releases:group.reduce((n,r)=>n+r.releases,0),captiveTurns:group.reduce((n,r)=>n+r.captiveTurns,0),peakCaptives:Math.max(...group.map(r=>r.peakCaptives)),rescueOrders:group.reduce((n,r)=>n+r.rescueOrders,0)});
 summary.push(summarize(group,variant?'variant':'baseline'));
 if(variant)for(const key of [...new Set(group.map(r=>r.cells.join(',')))].sort())summary.push(summarize(group.filter(r=>r.cells.join(',')===key),key));
}
writeFileSync('benchmarks/cell-variants.json',JSON.stringify({n,summary,rows},null,2));console.log(JSON.stringify(summary,null,2));

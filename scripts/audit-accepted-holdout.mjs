import * as E from '../dist/client/engine.js';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const [level='normal',variant='baseline',output]=process.argv.slice(2),N=variant==='baseline'?1000:200;
const powers=['FR','US','CN','IN','RU','GB'];
const teams={baseline:['p0','p12','p13','p14'],investigators:['p12','p15','p22','p24'],intervention:['p14','p18','p22','p26'],support:['p16','p17','p23','p24']};
const r={level,variant,games:N,seeds:[200001,200000+N],counts:[0,0,0],countries:{},timeouts:{total:0,architectOnly:0,cellsOnly:0,both:0,architectStage:{},architectFailedAttempts:0,architectArrestInProgress:0,cellsHistogram:{}},samples:[]};
for(const f of powers)r.countries[f]={games:0,score:0,arrests:0,topShare:0};
const stage=(s,f,id)=>{const k=s.factions[f].known[id];if(!k)return 0;if(!k.identified)return 1;const p=E.evidenceFor(s,f,id);if(p.length<2||!p.some(p=>p.verified))return 2;if(!k.prepared)return 3;if(k.locationUntil<s.turn)return 4;return 5;};
Date.now=()=>1800000000000;
for(let seed=200001;seed<=200000+N;seed++){
 const home=powers[seed%6],s=E.createGame(home,teams[variant]||teams.baseline,seed,level);s.humanFactions=[];
 if(variant==='strategy-investigation')s.npcStrategy='investigation';if(variant==='strategy-defense')s.npcStrategy='defense';
 while(!s.ended)E.advance(s);E.validateSave(structuredClone(s));
 const outcome=s.ended==='victory'?0:s.crisis>=100?1:2;r.counts[outcome]++;
 const max=Math.max(...powers.map(f=>s.factions[f].score)),tops=powers.filter(f=>s.factions[f].score===max),scores={};
 for(const f of powers){const d=r.countries[f];d.games++;d.score+=s.factions[f].score;d.arrests+=s.suspects.filter(t=>t.arrestedBy===f).length;if(tops.includes(f))d.topShare+=1/tops.length;scores[f]=s.factions[f].score;}
 r.samples.push({seed,home,outcome,homeScore:s.factions[home].score,homeArrests:s.suspects.filter(t=>t.arrestedBy===home).length,homeTop:tops.includes(home)?1/tops.length:0,scores});
 if(outcome===2){assert.equal(s.turn,30);const d=r.timeouts,t=s.suspects.find(t=>t.id==='s6'),cells=E.cellsDone(s).length;d.total++;d.cellsHistogram[cells]=(d.cellsHistogram[cells]||0)+1;
 if(!t.arrested&&cells>=2)d.architectOnly++;else if(t.arrested&&cells<2)d.cellsOnly++;else d.both++;
 if(!t.arrested){const best=Math.max(...powers.map(f=>stage(s,f,'s6')));d.architectStage[best]=(d.architectStage[best]||0)+1;
 d.architectFailedAttempts+=s.campaignStats.events.some(e=>e.type==='arrest'&&e.targetName===t.name&&e.status==='ÉCHEC');
 d.architectArrestInProgress+=s.agents.some(a=>a.task?.type==='arrest'&&a.task.target==='s6');}
 }
}
if(output)writeFileSync(output,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({...r,samples:undefined}));

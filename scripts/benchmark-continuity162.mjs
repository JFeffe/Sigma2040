// Run with --baseline /absolute/path/to/reference-engine.mjs to compare the
// published reference with the current engine. Reference relative imports must
// resolve to that revision's client modules. No game state or source is written.
import * as live from '../dist/client/engine.js';
import {COUNTRIES,DISPLAY_ROSTER} from '../dist/client/data.js';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const arg=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];};
const candidate=arg('--candidate',null),current=candidate?await import(pathToFileURL(candidate).href):live;
const baseline=arg('--baseline',null),engines={current,...(baseline?{baseline:await import(pathToFileURL(baseline).href)}:{})};
const start=Number(arg('--start','1')),count=Number(arg('--count','100')),strategies=arg('--strategies','balanced').split(','),levels=arg('--levels','normal').split(','),out=arg('--out',null),mode=arg('--mode','all-ai'),scope=arg('--scope','all');
const powers=COUNTRIES.filter(c=>c.power).map(c=>c.id),roster=DISPLAY_ROSTER.slice(0,4).map(a=>a.id),rows=[];
for(const level of levels)for(const strategy of strategies)for(let seed=start;seed<start+count;seed++){
 const home=powers[seed%6],base=current.createGame(home,roster,seed,level);
 for(const [version,E] of Object.entries(engines)){
  const s=structuredClone(base);if(scope==='focus')s.npcStrategies={[home]:strategy};else s.npcStrategy=strategy;
  if(mode==='all-ai')s.humanFactions=[];
  const attacks=[],first={};let turns=0;
  while(!s.ended){
   if(++turns>30)throw Error('Campaign exceeded turn limit');const turn=s.turn;
   // A fixed reference policy controls the focal country for solo comparisons.
   if(mode==='solo-reference')(engines.baseline||current).planFaction(s,home);
   E.advance(s);attacks.push(...s.attackReports);
   for(const t of s.suspects.filter(t=>t.arrested))first[t.arrestedBy]??=turn;
  }
  E.validateSave(structuredClone(s));
  rows.push({version,mode,level,strategy,seed,home,win:s.ended==='victory',crisisDefeat:s.ended==='defeat'&&s.crisis>=100,turn:s.turn,crisis:s.crisis,arrests:s.suspects.filter(t=>t.arrested).length,firstArrest:Object.keys(first).length?Math.min(...Object.values(first)):null,architect:s.suspects.find(t=>t.id==='s6').arrested,hit:attacks.filter(a=>a.status==='RÉUSSIE').length,intercepted:attacks.filter(a=>a.status==='INTERCEPTÉE').length,cancelled:s.plots.filter(p=>p.cancelled).length,score:Object.values(s.factions).reduce((n,f)=>n+f.score,0)/6,points:s.prestigeLedger.reduce((p,e)=>{p[e.key.startsWith('proof:')?'proofs':/^(arrest:|loc:|prep:)/.test(e.key)?'arrests':'protection']+=e.points;return p;},{proofs:0,arrests:0,protection:0}),countries:Object.fromEntries(Object.values(s.factions).map(f=>[f.id,{score:f.score,arrests:s.suspects.filter(t=>t.arrestedBy===f.id).length}])),actions:s.campaignStats.factions,support:s.campaignStats.support});
 }
}
const groups=[];for(const version of Object.keys(engines))for(const level of levels)for(const strategy of strategies){const r=rows.filter(x=>x.version===version&&x.level===level&&x.strategy===strategy),m=k=>r.reduce((n,x)=>n+Number(x[k]),0)/r.length,first=r.filter(x=>x.firstArrest!==null);groups.push({version,mode,level,strategy,n:r.length,...Object.fromEntries(['win','crisisDefeat','turn','crisis','arrests','architect','hit','intercepted','cancelled','score'].map(k=>[k,m(k)])),firstArrest:first.reduce((n,x)=>n+x.firstArrest,0)/first.length,noArrest:1-first.length/r.length});}
if(out)writeFileSync(out,JSON.stringify({start,count,mode,scope,groups,rows}));console.log(JSON.stringify(groups,null,2));

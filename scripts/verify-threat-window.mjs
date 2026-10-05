import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,DISPLAY_ROSTER} from '../dist/client/data.js';
const powers=COUNTRIES.filter(c=>c.power),roster=DISPLAY_ROSTER.slice(0,4).map(a=>a.id),rows=[];
for(const level of ['easy','normal','expert']){
 let moves=0,minLead=Infinity;
 for(let seed=120001;seed<120026;seed++){
  const s=E.createGame(powers[seed%6].id,roster,seed,level);s.humanFactions=[];
  while(!s.ended){
   const resolutionTurn=s.turn,before=new Map(s.plots.map(p=>[p.id,{country:p.country,turn:p.turn}]));E.advance(s);
   for(const p of s.plots)if(p.country!==before.get(p.id).country){
    assert.ok(before.get(p.id).turn-resolutionTurn>=4,'No last-minute relocation');
    assert.ok(p.turn-s.turn>=3,'At least three turns remain after transition');
    moves++;minLead=Math.min(minLead,p.turn-s.turn);
   }
  }
  E.validateSave(structuredClone(s));
 }
 rows.push({level,games:25,moves,minLead:moves?minLead:null});
}
assert.ok(rows.reduce((n,r)=>n+r.moves,0)>0,'Rerouting must still occur in real campaigns');
writeFileSync(new URL('../docs/threat-window164-results.json',import.meta.url),JSON.stringify({passed:true,rows},null,2)+'\n');
console.log(JSON.stringify({passed:true,rows}));

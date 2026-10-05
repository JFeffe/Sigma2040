// Historical release-163 acceptance replay. Later rule changes invalidate these counts.
import {BUILD_VERSION} from '../dist/client/build-version.js';
if(BUILD_VERSION!=='163')throw Error('Replay this benchmark on release 163; later threat rules change the baseline.');
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,DISPLAY_ROSTER} from '../dist/client/data.js';
const powers=COUNTRIES.filter(c=>c.power),roster=DISPLAY_ROSTER.slice(0,4).map(a=>a.id);
for(const [level,start,expected] of [['easy',30001,[177,389,434]],['normal',10001,[354,345,301]],['expert',100001,[640,178,182]]]){
 const counts=[0,0,0];
 for(let seed=start;seed<start+1000;seed++){
  const s=E.createGame(powers[seed%6].id,roster,seed,level);s.humanFactions=[];
  while(!s.ended)E.advance(s);
  E.validateSave(structuredClone(s));
  counts[s.ended==='victory'?0:s.crisis>=100?1:2]++;
 }
 assert.deepEqual(counts,expected,`Accepted ${level} behavior must be preserved`);
 console.log(JSON.stringify({level,seeds:[start,start+999],games:1000,counts,passed:true}));
}

import fs from 'node:fs';
import vm from 'node:vm';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import * as core from '../tools/bot-explorer/core.mjs';
const load=f=>JSON.parse(gunzipSync(fs.readFileSync('docs/bots/explorer/'+f+'.json.gz')));
const validation=load('validation'),benchmark=load('benchmark'),large=load('bb1-5000');
assert.equal(large.length,5000);assert.equal(new Set(large.map(r=>r.seed)).size,5000);
for(const r of large){assert.equal(r.population,'bb1-5000');assert.equal(r.profile,'uniform');assert.equal(r.curve.length,r.turn);for(const roster of Object.values(r.rosters))assert.equal(new Set(roster).size,4);const journal=load('details/'+r.key);assert.equal(journal.timeline.length,r.turn);assert.deepEqual(journal.timeline.at(-1).scores,r.finalScores);}
assert.equal(validation.length,2160);assert.equal(benchmark.length,3456);
for(const r of [...validation,...benchmark,...large]){
 assert.ok(Math.abs(core.sum(Object.values(r.sources),x=>x)-r.score)<1e-7,r.key);
 assert.ok(r.first>=0&&r.first<=1);
}
const teams=new Set(benchmark.map(r=>r.teamKey));assert.equal(teams.size,48);
for(const id of teams){
 const rs=benchmark.filter(r=>r.teamKey===id);assert.equal(rs.length,72);
 assert.equal(new Set(rs.map(r=>r.seed)).size,72);
 for(const h of new Set(rs.map(r=>r.home)))assert.equal(rs.filter(r=>r.home===h).length,12);
 for(const a of rs[0].team)assert.equal(rs.filter(r=>r.team[0]===a).length,18);
}
const meta=JSON.parse(fs.readFileSync('docs/bots/explorer/meta.json'));
for(const a of meta.agents)assert.equal(meta.teams.filter(t=>t.includes(a.id)).length,12);
assert.equal(validation.filter(r=>r.population==='v3'&&r.victory).length,660);
for(const r of validation)assert.equal(r.curve.length,r.turn);
for(const file of ['dashboard.html','explorer.css','explorer.mjs','core.mjs'])
 assert.equal(fs.readFileSync('tools/bot-explorer/'+file,'utf8'),fs.readFileSync('docs/bots/explorer/'+file,'utf8'));
// Rendering smoke check across every population and view. Browser interaction
// testing is separate; these minimal DOM stubs catch missing dataset arguments.
const els={},context={...core,console,setTimeout,clearTimeout,setInterval,clearInterval,URLSearchParams,
 document:{getElementById:id=>els[id]??={addEventListener(){},value:'',innerHTML:'',textContent:''},addEventListener(){},querySelectorAll:()=>[]},
 window:{addEventListener(){}},location:{hash:''},history:{replaceState(){}},
 INPUT:{meta,all:[...validation,...benchmark],d:load('details/v3-1001004')}};
vm.createContext(context);
const src=fs.readFileSync('tools/bot-explorer/explorer.mjs','utf8').replace(/^import .*\n/,'').replace(/boot\(\);\s*$/,'');
vm.runInContext(src+`
meta=INPUT.meta;all=INPUT.all;
for(const pop of Object.keys(popNames)){
 f={population:pop,agents:[]};selected=filterRows(all,f);
 for(const fn of [overview,games,teams,agents,actions,suspects,compare,method]){
  const html=fn();if(!html.length||html.includes('NaN'))throw Error(pop+fn.name);
 }
}
detailRow=all.find(r=>r.key===INPUT.d.key);detailData=INPUT.d;dfaction=detailRow.home;dturn=detailRow.turn;
for(const t of ['course','operations','agents','prestige','dossiers']){dtab=t;renderDetail();}
`,context);
console.log('PASS: 10616 records, source points, team balance, 40 views, 5 detail tabs and synchronized assets.');

import test from 'node:test';import assert from 'node:assert/strict';import {filterRows,summary,actionTotals,csv,compareOnSeeds} from '../tools/bot-explorer/core.mjs';
const row=(x={})=>({population:'v3',seed:1,home:'FR',team:['a','b','c','d'],score:12,rank:1,turn:20,first:1,victory:true,reason:'victory',dead:0,captured:0,suspects:[{cell:3,arrested:true,by:'FR'}],...x});
test('filters intersect agents, numeric bounds and architect ownership',()=>{const rs=[row(),row({seed:2,team:['a','c','d','e'],score:4}),row({seed:3,home:'US'})];assert.deepEqual(filterRows(rs,{agents:['a','b'],home:'FR',score:10,architect:'own'}).map(r=>r.seed),[1]);assert.equal(filterRows(rs,{agents:['missing']}).length,0);assert.equal(filterRows(rs,{team:'a,b,c,d'}).length,2);});
test('individual wins exclude collective defeats and split ties',()=>{const s=summary([row(),row({victory:false,reason:'crisis'}),row({first:.5})]);assert.equal(s.win,2/3);assert.equal(s.individual,.5);assert.equal(s.crisis,1);assert.equal(summary([]).win,null);assert.ok(s.ci[0]<s.win&&s.ci[1]>s.win);});
test('paired populations use same seed universe despite outcomes',()=>{const a=row(),b=row({population:'v2',victory:false}),c=row({population:'v2',seed:99});assert.equal(compareOnSeeds([a],[a,b,c])[0].n,1);assert.equal(compareOnSeeds([a],[a,b,c])[0].w,0);});
test('action aggregation preserves interruptions and weighted chance totals',()=>{const rs=[row({actions:{hack:{count:3,rolls:2,chance:100,success:1,failed:1,stopped:1}},agents:[{templateId:'a',actions:{hack:{count:1,rolls:1,chance:30}}}]})];const t=actionTotals(rs)[0];assert.equal(t.rolls,2);assert.equal(t.chance/t.rolls,50);assert.equal(t.stopped,1);assert.equal(actionTotals(rs,'a')[0].chance,30);});
test('CSV escapes quotes/newlines and prevents text formulas',()=>{const out=csv([{label:'Nom',value:r=>r.name},{label:'Points',value:r=>r.score}],[{name:'=SUM(A1)',score:-2},{name:'a"b\nc',score:null}]);assert.ok(out.includes('"\'=SUM(A1)"'));assert.ok(out.includes('"-2"'));assert.ok(out.includes('"a""b\nc"'));});

test('population names are explicit and separate experimental prototype from published Normal',async()=>{
 const {readFileSync}=await import('node:fs');
 const html=readFileSync(new URL('../tools/bot-explorer/dashboard.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../tools/bot-explorer/explorer.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(html,/\bV[23]\b|Six nouveaux|Six précédents/);
 for(const label of ['BotBrillant1 — 6 bots','Prototype compétitif — 6 bots','BB1 face à 5 prototypes','BB1 — 48 compositions d’équipe'])assert.ok(html.includes(label));
 assert.match(app,/Ce prototype ne correspond pas au bot Normal du jeu publié/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {tickFracture,observeProtection} from '../dist/client/fracture.js';
import {COUNTRIES} from '../dist/client/data.js';
import {relocationCountries,threatCountryClear} from '../dist/client/threat-placement.js';
test('1000 seeded campaigns distribute all 17 threats across six countries with six-turn spacing',()=>{
 const countries=COUNTRIES.filter(c=>!c.power);
 for(let seed=1;seed<=1000;seed++){
  const s=E.createGame('FR',['p0','p12','p13','p14'],seed);assert.equal(s.plots.length,17);
  for(const c of countries){const plots=s.plots.filter(p=>p.country===c.id).sort((a,b)=>a.turn-b.turn);assert.ok(plots.length===2||plots.length===3);for(let i=1;i<plots.length;i++)assert.ok(plots[i].turn-plots[i-1].turn>=6);}
  assert.deepEqual(s.plots.filter(p=>p.cell===3).map(p=>p.turn),[16,22,28]);
 }
});
test('Relocations avoid crowded countries and reports cannot create four attacks in four turns',()=>{
 const s={plots:[{id:'a',country:'DE',turn:13},{id:'b',country:'DE',turn:14},{id:'c',country:'DE',turn:15},{id:'d',country:'CA',turn:16}]},p=s.plots[3];
 assert.equal(threatCountryClear(s,p,'DE',16),false);
 assert.ok(!relocationCountries(s,p,COUNTRIES,17).some(c=>c.id==='DE'));
});

test('A blocked postponement consumes no resources and does not announce a fictitious delay',()=>{
 const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.turn=4;
 s.plots=[{id:'a',country:'DE',turn:7,cell:0},{id:'b',country:'DE',turn:11,cell:3}];
 observeProtection(s,'DE',10);const resources=s.fracture.cells[0].resources,messages=[];
 tickFracture(s,()=>0,(_s,text)=>messages.push(text));assert.equal(s.plots[0].turn,7);assert.equal(s.plots[0].adapted,undefined);assert.equal(s.fracture.cells[0].resources,resources);assert.equal(messages.length,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);
test('Fourteen attacks start at T3, rotate cells and accept fourteen archived diplomatic records',()=>{
 const s=fresh();assert.deepEqual(s.plots.filter(p=>p.cell<3).map(p=>p.turn),[3,5,7,9,11,13,15,17,19,21,23,25,27,29]);assert.deepEqual([0,1,2].map(c=>s.plots.filter(p=>p.cell===c).length),[5,5,4]);assert.equal(E.visiblePlots(s).length,2);assert.equal(E.visiblePlots(s)[0].turn,3);s.turn=3;assert.equal(E.visiblePlots(s)[1].turn,5);
 s.requests=s.plots.map(p=>({plot:p.id,from:'US',status:'expired',country:p.country,deadline:p.turn}));E.validateSave(structuredClone(s));
 const old=fresh();old.plots=old.plots.slice(0,7).map((p,i)=>({...p,turn:7+i*5}));assert.deepEqual(E.validateSave(structuredClone(old)).plots,old.plots);
});
test('Prestige is four total divided by participating nations, with full individual secondary rewards',()=>{
 for(let n=1;n<=6;n++){const s=fresh(),powers=Object.keys(s.factions);s.humanFactions=powers;s.plots=[{id:'plot0',turn:1,country:'JP',cell:0,kind:'Attaque',resolved:false}];
 for(const f of powers.slice(0,n)){s.factions[f].defense.JP=1;s.factions[f].cooperation.JP=2;}
 const a=E.team(s)[0];a.country='JP';assert.equal(E.options(s,a.id,'protect').error,null);E.assign(s,a.id,'protect');E.advance(s);
 for(const f of powers.slice(0,n)){assert.equal(s.factions[f].score,4/n);assert.equal(s.factions[f].cooperation.JP,3);assert.equal(s.factions[f].confidence,22);assert.equal(s.factions[f].influence,undefined);}assert.equal(s.crisis,10);assert.ok(Math.abs(s.prestigeLedger.reduce((sum,e)=>sum+e.points,0)-4)<1e-10);
 }
});

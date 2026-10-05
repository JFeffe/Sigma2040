import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {playerView} from '../dist/client/multiplayer-core.js';
import {gameShell} from '../dist/client/shell.js';
import {makeScreens} from '../dist/client/screens.js';
import {createCamera,countryPin} from '../dist/client/globe.js';
import {COUNTRIES} from '../dist/client/data.js';
const fresh=()=>E.createGame('FR',['p0','p1','p2','p3'],17);
test('Shared defense awards survive log truncation and save reload, without double credit',()=>{
 const s=fresh();s.plots=[{id:'test',country:'DE',turn:1,cell:0,kind:'test',resolved:false}];s.factions.FR.defense.DE=4;s.factions.US.defense.DE=4;E.advance(s);
 const entries=s.prestigeLedger.filter(e=>e.key.startsWith('test:'));assert.equal(entries.length,2);assert.ok(entries.every(e=>e.points===3&&e.turn===1&&e.reason.includes('Allemagne')));
 for(let i=0;i<410;i++)E.log(s,'Archive secondaire');const copy=E.validateSave(structuredClone(s));assert.deepEqual(copy.prestigeLedger,s.prestigeLedger);E.advance(copy);assert.equal(copy.prestigeLedger.filter(e=>e.key.startsWith('test:')).length,2);
 const view=playerView({game:s,offers:[]},'FR');assert.ok(view.prestigeLedger.every(e=>e.faction==='FR'));s.ended='defeat';assert.deepEqual(playerView({game:s,offers:[]},'FR').prestigeLedger,s.prestigeLedger);
});
test('Old saves preserve prestige as an undated balance; invalid history is rejected',()=>{
 const s=fresh();delete s.prestigeLedger;s.factions.FR.score=12;const restored=E.validateSave(s);assert.deepEqual(restored.prestigeLedger.map(e=>[e.faction,e.points,e.turn]),[['FR',12,null]]);restored.prestigeLedger[0].points=-1;assert.throws(()=>E.validateSave(restored));
});
test('New shell replaces old panels, preserves news links and requested navigation order',()=>{
 const s=fresh(),world=makeScreens(s,'FR',null,[],createCamera()).world(),html=gameShell(s,'world',world,false);
 assert.ok(html.includes('news-ticker'));assert.ok(!html.includes('intel-rail'));assert.ok(!html.includes('nouveauté'));assert.ok(html.includes('data-id="journal"'));
 const nav=html.match(/<nav[^]*?<\/nav>/)[0];assert.deepEqual([...nav.matchAll(/data-id="([^"]+)"/g)].map(m=>m[1]),['world','inquiry','operations','threats','government','diplomacy','agents','journal']);
 for(const c of COUNTRIES){const pin=countryPin(s,c,[],[]);assert.deepEqual([...pin.matchAll(/class="map-status ([^ ]+)/g)].map(m=>m[1]),c.power?['protection']:['access','mandate','safehouse','hack','protection']);}
});

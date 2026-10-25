import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,DISPLAY_ROSTER} from '../dist/client/data.js';
import {threatStatus} from '../dist/client/threat-status.js';
import {threatPanel} from '../dist/client/threats-ui.js';
import {navigationAvailability,gameShell} from '../dist/client/shell.js';
import {personnelPanel} from '../dist/client/personnel-ui.js';
const fresh=(seed=42)=>E.createGame('FR',['p0','p12','p13','p14'],seed);
test('Cooperation shuffles independently per power and seed, preserving every starting distribution and saved relations',()=>{
 const minors=COUNTRIES.filter(c=>!c.power),seen=new Set();
 for(let seed=1;seed<=100;seed++){
  const s=fresh(seed),rows=Object.values(s.factions).map(f=>minors.map(c=>f.cooperation[c.id]));
  for(const row of rows)assert.deepEqual([...row].sort(),[0,1,2,2,3,4]);
  seen.add(JSON.stringify(s.factions.US.cooperation));assert.ok(new Set(rows.map(JSON.stringify)).size>1);
  assert.deepEqual(fresh(seed).factions.US.cooperation,s.factions.US.cooperation);
 }
 assert.ok(seen.size>40);
 const s=fresh();s.factions.US.cooperation.TR=4;const relations=Object.fromEntries(Object.entries(s.factions).map(([id,f])=>[id,f.cooperation]));
 assert.deepEqual(Object.fromEntries(Object.entries(E.validateSave(structuredClone(s)).factions).map(([id,f])=>[id,f.cooperation])),relations);
});
test('Threat indicator counts only attacks not covered by our country at their scheduled turn',()=>{
 const s=fresh();s.turn=4;s.plots=[{id:'a',cell:0,country:'DE',turn:6,kind:'Attaque',announced:true},{id:'b',cell:1,country:'JP',turn:8,kind:'Attaque',announced:true}];
 assert.equal(navigationAvailability(s).threats.badge,'2');s.factions.US.defense.DE=9;
 assert.equal(navigationAvailability(s).threats.badge,'2');E.team(s)[0].country='DE';E.team(s)[0].task={type:'protect',remaining:1,queued:true};
 assert.equal(threatStatus(s).uncovered.length,2);s.factions.FR.defense.DE=5;assert.equal(navigationAvailability(s).threats.badge,'2');
 s.factions.FR.defense.DE=6;assert.equal(navigationAvailability(s).threats.badge,'1');assert.equal(threatStatus(s).covered,1);
 s.factions.FR.defense.JP=8;assert.equal(navigationAvailability(s).threats,null);assert.doesNotMatch(gameShell(s,'threats','',false),/nav-available nav-threats/);
 s.plots[1].turn=9;assert.equal(navigationAvailability(s).threats.badge,'1');assert.match(gameShell(s,'threats','',false),/nav-available nav-threats/);
 s.ended='defeat';assert.deepEqual(navigationAvailability(s),{});
});
test('Threat cards show countdown, smaller attack turn and own coverage with no support action',()=>{
 const s=fresh();s.plots=[{id:'a',cell:0,country:'DE',turn:3,kind:'Attaque',announced:true}];s.factions.FR.defense.DE=3;
 const html=threatPanel(s);assert.match(html,/0 menace\(s\) · 1 couverte\(s\)/);assert.match(html,/threat-covered/);assert.match(html,/<strong>Attaque à la fin du tour 3<\/strong><small>3 tours pour agir/);assert.match(html,/T3 inclus/);assert.doesNotMatch(html,/Préparer un soutien|data-cmd="protect/);
 s.factions.FR.defense.DE=2;assert.match(threatPanel(s),/fin T2 inclus/);assert.match(threatPanel(s),/À l’attaque T3 : non couverte/);
 s.plots[0].resolved=true;assert.match(threatPanel(s),/Aucune menace annoncée/);
});
test('Personnel prominently renders every supplied full-body image and targets the selected co-located agent',()=>{
 for(const candidate of DISPLAY_ROSTER){const s=E.createGame('FR',[candidate.id,...DISPLAY_ROSTER.filter(x=>x.id!==candidate.id).slice(0,3).map(x=>x.id)],42),a=E.team(s).find(a=>a.templateId===candidate.id||a.id===candidate.id),html=personnelPanel(s,a.id);
  const figure=html.match(/<figure class="personnel-portrait-stage">([\s\S]*?)<\/figure>/)?.[1];assert.ok(figure,candidate.id);assert.match(figure,/class="full-body/);assert.doesNotMatch(figure,/<details/);
  const path=figure.match(/<image href="\.\/(.*?)"/)[1].split('?')[0];assert.ok(existsSync(new URL('../dist/client/'+path,import.meta.url)));
  assert.match(html,new RegExp('data-cmd="agent"[^>]*data-id="'+a.id+'"'));assert.match(html,new RegExp('data-cmd="agent-journal"[^>]*data-id="'+a.id+'"'));
 }
 const s=fresh(),a=E.team(s)[1];E.assign(s,a.id,'travel','DE');a.task.queued=false;
 const html=personnelPanel(s,a.id);assert.match(html,/data-cmd="cancel"[^>]*disabled/);assert.match(html,/MISSION EN COURS/);
 a.task=null;a.status='captured';const detained=personnelPanel(s,a.id);assert.match(detained,/Consulter la détention/);assert.doesNotMatch(detained,/data-cmd="agent-rest"/);
});

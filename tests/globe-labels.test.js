import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRIES} from '../dist/client/data.js';
import {countryPin,layoutCountryLabels} from '../dist/client/globe.js';

test('Every strategic country has a map name, independent city marker and centered status icons',()=>{
 const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.factions.FR.access.DE=true;s.factions.FR.authorized.DE=true;s.factions.FR.safehouses.push('DE');
 const pins=COUNTRIES.map(c=>countryPin(s,c,[],[]));assert.equal(pins.length,12);
 for(let i=0;i<12;i++){assert.match(pins[i],new RegExp(`data-id="${COUNTRIES[i].id}"`));assert.ok(pins[i].includes(COUNTRIES[i].name.toLocaleUpperCase('fr')));assert.ok(pins[i].includes(COUNTRIES[i].city));assert.match(pins[i],/class="pin-country"/);assert.doesNotMatch(pins[i],/pin-card/);assert.equal((pins[i].match(/class="map-status /g)||[]).length,COUNTRIES[i].power?1:5);assert.equal((pins[i].match(/<svg x="-7" y="-7" width="14" height="14"/g)||[]).length,COUNTRIES[i].power?1:5);}
 assert.match(pins[COUNTRIES.findIndex(c=>c.id==='DE')],/map-status access is-active/);
 assert.match(pins[COUNTRIES.findIndex(c=>c.id==='DE')],/map-status mandate is-active/);
 assert.match(pins[COUNTRIES.findIndex(c=>c.id==='DE')],/map-status safehouse is-active/);
});

test('Country labels remain near their map locations at wide and narrow sizes',()=>{
 const points=[['FR',650,350],['GB',645,338],['DE',670,342],['RU',760,315],['TR',735,385],['IN',855,430],['CN',970,360],['JP',1040,390],['US',300,370],['CA',298,350],['BR',420,550],['ZA',680,600]];
 for(const [width,height] of [[1200,800],[600,600],[360,600]]){
  const ps=points.map(([id,x,y])=>({id,x:x*width/1200,y:y*height/800})),layout=layoutCountryLabels(ps,width,height,'FR');
  for(const p of ps){const [dx,dy]=layout[p.id];assert.ok(Math.hypot(dx,dy)<=43,`${p.id} should remain on its country`);}
 }
});

test('Cooperation labels show the viewing faction’s live level with five slots',()=>{
 const s=E.createGame('FR',['p0','p12','p13','p14'],42),country=COUNTRIES.find(c=>c.id==='DE');
 for(const [level,name] of ['Hostile','Réticente','Neutre','Favorable','Soutien total'].entries()){
  s.factions.FR.cooperation.DE=level;const pin=countryPin(s,country,[],[]);
  assert.equal((pin.match(/cooperation-bar filled/g)||[]).length,level+1);
  assert.equal((pin.match(/cooperation-bar empty/g)||[]).length,4-level);
  assert.ok(pin.includes(name));assert.ok(pin.indexOf('pin-cooperation')>pin.indexOf('class="pin-name"'));
 }
 for(const c of COUNTRIES.filter(c=>c.power))assert.doesNotMatch(countryPin(s,c,[],[]),/pin-cooperation/);
 s.player='US';s.factions.US.cooperation.DE=0;assert.match(countryPin(s,country,[],[]),/cooperation-0/);
});

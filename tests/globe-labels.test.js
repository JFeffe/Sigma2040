import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRIES} from '../dist/client/data.js';
import {countryPin,layoutCountryLabels} from '../dist/client/globe.js';

test('Every strategic country has a map name, independent city marker and centered status icons',()=>{
 const s=E.createGame('FR',['p0','p12','p13','p14'],42);s.factions.FR.access.DE=true;s.factions.FR.authorized.DE=true;s.factions.FR.safehouses.push('DE');
 const pins=COUNTRIES.filter(c=>!c.expansion).map(c=>countryPin(s,c,[],[]));assert.equal(pins.length,12);
 for(let i=0;i<12;i++){assert.match(pins[i],new RegExp(`data-id="${COUNTRIES[i].id}"`));assert.ok(pins[i].includes(COUNTRIES[i].name.toLocaleUpperCase('fr')));assert.ok(pins[i].includes(COUNTRIES[i].city));assert.match(pins[i],/class="pin-country"/);assert.doesNotMatch(pins[i],/pin-card/);assert.equal((pins[i].match(/class="map-status /g)||[]).length,COUNTRIES[i].power?1:5);assert.equal((pins[i].match(/<svg x="-7" y="-7" width="14" height="14"/g)||[]).length,COUNTRIES[i].power?1:5);}
 assert.match(pins[COUNTRIES.findIndex(c=>c.id==='DE')],/map-status access is-active/);
 assert.match(pins[COUNTRIES.findIndex(c=>c.id==='DE')],/map-status mandate is-active/);
 assert.match(pins[COUNTRIES.findIndex(c=>c.id==='DE')],/map-status safehouse is-active/);
});

test('Country labels remain near their map locations at wide and narrow sizes',()=>{
 const points=[['FR',650,350],['GB',645,338],['DE',670,342],['RU',760,315],['TR',735,385],['IN',855,430],['CN',970,360],['JP',1040,390],['US',300,370],['CA',298,350],['BR',420,550],['ZA',680,600]];
 const nameBox={left:-34,right:34,top:-23,bottom:-5},labelBox={left:-58,right:58,top:-23,bottom:37};
 for(const [width,height] of [[1200,800],[600,600],[360,600]]){
  const ps=points.map(([id,x,y])=>({id,x:x*width/1200,y:y*height/800,nameBox,labelBox}));
  const layout=layoutCountryLabels(ps,width,height,'FR');
  assert.ok(layout.FR);
  assert.ok(Object.keys(layout).length>=8);
  for(const p of ps){
   if(!layout[p.id])continue;
   const {dx,dy,compact}=layout[p.id],box=compact?nameBox:labelBox;
   assert.ok(Math.hypot(dx,dy)<=46,p.id+' should remain on its country');
   assert.ok(p.x+dx+box.left>=6&&p.x+dx+box.right<=width-6);
   assert.ok(p.y+dy+box.top>=6&&p.y+dy+box.bottom<=height-6);
  }
 }
});

test('A country at a crowded edge keeps its name near its anchor and folds away the status row',()=>{
 const nameBox={left:-56,right:56,top:-24,bottom:-5},labelBox={left:-60,right:60,top:-24,bottom:34};
 const [width,height]=[320,160];
 const p={id:'GB',x:286,y:34,nameBox,labelBox},overlay={left:0,right:width,top:43,bottom:height};
 const {GB}=layoutCountryLabels([p],width,height,'GB',[overlay]);
 assert.ok(GB.compact);
 assert.ok(Math.hypot(GB.dx,GB.dy)<=46);
 assert.equal(p.x+GB.dx+nameBox.right,width-6);
});

test('Selection and close zoom keep the country stats visible when a nearby full placement fits',()=>{
 const point={
  id:'JP',x:180,y:130,
  nameBox:{left:-30,right:30,top:-23,bottom:-5},
  labelBox:{left:-55,right:55,top:-23,bottom:36},
  cityBox:{left:167,right:193,top:128,bottom:154}
 };
 assert.equal(layoutCountryLabels([point],400,300,'FR').JP.compact,true);
 for(const [label,selected] of [[point,'JP'],[{...point,detail:true},'FR']]){
  const {dx,dy,compact}=layoutCountryLabels([label],400,300,selected).JP;
  assert.equal(compact,false);
  assert.ok(Math.hypot(dx,dy)<=46);
  assert.ok(point.y+dy+point.labelBox.bottom<=point.cityBox.top);
 }
});

test('The selected country reserves its full label beyond the overview nudge range',()=>{
 const nameBox={left:-35,right:35,top:-24,bottom:-5};
 const labelBox={left:-55,right:55,top:-24,bottom:38};
 const points=[
  {id:'FR',x:335,y:355,nameBox,labelBox},
  {id:'GB',x:426,y:337,nameBox,labelBox},
  {id:'DE',x:350,y:180,nameBox,labelBox}
 ];
 const hud={left:0,right:840,top:0,bottom:200};
 const panel={left:200,right:450,top:170,bottom:300};
 const layout=layoutCountryLabels(points,840,610,'DE',[hud,panel]);
 assert.equal(layout.DE.compact,false);
 assert.ok(Math.hypot(layout.DE.dx,layout.DE.dy)>64);
 assert.ok(layout.FR&&layout.GB);
 const reserved=[hud,panel];
 for(const p of points){
  const {dx,dy,compact}=layout[p.id],box=compact?nameBox:labelBox;
  const bounds={left:p.x+dx+box.left,right:p.x+dx+box.right,top:p.y+dy+box.top,bottom:p.y+dy+box.bottom};
  assert.ok(reserved.every(other=>bounds.right<=other.left||bounds.left>=other.right||bounds.bottom<=other.top||bounds.top>=other.bottom),p.id);
  reserved.push(bounds);
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

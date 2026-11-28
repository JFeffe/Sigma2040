import {localizeContent,translateText} from './localization.js?v=247';
import {mapCountries,countryOnMap} from './operation-map.js?v=247';
import {renderRatio,terrainLimit} from './graphics.js?v=247';
import {COOPERATION} from './cooperation.js?v=247';
import {paintSignals,signalSnapshot} from './feedback.js?v=247';
import {domeRaw,limitDome} from './dome-projection.js?v=247';
import {COUNTRIES,COUNTRY} from './data.js?v=247';
import {team,knownTargets,visiblePlots,cyberStatus,hasSafehouse} from './engine.js?v=247';
import {icon,esc} from './ui.js?v=247';
import {agentMapMarkers,mapAgents,OBSERVER_COLORS} from './map-markers.js?v=247';
export const createCamera=()=>({lon:25,lat:18,k:1,mode:'globe',yaw:0,pitch:0,panX:0,panY:0,expanded:false,foreign:true});
export function constrain(c){c.k=Math.max(1,Math.min(3,c.k));c.lat=Math.max(-80,Math.min(80,c.lat));c.lon=((c.lon+180)%360+360)%360-180;limitDome(c);return c;}
export function zoomAt(c,k){c.k=k;if(c.k<=1){c.panX=0;c.panY=0;}return constrain(c);}
export function focusCountry(c,id){if(COUNTRY[id]){[c.lon,c.lat]=COUNTRY[id].pos;if(c.mode==='dome'&&c.k>1){const raw=domeRaw(c.yaw,c.pitch),lon=((c.lon-5+540)%360-180)*Math.PI/180,[x,y]=raw(lon,c.lat*Math.PI/180);c.panX=-x;c.panY=y;}}return constrain(c);}
let context,texturePromise,cachedTerrain;
const geometryCache=new WeakMap();
function geometry(world){if(!geometryCache.has(world))geometryCache.set(world,world.map(f=>({type:'Feature',geometry:f.geometry,properties:{id:f.id},country:COUNTRIES.find(c=>c.iso===f.id)})));return geometryCache.get(world);}
// Country names sit inside the land mass; city markers keep their own coordinates.
const COUNTRY_LABEL_POS={FR:[2,46],US:[-102,39],CN:[103,34],IN:[78,22],RU:[78,59],GB:[-2,54],CA:[-105,57],BR:[-53,-11],DE:[11,51],TR:[34,40],ZA:[24,-29],JP:[138,37],PT:[-8.1,40.1],AU:[134,-24]};
const mapGlyph=id=>icon(id).replace('<svg class="icon"','<svg x="-7" y="-7" width="14" height="14" class="icon"');
export function countryPin(s,c,plots,targets){
 const f=s.factions[s.player],hack=cyberStatus(s,s.player,c.id),protectionRemaining=Math.max(0,...Object.values(s.factions).map(ff=>(ff.defense[c.id]||0)-s.turn+1)),protectedNow=protectionRemaining>0;
 const items=[
  ['access','eye','Accès',!!f.access[c.id]],
  ['mandate','seal','Mandat',!!f.authorized[c.id]],
  ['safehouse','moon','Planque',c.id===s.player||hasSafehouse(s,s.player,c.id)],
  ['hack','terminal','Hack',hack.active],
  ['protection','shield','Protection',protectedNow]
 ].filter(([key])=>!c.power||key==='protection');
 const status=items.map(([key,glyph,label,active],i)=>`<g class="map-status ${key} ${active?'is-active':'is-inactive'}" transform="translate(${(i-(items.length-1)/2)*22} ${c.power?11:27})"><title>${label} : ${active?'actif':'inactif'}${['hack','protection'].includes(key)&&active?' · '+(key==='hack'?hack.remaining:protectionRemaining)+' tour(s) restant(s)':''}</title><circle r="9"/>${mapGlyph(glyph)}${['hack','protection'].includes(key)&&active?`<g class="hack-count" aria-hidden="true"><circle cx="8" cy="-8" r="8"/><text x="8" y="-5" text-anchor="middle">${key==='hack'?hack.remaining:protectionRemaining}</text></g>`:''}</g>`).join('');
 const level=f.cooperation[c.id],relation=c.power?null:COOPERATION[level];
 const cooperation=relation?`<g class="pin-cooperation cooperation-${level}" transform="translate(4 5) scale(.7)"><title>Coopération avec votre équipe : ${relation.name} · ${level+1}/5</title><text x="-6" y="3" text-anchor="end">${relation.name}</text>${Array.from({length:5},(_,i)=>`<rect class="cooperation-bar ${i<=level?'filled':'empty'}" x="${2+i*11}" y="-7" width="8" height="11" rx="1.5"/>`).join('')}</g>`:'';
 const cooperationLabel=relation?translateText('Coopération avec votre équipe')+' · '+translateText(relation.name)+', '+translateText(`${level+1} sur 5`)+'. ':'';
 const statuses=items.map(([, ,label,active])=>translateText(label)+' '+translateText(active?'actif':'inactif')).join(', ');
 const name=translateText(c.name);
 const accessible=`${name}, ${translateText(c.city)}. ${cooperationLabel}${statuses}`;
 return `<g class="map-pin-v2 ${plots.some(p=>p.country===c.id)?'threatened':''}" data-cmd="map-country" data-id="${c.id}" role="button" tabindex="0" aria-label="${esc(accessible)}"><g class="city-mark"><circle class="pin-hit" r="15" fill="transparent"/><circle class="pin-ring" r="8"/><circle class="pin-core" r="3"/><text class="pin-country" x="12" y="-10">${c.id}</text>${targets.some(t=>t.country===c.id&&!t.arrested)?'<circle class="clue-mark intelligence-layer" cx="9" cy="-8" r="3"/>':''}</g><g class="map-country-label"><text class="pin-name" text-anchor="middle" y="-8">${esc(name.toUpperCase())}</text>${cooperation}<g class="pin-status-row">${status}</g></g></g>`;
}
const mapMargin=6,overviewLabelDistance=46,detailLabelDistance=64;
const labelNudges=Array.from({length:17},(_,i)=>(i-8)*8)
 .flatMap(dx=>Array.from({length:17},(_,i)=>{const dy=(i-8)*8;return {dx,dy,distance:Math.hypot(dx,dy)};}))
 .filter(p=>p.distance<=detailLabelDistance).sort((a,b)=>a.distance-b.distance);
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const clampLabel=(value,min,max)=>Math.max(min,Math.min(max,value));
const moveBox=(box,x,y)=>({left:box.left+x,right:box.right+x,top:box.top+y,bottom:box.bottom+y});
const insideStage=(box,width,height)=>box.left>=mapMargin&&box.right<=width-mapMargin&&box.top>=mapMargin&&box.bottom<=height-mapMargin;
const selectedFirst=(points,selected)=>[...points].sort((a,b)=>Number(b.id===selected)-Number(a.id===selected));

function nearestOpenPosition(x,y,box,width,height,occupied){
 const minX=mapMargin-box.left,maxX=width-mapMargin-box.right;
 const minY=mapMargin-box.top,maxY=height-mapMargin-box.bottom;
 if(minX>maxX||minY>maxY)return null;

 // The nearest free position can be at the anchor, at the stage edge, or beside an obstacle.
 const horizontal=new Set([minX,maxX,clampLabel(x,minX,maxX)]);
 const vertical=new Set([minY,maxY,clampLabel(y,minY,maxY)]);
 for(const obstacle of occupied){
  horizontal.add(clampLabel(obstacle.left-box.right,minX,maxX));
  horizontal.add(clampLabel(obstacle.right-box.left,minX,maxX));
  vertical.add(clampLabel(obstacle.top-box.bottom,minY,maxY));
  vertical.add(clampLabel(obstacle.bottom-box.top,minY,maxY));
 }
 let best=null,bestScore=Infinity;
 for(const labelX of horizontal)for(const labelY of vertical){
  const dx=labelX-x,dy=labelY-y,score=dx*dx+dy*dy;
  if(score>=bestScore)continue;
  const bounds=moveBox(box,labelX,labelY);
  if(occupied.some(other=>overlaps(bounds,other)))continue;
  best={dx,dy,bounds};bestScore=score;
 }
 return best;
}

// Reserve the complete selected readout before placing the surrounding countries.
export function layoutCountryLabels(points,width,height,selected,obstacles=[]){
 const occupied=[...obstacles,...points.map(p=>p.cityBox).filter(Boolean)],positions={};
 const focus=points.find(p=>p.id===selected);
 const selectedPlacement=focus&&nearestOpenPosition(focus.x,focus.y,focus.labelBox,width,height,occupied);
 if(selectedPlacement){
  const {dx,dy,bounds}=selectedPlacement;
  positions[selected]={dx,dy,compact:false};occupied.push(bounds);
 }
 for(const p of selectedFirst(points,selected)){
  if(positions[p.id])continue;
  const maxDistance=p.detail?detailLabelDistance:overviewLabelDistance;
  const compactPenalty=p.detail?maxDistance+1:15;
  const variants=p===focus?[[p.nameBox,true]]:[[p.labelBox,false],[p.nameBox,true]];
  let best=null,bestScore=Infinity;
  for(const [box,compact] of variants){
   const minX=mapMargin-p.x-box.left,maxX=width-mapMargin-p.x-box.right;
   const minY=mapMargin-p.y-box.top,maxY=height-mapMargin-p.y-box.bottom;
   if(minX>maxX||minY>maxY)continue;
   for(const nudge of labelNudges){
    const dx=clampLabel(nudge.dx,minX,maxX),dy=clampLabel(nudge.dy,minY,maxY),distance=Math.hypot(dx,dy);
    const score=distance+(compact?compactPenalty:0);
    if(distance>maxDistance||score>=bestScore)continue;
    const bounds=moveBox(box,p.x+dx,p.y+dy);
    if(occupied.some(other=>overlaps(bounds,other)))continue;
    best={dx,dy,compact,bounds};bestScore=score;
   }
  }
  if(!best)continue;
  const {dx,dy,compact,bounds}=best;
  positions[p.id]={dx,dy,compact};occupied.push(bounds);
 }
 return positions;
}

function placeCapitalCaption(point,box,width,height,occupied){
 const right=14-box.left,left=-14-box.right,center=-(box.left+box.right)/2;
 const candidates=[[right,-10],[left,-10],[right,19],[left,19],[center,14-box.top],[center,-14-box.bottom]];
 for(const [dx,dy] of candidates){
  const bounds=moveBox(box,point.cityX+dx,point.cityY+dy);
  if(insideStage(bounds,width,height)&&!occupied.some(other=>overlaps(bounds,other)))return {dx,dy,bounds};
 }
 return null;
}

function moveAgent(marker,dx,dy){
 marker.medallion.setAttribute('transform',`translate(${dx} ${dy})`);
 marker.tether.setAttribute('d',`M0 0L${dx} ${dy}`);
}

function svgBounds(element,gap){
 const {x,y,width,height}=element.getBBox();
 return {left:x-gap,right:x+width+gap,top:y-gap,bottom:y+height+gap};
}

function countryLabelPath(point,placement){
 const {dx,dy,compact}=placement;
 if(Math.hypot(dx,dy)<1)return '';
 const {x,y,cityX,cityY,cityBox,labelBox,nameBox}=point;
 const nearbyCapital=cityBox&&Math.hypot(cityX-x,cityY-y)<=detailLabelDistance;
 const fromX=nearbyCapital?cityX:x,fromY=nearbyCapital?cityY:y;
 const bounds=moveBox(compact?nameBox:labelBox,x+dx,y+dy);
 const endX=clampLabel(fromX,bounds.left,bounds.right),endY=clampLabel(fromY,bounds.top,bounds.bottom);
 const length=Math.hypot(endX-fromX,endY-fromY),startGap=nearbyCapital?8:0;
 if(length<=startGap+2)return '';
 const startX=fromX+(endX-fromX)*startGap/length,startY=fromY+(endY-fromY)*startGap/length;
 return `M${startX} ${startY}L${endX} ${endY}`;
}

function texture(){return texturePromise??=(async()=>{const img=new Image();img.src='./assets/earth.jpg';await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);return {width:c.width,height:c.height,data:ctx.getImageData(0,0,c.width,c.height).data};})().catch(e=>{texturePromise=null;throw e;});}
export function syncCameraTurn(camera,state,room='solo'){const key=`${room}:${state.seed}:${state.player}:${state.turn}`;if(camera.turnKey!==key){camera.turnKey=key;camera.foreign=true;}}
export function renderMap(s,selected,world,camera){context={s,selected,world};return `<div class="cartography ${camera.foreign===false?'foreign-hidden':''} ${camera.expanded?'map-expanded':''}" ${camera.expanded?'role="dialog" aria-modal="true" aria-label="Carte agrandie"':''}>
 <div class="cartography-top"><span>${icon('world')} OPÉRATION LIGNE DE FAILLE</span></div>
 <div class="map-stage"><canvas class="earth-canvas" aria-hidden="true"></canvas><svg id="strategicMap" class="strategic-map" role="group" tabindex="0" aria-label="${camera.mode==='dome'?'Dôme interactif. Glisser pour orienter, ou déplacer après zoom.':'Globe interactif. Glisser pour tourner.'} Flèches pour déplacer. Plus et moins pour zoomer."></svg><p class="globe-loading" role="status">Chargement du globe…</p></div>
 </div>`;}
export function mountMap(camera,getSelected,rerender){
 const svg=document.querySelector('#strategicMap');if(!svg)return ()=>{};
 const {s,world}=context,shell=svg.closest('.cartography'),canvas=shell.querySelector('canvas'),abort=new AbortController(),features=geometry(world),d3=globalThis.d3;
 let closed=false,frame=0,settle=0,dragging=false,moved=false,source=null,projection,width=0,height=0;
 const pointers=new Map();let pinch=0,origin=null;
 const on=(el,t,fn,opts={})=>el.addEventListener(t,fn,{...opts,signal:abort.signal});
 const message=shell.querySelector('.globe-loading');
 const deck=svg.closest('.command-deck');
 const navigation=deck?.querySelector('.deck-nav');
 const foreignToggle=deck?.querySelector('.field-team [data-map="foreign"]');
 const overlays=[...(deck?.querySelectorAll(
  '.deck-header,.news-ticker,.crisis-alert,.deck-nav,.field-team,.map-dossier,.pending-communication,.objective-strip,.attack-delay-banner')||[])];
 function syncForeignVisibility(){
  const visible=camera.foreign!==false;
  shell.classList.toggle('foreign-hidden',!visible);
  foreignToggle?.setAttribute('aria-pressed',visible);
 }
 function labelObstacles(){
  const stage=svg.getBoundingClientRect();
  return overlays.flatMap(el=>{
   const rect=el.getBoundingClientRect();
   if(!rect.width||!rect.height||getComputedStyle(el).visibility==='hidden')return [];
   const railWidth=el===navigation?Number.parseFloat(getComputedStyle(el).getPropertyValue('--atlas-rail-width'))||0:0;
   return [{left:rect.left-stage.left-3,right:Math.max(rect.right,rect.left+railWidth)-stage.left+3,
    top:rect.top-stage.top-3,bottom:rect.bottom-stage.top+3}];
  });
 }
 if(!d3){message.textContent=translateText('Globe indisponible. Le sélecteur de pays reste accessible.');return ()=>abort.abort();}
 const paths=features.map(f=>{
  const active=f.country&&countryOnMap(s,f.country.id);
  return active?`<path class="globe-country strategic" data-cmd="map-country" data-id="${f.country.id}"></path>`:
   `<path class="globe-country"><title>${esc(f.country?.name||f.properties.id)}</title></path>`;
 }).join('');
 const plots=visiblePlots(s),targets=knownTargets(s);
 svg.innerHTML=`<path class="globe-outline"/><g class="globe-countries">${paths}</g><path class="globe-grid"/><g class="globe-routes"></g><path class="pin-label-tether" aria-hidden="true"/><path class="pin-label-tether selected-country-tether" aria-hidden="true"/><g class="globe-pins">${mapCountries(s).map(c=>countryPin(s,c,plots,targets)).join('')}</g><g class="globe-agents">${agentMapMarkers(s)}</g>`;
 localizeContent(svg);
 const otherTethers=svg.querySelector('.pin-label-tether'),selectedTether=svg.querySelector('.selected-country-tether');
 const countryPaths=[...svg.querySelectorAll('.globe-country')],pins=[...svg.querySelectorAll('.map-pin-v2')].map(el=>{
  const label=el.querySelector('.map-country-label');
  return {el,label,country:COUNTRY[el.dataset.id],name:label.querySelector('.pin-name'),status:label.querySelector('.pin-status-row'),
   cityMark:el.querySelector('.city-mark'),city:el.querySelector('.pin-country')};
 }),agents=[...svg.querySelectorAll('.agent-map-anchor')].map(el=>({
  el,medallion:el.querySelector('.agent-medallion'),tether:el.querySelector('.agent-tether')
 }));
 function terrain(radius,fast){
  if(!source||!world.length)return;
  const size=fast?200:Math.min(terrainLimit(),Math.ceil(radius*2*renderRatio(width,height))),key=[size,camera.lon,camera.lat].join(':');
  if(cachedTerrain?.key!==key){
   const raster=document.createElement('canvas');raster.width=raster.height=size;
   const ctx=raster.getContext('2d'),out=ctx.createImageData(size,size),dst=out.data;
   const lon0=camera.lon*Math.PI/180,lat0=camera.lat*Math.PI/180,cl=Math.cos(lon0),sl=Math.sin(lon0),cp=Math.cos(lat0),sp=Math.sin(lat0),tau=2*Math.PI;
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=(x+.5-size/2)/(size/2),ny=-(y+.5-size/2)/(size/2),r2=nx*nx+ny*ny;if(r2>=1)continue;
    const i=(y*size+x)*4,z=Math.sqrt(1-r2),light=.57+.43*Math.max(0,-.3*nx+.35*ny+.88*z);
    // Inverse orthographic projection using the camera's east, north and front axes.
    const wx=-nx*sl-ny*sp*cl+z*cp*cl,wy=ny*cp+z*sp,wz=nx*cl-ny*sp*sl+z*cp*sl;
    const lon=Math.atan2(wz,wx),lat=Math.asin(Math.max(-1,Math.min(1,wy)));
    const sx=Math.min(source.width-1,Math.max(0,Math.floor((lon/tau+.5)*source.width))),sy=Math.min(source.height-1,Math.max(0,Math.floor((.5-lat/Math.PI)*source.height))),j=(sy*source.width+sx)*4;
    dst[i]=source.surface[j]*light;dst[i+1]=source.surface[j+1]*light;dst[i+2]=source.surface[j+2]*light;dst[i+3]=Math.min(255,(1-Math.sqrt(r2))*size*255);
   }
   ctx.putImageData(out,0,0);cachedTerrain={key,raster};
  }
  const ratio=renderRatio(width,height);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);const c=canvas.getContext('2d');c.scale(ratio,ratio);c.drawImage(cachedTerrain.raster,width/2-radius,height/2-radius,2*radius,2*radius);
 }
 function domeTerrain(radius,fast,raw){
  if(!source?.surface)return;
  const size=fast?220:Math.min(terrainLimit(),Math.ceil(radius*2*renderRatio(width,height))),rw=Math.ceil(size*1.22),key=['dome',size,camera.yaw,camera.pitch].join(':');
  if(cachedTerrain?.key!==key){
   const raster=document.createElement('canvas');raster.width=rw;raster.height=size;
   const ctx=raster.getContext('2d'),out=ctx.createImageData(rw,size),dst=out.data;
   for(let y=0;y<size;y++)for(let x=0;x<rw;x++){
    const nx=(x+.5-rw/2)/(size/2),ny=-(y+.5-size/2)/(size/2),p=raw.invert(nx,ny);if(!p)continue;
    const lon=((p[0]+5*Math.PI/180+3*Math.PI)%(2*Math.PI))-Math.PI,lat=p[1];
    const sx=Math.min(source.width-1,Math.max(0,Math.floor((lon/(2*Math.PI)+.5)*source.width))),sy=Math.min(source.height-1,Math.max(0,Math.floor((.5-lat/Math.PI)*source.height))),j=(sy*source.width+sx)*4,i=(y*rw+x)*4;
    const z=Math.sqrt(Math.max(0,1-(nx/1.22)**2-ny*ny)),light=.65+.35*Math.max(0,-.2*nx+.3*ny+.9*z);
    dst[i]=source.surface[j]*light;dst[i+1]=source.surface[j+1]*light;dst[i+2]=source.surface[j+2]*light;dst[i+3]=255;
   }
   ctx.putImageData(out,0,0);cachedTerrain={key,raster};
  }
  const ratio=renderRatio(width,height);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.drawImage(cachedTerrain.raster,width/2+camera.panX*radius-radius*1.22,height/2+camera.panY*radius-radius,2*radius*1.22,2*radius);
 }
 function paint(fast=false){
  if(closed)return;constrain(camera);width=svg.clientWidth;height=svg.clientHeight;if(!width||!height)return;
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);const dome=camera.mode==='dome',raw=domeRaw(camera.yaw,camera.pitch),radius=(dome?Math.min(width*.40,height*.50):Math.min(width*.46,height*.46))*camera.k;
  projection=dome?d3.geoProjection(raw).center(raw.invert(0,0).map(v=>v*180/Math.PI)).translate([width/2+camera.panX*radius,height/2+camera.panY*radius]).scale(radius).rotate([-5,0]).precision(.35):d3.geoOrthographic().translate([width/2,height/2]).scale(radius).rotate([-camera.lon,-camera.lat]).clipAngle(90);const path=d3.geoPath(projection),center=[camera.lon,camera.lat];
  if(dome)domeTerrain(radius,fast,raw);else terrain(radius,fast);svg.querySelector('.globe-outline').setAttribute('d',path({type:'Sphere'}));
  countryPaths.forEach((el,i)=>{el.setAttribute('d',path(features[i])||'');el.classList.toggle('chosen',features[i].country?.id===getSelected());el.classList.toggle('origin',features[i].country?.id===s.player);});
  svg.querySelector('.globe-grid').setAttribute('d',path(d3.geoGraticule10()));
  const visible=p=>dome||d3.geoDistance(center,p)<Math.PI/2-.03;
  const onStage=([x,y])=>x>=0&&x<=width&&y>=0&&y<=height;
  const detail=camera.k>=1.6,selected=getSelected();
  const points=[];
  for(const pin of pins){
   const {el,country,label,status}=pin,land=COUNTRY_LABEL_POS[country.id];
   const cityPoint=projection(country.pos),landPoint=projection(land);
   const cityVisible=visible(country.pos)&&onStage(cityPoint);
   const anchor=visible(land)&&onStage(landPoint)?landPoint:cityVisible?cityPoint:null;
   el.style.display=anchor?'':'none';
   if(!anchor)continue;
   const [cityX,cityY]=cityPoint;
   el.setAttribute('transform',`translate(${cityX} ${cityY})`);
   el.classList.toggle('chosen',country.id===selected);
   pin.cityMark.style.display=cityVisible?'':'none';
   if(pin.measuredWidth!==width){
    status.setAttribute('transform',width<700?'scale(.82)':'');
    pin.labelBox=svgBounds(label,3);pin.nameBox=svgBounds(pin.name,3);
    pin.cityBounds=null;pin.measuredWidth=width;
   }
   const cityBox=cityVisible?{left:cityX-13,right:cityX+13,top:cityY-13,bottom:cityY+13}:null;
   points.push({id:country.id,x:anchor[0],y:anchor[1],cityX,cityY,cityBox,detail,nameBox:pin.nameBox,labelBox:pin.labelBox,pin});
  }

  const obstacles=labelObstacles(),stationary=[],agentCenters=[];
  for(const marker of agents){
   const {el}=marker,foreign=el.classList.contains('foreign-map-anchor');
   const {travelFrom,travelTo}=el.dataset;
   const position=travelTo?d3.geoInterpolate(COUNTRY[travelFrom].pos,COUNTRY[travelTo].pos)(.5):[+el.dataset.x,+el.dataset.y];
   const [x,y]=projection(position),show=visible(position)&&(!foreign||camera.foreign!==false);
   el.style.display=show?'':'none';
   if(!show)continue;
   el.setAttribute('transform',`translate(${x} ${y})`);
   marker.box??=svgBounds(marker.medallion,4);
   let dx=+el.dataset.dx,dy=+el.dataset.dy;
   if(foreign){
    dx=Math.max(28-x,Math.min(dx,width-190-x));
    dy=Math.max(30-y,Math.min(dy,height-36-y));
   }else if(travelTo){
    const ids=[travelFrom,travelTo].sort(),interpolate=d3.geoInterpolate(COUNTRY[ids[0]].pos,COUNTRY[ids[1]].pos);
    const a=projection(interpolate(.49)),b=projection(interpolate(.51)),length=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
    const offset=+el.dataset.routeOffset||0;
    dx=(b[0]-a[0])/length*offset;dy=(b[1]-a[1])/length*offset;
   }else{
    stationary.push({marker,x,y,dx,dy});
    continue;
   }
   moveAgent(marker,dx,dy);
   obstacles.push(moveBox(marker.box,x+dx,y+dy));
   agentCenters.push([x+dx,y+dy]);
  }

  const labelPositions=layoutCountryLabels(points,width,height,selected,obstacles);
  const occupied=[...obstacles,...points.map(p=>p.cityBox).filter(Boolean)];
  const otherPaths=[];
  let selectedPath='';
  for(const point of points){
   const {id,x,y,cityX,cityY,pin,labelBox,nameBox}=point;
   const placement=labelPositions[id];
   pin.label.classList.toggle('map-label-hidden',!placement);
   if(!placement)continue;
   const {dx,dy,compact}=placement,fromX=x-cityX,fromY=y-cityY;
   pin.label.classList.toggle('map-label-compact',compact);
   pin.label.setAttribute('transform',`translate(${fromX+dx} ${fromY+dy})`);
   const connector=countryLabelPath(point,placement);
   if(id===selected)selectedPath=connector;
   else if(connector)otherPaths.push(connector);
   occupied.push(moveBox(compact?nameBox:labelBox,x+dx,y+dy));
  }
  otherTethers.setAttribute('d',otherPaths.join(' '));
  selectedTether.setAttribute('d',selectedPath);
  for(const point of selectedFirst(points,selected)){
   const {id,cityBox,pin}=point,{city,country}=pin;
   city.classList.add('map-label-hidden');
   if(!cityBox||!detail&&labelPositions[id])continue;
   const caption=detail?translateText(country.city):country.id;
   if(!pin.cityBounds||city.textContent!==caption){
    city.textContent=caption;city.setAttribute('x','0');city.setAttribute('y','0');
    pin.cityBounds=svgBounds(city,3);
   }
   const placement=placeCapitalCaption(point,pin.cityBounds,width,height,occupied);
   if(!placement)continue;
   city.setAttribute('x',placement.dx);city.setAttribute('y',placement.dy);
   city.classList.remove('map-label-hidden');
   occupied.push(placement.bounds);
  }
  for(const {marker,x,y,dx,dy} of stationary){
   const candidates=[[dx,dy],[-65,-55],[65,-55],[-65,55],[65,55],[0,-105],[0,105],[-115,0],[115,0]];
   let best=candidates[0],score=-Infinity,needsSpace=true;
   for(const candidate of candidates){
    const px=x+candidate[0],py=y+candidate[1],bounds=moveBox(marker.box,px,py);
    if(!insideStage(bounds,width,height))continue;
    const distance=Math.min(150,...agentCenters.map(p=>Math.hypot(px-p[0],py-p[1])));
    const collision=occupied.some(other=>overlaps(bounds,other));
    const value=distance-(collision?200:0)-Math.hypot(candidate[0]-dx,candidate[1]-dy)*.2;
    if(value>score){score=value;best=candidate;needsSpace=collision;}
   }
   if(needsSpace&&onStage([x,y])){
    const free=nearestOpenPosition(x+dx,y+dy,marker.box,width,height,occupied);
    if(free)best=[dx+free.dx,dy+free.dy];
   }
   const px=x+best[0],py=y+best[1];
   moveAgent(marker,...best);
   agentCenters.push([px,py]);occupied.push(moveBox(marker.box,px,py));
  }
  svg.querySelector('.globe-routes').innerHTML=mapAgents(s).filter(a=>a.task&&['travel','sneak'].includes(a.task.type)).map(a=>`<path data-agent="${a.id}" ${s.multiplayer?.observer?`style="stroke:${OBSERVER_COLORS[a.faction]}"`:""} class="travel-route ${signalSnapshot().some(x=>x.agentId===a.id&&x.kind==='order')?'route-feedback':''} ${a.task.type==='sneak'?'covert':''}" d="${path({type:'LineString',coordinates:[COUNTRY[a.country].pos,COUNTRY[a.task.target].pos]})||''}"><title>${esc(a.name)} · ${esc(translateText(`${a.task.remaining} ${a.task.remaining===1?'tour':'tours'}`))}</title></path>`).join('');
  syncForeignVisibility();
 }
 function schedule(fast=true){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;paint(fast&&dragging);});}
 function action(cmd){if(cmd==='in')zoomAt(camera,camera.k*1.25);if(cmd==='out')zoomAt(camera,camera.k/1.25);if(cmd==='reset')Object.assign(camera,{lon:25,lat:18,k:1,yaw:0,pitch:0,panX:0,panY:0});if(cmd==='focus'){if(camera.mode==='dome')camera.k=Math.max(1.65,camera.k);focusCountry(camera,getSelected());}if(cmd==='america')Object.assign(camera,{lon:-85,lat:15,k:1});if(cmd==='europe')Object.assign(camera,{lon:25,lat:18,k:1,yaw:0,pitch:0,panX:0,panY:0});if(cmd==='asia')Object.assign(camera,{lon:100,lat:20,k:1});if(camera.mode==='dome'&&['america','europe','asia'].includes(cmd)){camera.k=1.65;camera.yaw=camera.pitch=0;const raw=domeRaw(),point=raw((camera.lon-5)*Math.PI/180,camera.lat*Math.PI/180);camera.panX=-point[0];camera.panY=point[1];}if(cmd==='foreign'){camera.foreign=camera.foreign===false;try{localStorage.setItem('shadow-mandate-map-foreign',String(camera.foreign));}catch{}syncForeignVisibility();}if(cmd==='expand'){camera.expanded=!camera.expanded;rerender();return;}schedule(false);}
 on(shell,'click',e=>{const b=e.target.closest('[data-map]');if(b)action(b.dataset.map);});
 if(foreignToggle)on(foreignToggle,'click',()=>action('foreign'));
 on(svg,'pointerdown',e=>{if(e.button!==0&&e.pointerType!=='touch')return;pointers.set(e.pointerId,[e.clientX,e.clientY]);origin=[e.clientX,e.clientY];dragging=true;moved=false;pinch=0;});
 on(window,'pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId),p=[e.clientX,e.clientY];pointers.set(e.pointerId,p);if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)zoomAt(camera,camera.k*distance/pinch);pinch=distance;moved=true;}else{const dx=p[0]-old[0],dy=p[1]-old[1];if(camera.mode==='dome'){if(camera.k>1){const r=Math.min(width*.40,height*.50)*camera.k;camera.panX+=dx/r;camera.panY+=dy/r;}else{camera.yaw+=dx*.08;camera.pitch+=dy*.04;}}else{camera.lon-=dx*.3/camera.k;camera.lat+=dy*.3/camera.k;}if(Math.hypot(p[0]-origin[0],p[1]-origin[1])>4)moved=true;}schedule();});
 const release=e=>{pointers.delete(e.pointerId);pinch=0;if(!pointers.size){dragging=false;schedule(false);}};on(window,'pointerup',release);on(window,'pointercancel',release);
 on(svg,'click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false;}},{capture:true});
 on(svg,'wheel',e=>{e.preventDefault();zoomAt(camera,camera.k*Math.exp(-Math.max(-120,Math.min(120,e.deltaY))*.002));dragging=true;schedule();clearTimeout(settle);settle=setTimeout(()=>{dragging=false;schedule(false);},120);},{passive:false});
 on(svg,'keydown',e=>{if(e.target.matches('[data-cmd]')&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}if(e.target!==svg)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','0'].includes(e.key)){e.preventDefault();if(camera.mode==='dome'){const dx=e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0,dy=e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0;if(camera.k>1){camera.panX+=dx;camera.panY+=dy;}else{camera.yaw+=dx*20;camera.pitch+=dy*10;}}else{if(e.key==='ArrowLeft')camera.lon-=12;if(e.key==='ArrowRight')camera.lon+=12;if(e.key==='ArrowUp')camera.lat+=10;if(e.key==='ArrowDown')camera.lat-=10;}if(e.key==='+'||e.key==='=')action('in');if(e.key==='-')action('out');if(e.key==='0')action('reset');schedule(false);}});
 if(camera.expanded){on(document,'keydown',e=>{if(e.key==='Escape'){camera.expanded=false;rerender();}if(e.key==='Tab'){const all=[...shell.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(n=>n.getClientRects().length),i=all.indexOf(document.activeElement);if(e.shiftKey&&i<=0||!e.shiftKey&&i===all.length-1){e.preventDefault();all[e.shiftKey?all.length-1:0]?.focus();}}});svg.focus();}
 on(window,'graphicschange',()=>{cachedTerrain=null;schedule(false);});
 const resize=new ResizeObserver(()=>schedule(false));resize.observe(svg);for(const overlay of overlays)resize.observe(overlay);
 texture().then(t=>{if(closed)return;source=t;
   if(!t.surface&&world.length){
    const mask=document.createElement('canvas');mask.width=t.width;mask.height=t.height;const mc=mask.getContext('2d',{willReadFrequently:true});
    const flat=d3.geoEquirectangular().translate([t.width/2,t.height/2]).scale(t.width/(2*Math.PI));
    mc.beginPath();d3.geoPath(flat,mc)({type:'FeatureCollection',features});mc.fill();const land=mc.getImageData(0,0,t.width,t.height).data;t.surface=new Uint8ClampedArray(t.data.length);
    for(let i=0;i<t.data.length;i+=4){const a=land[i+3]/255,luma=.2126*t.data[i]+.7152*t.data[i+1]+.0722*t.data[i+2];t.surface[i]=20*(1-a)+(t.data[i]*.82+luma*.18)*a;t.surface[i+1]=62*(1-a)+(t.data[i+1]*.82+luma*.18)*a;t.surface[i+2]=91*(1-a)+(t.data[i+2]*.82+luma*.18)*a;t.surface[i+3]=255;}
   }
   message.hidden=!!t.surface;paint();}).catch(()=>{if(!closed)message.textContent=translateText('Texture indisponible : frontières et sélecteur accessibles.');});paint();paintSignals(svg);
 return ()=>{closed=true;abort.abort();resize.disconnect();cancelAnimationFrame(frame);clearTimeout(settle);};
}

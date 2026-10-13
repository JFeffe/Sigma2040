import {renderRatio,terrainLimit} from './graphics.js?v=193';
import {COOPERATION} from './cooperation.js?v=193';
import {paintSignals,signalSnapshot} from './feedback.js?v=193';
import {domeRaw,limitDome} from './dome-projection.js?v=193';
import {COUNTRIES,COUNTRY} from './data.js?v=193';
import {team,knownTargets,visiblePlots,cyberStatus,hasSafehouse} from './engine.js?v=193';
import {icon,esc} from './ui.js?v=193';
import {agentMapMarkers,mapAgents,OBSERVER_COLORS} from './map-markers.js?v=193';
export const createCamera=()=>{let mode='globe',foreign=true;try{if(localStorage.getItem('sigma-map-mode')==='dome')mode='dome';}catch{}return {lon:25,lat:18,k:1,mode,yaw:0,pitch:0,panX:0,panY:0,expanded:false,routes:true,intel:true,foreign};};
export function constrain(c){c.k=Math.max(1,Math.min(3,c.k));c.lat=Math.max(-80,Math.min(80,c.lat));c.lon=((c.lon+180)%360+360)%360-180;limitDome(c);return c;}
export function zoomAt(c,k){c.k=k;if(c.k<=1){c.panX=0;c.panY=0;}return constrain(c);}
export function focusCountry(c,id){if(COUNTRY[id]){[c.lon,c.lat]=COUNTRY[id].pos;if(c.mode==='dome'&&c.k>1){const raw=domeRaw(c.yaw,c.pitch),lon=((c.lon-5+540)%360-180)*Math.PI/180,[x,y]=raw(lon,c.lat*Math.PI/180);c.panX=-x;c.panY=y;}}return constrain(c);}
let context,texturePromise,cachedTerrain;
const geometryCache=new WeakMap();
function geometry(world){if(!geometryCache.has(world))geometryCache.set(world,world.map(f=>({type:'Feature',geometry:f.geometry,properties:{id:f.id},country:COUNTRIES.find(c=>c.iso===f.id)})));return geometryCache.get(world);}
// Country names sit inside the land mass; city markers keep their own coordinates.
const COUNTRY_LABEL_POS={FR:[2,46],US:[-102,39],CN:[103,34],IN:[78,22],RU:[78,59],GB:[-2,54],CA:[-105,57],BR:[-53,-11],DE:[11,51],TR:[34,40],ZA:[24,-29],JP:[138,37]};
const labelSize=width=>width<700?[146,67]:[156,69];
const mapGlyph=id=>icon(id).replace('<svg class="icon"','<svg x="-7" y="-7" width="14" height="14" class="icon"');
export function countryPin(s,c,plots,targets){
 const f=s.factions[s.player],hack=cyberStatus(s,s.player,c.id),protectedNow=Object.values(s.factions).some(ff=>(ff.defense[c.id]||0)>=s.turn);
 const items=[
  ['access','eye','Accès',!!f.access[c.id]],
  ['mandate','seal','Mandat',!!f.authorized[c.id]],
  ['safehouse','moon','Planque',c.id===s.player||hasSafehouse(s,s.player,c.id)],
  ['hack','terminal','Hack',hack.active],
  ['protection','shield','Protection',protectedNow]
 ].filter(([key])=>!c.power||key==='protection');
 const status=items.map(([key,glyph,label,active],i)=>`<g class="map-status ${key} ${active?'is-active':'is-inactive'}" transform="translate(${(i-(items.length-1)/2)*22} ${c.power?11:27})"><title>${label} : ${active?'actif':'inactif'}${key==='hack'&&active?' · '+hack.remaining+' tour(s) restant(s)':''}</title><circle r="9"/>${mapGlyph(glyph)}${key==='hack'&&active?`<g class="hack-count" aria-hidden="true"><circle cx="8" cy="-8" r="8"/><text x="8" y="-5" text-anchor="middle">${hack.remaining}</text></g>`:''}</g>`).join('');
 const level=f.cooperation[c.id],relation=c.power?null:COOPERATION[level];
 const cooperation=relation?`<g class="pin-cooperation cooperation-${level}" transform="translate(4 5) scale(.624)"><title>Coopération avec votre équipe : ${relation.name} · ${level+1}/5</title><text x="-6" y="3" text-anchor="end">${relation.name}</text>${Array.from({length:5},(_,i)=>`<rect class="cooperation-bar ${i<=level?'filled':'empty'}" x="${2+i*11}" y="-7" width="8" height="11" rx="1.5"/>`).join('')}</g>`:'';
 const accessible=`${c.name}, ${c.city}. ${relation?'Coopération avec votre équipe : '+relation.name+', '+(level+1)+' sur 5. ':''} ${items.map(([, ,label,active])=>`${label} ${active?'actif':'inactif'}`).join(', ')}`;
 return `<g class="map-pin-v2 ${plots.some(p=>p.country===c.id)?'threatened':''}" data-cmd="map-country" data-id="${c.id}" role="button" tabindex="0" aria-label="${esc(accessible)}"><g class="city-mark"><circle class="pin-hit" r="15" fill="transparent"/><circle class="pin-ring" r="8"/><circle class="pin-core" r="3"/><text class="pin-country" x="12" y="-10">${c.id}</text>${targets.some(t=>t.country===c.id&&!t.arrested)?'<circle class="clue-mark intelligence-layer" cx="9" cy="-8" r="3"/>':''}</g><g class="map-country-label"><text class="pin-name" text-anchor="middle" y="-8">${esc(c.name.toLocaleUpperCase('fr'))}</text>${cooperation}<g class="pin-status-row">${status}</g></g></g>`;
}
export function layoutCountryLabels(points,width,height,selected){
 const placed=[],positions={},cities=points.filter(p=>p.cityBox).map(p=>p.cityBox);
 const [cardWidth,cardHeight]=labelSize(width);
 const offsets=[[0,0],[0,-18],[0,18],[-18,0],[18,0],[-30,-18],[30,-18],[-30,18],[30,18],[0,-34],[0,34],[-42,0],[42,0]];
 if(cities.length)for(let radius=48;radius<=240;radius+=24)for(const [x,y] of [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]])offsets.push([x*radius,y*radius]);
 for(const p of [...points].sort((a,b)=>(a.id===selected?-1:0)-(b.id===selected?-1:0))){
  let best=offsets[0],score=Infinity;
  for(const [dx,dy] of offsets){const x=p.x+dx,y=p.y+dy,left=x-cardWidth/2,right=x+cardWidth/2,top=y-cardHeight/2+8,bottom=y+cardHeight/2+8;
   const outside=Math.max(0,8-left)+Math.max(0,right-(width-8))+Math.max(0,8-top)+Math.max(0,bottom-(height-8));
   const overlap=placed.reduce((n,q)=>n+Math.max(0,Math.min(right,q.right)-Math.max(left,q.left))*Math.max(0,Math.min(bottom,q.bottom)-Math.max(top,q.top)),0);
   const cityOverlap=cities.reduce((n,q)=>n+Math.max(0,Math.min(right,q.right)-Math.max(left,q.left))*Math.max(0,Math.min(bottom,q.bottom)-Math.max(top,q.top)),0);
   const value=cityOverlap*10000+overlap+outside*80+Math.hypot(dx,dy)*6;
   if(value<score){score=value;best=[dx,dy];}
  }
  const [dx,dy]=best,x=p.x+dx,y=p.y+dy;positions[p.id]=[dx,dy];placed.push({left:x-cardWidth/2,right:x+cardWidth/2,top:y-cardHeight/2+8,bottom:y+cardHeight/2+8});
 }
 return positions;
}
function texture(){return texturePromise??=(async()=>{const img=new Image();img.src='./assets/earth.jpg';await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);return {width:c.width,height:c.height,data:ctx.getImageData(0,0,c.width,c.height).data};})().catch(e=>{texturePromise=null;throw e;});}
export function syncCameraTurn(camera,state,room='solo'){const key=`${room}:${state.seed}:${state.player}:${state.turn}`;if(camera.turnKey!==key){camera.turnKey=key;camera.foreign=true;}}
export function renderMap(s,selected,world,camera){context={s,selected,world};return `<div class="cartography ${camera.foreign===false?'foreign-hidden':''} ${camera.expanded?'map-expanded':''}" ${camera.expanded?'role="dialog" aria-modal="true" aria-label="Carte agrandie"':''}>
 <div class="cartography-top"><span>${icon('world')} OPÉRATION LIGNE DE FAILLE</span><div class="map-view-switch" role="group" aria-label="Type de carte"><button data-map="dome" aria-pressed="${camera.mode==='dome'}">Dôme compact</button><button data-map="globe" aria-pressed="${camera.mode!=='dome'}">Globe</button></div></div>
 <div class="map-stage"><canvas class="earth-canvas" aria-hidden="true"></canvas><svg id="strategicMap" class="strategic-map" role="group" tabindex="0" aria-label="${camera.mode==='dome'?'Dôme interactif. Glisser pour orienter, ou déplacer après zoom.':'Globe interactif. Glisser pour tourner.'} Flèches pour déplacer. Plus et moins pour zoomer."></svg><p class="globe-loading" role="status">Chargement du globe…</p></div>

 <div class="map-bottom"><div class="map-layers"><button data-map="routes" aria-pressed="${camera.routes}">${icon('plane')} Trajets</button><button data-map="intel" aria-pressed="${camera.intel}">${icon('radar')} Info</button><button data-map="foreign" aria-pressed="${camera.foreign!==false}" title="Afficher ou masquer les agents étrangers repérés">${icon('people')} Agents étrangers</button></div><span class="map-instruction">${camera.mode==='dome'?'Glisser : orienter · Après zoom : déplacer':'Glisser : tourner'} · Molette : zoom</span></div></div>`;}
export function mountMap(camera,getSelected,rerender){
 const svg=document.querySelector('#strategicMap');if(!svg)return ()=>{};
 const {s,world}=context,shell=svg.closest('.cartography'),canvas=shell.querySelector('canvas'),abort=new AbortController(),features=geometry(world),d3=globalThis.d3;
 let closed=false,frame=0,settle=0,dragging=false,moved=false,source=null,projection,width=0,height=0;
 const pointers=new Map();let pinch=0,origin=null;
 const on=(el,t,fn,opts={})=>el.addEventListener(t,fn,{...opts,signal:abort.signal});
 const message=shell.querySelector('.globe-loading');
 if(!d3){message.textContent='Globe indisponible. Le sélecteur de pays reste accessible.';return ()=>abort.abort();}
 const paths=features.map(f=>`<path class="globe-country ${f.country?'strategic':''}" ${f.country?`data-cmd="map-country" data-id="${f.country.id}"`:''}><title>${esc(f.country?.name||f.properties.id)}</title></path>`).join('');
 const plots=visiblePlots(s),targets=knownTargets(s);
 svg.innerHTML=`<path class="globe-outline"/><g class="globe-countries">${paths}</g><path class="globe-grid"/><g class="globe-routes"></g><g class="globe-pins">${COUNTRIES.map(c=>countryPin(s,c,plots,targets)).join('')}</g><g class="globe-agents">${agentMapMarkers(s)}</g>`;
 const countryPaths=[...svg.querySelectorAll('.globe-country')],pins=[...svg.querySelectorAll('.map-pin-v2')],agents=[...svg.querySelectorAll('.agent-map-anchor')];
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
  const labelBoxes=[];
  const visiblePins=pins.map(el=>{const country=COUNTRY[el.dataset.id],land=COUNTRY_LABEL_POS[country.id],show=visible(land),cityPoint=projection(country.pos),countryPoint=projection(land);el.style.display=show?'':'none';el.querySelector('.city-mark').style.display=visible(country.pos)?'':'none';el.setAttribute('transform',`translate(${cityPoint[0]} ${cityPoint[1]})`);el.classList.toggle('chosen',country.id===getSelected());const city=el.querySelector('.pin-country');city.textContent=camera.k>=1.6?country.city:country.id;const offset=country.id==='GB'?[-35,-12]:country.id==='FR'?[-15,27]:[12,-10];city.setAttribute('x',offset[0]);city.setAttribute('y',offset[1]);const box=city.getBBox(),cityBox=visible(country.pos)?{left:cityPoint[0]+Math.min(-12,box.x)-5,right:cityPoint[0]+Math.max(12,box.x+box.width)+5,top:cityPoint[1]+Math.min(-12,box.y)-5,bottom:cityPoint[1]+Math.max(12,box.y+box.height)+5}:null;return show?{cityBox,id:country.id,x:countryPoint[0],y:countryPoint[1],cityX:cityPoint[0],cityY:cityPoint[1],el}:null;}).filter(Boolean);
  const labelPositions=layoutCountryLabels(visiblePins,width,height,getSelected());
  for(const {id,x,y,cityX,cityY,el} of visiblePins){const [dx,dy]=labelPositions[id],label=el.querySelector('.map-country-label');label.setAttribute('transform',`translate(${x-cityX+dx} ${y-cityY+dy})`);label.querySelector('.pin-status-row').setAttribute('transform',width<700?'scale(.82)':'');labelBoxes.push([x+dx,y+dy]);}
  const placed=[];
  agents.forEach(el=>{const moving=!!el.dataset.travelTo,p=moving?d3.geoInterpolate(COUNTRY[el.dataset.travelFrom].pos,COUNTRY[el.dataset.travelTo].pos)(.5):[+el.dataset.x,+el.dataset.y],show=visible(p),[x,y]=projection(p);el.style.display=show?'':'none';el.setAttribute('transform',`translate(${x} ${y})`);if(!show)return;if(el.classList.contains('foreign-map-anchor')){const dx=Math.max(28-x,Math.min(+el.dataset.dx,width-190-x)),dy=Math.max(30-y,Math.min(+el.dataset.dy,height-36-y));el.querySelector('.agent-medallion').setAttribute('transform',`translate(${dx} ${dy})`);el.querySelector('.agent-tether').setAttribute('d',`M0 0L${dx} ${dy}`);placed.push([x+dx+80,y+dy]);return;}if(moving){const ids=[el.dataset.travelFrom,el.dataset.travelTo].sort(),interpolate=d3.geoInterpolate(COUNTRY[ids[0]].pos,COUNTRY[ids[1]].pos),p1=projection(interpolate(.49)),p2=projection(interpolate(.51)),len=Math.hypot(p2[0]-p1[0],p2[1]-p1[1])||1,offset=+el.dataset.routeOffset||0,dx=(p2[0]-p1[0])/len*offset,dy=(p2[1]-p1[1])/len*offset;el.querySelector('.agent-medallion').setAttribute('transform',`translate(${dx} ${dy})`);el.querySelector('.agent-tether').setAttribute('d',`M0 0L${dx} ${dy}`);placed.push([x+dx,y+dy]);return;}const candidates=[[+el.dataset.dx,+el.dataset.dy],[-65,-55],[65,-55],[-65,55],[65,55],[0,-105],[0,105],[-115,0],[115,0]];let best=candidates[0],score=-Infinity;for(const q of candidates){const px=x+q[0],py=y+q[1];if(px<28||px>width-28||py<28||py>height-28)continue;const distance=Math.min(150,...placed.map(p=>Math.hypot(px-p[0],py-p[1]))),labels=Math.min(100,...labelBoxes.map(p=>Math.hypot(px-p[0],py-p[1])));const value=distance+Math.min(45,labels);if(value>score){score=value;best=q;}}placed.push([x+best[0],y+best[1]]);el.querySelector('.agent-medallion').setAttribute('transform',`translate(${best[0]} ${best[1]})`);el.querySelector('.agent-tether').setAttribute('d',`M0 0L${best[0]} ${best[1]}`);});
  svg.querySelector('.globe-routes').innerHTML=mapAgents(s).filter(a=>a.task&&['travel','sneak'].includes(a.task.type)).map(a=>`<path data-agent="${a.id}" ${s.multiplayer?.observer?`style="stroke:${OBSERVER_COLORS[a.faction]}"`:""} class="travel-route ${signalSnapshot().some(x=>x.agentId===a.id&&x.kind==='order')?'route-feedback':''} ${a.task.type==='sneak'?'covert':''}" d="${path({type:'LineString',coordinates:[COUNTRY[a.country].pos,COUNTRY[a.task.target].pos]})||''}"><title>${esc(a.name)} · ${a.task.remaining} tour(s)</title></path>`).join('');
  shell.classList.toggle('routes-hidden',!camera.routes);shell.classList.toggle('intel-hidden',!camera.intel);shell.classList.toggle('foreign-hidden',camera.foreign===false);shell.querySelectorAll('[data-map="routes"],[data-map="intel"],[data-map="foreign"]').forEach(b=>b.setAttribute('aria-pressed',camera[b.dataset.map]));
 }
 function schedule(fast=true){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;paint(fast&&dragging);});}
 function action(cmd){if(cmd==='dome'||cmd==='globe'){camera.mode=cmd;camera.k=1;camera.panX=camera.panY=0;try{localStorage.setItem('sigma-map-mode',cmd);}catch{}rerender();return;}if(cmd==='in')zoomAt(camera,camera.k*1.25);if(cmd==='out')zoomAt(camera,camera.k/1.25);if(cmd==='reset')Object.assign(camera,{lon:25,lat:18,k:1,yaw:0,pitch:0,panX:0,panY:0});if(cmd==='focus'){if(camera.mode==='dome')camera.k=Math.max(1.65,camera.k);focusCountry(camera,getSelected());}if(cmd==='america')Object.assign(camera,{lon:-85,lat:15,k:1});if(cmd==='europe')Object.assign(camera,{lon:25,lat:18,k:1,yaw:0,pitch:0,panX:0,panY:0});if(cmd==='asia')Object.assign(camera,{lon:100,lat:20,k:1});if(camera.mode==='dome'&&['america','europe','asia'].includes(cmd)){camera.k=1.65;camera.yaw=camera.pitch=0;const raw=domeRaw(),point=raw((camera.lon-5)*Math.PI/180,camera.lat*Math.PI/180);camera.panX=-point[0];camera.panY=point[1];}if(cmd==='routes'||cmd==='intel')camera[cmd]=!camera[cmd];if(cmd==='foreign'){camera.foreign=camera.foreign===false;try{localStorage.setItem('sigma-map-foreign',String(camera.foreign));}catch{}shell.classList.toggle('foreign-hidden',!camera.foreign);shell.querySelector('[data-map="foreign"]').setAttribute('aria-pressed',camera.foreign);}if(cmd==='expand'){camera.expanded=!camera.expanded;rerender();return;}schedule(false);}
 on(shell,'click',e=>{const b=e.target.closest('[data-map]');if(b)action(b.dataset.map);});
 on(svg,'pointerdown',e=>{if(e.button!==0&&e.pointerType!=='touch')return;pointers.set(e.pointerId,[e.clientX,e.clientY]);origin=[e.clientX,e.clientY];dragging=true;moved=false;pinch=0;});
 on(window,'pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId),p=[e.clientX,e.clientY];pointers.set(e.pointerId,p);if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)zoomAt(camera,camera.k*distance/pinch);pinch=distance;moved=true;}else{const dx=p[0]-old[0],dy=p[1]-old[1];if(camera.mode==='dome'){if(camera.k>1){const r=Math.min(width*.40,height*.50)*camera.k;camera.panX+=dx/r;camera.panY+=dy/r;}else{camera.yaw+=dx*.08;camera.pitch+=dy*.04;}}else{camera.lon-=dx*.3/camera.k;camera.lat+=dy*.3/camera.k;}if(Math.hypot(p[0]-origin[0],p[1]-origin[1])>4)moved=true;}schedule();});
 const release=e=>{pointers.delete(e.pointerId);pinch=0;if(!pointers.size){dragging=false;schedule(false);}};on(window,'pointerup',release);on(window,'pointercancel',release);
 on(svg,'click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false;}},{capture:true});
 on(svg,'wheel',e=>{e.preventDefault();zoomAt(camera,camera.k*Math.exp(-Math.max(-120,Math.min(120,e.deltaY))*.002));dragging=true;schedule();clearTimeout(settle);settle=setTimeout(()=>{dragging=false;schedule(false);},120);},{passive:false});
 on(svg,'keydown',e=>{if(e.target.matches('[data-cmd]')&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}if(e.target!==svg)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','0'].includes(e.key)){e.preventDefault();if(camera.mode==='dome'){const dx=e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0,dy=e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0;if(camera.k>1){camera.panX+=dx;camera.panY+=dy;}else{camera.yaw+=dx*20;camera.pitch+=dy*10;}}else{if(e.key==='ArrowLeft')camera.lon-=12;if(e.key==='ArrowRight')camera.lon+=12;if(e.key==='ArrowUp')camera.lat+=10;if(e.key==='ArrowDown')camera.lat-=10;}if(e.key==='+'||e.key==='=')action('in');if(e.key==='-')action('out');if(e.key==='0')action('reset');schedule(false);}});
 if(camera.expanded){on(document,'keydown',e=>{if(e.key==='Escape'){camera.expanded=false;rerender();}if(e.key==='Tab'){const all=[...shell.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(n=>n.getClientRects().length),i=all.indexOf(document.activeElement);if(e.shiftKey&&i<=0||!e.shiftKey&&i===all.length-1){e.preventDefault();all[e.shiftKey?all.length-1:0]?.focus();}}});svg.focus();}
 on(window,'graphicschange',()=>{cachedTerrain=null;schedule(false);});
 const resize=new ResizeObserver(()=>schedule(false));resize.observe(svg);
 texture().then(t=>{if(closed)return;source=t;
   if(!t.surface&&world.length){
    const mask=document.createElement('canvas');mask.width=t.width;mask.height=t.height;const mc=mask.getContext('2d',{willReadFrequently:true});
    const flat=d3.geoEquirectangular().translate([t.width/2,t.height/2]).scale(t.width/(2*Math.PI));
    mc.beginPath();d3.geoPath(flat,mc)({type:'FeatureCollection',features});mc.fill();const land=mc.getImageData(0,0,t.width,t.height).data;t.surface=new Uint8ClampedArray(t.data.length);
    for(let i=0;i<t.data.length;i+=4){const a=land[i+3]/255,luma=.2126*t.data[i]+.7152*t.data[i+1]+.0722*t.data[i+2];t.surface[i]=20*(1-a)+(t.data[i]*.82+luma*.18)*a;t.surface[i+1]=62*(1-a)+(t.data[i+1]*.82+luma*.18)*a;t.surface[i+2]=91*(1-a)+(t.data[i+2]*.82+luma*.18)*a;t.surface[i+3]=255;}
   }
   message.hidden=!!t.surface;paint();}).catch(()=>{if(!closed)message.textContent='Texture indisponible : frontières et sélecteur accessibles.';});paint();paintSignals(svg);
 return ()=>{closed=true;abort.abort();resize.disconnect();cancelAnimationFrame(frame);clearTimeout(settle);};
}

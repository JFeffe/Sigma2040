import {COUNTRIES} from './data.js?v=246';
import {esc} from './ui.js?v=246';
export function cityArt(id,extra=''){const i=COUNTRIES.findIndex(c=>c.id===id),c=COUNTRIES[i];return `<div class="city-art ${extra}" role="img" aria-label="${c.city}, illustration de 2040" style="${c.art?`background-image:url('./assets/${c.art}');background-size:cover;background-position:center`:`--cx:${i%3*50}%;--cy:${Math.floor(i/3)*100/3}%`}"><div class="city-caption"><strong>${c.city}</strong><span>2040 / ${c.id}</span></div></div>`;}
// Each entry contains the image, the shared-frame horizontal offset, and
// a profile viewBox around the silhouette with room for its soft edges.
const layeredBodies={
 p0:['iris-full-transparent.webp',184.5,'216 11 587 1494'],
 p12:['bishop-full-transparent.webp',47.0,'108 13 528 1462'],
 p13:['amber-full-transparent.webp',114.0,'214 44 450 1452'],
 p14:['lei-full-transparent.webp',11.0,'101 43 470 1448'],
 p15:['apero-full-transparent.webp',151.5,'224 26 505 1435'],
 p16:['mira-full-transparent.webp',129.5,'200 11 509 1474'],
 p17:['midnight-full-transparent.webp',193.5,'267 30 503 1439'],
 p18:['mercer-full-transparent.webp',159.0,'246 21 476 1458'],
 p19:['marlowe-full-transparent.webp',162.0,'235 29 505 1430'],
 p20:['nox-full-transparent.webp',230.0,'284 26 542 1447'],
 p21:['adler-full-transparent.webp',203.0,'279 38 499 1450'],
 p22:['dante-full-transparent.webp',208.0,'267 37 534 1413'],
 p23:['selin-full-transparent.webp',248.5,'302 45 544 1405'],
 p24:['rocket-full-transparent.webp',216.5,'262 22 558 1412'],
 p25:['alba-full-transparent.webp',222.0,'279 22 536 1440'],
 p26:['raven-full-transparent.webp',182.0,'237 43 540 1415'],
 p27:['link-full.webp',199,'230 0 588 1514'],
 p28:['viktor-full.webp',159,'203 11 563 1484'],
 p29:['monroe-full.webp',207,'246 10 572 1495'],
 p30:['tara-full.webp',195,'225 22 591 1511']
};
export function fullBody(agent,{alignTop=false,profile=false}={}){
 const alignment=profile?'xMidYMax meet':alignTop?'xMidYMin meet':'xMidYMid meet';
 const label=`${esc(agent.name)}, personnage debout de la tête aux pieds`;
 const body=layeredBodies[agent.templateId||agent.id];
 if(body){
  const [asset,cropX,profileFrame]=body;
  const viewBox=profile?profileFrame:'187 0 650 1536';
  const characterX=profile?0:187-cropX;
  const scenery=profile?'':'<image href="./assets/agent-full-background.png?v=246" width="1024" height="1536" class="agent-body-background"/>';
  return `<svg class="full-body iris-body agent-cutout" viewBox="${viewBox}" role="img" aria-label="${label}" preserveAspectRatio="${alignment}">${scenery}<image href="./assets/${asset}?v=246" x="${characterX}" width="1024" height="1536" class="agent-body-foreground"/></svg>`;
 }
 const i=agent.portrait??0,col=i%6,row=Math.floor(i/6),y=row?524:0,h=row?500:524;
 return `<svg class="full-body" viewBox="${col*256} ${y} 256 ${h}" preserveAspectRatio="${alignment}" role="img" aria-label="${label}"><image href="./assets/agent-bodies.png?v=246" width="1536" height="1024"/></svg>`;
}

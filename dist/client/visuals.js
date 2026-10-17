import {COUNTRIES} from './data.js?v=195';
import {esc} from './ui.js?v=195';
export function cityArt(id,extra=''){const i=COUNTRIES.findIndex(c=>c.id===id),c=COUNTRIES[i];return `<div class="city-art ${extra}" role="img" aria-label="${c.city}, illustration de 2040" style="--cx:${i%3*50}%;--cy:${Math.floor(i/3)*100/3}%"><div class="city-caption"><strong>${c.city}</strong><span>2040 / ${c.id}</span></div></div>`;}
// Keep the scenery frame fixed; shift only the character to center its silhouette.
const layeredBodies={
 p0:['iris-full-transparent.webp',184.5],p12:['bishop-full-transparent.webp',47.0],
 p13:['amber-full-transparent.webp',114.0],p14:['lei-full-transparent.webp',11.0],
 p15:['apero-full-transparent.webp',151.5],p16:['mira-full-transparent.webp',129.5],
 p17:['midnight-full-transparent.webp',193.5],p18:['mercer-full-transparent.webp',159.0],
 p19:['marlowe-full-transparent.webp',162.0],p20:['nox-full-transparent.webp',230.0],
 p21:['adler-full-transparent.webp',203.0],p22:['dante-full-transparent.webp',208.0],
 p23:['selin-full-transparent.webp',248.5],p24:['rocket-full-transparent.webp',216.5],
 p25:['alba-full-transparent.webp',222.0],p26:['raven-full-transparent.webp',182.0],
 p27:['link-full.webp',199],p28:['viktor-full.webp',159],
 p29:['monroe-full.webp',207],p30:['tara-full.webp',195]
};
export function fullBody(agent){const a={...agent,id:agent.templateId||agent.id};const body=layeredBodies[a.id];if(body){const [asset,cropX]=body;const characterX=187-cropX;return `<svg class="full-body iris-body agent-cutout" viewBox="187 0 650 1536" role="img" aria-label="${esc(a.name)}, personnage debout de la tête aux pieds" preserveAspectRatio="xMidYMid meet"><image href="./assets/agent-full-background.png?v=195" width="1024" height="1536" class="agent-body-background"/><image href="./assets/${asset}?v=195" x="${characterX}" width="1024" height="1536" class="agent-body-foreground"/></svg>`;}const i=a.portrait??0,col=i%6,row=Math.floor(i/6),y=row?524:0,h=row?500:524;return `<svg class="full-body" viewBox="${col*256} ${y} 256 ${h}" role="img" aria-label="${esc(a.name)}, personnage debout de la tête aux pieds" preserveAspectRatio="xMidYMid meet"><image href="./assets/agent-bodies.png?v=3" width="1536" height="1024"/></svg>`;}

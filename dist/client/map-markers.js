import {availability} from './presentation.js?v=174';
import {COUNTRY} from './data.js?v=174';
import {team,travelInProgress,activeSightings} from './engine.js?v=174';
import {esc,portraitAsset} from './ui.js?v=174';
export const OBSERVER_COLORS={FR:'#74b9ff',US:'#ffca70',CN:'#ff858d',IN:'#c7a0ff',RU:'#7cdec4',GB:'#f49dd6'};
export const mapAgents=s=>s.multiplayer?.observer?s.agents.filter(a=>s.multiplayer.humanFactions.includes(a.faction)):team(s);
const project=([lon,lat])=>[lon,lat];
export function routeSlots(s){
 const groups=new Map();for(const a of mapAgents(s).filter(travelInProgress)){const key=[a.task.origin||a.country,a.task.target].sort().join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a);}
 const slots={};for(const agents of groups.values())agents.sort((a,b)=>a.id.localeCompare(b.id)).forEach((a,i)=>{slots[a.id]=(i-(agents.length-1)/2)*60;});return slots;
}
export function agentMapMarkers(s){
 const slots=routeSlots(s);
 const groups=new Map();for(const a of mapAgents(s)){if(!groups.has(a.country))groups.set(a.country,[]);groups.get(a.country).push(a);}
 return [...groups].map(([country,agents])=>{const [x,y]=project(COUNTRY[country].pos);return agents.map((a,i)=>{
  const offsets=agents.length>4?agents.map((_,j)=>[Math.cos(j*2*Math.PI/agents.length)*100,Math.sin(j*2*Math.PI/agents.length)*100]):agents.length===1?[[0,-53]]:agents.length===2?[[-30,-50],[30,-50]]:agents.length===3?[[-56,-44],[0,-69],[56,-44]]:[[-32,-48],[32,-48],[-32,48],[32,48]];
  const [dx,dy]=travelInProgress(a)?[0,0]:offsets[i]||[0,-53],n=a.portrait??0,state=a.status==='captured'?'detained':a.task?'busy':'free',label=availability(a).label+(a.task?`, ${a.task.remaining} tour(s)`:'');
  return `<g class="agent-map-anchor ${s.multiplayer?.observer?'observer-map-agent':''}" style="--observer-color:${OBSERVER_COLORS[a.faction]}" ${travelInProgress(a)?`data-route-offset="${slots[a.id]||0}" data-travel-from="${a.task.origin||a.country}" data-travel-to="${a.task.target}"`:""} data-x="${x}" data-y="${y}" data-dx="${dx}" data-dy="${dy}" transform="translate(${x} ${y})"><g class="agent-screen-size"><path class="agent-tether" d="M0 0L${dx} ${dy}"/><g class="agent-medallion ${state}" transform="translate(${dx} ${dy})" data-cmd="map-agent" data-id="${a.id}" role="button" tabindex="0" aria-label="${esc(a.name)} · ${COUNTRY[country].name} · ${label}"><title>${esc(a.name)} · ${COUNTRY[a.faction].name} · ${label}</title><g class="medallion-face"><circle class="agent-shadow" cy="3" r="25"/><circle class="agent-halo" r="28"/><circle class="agent-rim" r="24"/><svg x="-21" y="-21" width="42" height="42" viewBox="0 0 42 42" aria-hidden="true"><defs><clipPath id="map-agent-${a.id}"><circle cx="21" cy="21" r="21"/></clipPath></defs><g clip-path="url(#map-agent-${a.id})">${portraitAsset(a)?`<image href="${portraitAsset(a)}" width="42" height="42" preserveAspectRatio="xMidYMid slice"/>`:`<svg width="42" height="42" viewBox="${n%3*362} ${Math.floor(n/3)*362} 362 362" preserveAspectRatio="xMidYMid slice"><image href="./assets/agents.png?v=3" width="1086" height="1448"/></svg>`}</g></svg><circle class="agent-glass-edge" r="21"/><g class="agent-state-badge" transform="translate(18 17)"><circle r="9"/>${state==='free'?'<path d="m-4 0 3 3 5-6"/>':state==='busy'?'<circle class="clock-dial" r="5"/><path d="M0-3V0L3 2"/>':'<path d="M-4-1H4V5H-4ZM-2-1V-4Q0-7 2-4V-1"/>'}</g></g></g></g></g>`;
 }).join('');}).join('')+(s.multiplayer?.observer?'':foreignMapMarkers(s));
}

export function foreignMapMarkers(s){
 const groups=new Map();for(const a of activeSightings(s)){if(!groups.has(a.country))groups.set(a.country,[]);groups.get(a.country).push(a);}
 return [...groups].map(([country,agents])=>agents.map((a,i)=>{const [x,y]=COUNTRY[country].pos,dx=90,dy=55+i*66,n=a.portrait??0,label=`${a.name} · Équipe ${COUNTRY[a.faction].name} · Dernière position : ${COUNTRY[country].name} · Repéré T${a.turn} · Valable jusqu’à fin T${a.until}`;
 return `<g class="agent-map-anchor foreign-map-anchor" data-x="${x}" data-y="${y}" data-dx="${dx}" data-dy="${dy}"><g class="agent-screen-size"><path class="agent-tether" d="M0 0L${dx} ${dy}"/><g class="agent-medallion foreign-medallion" transform="translate(${dx} ${dy})" data-cmd="map-country" data-id="${country}" role="button" tabindex="0" aria-label="${esc(label)}"><title>${esc(label)}</title><rect class="foreign-sighting-box" x="-25" y="-26" width="210" height="60" rx="8"/><svg x="-20" y="-20" width="36" height="42" viewBox="0 0 36 42">${portraitAsset(a)?`<image href="${portraitAsset(a)}" width="36" height="42" preserveAspectRatio="xMidYMid slice"/>`:`<svg width="36" height="42" viewBox="${n%3*362} ${Math.floor(n/3)*362} 362 362"><image href="./assets/agents.png?v=3" width="1086" height="1448"/></svg>`}</svg><text x="24" y="-10" class="foreign-sighting-name">${esc(a.name)}</text><text x="24" y="7">${esc(COUNTRY[a.faction].name)} · T${a.turn}</text><text x="24" y="24">Position : ${esc(COUNTRY[country].name)}</text></g></g></g>`;
 }).join('')).join('');
}

import {COUNTRIES} from './data.js?v=192';
export const PLANNED_THREAT_GAP=6;
export const LIVE_THREAT_GAP=4;
// All cells, including the Architect, share one country quota and timeline.
export function balanceThreatCountries(s,random){
 const countries=COUNTRIES.filter(c=>!c.power).map(c=>c.id),plots=[...s.plots].sort((a,b)=>a.turn-b.turn),used=Object.fromEntries(countries.map(c=>[c,0])),last={};
 const shuffled=[...countries].sort((a,b)=>a.localeCompare(b));
 for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 const quotas=Object.fromEntries(shuffled.map((c,i)=>[c,Math.floor(plots.length/countries.length)+(i<plots.length%countries.length?1:0)]));
 const priorities=plots.map(()=>Object.fromEntries(countries.map(c=>[c,random(s)])));
 function place(i){
  if(i===plots.length)return true;
  const p=plots[i],choices=countries.filter(c=>used[c]<quotas[c]&&(last[c]===undefined||p.turn-last[c]>=PLANNED_THREAT_GAP)).sort((a,b)=>used[a]-used[b]||priorities[i][a]-priorities[i][b]);
  for(const c of choices){const previous=last[c];used[c]++;last[c]=p.turn;p.country=c;if(place(i+1))return true;used[c]--;if(previous===undefined)delete last[c];else last[c]=previous;}
  return false;
 }
 if(!place(0))throw Error('Calendrier des menaces incompatible avec leur répartition.');
}
export function threatCountryClear(s,p,country,turn,gap=LIVE_THREAT_GAP){return s.plots.every(q=>q.id===p.id||q.cancelled||q.country!==country||Math.abs(q.turn-turn)>=gap);}
export function relocationCountries(s,p,choices,turn){
 const cap=Math.ceil(s.plots.length/COUNTRIES.filter(c=>!c.power).length);
 const counts=c=>s.plots.filter(q=>q.id!==p.id&&!q.cancelled&&q.country===c).length;
 const safe=choices.filter(c=>counts(c.id)<cap&&threatCountryClear(s,p,c.id,turn,PLANNED_THREAT_GAP));
 const least=Math.min(...safe.map(c=>counts(c.id)));
 return safe.filter(c=>counts(c.id)===least);
}

import {COUNTRIES,COUNTRY} from './data.js?v=231';

const fields=COUNTRIES.filter(c=>!c.power);
const legacyFields=fields.filter(c=>!c.expansion).map(c=>c.id);
const expandedFields=fields.map(c=>c.id);
const quickFromHQ={
 FR:['DE','TR','PT'],GB:['CA','DE','PT'],US:['CA','BR','PT'],
 RU:['DE','TR','JP'],IN:['ZA','JP','AU'],CN:['TR','JP','AU']
};
const routeKey=(from,to)=>[from,to].sort().join('-');
const quickField=new Set(['BR-CA','CA-JP','BR-ZA','DE-TR','DE-PT','PT-TR','AU-ZA','AU-JP']);
const legacyQuick=new Set(['BR-US','IN-JP','CN-TR']);

export function travelTurns(from,to,s){
 const a=COUNTRY[from],b=COUNTRY[to];
 if(s?.operationCountries&&a.power!==b.power)
  return quickFromHQ[a.power?from:to].includes(a.power?to:from)?1:2;
 if(s?.operationCountries&&!a.power&&!b.power)
  return from===to||quickField.has(routeKey(from,to))?1:2;
 return legacyQuick.has(routeKey(from,to))||Math.abs(a.pos[0]-b.pos[0])+Math.abs(a.pos[1]-b.pos[1])<=60?1:2;
}
export const operationIds=s=>s?.operationCountries??legacyFields;
export const operationCountries=s=>operationIds(s).map(id=>COUNTRY[id]);
export const mapCountries=s=>COUNTRIES.filter(c=>c.power||operationIds(s).includes(c.id));
export const countryOnMap=(s,id)=>!!COUNTRY[id]&&(COUNTRY[id].power||operationIds(s).includes(id));

export function validOperationMap(participants,ids,mode){
 if(!Array.isArray(ids)||ids.length!==(mode==='cooperative'?8:6)||new Set(ids).size!==ids.length||ids.some(id=>!expandedFields.includes(id)))return false;
 if(mode==='cooperative')return true;
 if(participants.length!==4||participants.some(id=>!quickFromHQ[id]))return false;
 const near=ids.filter(id=>participants.some(hq=>quickFromHQ[hq].includes(id)));
 return near.length>=5&&participants.every(hq=>ids.filter(id=>quickFromHQ[hq].includes(id)).length>=2)&&
  ids.every(id=>ids.some(other=>other!==id&&quickField.has(routeKey(id,other))));
}

export function selectOperationMap(participants,seed,mode){
 if(mode==='cooperative')return [...expandedFields];
 const candidates=[];
 for(let a=0;a<expandedFields.length-1;a++)for(let b=a+1;b<expandedFields.length;b++){
  const ids=expandedFields.filter((_,index)=>index!==a&&index!==b);
  if(validOperationMap(participants,ids,mode))candidates.push(ids);
 }
 if(!candidates.length)throw Error('Aucune carte compatible avec les superpuissances choisies.');
 let roll=(seed^0x85ebca6b)>>>0;
 roll=Math.imul(roll^(roll>>>16),0x7feb352d);
 roll=Math.imul(roll^(roll>>>15),0x846ca68b);
 roll=(roll^(roll>>>16))>>>0;
 return candidates[Math.floor(roll/4294967296*candidates.length)];
}

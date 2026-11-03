// Probabilities conditional on a failed action. Secourisme acts afterwards.
export function incidentRates(type,clandestine=false){
 if(['findSafehouse','intimidate'].includes(type))return {safe:.75,injury:.20,capture:.05};
 if(type==='equip')return {safe:.75,injury:.175,capture:.075};
 if(type==='sneak'||type==='arrest'&&clandestine)return {safe:.50,injury:.35,capture:.15};
 if(type==='arrest'||type==='rescue')return {safe:.50,injury:.40,capture:.10};
 return null;
}
const percent=n=>String(Math.round(n*1000)/10).replace('.',',')+' %';
export function incidentDescription(type,clandestine=false){
 const rates=incidentRates(type,clandestine);
 return rates?`${percent(rates.safe)} sans nouvelle blessure ni capture, ${percent(rates.injury)} de blessure, ${percent(rates.capture)} de capture. Aucun décès.`:'';
}

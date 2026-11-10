import {COUNTRY} from './data.js?v=238';
import {esc,flag,icon} from './ui.js?v=238';
import {travelInProgress} from './engine.js?v=238';
export function agentLocation(a,{compact=false,pin=false}={}){
 const moving=travelInProgress(a),from=moving?(a.task.origin||a.country):a.country,to=a.task?.target;
 return `<span class="agent-deployment" title="${moving?'Trajet en cours':'Pays actuel'} : ${esc(COUNTRY[from].name)}${moving?' → '+esc(COUNTRY[to].name):''}">${pin?icon('pin'):''}${flag(from)}<span>${moving?(compact?'En transit · ':'En transit depuis · '):compact?'':'Position · '}${esc(COUNTRY[from].name)}${moving?' → '+esc(COUNTRY[to].name):a.country===a.faction?' · QG':''}</span></span>`;
}

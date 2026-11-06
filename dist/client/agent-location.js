import {COUNTRY} from './data.js?v=223';
import {esc,flag} from './ui.js?v=223';
import {travelInProgress} from './engine.js?v=223';
export function agentLocation(a){
 const moving=travelInProgress(a),from=moving?(a.task.origin||a.country):a.country,to=a.task?.target;
 return `<span class="agent-deployment" title="${moving?'Trajet en cours':'Pays actuel'} : ${esc(COUNTRY[from].name)}${moving?' → '+esc(COUNTRY[to].name):''}">${flag(from)}<span>${moving?'En transit depuis':'Position'} · ${esc(COUNTRY[from].name)}${moving?' → '+esc(COUNTRY[to].name):a.country===a.faction?' · QG':''}</span></span>`;
}

import {COUNTRY} from './data.js?v=236';
import {mapCountries} from './operation-map.js?v=236';
import * as E from './engine.js?v=236';
import {button,esc,portrait} from './ui.js?v=236';

export function deploymentOptions(s,type,target){
 return E.team(s).filter(a=>!['dead','retired'].includes(a.status)).map(a=>({agent:a,...E.options(s,a.id,type,target)}));
}
export function agentTravelDestinations(s,id){
 const agent=E.team(s).find(a=>a.id===id);
 if(!agent)return [];
 return mapCountries(s).filter(c=>c.id!==agent.country&&(!c.power||c.id===agent.faction)).map(country=>({
  country,travel:E.options(s,id,'travel',country.id),sneak:E.options(s,id,'sneak',country.id)
 }));
}

function deploymentMode(type){
 return `<label class="deployment-mode">Mode de déplacement<select id="deploymentMode" aria-describedby="deploymentModeHelp"><option value="travel" ${type==='travel'?'selected':''}>Avec passeport</option><option value="sneak" ${type==='sneak'?'selected':''}>Passage clandestin</option></select></label><p id="deploymentModeHelp">${type==='travel'?'Départ sans arme. Arrivée signalée et +10 points d’exposition de base. Réussite automatique.':'Arme conservée. Réussite : exposition remise à zéro. Échec : voyage raté, exposition accrue et risque de blessure ou de capture.'}</p>`;
}

export function agentTravelPickerMarkup(s,id){
 const choice=agentTravelDestinations(s,id).find(row=>!row.travel.error||!row.sneak.error);
 return deploymentPickerMarkup(s,choice?.travel.error?'sneak':'travel',choice?.country.id,[id],id);
}

export function deploymentPickerMarkup(s,type,target,selectedIds=[],agentId=null){
 const rows=target?deploymentOptions(s,type,target):[],available=rows.some(o=>!o.error),selected=new Set(rows.filter(o=>!o.error&&selectedIds.includes(o.agent.id)).map(o=>o.agent.id)),count=selected.size;
 const destination=agentId?`<label class="deployment-mode">Destination<select id="deploymentDestination" ${target?'':'disabled'}>${agentTravelDestinations(s,agentId).map(({country,travel,sneak})=>`<option value="${country.id}" ${country.id===target?'selected':''} ${travel.error&&sneak.error?'disabled':''}>${esc(country.name)}</option>`).join('')}</select></label>`:`<p>Destination : <strong>${esc(COUNTRY[target]?.name)}</strong></p>`;
 return `<div class="simple-modal deployment-picker" data-deployment-agent="${esc(agentId)}" data-deployment-type="${esc(type)}" data-deployment-target="${esc(target)}"><span class="eyebrow">DÉPLOIEMENT</span><h2>Choisir un agent</h2>${destination}${deploymentMode(type)}<p class="deployment-mode">${type==='travel'?'Voyage avec passeport':'Passage clandestin'}</p><p>Cochez les agents à envoyer, puis confirmez leur déploiement ensemble.</p><fieldset class="deployment-agents"><legend class="sr-only">Agents à déployer</legend>${rows.map(({agent:a,error,duration,fatigue,chance})=>`<label class="agent-picker deployment-agent ${error?'unavailable':''}"><input type="checkbox" name="deployAgent" value="${esc(a.id)}" ${error?'disabled':''} aria-label="Déployer ${esc(a.name)}" aria-describedby="deploy-${esc(a.id)}" ${selected.has(a.id)?'checked':''}>${portrait(a)}<div><strong>${esc(a.name)}</strong><span id="deploy-${esc(a.id)}">${esc(COUNTRY[a.country].city)} · ${error?esc(error):`${duration} tour(s) · ${fatigue} énergie`} · ${chance} % de réussite</span></div></label>`).join('')}</fieldset>${available?'':'<p class="notice warning">Aucun agent disponible pour cette destination.</p>'}<div class="deployment-confirm"><p id="deploymentCount" role="status">${count} agent${count>1?'s':''} sélectionné${count>1?'s':''}</p>${button(count?`Déployer ${count} agent${count>1?'s':''}`:'Déployer les agents','confirm-deployment','primary wide',count?'':'disabled')}</div></div>`;
}
// Validate the whole group before staging any order. Travel has no shared
// resource cost; each agent keeps the engine's own duration and modifiers.
export function assignDeployment(s,ids,type,target){
 if(!Array.isArray(ids)||ids.length<1||ids.length>4||new Set(ids).size!==ids.length||!['travel','sneak'].includes(type)||typeof target!=='string'||!Object.hasOwn(COUNTRY,target))throw Error('Déploiement invalide.');
 const agents=ids.map(id=>s.agents.find(a=>a.id===id&&a.faction===s.player));
 if(agents.some(a=>!a))throw Error('Un agent de ce groupe ne vous appartient pas.');
 for(const a of agents){const o=E.options(s,a.id,type,target);if(o.error)throw Error(`${a.name} : ${o.error}`);}
 return agents.map(a=>E.assign(s,a.id,type,target));
}

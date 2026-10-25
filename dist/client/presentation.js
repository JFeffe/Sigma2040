import {investigationSteps,investigationProgressMarkup} from './investigation-steps.js?v=196';
import {COUNTRIES,COUNTRY,ACTIONS} from './data.js?v=196';
import {icon,esc} from './ui.js?v=196';
import {evidenceFor,knownTargets,hasSafehouse,options} from './engine.js?v=196';
const fieldOnly=new Set(['contacts','authorize','hide','influence','blackmail','drone','rescue']);
export function locationActions(a,s=null){const home=a.country===a.faction,local=s?knownTargets(s,a.faction).some(t=>!t.arrested&&t.country===a.country):true;return Object.entries(ACTIONS).filter(([id,d])=>!d.disabled&&(home?!d.field&&!fieldOnly.has(id):!d.home)&&(id!=='rescue'||!!s?.agents.some(b=>b.faction===a.faction&&b.status==='captured'&&b.country===a.country))&&(id!=='findSafehouse'||!!s||!a.safehouses?.includes(a.country))&&(!['collect','surveil','prepare','arrest','hack','intimidate'].includes(id)||local));}
export const CONTEXT_ACTIONS=new Set(['collect','surveil','prepare','arrest','hack','intimidate','protect']);
export const agentMenuActions=(a,s)=>locationActions(a,s).filter(([id])=>!CONTEXT_ACTIONS.has(id));
export function countryOptions(selected,exclude=null,secondaryOnly=false){if(secondaryOnly)return COUNTRIES.filter(c=>!c.power&&c.id!==exclude).map(c=>`<option value="${c.id}" ${c.id===selected?'selected':''}>${c.name}</option>`).join('');return [[true,'Superpuissances'],[false,'Autres pays']].map(([power,label])=>`<optgroup label="${label}">${COUNTRIES.filter(c=>!!c.power===power&&c.id!==exclude).map(c=>`<option value="${c.id}" ${c.id===selected?'selected':''}>${c.name}</option>`).join('')}</optgroup>`).join('');}
export function availability(a){
 if(a.status==='captured')return {kind:'detained',label:'EN DÉTENTION',icon:'lock'};
 if(a.task){const t=a.task,travel=['travel','sneak'].includes(t.type),rest=['rest','heal'].includes(t.type),label=travel?'EN VOYAGE':rest?(t.type==='heal'?'EN SOINS':'AU REPOS'):'EN MISSION';return {kind:'busy',label:t.queued?'ORDRE PLANIFIÉ':label,icon:travel?'plane':'clock'};}
 return {kind:'free',label:a.status==='injured'?'DISPONIBLE · BLESSÉ':'DISPONIBLE',icon:'check'};
}
export function statusBadge(a){const b=availability(a),t=a.task;return `<span class="availability ${b.kind}">${icon(b.icon)}${b.label}</span>${t?`<span class="availability-progress"><progress aria-label="Progression de ${esc(ACTIONS[t.type].name)}" max="${t.total}" value="${t.total-t.remaining}"></progress><small>${t.queued?'Début en fin de tour · ':''}${t.remaining} tour${t.remaining>1?'s':''} restant${t.remaining>1?'s':''}</small></span>`:''}`;}
export const caseProgress=investigationSteps;
export const progressMarkup=investigationProgressMarkup;

export const ACTION_GROUPS=[
 ['Déplacements',['travel','sneak']],
 ['Renseignement et enquête',['contacts','collect','analyze','surveil','authorize','prepare','arrest']],
 ['Intervention et protection',['rescue','influence','intimidate','hack','drone','protect','counter','cyberSupport']],
 ['Équipement et discrétion',['equip','findSafehouse','fieldRest','hide']],
 ['Repos et soins',['rest','heal']]
];
export function completedAction(s,a,type){return a.country!==a.faction&&(type==='contacts'&&!!s.factions[a.faction].access[a.country]||type==='authorize'&&!!s.factions[a.faction].authorized[a.country]||type==='findSafehouse'&&hasSafehouse(s,a.faction,a.country));}
export function actionOptions(allowed,selected,s=null,a=null,target=null){const available=new Map(allowed);return ACTION_GROUPS.map(([label,ids])=>{const entries=ids.filter(id=>available.has(id));return entries.length?`<optgroup label="${esc(label)}">${entries.map(id=>{const complete=!!s&&!!a&&completedAction(s,a,id),unavailable=complete||!!s&&!!a&&actionUnavailable(s,a,id);return `<option value="${id}" ${id===selected?'selected':''} ${id==='collect'&&s&&a&&knownTargets(s,a.faction).filter(t=>!t.arrested&&t.country===a.country).every(t=>evidenceFor(s,a.faction,t.id).length>=2)?'disabled':''} class="${complete?'action-unavailable action-complete':unavailable?'action-unavailable':''}">${esc(available.get(id).name)}${id==='intimidate'&&s&&a?intimidationLabel(s,a,target):''}${complete?' · Terminé ✓':unavailable?' · Indisponible':''}</option>`;}).join('')}</optgroup>`:'';}).join('');}

export function actionUnavailable(s,a,type){
 let targets=[null];
 if(['travel','sneak','cyberSupport'].includes(type))targets=COUNTRIES.filter(c=>c.id!==a.country).map(c=>c.id);
 else if(['collect','surveil','hack','prepare','arrest','intimidate'].includes(type))targets=knownTargets(s,a.faction).filter(t=>!t.arrested&&t.country===a.country).map(t=>t.id);
 else if(type==='rescue')targets=s.agents.filter(b=>b.faction===a.faction&&b.status==='captured'&&b.country===a.country).map(b=>b.id);
 return !targets.length||targets.every(target=>!!options(s,a.id,type,target).error);
}

export const ACTION_EFFECTS={
 influence:['Activer un contact : accès local','Coopération +1 niveau'],
 intimidate:['Recueillir une preuve disponible','Localiser jusqu’à la fin du tour suivant','Exposition +20 (16 avec Infiltration)'],
 hack:['Preuve disponible à vérifier · falsification possible','Hack du pays +1 tour · Recherche +1','Sans localisation · accès requis'],
 drone:['Ouvre l’accès local','Découvre et localise tous les suspects du pays','Sauf l’Architecte encore inconnu · aucune preuve','1 tour · 12 énergie · 1 module pendant la mission']
};
export function actionResourceBadges(type){
 const research={contacts:1,hack:1,counter:2}[type]||0,module=ACTIONS[type]?.tech;
 return `${research?`<span class="research-requirement">${icon('research')} Recherche +${research}</span>`:''}${module?`<span class="module-requirement" title="Une place réservée pendant la mission, libérée à la fin ou à l’annulation">${icon('module')} Module · 1 place</span>`:''}`;
}
export function actionResources(type){const badges=actionResourceBadges(type);return badges?`<div class="action-resources" aria-label="Recherche et Module">${badges}</div>`:'';}
export function actionEffects(type){return ACTION_EFFECTS[type]?`<div class="action-effects" aria-label="Effets clés">${ACTION_EFFECTS[type].map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:'';}

export function sortedCaseTargets(s){
 const category=t=>t.arrested?2:0;
 const progress=t=>{const e=evidenceFor(s,s.player,t.id);return [caseProgress(s,t).done,e.filter(p=>p.verified).length,e.length];};
 return knownTargets(s).sort((a,b)=>{const group=category(a)-category(b);if(group)return group;const x=progress(a),y=progress(b);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return y[i]-x[i];return a.id.localeCompare(b.id);});
}

function intimidationLabel(s,a,target){const local=knownTargets(s,a.faction).filter(t=>!t.arrested&&t.country===a.country),t=local.find(t=>t.id===target);return t?' · '+(t.intimidated?'0/1 restante':'1/1 restante'):' · '+local.filter(t=>!t.intimidated).length+'/'+local.length+' cibles disponibles';}

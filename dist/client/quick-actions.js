import {locationActions} from './presentation.js?v=193';
import * as E from './engine.js?v=193';
import {ACTIONS} from './data.js?v=193';
import {button,esc,icon} from './ui.js?v=193';
export function quickAction(s,a){
 if(!a||a.task||['captured','dead','retired'].includes(a.status)||s.ended)return null;
 const candidates=[],add=(type,target,reason)=>candidates.push({type,target,reason});
 if(a.status==='injured')add(a.country===a.faction?'heal':'travel',a.faction,'Une blessure nécessite des soins au QG.');
 if(a.exposure>=20)add('hide',null,a.exposure>=80?'Réduire la pression sur les cellules et les malus.':a.exposure>=40?'Votre exposition pénalise les opérations.':'Vous êtes repérable au contre-espionnage mondial.');
 if(a.fatigue>=50){add(a.country===a.faction?'rest':'fieldRest',null,'Récupérez de l’énergie pour améliorer vos prochaines chances.');add('findSafehouse',null,'Un refuge permettra de récupérer sur place.');add('hide',null,'Récupérez un peu d’énergie en réduisant votre exposition.');}
 if(a.country===a.faction)for(const e of E.evidenceQueue(s,a.faction).filter(e=>!E.analysisAgent(s,a.faction,e.id)))add('analyze',e.id,'Une pièce attend sa vérification au QG.');
 const f=s.factions[a.faction],local=E.knownTargets(s,a.faction).filter(t=>!t.arrested&&t.country===a.country);
 if(!f.access[a.country])add('contacts',null,'Ouvrez un accès local pour exploiter les pistes.');
 for(const t of local){const proofs=E.evidenceFor(s,a.faction,t.id);if(t.prepared&&t.locationUntil>=s.turn&&f.authorized[a.country])add('arrest',t.id,'Le dossier et la localisation permettent une intervention avec mandat.');if(proofs.length<2)add('collect',t.id,'Complétez les preuves de ce dossier.');if(!t.prepared)add('prepare',t.id,'Transformez les preuves réunies en dossier d’arrestation.');if(!f.authorized[a.country])add('authorize',null,'Obtenez un mandat avant l’intervention.');if(t.locationUntil<s.turn)add('surveil',t.id,'Actualisez la position de la cible.');}
 if(E.visiblePlots(s).some(p=>p.country===a.country&&!p.resolved))add('protect',null,'Une menace est annoncée dans ce pays.');
 if(a.country===a.faction)for(const t of E.knownTargets(s,a.faction).filter(t=>!t.arrested&&t.country!==a.country))add('travel',t.country,'Rejoignez un pays où une piste est connue.');
 add(a.country===a.faction?'counter':'contacts',null,'Développez votre réseau et la Recherche.');
 const allowed=new Set(locationActions(a,s).map(([type])=>type));return candidates.find(c=>allowed.has(c.type)&&!E.options(s,a.id,c.type,c.target).error)||null;
}
export function quickActionMarkup(s,a){const q=quickAction(s,a);return q?`<div class="quick-action">${button(icon('bolt')+ACTIONS[q.type].name,'suggest-action','primary wide',`data-id="${esc(a.id)}" data-type="${q.type}" data-target="${q.target||''}"`)}</div>`:'';}

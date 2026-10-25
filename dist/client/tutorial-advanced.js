import {NPC_TUTORIALS,isNpcTutorial} from './tutorial-mode.js?v=204';
import {npcTutorialObjective} from './tutorial-npc.js?v=204';
import {AUTONOMY_TUTORIALS,autonomyObjective,autonomyOrderError} from './tutorial-autonomy.js?v=204';
// Later lessons derive their progress from real game state and operation reports.
import {ACTIONS,COUNTRY} from './data.js?v=204';
export const ADVANCED_TUTORIALS=['countdown','longrange','hostile','stealth','digital','finale',...AUTONOMY_TUTORIALS,...NPC_TUTORIALS];
export const tutorialTechAllowed=(s,type)=>isNpcTutorial(s)||['longrange','resources','autonomy'].includes(s?.tutorial?.mission)&&['logistics','relay'].includes(type);
export const tutorialGovernmentAllowed=(s,type,country)=>{
 if(isNpcTutorial(s))return true;
 if(AUTONOMY_TUTORIALS.includes(s?.tutorial?.mission))return ['funding','medical'].includes(type)||type==='diplomacy'&&['TR','JP'].includes(country);
 if(!['hostile','finale'].includes(s?.tutorial?.mission))return false;
 if(['funding','medical'].includes(type))return true;
 const g=s.campaignStats?.support?.FR?.government||{},used=(g.funding?.count||0)+(g.medical?.count||0)>0;
 const cost=[15,15,10,5][s.factions.FR.cooperation.TR]??0;
 return type==='diplomacy'&&country==='TR'&&(used||s.factions.FR.confidence-cost>=15);
};
export const tutorialCanWait=s=>['arrest',...ADVANCED_TUTORIALS].includes(s?.tutorial?.mission);
const active=(s,type)=>s.factions.FR.tech.some(t=>t.type===type&&t.until>=s.turn);
export function advancedObjective(s){
 const npc=npcTutorialObjective(s);if(npc)return npc;
 const autonomous=autonomyObjective(s);if(autonomous)return autonomous;
 const mission=s.tutorial.mission;if(!ADVANCED_TUTORIALS.includes(mission))return null;
 const f=s.factions.FR,k=f.known.s0,target=s.suspects.find(t=>t.id==='s0');
 const reports=s.operationReports||[],orders=[],tech=[];
 const result=(title,text,extra={})=>({step:0,title:s.ended?'Exercice à recommencer':title,text:s.ended?'La limite de tours est atteinte. Recommencez en coordonnant les ordres disponibles.':text,orders,tech,done:false,failed:!!s.ended,...extra});
 const add=(id,type,target=null,optional=false)=>{
  const a=s.agents.find(a=>a.id===id);if(!a||a.task||orders.some(o=>o.agentId===id))return;
  if(a.fatigue>=100&&!['travel','rest','hide','findSafehouse','fieldRest'].includes(type)){
   type=a.country===s.player?'rest':f.safehouses.includes(a.country)?'fieldRest':'hide';target=null;optional=false;
  }
  orders.push({agentId:id,type,target,optional});
 };
 const recovery=()=>{for(const a of s.agents){if(a.task||orders.some(o=>o.agentId===a.id)||a.fatigue<=0&&a.exposure<=0)continue;if(a.country===s.player)add(a.id,'rest',null,true);else if(f.safehouses.includes(a.country))add(a.id,'fieldRest',null,true);else if(!orders.some(o=>o.type==='findSafehouse'&&s.agents.find(b=>b.id===o.agentId).country===a.country)&&!s.agents.some(b=>b.task?.type==='findSafehouse'&&b.country===a.country))add(a.id,'findSafehouse',null,true);else add(a.id,'hide',null,true);}};
 const evidence=f.evidence.filter(e=>!e.contested),raw=evidence.find(e=>!e.verified),verified=evidence.filter(e=>e.verified).length;
 if(mission==='countdown'){
  const plot=s.plots[0],blocked=!!s.credited[plot.id+':FR'];
  if(plot.resolved&&!blocked)return result('La protection est arrivée trop tard','La protection doit être active au tour de l’attaque, pas seulement aujourd’hui. Recommencez : voyage au T1, protection aux T2–T3, interception au T4.',{failed:true});
  if(blocked&&verified>=2)return result('Attaque interceptée, enquête poursuivie','Berlin a été protégée au bon moment : 4 points de protection. Pendant le déploiement et la mise en place, deux preuves ont été vérifiées. Le dossier mène maintenant jusqu’à Tokyo.',{done:true});
  const iris=s.agents.find(a=>a.id==='p0');
  if(!plot.resolved&&(f.defense.DE||0)<plot.turn){if(iris.country!=='DE')add('p0','travel','DE');else add('p0','protect');}
  if(evidence.length<2)add('p12','collect','s0');
  if(raw)add('p15','analyze',raw.id);
  recovery();
  return result(blocked?'Terminer l’analyse des preuves':'Protéger Berlin avant la fin du T4',blocked?'L’attaque a été interceptée : 4 points. Terminez les deux vérifications.':`Menace de Berlin : comparez protection actuelle et couverture à l’attaque T4. ${(f.defense.DE||0)>=plot.turn?'Votre protection couvre maintenant l’échéance ; poursuivez l’enquête et terminez le tour.':s.turn===1?'La protection actuelle expire fin T1. Déployez IRIS maintenant, puis protégez aux T2–T3.':'IRIS doit achever la protection au plus tard T4 (2 tours de préparation).'} Collecte et vérification avancent en parallèle.`,{deadline:4});
 }
 if(mission==='longrange'){
  if(target.arrested)return result('Intervention longue portée réussie','La logistique a permis de rejoindre Tokyo en un tour. Le relais a ajouté deux tours à la localisation ; sa durée d’activation et la validité de la position sont distinctes. La piste suivante mène en Turquie.',{done:true});
  for(const id of ['p0','p14'])if(s.agents.find(a=>a.id===id).country!=='JP')add(id,'travel','JP');
  if(orders.some(o=>o.type==='travel')&&!active(s,'logistics'))tech.push('logistics');
  if(k.locationUntil<s.turn){add('p12','surveil','s0');if(orders.some(o=>o.type==='surveil')&&!active(s,'relay'))tech.push('relay');}
  else if(!k.prepared)add('p12','prepare','s0');
  const iris=s.agents.find(a=>a.id==='p0'),lei=s.agents.find(a=>a.id==='p14');
  if(iris.country==='JP'&&!f.authorized.JP)add('p0','authorize');
  if(lei.country==='JP'){
   if(k.prepared&&f.authorized.JP&&k.locationUntil>=s.turn)add('p14','arrest','s0');
   else if(!lei.weapon)add('p14','equip');
  }
  recovery();
  return result('Coordonner Paris et Tokyo',`${orders.some(o=>o.type==='travel')?'Au même tour : IRIS et LEI rejoignent Tokyo avec la logistique ; BISHOP localise avec le relais. Chaque module est actif 2 tours et occupe une des 2 places.':'Préparation, mandat et équipement peuvent avancer ensemble ; l’arrestation suit dès que le dossier est prêt.'}${k.locationUntil>=s.turn?' Position valide jusqu’à fin T'+k.locationUntil+' ; la prolongation survit à l’expiration naturelle du relais.':''}`);
 }
 const succeeded=(type,id=null)=>reports.some(r=>r.type===type&&(!id||r.agentId===id)&&r.status==='RÉUSSITE'&&!r.withoutObject);
 if(mission==='stealth'){
  const cobalt=s.suspects.find(t=>t.id==='s1'),ck=f.known.s1;
  const ce=f.evidence.filter(e=>!e.contested&&s.proofs.find(p=>p.id===e.id)?.suspect==='s1');
  if(target.arrested&&cobalt.arrested&&succeeded('sneak','p14')&&succeeded('fieldRest','p12')&&succeeded('hide','p12'))return result('Deux dossiers, une équipe discrète','Vesper et Cobalt sont arrêtés. Les preuves, la préparation et la localisation ont été gérées séparément dans le même pays. Le passage clandestin a effacé l’exposition de LEI ; BISHOP a récupéré en parallèle.',{done:true});
  const lei=s.agents.find(a=>a.id==='p14');
  if(lei.country!=='TR')add('p14','sneak','TR');
  else if(!cobalt.arrested){
   if(ce.length<2)add('p14','collect','s1');
   else if(ck.prepared&&ck.locationUntil>=s.turn&&f.authorized.TR)add('p14','arrest','s1');
  }
  if(!target.arrested){
   if(!f.authorized.TR)add('p0','authorize');
   else if(k.locationUntil<s.turn)add('p0','surveil','s0');
   else add('p0','arrest','s0');
  }else if(!cobalt.arrested&&ck.locationUntil<s.turn)add('p0','surveil','s1');
  if(!f.safehouses.includes('TR'))add('p12','findSafehouse');
  else if(!succeeded('fieldRest','p12'))add('p12','fieldRest');
  else if(!succeeded('hide','p12'))add('p12','hide');
  else if(!cobalt.arrested&&!ck.prepared&&ce.length>=2&&ce.some(e=>e.verified))add('p12','prepare','s1');
  const piece=ce.find(e=>!e.verified);
  if(piece&&!cobalt.arrested&&lei.country==='TR')add('p15','analyze',piece.id);else if(!cobalt.arrested||!target.arrested)add('p15','cyberSupport','TR');
  recovery();
  return result('Vesper et Cobalt · Deux dossiers à Ankara',"Dans le panneau d’Ankara, choisissez la cible avant d’affecter l’action. IRIS intervient sur Vesper pendant que LEI recueille une seconde preuve sur Cobalt et qu’APÉRO vérifie sa première pièce au QG. BISHOP trouve une planque, récupère puis prépare Cobalt. Le mandat couvre le pays, mais chaque cible conserve ses propres preuves et sa localisation.");
 }
 if(mission==='digital'){
  if(target.arrested&&verified>=2&&succeeded('drone')&&succeeded('cyberSupport')&&succeeded('hack'))return result('Réseau compromis','Le drone a ouvert l’accès et localisé sans fournir de preuve. L’intrusion a obtenu une pièce pendant la vérification au QG. Le hack du pays a soutenu les opérations ; ces trois effets sont distincts.',{done:true});
  if(!succeeded('drone'))add('p14','drone','s0');
  if(!succeeded('cyberSupport'))add('p15','cyberSupport','TR');
  else if(raw)add('p15','analyze',raw.id);
  else if(!target.arrested)add('p15','cyberSupport','TR');
  if(!f.access.TR&&!f.safehouses.includes('TR'))add('p12','findSafehouse');
  else if(f.access.TR&&!succeeded('hack'))add('p12','hack','s0');
  else if(!k.prepared&&evidence.length>=2&&verified>=1)add('p12','prepare','s0');
  if(succeeded('drone')&&!target.arrested){
   if(!f.authorized.TR)add('p14','authorize');
   else if(k.locationUntil<s.turn)add('p14','surveil','s0');
   else if(k.prepared&&verified>=2)add('p14','arrest','s0');
   else if(!s.agents.find(a=>a.id==='p14').weapon)add('p14','equip');
  }
  recovery();
  return result('Drone, intrusion et vérification',"Au T1 : drone sur le terrain, hack du pays depuis le QG et planque en parallèle. Puis BISHOP mène l’intrusion pendant qu’APÉRO vérifie la première preuve. Entre deux pièces, APÉRO prolonge le hack du pays : +3 tours à chaque réussite, bonus maintenu à +10. Le bonus de hack est réel, mais les chances restent fixées à 100 % dans cet exercice.");
 }
 if(mission==='finale'){
  const plot=s.plots[0],blocked=!!s.credited[plot.id+':FR'];
  if(plot.resolved&&!blocked||!target.arrested&&target.country!=='TR')return result('Une échéance a été manquée','Protégez Berlin avant l’attaque T4 et arrêtez Vesper à Ankara avant son départ à la fin de T6. Les deux opérations doivent avancer ensemble.',{failed:true});
  if(blocked&&target.arrested&&verified>=2)return result('Opération Filigrane accomplie','Attaque interceptée, preuves vérifiées et cible arrêtée avant son départ. Vous avez coordonné deux fronts avec quatre agents. Les exercices restent rejouables séparément ; poursuivez avec les choix de ressources.',{done:true});
  const iris=s.agents.find(a=>a.id==='p0');
  if(!plot.resolved&&(f.defense.DE||0)<plot.turn){if(iris.country!=='DE')add('p0','travel','DE');else add('p0','protect');}
  if(!target.arrested){
   if(evidence.length<2)add('p12','collect','s0');else if(verified>=1&&!k.prepared)add('p12','prepare','s0');
   if(!f.authorized.TR)add('p14','authorize');else if(k.locationUntil<s.turn)add('p14','surveil','s0');else if(k.prepared&&verified>=2)add('p14','arrest','s0');else if(!s.agents.find(a=>a.id==='p14').weapon)add('p14','equip');
  }
  if(raw)add('p15','analyze',raw.id);
  recovery();
  return result('Deux fronts, un seul tour',"Berlin : protection avant l’attaque à la fin de T4. Ankara : deux preuves vérifiées et arrestation avant le départ à la fin de T6. IRIS protège pendant que BISHOP collecte, APÉRO vérifie et LEI prépare l’intervention.",{deadline:4});
 }
 const support=s.campaignStats?.support?.FR?.government||{},favor=(support.funding?.count||0)+(support.medical?.count||0)>0;
 const recovered=reports.some(r=>['rest','fieldRest'].includes(r.type)&&r.status==='RÉUSSITE');
 if(target.arrested&&verified>=1&&f.cooperation.TR>=1&&favor&&recovered)return result('Filigrane démantelé','Vous avez rétabli la coopération, choisi un soutien gouvernemental, récupéré de l’énergie et mené l’enquête jusqu’à l’arrestation. Plusieurs répartitions des rôles étaient possibles. La piste se poursuit : il faut maintenant apprendre à agir discrètement.',{done:true});
 if(s.turn>=40)return result('Reprendre la coordination','La fenêtre de l’exercice est terminée. Recommencez en répartissant les actions indépendantes entre les agents.',{failed:true});
 if(!f.access.TR||f.cooperation.TR<1)add('p0','influence');
 if(!target.arrested){
  if(f.access.TR&&f.cooperation.TR>=1&&!f.authorized.TR)add('p0','authorize');
  else if(f.access.TR&&f.cooperation.TR>=1&&f.cooperation.TR<4&&f.cooperationRaised.TR!==s.turn)add('p0','influence',null,true);
  if(!f.safehouses.includes('TR')&&!f.access.TR)add('p12','findSafehouse');
  else if(f.access.TR&&evidence.length<2)add('p12','collect','s0');
  else if(evidence.length>=2&&verified>=1&&!k.prepared)add('p12','prepare','s0');
  if(k.prepared&&f.authorized.TR&&k.locationUntil>=s.turn)add('p14','arrest','s0');
  else if(!f.authorized.TR&&!orders.some(o=>o.type==='authorize'))add('p14','authorize');
  else if(k.locationUntil<s.turn&&evidence.length>=2)add('p14','surveil','s0');
 }
 if(raw&&!target.arrested&&!s.agents.some(a=>a.task?.type==='analyze'&&a.task.target===raw.id))add('p15','analyze',raw.id);
 // Reassign suggested field jobs if the player has exchanged roles or travelled.
 for(let i=0;i<orders.length;i++){
  const o=orders[i],home=o.type==='analyze'||o.type==='rest',c=home?'FR':'TR',a=s.agents.find(a=>a.id===o.agentId);
  if(s.agents.some(b=>b.task?.type===o.type&&(o.target===null?b.country===c:b.task.target===o.target))){orders.splice(i,1);i--;continue;}
  if(['rest','fieldRest','hide'].includes(o.type))continue;
  if(a.country===c&&(!a.task||a.task.type===o.type))continue;
  const alternate=s.agents.find(b=>b.country===c&&!b.task&&!orders.some(x=>x!==o&&x.agentId===b.id));
  if(alternate)o.agentId=alternate.id;else if(!a.task){o.type='travel';o.target=c;}else{orders.splice(i,1);i--;}
 }
 recovery();
 return result('Choisir les moyens, coordonner l’équipe',`Objectifs : deux preuves (${target.arrested?2:evidence.length}/2), au moins une vérifiée (${verified}/1), coopération au moins Réticente (${f.cooperation.TR>=1?'acquise':'à améliorer'}), récupération (${recovered?'faite':'à faire'}), financement OU soutien médical (${favor?'choisi':'à choisir dans Gouvernement'}), puis arrestation. Les ordres sont des suggestions : échangez les rôles si utile et occupez les agents disponibles en parallèle.`,{freeChoice:true});
}
export function advancedOrderError(s,id,type,target){
 if(isNpcTutorial(s))return null;
 const autonomous=autonomyOrderError(s,id,type,target);if(autonomous!==undefined)return autonomous;
 if(s.tutorial.mission==='hostile'){
  const allowed=['contacts','influence','authorize','findSafehouse','fieldRest','rest','hide','equip','collect','analyze','prepare','surveil','arrest'];
  if(type==='travel'&&['FR','TR'].includes(target))return null;
  if(!allowed.includes(type))return 'Cette mission porte sur la coopération, le soutien et l’enquête.';
  if(['collect','prepare','surveil','arrest'].includes(type)&&target!=='s0'||type==='analyze'&&target&&!s.factions.FR.evidence.some(e=>e.id===target))return 'Travaillez sur le dossier Vesper.';
  return null;
 }
 if(s.tutorial.mission==='longrange'&&type==='travel'&&!active(s,'logistics'))return 'Activez d’abord Logistique prioritaire dans Modules d’opération.';
 if(s.tutorial.mission==='longrange'&&type==='surveil'&&!active(s,'relay'))return 'Activez d’abord Relais satellite dans Modules d’opération.';
 return undefined;
}
export function advancedHint(s,o,free){
 const tech=o.tech?.length?(o.freeChoice?'Suggestion facultative dans Modules d’opération : ':'À activer dans Modules d’opération : ')+o.tech.map(t=>t==='relay'?'Relais satellite (2 crédits)':'Logistique prioritaire (3 crédits)').join(' et ')+'. ':'';
 const directions=free.map(x=>{
  const name=s.agents.find(a=>a.id===x.agentId).name;
  if(x.type==='cyberSupport')return `${name} : double-cliquez sur son portrait → Hack d’un pays → ${COUNTRY[x.target].name}.`;
  if(x.type==='sneak')return `${name} : double-cliquez sur son portrait → Passage clandestin → Turquie.`;
  if(x.type==='travel')return `${name} : sur le globe, ${COUNTRY[x.target].name} → Déployer un agent.`;
  if(x.type==='protect')return `${name} : menace en ${COUNTRY[s.agents.find(a=>a.id===x.agentId).country].name} → Protéger la région (2 tours).`;
  if(['findSafehouse','fieldRest','rest','equip','hide','influence','heal'].includes(x.type))return `${name} : double-cliquez sur son portrait → ${ACTIONS[x.type].name}.`;
  if(x.type==='rescue')return `${name} : double-cliquez sur son portrait → Extraire un agent capturé → ${s.agents.find(a=>a.id===x.target)?.name||'coéquipier'}.`;
  const target=x.type==='analyze'?s.proofs.find(p=>p.id===x.target)?.suspect:x.target;
  const label=s.suspects.find(t=>t.id===target)?.name||'du pays de l’agent';
  return `${name} : dossier ${label} → ${ACTIONS[x.type].name}.`;
 }).join(' ');
 return tech+o.text+' '+directions+(!free.length&&s.agents.some(a=>a.task)?' Les ordres sont affectés : terminez le tour.':'');
}

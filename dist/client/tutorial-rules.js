// Training is a separate, explicitly scripted mode. No campaign uses these rules.
export const TUTORIAL_IDS=Object.freeze(['contact','evidence','arrest']);
export const isTutorial=s=>s?.tutorial?.version===1&&TUTORIAL_IDS.includes(s.tutorial.mission);
export function tutorialObjective(s){
 if(!isTutorial(s))return null;
 const f=s.factions[s.player],k=f.known.s0,e=f.evidence,t=s.suspects.find(t=>t.id==='s0');
 const order=(agentId,type,target=null)=>({agentId,type,target});
 const result=(step,title,text,orders=[],extra={})=>({step,title,text,orders,done:false,failed:false,...extra});
 if(s.tutorial.mission==='contact'){
  if(s.agents[0].country!=='DE')return result(0,'Rejoindre Berlin','Sélectionnez IRIS, choisissez « Voyager sous passeport » vers l’Allemagne, confirmez l’ordre puis terminez le tour.',[order('p0','travel','DE')]);
  if(!f.access.DE)return result(1,'Ouvrir un accès local','Le contact nous attend à Berlin. Avec IRIS, affectez « Activer un contact ». Un agent sur place ne suffit pas : l’accès doit être ouvert pour recueillir des preuves.',[order('p0','contacts')]);
  return result(2,'Contact établi','IRIS a obtenu un accès aux archives du réseau Filigrane. Vous savez maintenant affecter un ordre et le résoudre en terminant le tour.',[],{done:true});
 }
 if(s.tutorial.mission==='evidence'){
  const raw=e.find(p=>!p.verified&&!p.contested),verified=e.filter(p=>p.verified).length;
  if(verified>=2&&!raw)return result(6,'Dossier fiable','Deux preuves vérifiées, une falsification écartée. Vous avez fait avancer le terrain et le QG en parallèle, sans attendre inutilement la fin des collectes.',[],{done:true});
  const orders=[];
  if(e.length<2||e.length<3&&e.some(p=>p.contested))orders.push(order('p12','collect','s0'));
  if(raw)orders.push(order('p15','analyze',raw.id));
  // A useful support job while the second document is checked; never delays the lesson.
  const bishop=s.agents.find(a=>a.id==='p12');
  if(e.length===2&&raw&&!orders.some(o=>o.agentId==='p12')&&!f.safehouses.includes('DE'))orders.push({...order('p12','findSafehouse'),optional:true});
  for(const a of s.agents){
   if(a.task||orders.some(o=>o.agentId===a.id)||a.fatigue<=0&&a.exposure<=0)continue;
   if(a.country===s.player)orders.push({...order(a.id,'rest'),optional:true});
   else if(f.safehouses.includes(a.country))orders.push({...order(a.id,'fieldRest'),optional:true});
  }
  const parallel=orders.some(o=>o.type==='collect')&&orders.some(o=>o.type==='analyze');
  const step=e.length<2?e.length:raw?e.length===3?5:2+e.filter(p=>p.verified||p.contested).length:4;
  return result(step,parallel?'Collecter et vérifier en parallèle':orders.some(o=>o.type==='collect')?(e.some(p=>p.contested)?'Remplacer la pièce falsifiée':e.length?'Poursuivre la collecte':'Recueillir une première pièce'):'Vérifier au QG',
   'Dès qu’une preuve est disponible, APÉRO la vérifie au QG pendant que BISHOP poursuit le travail de terrain. Affectez les ordres disponibles avant de terminer le tour. Une planque puis le repos permettent de récupérer pendant les temps d’attente.',orders);
 }
 if(t.arrested)return result(4,'Vesper est en détention','Le dossier préparé, le mandat et une position encore valide ont permis l’intervention. Vesper révèle que Filigrane finançait plusieurs opérations de Fracture.',[],{done:true});
 if(t.country!=='DE'||s.turn>6)return result(4,'La fenêtre s’est refermée','Vesper a quitté Berlin à la fin du tour 6. Recommencez cette mission : préparez le dossier et le mandat en parallèle, puis localisez juste avant d’intervenir.',[],{failed:true});
 const preparation=[];
 if(!k.prepared)preparation.push(order('p12','prepare','s0'));
 if(!f.authorized.DE)preparation.push(order('p0','authorize'));
 if(k.locationUntil<s.turn){
  const ongoing=s.agents.find(a=>a.task?.type==='surveil'&&a.task.target==='s0');
  preparation.push(order(ongoing?.id||'p14','surveil','s0'));
 }
 if(preparation.length)return result(Number(!!k.prepared)+Number(!!f.authorized.DE),preparation.length>1?'Préparer, mandater et localiser ensemble':k.locationUntil?'Actualiser la position':'Finaliser l’intervention',
  'BISHOP prépare le dossier, IRIS obtient le mandat et LEI localise Vesper pendant le même tour. Ces actions sont indépendantes. L’arrestation attend leurs résultats ; la localisation reste valable trois tours après sa résolution.',preparation);

 return result(3,'Intervenir avant le départ',`Affectez LEI à l’arrestation. La position reste valide jusqu’à la fin du tour ${k.locationUntil} inclus ; Vesper part à la fin du tour 6. Une arrestation résolue au tour 6 peut encore l’arrêter.`,[order('p14','arrest','s0')]);
}
export function tutorialOrderError(s,id,type,target,useCredits=false){
 if(!isTutorial(s))return null;
 const objective=tutorialObjective(s);
 if(objective.done||objective.failed)return 'Exercice terminé. Choisissez la mission suivante ou recommencez.';
 if(useCredits)return 'Exercice scénarisé : réussite garantie, aucun renfort nécessaire.';
 if(!objective.orders.some(o=>o.agentId===id&&o.type===type&&(o.target===null||o.target===target||type==='analyze'&&target===null)))return 'Suivez l’objectif de cet exercice. Les autres opérations seront disponibles en campagne.';
 return null;
}

export function tutorialPendingOrders(s){
 const o=tutorialObjective(s);return !o||o.done||o.failed?[]:o.orders.filter(x=>!s.agents.find(a=>a.id===x.agentId)?.task);
}
export function tutorialAgentPlan(s){
 const o=tutorialObjective(s);if(!o||o.done||o.failed)return [];
 return s.agents.map(a=>{
  const order=o.orders.find(x=>x.agentId===a.id);
  if(a.task)return {agent:a,order,status:a.task.queued?'Planifié':'En cours',text:a.task.type+' · '+a.task.remaining+' tour(s)'};
  if(order)return {agent:a,order,status:order.optional?'Soutien utile':'À affecter',text:order.type};
  const waiting=s.tutorial.mission==='evidence'&&a.id==='p15';
  return {agent:a,order:null,status:'Disponible',text:waiting?'Aucune pièce à vérifier pour le moment ; attendre la collecte.':'Son objectif est rempli ; aucune autre action utile requise avant l’intervention.'};
 });
}
export function tutorialHint(s){
 const o=tutorialObjective(s);if(!o)return '';if(o.done||o.failed)return o.text;
 const free=tutorialPendingOrders(s);
 if(!free.length&&s.agents.some(a=>a.task))return 'Tous les ordres utiles sont affectés. Fermez le dossier puis utilisez « Terminer le tour ». Les missions de deux tours continuent au tour suivant. Consultez le rôle de chaque agent ci-dessous.';
 return free.map(x=>{
  const name=s.agents.find(a=>a.id===x.agentId).name;
  switch(x.type){
   case 'travel':return 'Sur le globe, sélectionnez l’Allemagne (Berlin), puis « Déployer un agent », cochez IRIS et confirmez.';
   case 'contacts':return 'IRIS : ouvrez Vesper depuis Berlin, puis « Accès local » → « Activer un contact » et confirmez.';
   case 'collect':return `${s.factions.FR.evidence.some(e=>e.contested)?'La falsification est écartée : remplacez-la. ':''}BISHOP : dossier Vesper → « 2 preuves » → « Recueillir une preuve » (2 tours).`;
   case 'analyze':return 'APÉRO : dans le même dossier, « Validation » → « Vérifier une preuve », gardez la première pièce en attente (1 tour). Lancez la vérification dès maintenant, même si BISHOP collecte encore.';
   case 'prepare':return 'BISHOP : dossier Vesper → « Intervention » → « Préparer une arrestation ».';
   case 'authorize':return 'IRIS : même dossier → « Intervention » → « Obtenir un mandat ».';
   case 'surveil':return `${name} : même dossier → « Intervention » → « Localiser la cible ». Faites-le en parallèle de la préparation et du mandat si ces ordres restent à effectuer ; position valable 3 tours après résolution.`;
   case 'arrest':return `LEI : dossier Vesper → « Arrestation » → « Procéder à l’arrestation ». Position valide jusqu’à fin T${s.factions.FR.known.s0.locationUntil} ; départ fin T6.`;
   case 'findSafehouse':return 'En parallèle, BISHOP peut trouver une planque pour récupérer ensuite sur place : double-cliquez sur son portrait → « Trouver une planque ».';
   case 'rest':return `${name} peut récupérer pendant le travail du terrain : double-cliquez sur son portrait → « Se reposer au QG ».`;
   case 'fieldRest':return `${name} peut récupérer pendant la vérification : double-cliquez sur son portrait → « Se reposer dans la planque ».`;
  }
 }).join(' ')+(free.length>1?' Affectez ces ordres avant de terminer le même tour.':'');
}

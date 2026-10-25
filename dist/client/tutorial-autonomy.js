// Chapters 10–12 keep real game prerequisites and offer optional plans.
export const AUTONOMY_TUTORIALS=['resources','reroute','autonomy'];
export function autonomyObjective(s){
 const mission=s.tutorial.mission;if(!AUTONOMY_TUTORIALS.includes(mission))return null;
 const f=s.factions.FR,orders=[],tech=[];
 const agent=id=>s.agents.find(a=>a.id===id),suspect=id=>s.suspects.find(t=>t.id===id);
 const pieces=id=>f.evidence.filter(e=>!e.contested&&s.proofs.find(p=>p.id===e.id)?.suspect===id);
 const pending=(type,target,country)=>s.agents.some(a=>a.task?.type===type&&(target?a.task.target===target:!country||a.country===country));
 const add=(id,type,target=null,optional=false)=>{
  const a=agent(id);if(!a||a.task||orders.some(o=>o.agentId===id))return;
  if(pending(type,target,a.country)&&!['travel','sneak','hide','rest','fieldRest','equip'].includes(type))return;
  if(a.fatigue>=100&&!['travel','rest','hide','fieldRest','findSafehouse'].includes(type)){
   type=a.country==='FR'?'rest':f.safehouses.includes(a.country)?'fieldRest':'hide';target=null;
  }
  orders.push({agentId:id,type,target,optional});
 };
 const at=(id,country,type,target=null)=>{if(agent(id).country!==country)add(id,'travel',country);else add(id,type,target);};
 const recover=id=>{const a=agent(id);if(a.country==='FR')add(id,'rest',null,true);else if(f.safehouses.includes(a.country))add(id,'fieldRest',null,true);else if(!orders.some(o=>o.type==='findSafehouse'&&agent(o.agentId).country===a.country)&&!pending('findSafehouse',null,a.country))add(id,'findSafehouse',null,true);else add(id,'hide',null,true);};
 const analyst=country=>{
  const raw=f.evidence.find(e=>!e.verified&&!e.contested&&!suspect(s.proofs.find(p=>p.id===e.id)?.suspect)?.arrested&&!pending('analyze',e.id));
  at('p15','FR',raw?'analyze':'cyberSupport',raw?.id||country);
 };
 const caseWork=(id,target)=>{
  const k=f.known[target],t=suspect(target),e=pieces(target);if(t.arrested)return;
  if(agent(id).country!==k.country){add(id,'travel',k.country);return;}
  if(!f.access[k.country])add(id,'contacts');
  else if(e.length<2)add(id,'collect',target);
  else if(e.some(e=>e.verified)&&!k.prepared)add(id,'prepare',target);
  else if(!f.authorized[k.country])add(id,'authorize');
  else if(k.locationUntil<s.turn)add(id,'surveil',target);
  else if(k.prepared)add(id,'arrest',target);
 };
 const result=(title,text,extra={})=>({step:0,title,text,orders,tech,done:false,failed:!!s.ended,freeChoice:true,...extra});
 if(s.ended)return result('Exercice à recommencer','La limite de tours est atteinte. Recommencez en répartissant les opérations et en surveillant les échéances.',{failed:true});
 if(mission==='resources'){
  if(suspect('s0').arrested)return result('Les moyens au service du plan','Tokyo est sécurisé. Vous avez choisi vos dépenses tout en faisant avancer le terrain et le QG. Comparez dans le bilan les crédits dépensés, la confiance et les tours de voyage.',{done:true});
  for(const id of ['p0','p14'])if(agent(id).country!=='JP')add(id,'travel','JP');
  if(orders.some(o=>o.type==='travel')&&!f.tech.some(t=>t.type==='logistics'&&t.until>=s.turn)&&f.budget>=3)tech.push('logistics');
  const e=pieces('s0'),k=f.known.s0;
  if(e.length<2)at('p12','JP','collect','s0');else if(e.some(e=>e.verified)&&!k.prepared)at('p12','JP','prepare','s0');
  if(agent('p0').country==='JP'&&!f.authorized.JP)add('p0','authorize');
  if(agent('p14').country==='JP'){
   if(k.locationUntil<s.turn)add('p14','surveil','s0');
   else if(k.prepared&&f.authorized.JP)add('p14','arrest','s0');
   else if(!agent('p14').weapon)add('p14','equip');
  }
  analyst('JP');for(const a of s.agents)recover(a.id);
  return result('Choisir où dépenser',`Réserve : ${f.budget} crédits. Logistique : 3 ; relais : 2. La logistique est une suggestion, pas une obligation. Voyage, collecte et vérification peuvent avancer ensemble. Le financement reste un choix dans Gouvernement.`);
 }
 if(mission==='reroute'){
  if(['s0','s1'].every(id=>suspect(id).arrested))return result('L’équipe s’est adaptée','Vesper a été repris à Tokyo et Cobalt arrêté à Ankara. Le départ a invalidé la position, sans effacer les preuves ni le dossier préparé. Vous avez poursuivi la seconde enquête pendant les déplacements.',{done:true});
  caseWork('p0','s1');
  if(s.turn===1){at('p12','TR','authorize');at('p14','TR','surveil','s0');}
  else if(!suspect('s0').arrested){
   const c=f.known.s0.country,k=f.known.s0;
   if(agent('p12').country!==c)add('p12','travel',c);else if(k.locationUntil<s.turn)add('p12','surveil','s0');
   if(agent('p14').country!==c)add('p14','travel',c);else if(!f.authorized[c])add('p14','authorize');else if(k.locationUntil>=s.turn&&k.prepared)add('p14','arrest','s0');else if(!agent('p14').weapon)add('p14','equip');
  }
  analyst(suspect('s0').arrested?'TR':'JP');for(const a of s.agents)recover(a.id);
  return result(s.turn===1?'Poursuivre les deux pistes':'Réaffecter sans abandonner Ankara',s.turn===1?'IRIS collecte sur Cobalt pendant qu’APÉRO vérifie sa première pièce ; BISHOP obtient le mandat et LEI confirme la piste de Vesper. Affectez ces opérations en parallèle, puis consultez les rapports du tour.':'Vesper a changé de pays : sa position doit être confirmée et le mandat obtenu au Japon. Envoyez deux agents ; IRIS continue le dossier Cobalt à Ankara, avec l’appui du QG.');
 }
 const plot=s.plots[0],blocked=!!s.credited[plot.id+':FR'];
 if(plot.resolved&&!blocked||['s0','s1'].some(id=>!suspect(id).arrested&&suspect(id).country!==(id==='s0'?'TR':'JP')))return result('Une échéance a été manquée','Berlin devait être couvert à la fin de T6 et les deux suspects arrêtés avant leur départ à la fin de T12. Recommencez ; les suggestions restent disponibles dans Instructions.',{failed:true});
 if(blocked&&['s0','s1'].every(id=>suspect(id).arrested))return result('Prêt à commander','Deux suspects arrêtés et attaque interceptée. Les douze chapitres restent rejouables. Poursuivez avec les chapitres 13 à 15 : des joueurs PNJ vous accompagnent jusqu’à une campagne complète.',{done:true});
 // Prepare from T2: a T1 protection would expire before the T6 attack.
 if(!plot.resolved&&(f.defense.DE||0)<plot.turn&&s.turn>=2)at('p0','DE','protect');
 caseWork('p12','s0');caseWork('p14','s1');analyst(!suspect('s0').arrested?'TR':'JP');
 for(const a of s.agents)recover(a.id);
 return result('Berlin T6 · Deux arrestations avant le départ T12',`Berlin : ${blocked?'attaque interceptée':(f.defense.DE||0)>=plot.turn?'couvert à l’échéance':'couverture T6 à assurer'}. Vesper : ${suspect('s0').arrested?'arrêté':'Ankara'}. Cobalt : ${suspect('s1').arrested?'arrêté':'Tokyo'}. Choisissez vos rôles et vos ordres. Instructions propose un plan si vous en avez besoin.`,{unguided:true,deadline:6});
}
export function autonomyOrderError(s,id,type,target){
 const mission=s.tutorial.mission;if(!AUTONOMY_TUTORIALS.includes(mission))return undefined;
 const countries=mission==='resources'?['FR','JP']:['FR','TR','JP',...(mission==='autonomy'?['DE']:[])];
 if(['travel','sneak','cyberSupport'].includes(type))return countries.includes(target)?null:'Concentrez-vous sur les pays de cet exercice.';
 if(['collect','hack','prepare','surveil','arrest','drone','blackmail','intimidate'].includes(type))return (mission==='resources'?['s0']:['s0','s1']).includes(target)?null:'Choisissez Vesper ou Cobalt parmi les objectifs de cette mission.';
 if(type==='analyze')return !target||s.factions.FR.evidence.some(e=>e.id===target)?null:'Choisissez une pièce de votre équipe.';
 if(['contacts','influence','authorize','findSafehouse','fieldRest','rest','hide','equip','protect'].includes(type))return null;
 return 'Cette action ne fait pas partie de cet exercice.';
}

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
  if(e.length<2)return result(e.length,e.length?'Recueillir une seconde pièce':'Recueillir une première pièce','BISHOP est à Berlin, APÉRO reste au QG. Une collecte prend deux tours : confirmez l’ordre, puis avancez jusqu’à son résultat. Les pièces sont transmises automatiquement au QG.',[order('p12','collect','s0')]);
  const raw=e.find(p=>!p.verified&&!p.contested);
  if(raw)return result(e.length===3?5:2+e.filter(p=>p.verified||p.contested).length,'Vérifier au QG','APÉRO compare le document aux sources indépendantes. Une pièce brute peut être falsifiée : la collecte seule ne garantit pas sa fiabilité.',[order('p15','analyze',raw.id)]);
  if(e.length<3)return result(4,'Remplacer la pièce falsifiée','Le registre des accès a été falsifié. Il ne compte plus dans le dossier. Demandez à BISHOP de recueillir la troisième pièce, puis faites-la vérifier par APÉRO.',[order('p12','collect','s0')]);
  return result(6,'Dossier fiable','Deux preuves vérifiées, une falsification écartée. Les documents désignent Vesper, l’intermédiaire financier de Filigrane. L’équipe peut préparer son arrestation.',[],{done:true});
 }
 if(t.arrested)return result(4,'Vesper est en détention','Le dossier préparé, le mandat et une position encore valide ont permis l’intervention. Vesper révèle que Filigrane finançait plusieurs opérations de Fracture.',[],{done:true});
 if(t.country!=='DE'||s.turn>6)return result(4,'La fenêtre s’est refermée','Vesper a quitté Berlin à la fin du tour 6. Recommencez cette mission : préparez le dossier et le mandat en parallèle, puis localisez juste avant d’intervenir.',[],{failed:true});
 const preparation=[];
 if(!k.prepared)preparation.push(order('p12','prepare','s0'));
 if(!f.authorized.DE)preparation.push(order('p0','authorize'));
 if(preparation.length)return result(Number(!!k.prepared)+Number(!!f.authorized.DE),'Préparer une intervention légale','Les deux preuves sont déjà vérifiées. BISHOP prépare l’arrestation ; IRIS obtient le mandat. Vous pouvez affecter ces deux ordres avant de terminer le même tour.',preparation);
 if(k.locationUntil<s.turn)return result(2,k.locationUntil?'Actualiser la position':'Localiser au bon moment','BISHOP doit confirmer la position de Vesper. Coopération neutre : mission de 1 tour, puis position valable 3 tours après sa résolution. Une position périmée exige une nouvelle localisation.',[order('p12','surveil','s0')]);
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

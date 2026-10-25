import {COUNTRY,SUSPECTS} from './data.js?v=204';
import {isNpcTutorial,tutorialParticipants} from './tutorial-mode.js?v=204';
export const NPC_MISSIONS=Object.freeze([
 {id:'allies',number:'13',title:'Services alliés',place:'Berlin / Ankara · Avec le Royaume-Uni',duration:'12–18 min',agents:4,npcs:1,skills:'Joueur PNJ · Couverture collective · Prestige partagé',brief:'Le service britannique rejoint Filigrane. Il choisit ses propres opérations avec la véritable IA du jeu. Une attaque vise Berlin au T4, une autre Ankara au T8. Menez le dossier Vesper pendant que les deux services protègent les régions. Vos actions restent garanties pour cette première rencontre.',goals:['Observer les actions du service britannique','Enquêter et protéger en parallèle','Arrêter Vesper, quel que soit le service','Résoudre les deux menaces et comparer les points'],lesson:'Chaque service possède ses agents, ses preuves et ses ressources. Une arrestation par un PNJ compte pour l’objectif collectif. Une protection étrangère peut sauver la région ; les 4 points d’interception sont partagés entre les pays qui la couvrent à l’attaque. Comparez votre couverture et celle des autres dans Menaces, puis leurs points dans Diplomatie. Les décisions du PNJ ne sont pas scriptées.',next:'Passez à une opération plus longue, avec trois services et des chances réelles.'},
 {id:'network',number:'14',title:'Un monde en mouvement',place:'Opération de 20 tours maximum · 3 joueurs PNJ',duration:'25–40 min',agents:4,npcs:3,skills:'Risques réels · Priorités · Recrutement · Trois services',brief:'Les services britannique, américain et chinois opèrent en même temps que vous. Vous commencez une campagne raccourcie à 20 tours, avec plusieurs dossiers, des menaces successives et les chances normales. Adaptez les rôles aux résultats et aux déplacements ; consultez Instructions pour une aide de situation.',goals:['Lancer plusieurs opérations en parallèle','Adapter le plan aux autres services et aux échecs','Gérer énergie, confiance, modules et remplacements','Atteindre le bilan collectif'],lesson:'Une action affectée n’est plus une réussite garantie. Comparez l’agent, sa fatigue, les talents, le mandat et le renfort. Réagissez aux échecs et aux arrestations étrangères au lieu de poursuivre un dossier terminé. La formation est validée en atteignant le bilan, même en cas de défaite : le résultat de campagne reste affiché honnêtement.',next:'Dernière étape : prendre le commandement d’une campagne complète.'},
 {id:'command',number:'15',title:'Prise de commandement',place:'Campagne de 30 tours maximum · 3 joueurs PNJ',duration:'40–60 min',agents:4,npcs:3,skills:'Campagne complète · Architecte · Classement · Bilan',brief:'Vous prenez le commandement de la France avec quatre agents et trois services PNJ actifs. Cette campagne utilise les règles normales : crise, menaces, preuves falsifiées, mouvements du réseau et risques d’opération. Le guide accompagne les trois premiers tours, puis se fait discret. Allez jusqu’au bilan final.',goals:['Organiser le déploiement et les enquêtes','Arrêter l’Architecte et démanteler au moins deux cellules','Suivre les menaces avec les autres services','Lire le bilan, le prestige et les points de protection'],lesson:'La victoire est collective : l’Architecte doit être arrêté et au moins deux cellules démantelées, quel que soit le service responsable. Le prestige classe ensuite les pays. Une crise à 100 ou la limite de 30 tours met fin à la campagne. Le chapitre est terminé quand vous atteignez le bilan ; une défaite reste une défaite. Vous pouvez rejouer pour améliorer vos décisions.',next:'Formation terminée. Lancez une nouvelle campagne depuis le menu principal quand vous le souhaitez.'}
]);
// Called after the normal campaign factory: chapter 15 retains its entire game setup.
export function setupNpcTutorial(s,id){
 s.tutorial={version:1,revision:2,mission:id};delete s.humanFactions;
 if(id!=='allies'){
  if(id==='network')s.plots=s.plots.filter(p=>p.turn<=20);
  return s;
 }
 const participants=tutorialParticipants(id);
 s.factions=Object.fromEntries(Object.entries(s.factions).filter(([f])=>participants.includes(f)));
 s.agents=s.agents.filter(a=>participants.includes(a.faction));
 s.suspects=SUSPECTS.map(t=>({...t,arrested:false}));s.suspects[0].country='TR';
 s.proofs=s.suspects.flatMap(t=>[0,1,2].map(source=>({id:`${t.id}-e${source}`,suspect:t.id,source,authentic:true,foundBy:null})));
 s.plots=[{id:'allies-berlin',turn:4,country:'DE',cell:1,kind:'Sabotage des communications',resolved:false,announced:true},{id:'allies-ankara',turn:8,country:'TR',cell:2,kind:'Attaque d’infrastructure',resolved:false,announced:true}];
 s.logs=[];s.logId=0;s.crisis=0;s.threatReports=[];s.campaignStats={partial:false,detailsPartial:false,factions:{},agents:{},support:{}};
 s.fracture={version:1,cells:Array.from({length:3},()=>({pressure:0,resources:0,cooldown:0})),flights:[],moved:[],defenses:{}};
 for(const f of Object.values(s.factions)){
  f.known={s0:{identified:true,country:'TR',locationUntil:0,prepared:false,discovery:{turn:1,source:'Briefing Filigrane · Opération conjointe'}}};
  f.evidence=[{id:'s0-e0',verified:false,contested:false,collectedBy:f.id,verifiedBy:null}];f.access.TR=true;f.access.DE=true;f.cooperation.TR=2;f.cooperation.DE=2;
 }
 for(const a of s.agents){
  a.country=a.faction==='FR'?(a.id==='p0'?'DE':a.id==='p15'?'FR':'TR'):a.id==='GB-0'?'DE':a.id==='GB-1'?'GB':'TR';a.weapon=a.country===a.faction;
 }
 return s;
}
export function npcTutorialObjective(s){
 if(!isNpcTutorial(s))return null;
 const id=s.tutorial.mission,f=s.factions.FR,team=s.agents.filter(a=>a.faction==='FR'&&!['dead','retired'].includes(a.status));
 const orders=[],result=(title,text,extra={})=>({step:0,title,text,orders,tech:[],done:false,failed:false,freeChoice:true,unguided:id!=='allies',...extra});
 if(s.ended)return result(s.ended==='victory'?'Victoire collective · Chapitre terminé':'Défaite collective · Chapitre terminé','Consultez le bilan : résultat collectif, classement, points de protection et efficacité des agents. Une partie terminée valide ce chapitre, quel que soit son résultat. Rejouez pour mettre vos conclusions en pratique.',{done:true});
 const protectedCount=s.plots.filter(p=>p.resolved&&(p.cancelled||Object.keys(s.credited).some(k=>k.startsWith(p.id+':'))||s.suspects.filter(t=>t.cell===p.cell).every(t=>t.arrested))).length;
 if(id==='allies'&&s.turn>8&&s.suspects.find(t=>t.id==='s0').arrested&&protectedCount>0)return result('Les services ont agi ensemble','Vesper est arrêté et les deux échéances sont passées. Au moins une menace a été neutralisée. Comparez le prestige dans Diplomatie : une réussite britannique contribue aussi à la mission. Vous pouvez passer au chapitre 14.',{done:true});
 if(id==='allies'&&s.turn>12)return result('Reprendre la coordination','L’exercice se termine ici. Au prochain essai, maintenez une couverture aux tours 4 et 8 et poursuivez Vesper avec votre équipe ou le service britannique.',{failed:true});
 // Suggestions use only the player's dossiers and publicly announced threats.
 const targets=s.suspects.filter(t=>f.known[t.id]&&!t.arrested).map(t=>({...t,...f.known[t.id]}));
 const pending=(type,target,country)=>s.agents.some(a=>a.faction==='FR'&&a.task?.type===type&&(target?a.task.target===target:!country||a.country===country))||orders.some(o=>o.type===type&&(target?o.target===target:!country||team.find(a=>a.id===o.agentId)?.country===country));
 const add=(a,type,target=null)=>{if(!a||a.task||orders.some(o=>o.agentId===a.id)||a.status==='captured')return;orders.push({agentId:a.id,type,target,optional:true});};
 const recover=a=>{if(a.status==='injured'&&a.country!=='FR'){add(a,'travel','FR');return;}if(a.country==='FR')add(a,a.status==='injured'?'heal':'rest');else if(f.safehouses.includes(a.country))add(a,'fieldRest');else if(!pending('findSafehouse',null,a.country))add(a,'findSafehouse');else add(a,'hide');};
 const raw=f.evidence.find(e=>!e.verified&&!e.contested&&targets.some(t=>s.proofs.find(p=>p.id===e.id)?.suspect===t.id)&&!pending('analyze',e.id));
 const analyst=team.filter(a=>a.country==='FR'&&!a.task&&a.status!=='captured').sort((a,b)=>Number(b.id==='p15')-Number(a.id==='p15')||b.stats[0]-a.stats[0])[0];
 if(analyst){if(analyst.fatigue>=75||analyst.status==='injured')recover(analyst);else if(raw)add(analyst,'analyze',raw.id);else {const field=targets.find(t=>team.some(a=>a.country===t.country));const country=field?.country||targets.find(t=>!COUNTRY[t.country].power)?.country;if(country)add(analyst,'cyberSupport',country);else recover(analyst);}}
 const threats=s.plots.filter(p=>!p.resolved&&!p.cancelled&&(p.announced||p.turn-s.turn<=5)&&!s.suspects.filter(t=>t.cell===p.cell).every(t=>t.arrested)).sort((a,b)=>a.turn-b.turn);
 const slots=()=>f.tech.filter(t=>t.until>=s.turn).length+team.filter(a=>['protect','drone'].includes(a.task?.type)).length+orders.filter(o=>['protect','drone'].includes(o.type)).length;
 for(const a of team){
  if(a.task||a.status==='captured'||orders.some(o=>o.agentId===a.id))continue;
  if(a.fatigue>=65||a.status==='injured'){recover(a);continue;}
  const captive=team.find(b=>b.status==='captured'&&b.country===a.country&&!pending('rescue',b.id));
  if(captive&&a.country!=='FR'){add(a,'rescue',captive.id);continue;}
  const threat=threats.find(p=>p.country===a.country&&p.turn>=s.turn+1&&p.turn<=s.turn+4&&(f.defense[p.country]||0)<p.turn&&!pending('protect',null,p.country));
  if(threat&&slots()<2){add(a,'protect');continue;}
  const local=targets.filter(t=>t.country===a.country);
  let assigned=false;
  for(const t of local){
   const e=f.evidence.filter(e=>!e.contested&&s.proofs.find(p=>p.id===e.id)?.suspect===t.id);
   const type=!f.access[a.country]?'contacts':e.length<2&&!pending('collect',t.id)?'collect':e.some(e=>e.verified)&&e.length>=2&&!t.prepared&&!pending('prepare',t.id)?'prepare':!f.authorized[a.country]&&!pending('authorize',null,a.country)?'authorize':e.length>=2&&t.locationUntil<s.turn?'surveil':e.length>=2&&e.some(e=>e.verified)&&t.prepared&&t.locationUntil>=s.turn?'arrest':null;
   if(!type||pending(type,['contacts','authorize'].includes(type)?null:t.id,a.country))continue;
   add(a,type,['contacts','authorize'].includes(type)?null:t.id);assigned=true;break;
  }
  if(assigned)continue;
  if(a.country==='FR'&&a!==analyst){const t=targets.find(t=>!orders.some(o=>o.type==='travel'&&o.target===t.country))||targets[0];if(t)add(a,'travel',t.country);else recover(a);}
  else if(!local.length){const t=targets.find(t=>t.country!==a.country);if(t)add(a,'travel',t.country);else recover(a);}
  else recover(a);
 }
 const summary=`${Object.keys(s.factions).length-1} service(s) PNJ actif(s). ${s.suspects.filter(t=>t.arrested).length}/7 suspects arrêtés collectivement. Crise : ${s.crisis}/100.`;
 return result(id==='allies'?'Coordonner avec le service britannique':id==='network'?'Adapter le plan aux autres services':'Prise de commandement',id==='allies'?`${summary} Berlin : attaque T4 ; Ankara : attaque T8. Les protections et arrestations britanniques comptent aussi. Consultez Menaces et Diplomatie ; maintenez l’enquête pendant la protection.`:id==='command'&&s.turn<=3?`${summary} Au départ : gardez un analyste au QG, déployez les autres agents, ouvrez les accès puis vérifiez pendant les collectes. Vos chances sont maintenant réelles.`:`${summary} Priorité aux attaques proches, à l’Architecte et aux cellules presque démantelées. Les rôles proposés dans Instructions restent facultatifs.`);
}

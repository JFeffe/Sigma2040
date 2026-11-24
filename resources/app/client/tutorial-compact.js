import {translateText} from './localization.js?v=243';
import {npcTutorialObjective} from './tutorial-npc.js?v=243';
export const COMPACT_IDS=['basics','inquiry','intervention','shield','recovery','simulation'];
export const isCompactTutorial=s=>s?.tutorial?.version===1&&COMPACT_IDS.includes(s.tutorial.mission);
export const COMPACT_BASE={basics:'contact',inquiry:'evidence',intervention:'arrest',shield:'countdown',recovery:'hostile',simulation:'allies'};
export const COMPACT_MISSIONS=[
 {id:'basics',title:'Prendre les commandes',duration:'2 min',agents:1,brief:'La victoire est collective : arrêter l’Architecte et démanteler au moins deux cellules. Le prestige classe les services. Repérez les menaces sur la carte, puis sélectionnez IRIS : ses stats Analyse, Habileté et Sang-froid et ses talents déterminent ses points forts.',skills:'Objectif · Carte · Stats et talents · Premier ordre',goals:['Voyager à Berlin','Activer un contact'],lesson:'Sélectionnez l’Allemagne sur la carte, déployez IRIS et confirmez. Terminer le tour résout les ordres ; une mission de plusieurs tours continue automatiquement. Une fois sur place, ouvrez Vesper et activez un contact.'},
 {id:'inquiry',title:'Mener une enquête',duration:'3 min',agents:2,brief:'BISHOP est déjà à Berlin avec un accès local. Une première preuve attend APÉRO au QG : vérifiez-la pendant que BISHOP collecte la seconde.',skills:'Accès local · Collecte · Vérification en parallèle',goals:['Collecter une deuxième preuve','Vérifier la première au QG'],lesson:'Dossier Vesper : BISHOP → Recueillir une preuve ; APÉRO → Vérifier une preuve. Affectez les deux avant de terminer le tour. Il faut deux preuves dont au moins une vérifiée. Une preuve falsifiée est écartée et doit être remplacée.'},
 {id:'intervention',title:'Arrêter une cible',duration:'3 min',agents:3,brief:'Deux preuves sont déjà vérifiées. Préparez le dossier, obtenez le mandat et localisez Vesper avec trois agents en parallèle, puis procédez à l’arrestation.',skills:'Préparation · Mandat · Localisation · Arrestation',goals:['Préparer, mandater et localiser','Arrêter Vesper'],lesson:'Dans Intervention : BISHOP prépare, IRIS obtient le mandat, LEI localise puis arrête. Vérifiez la date de validité de la position. En campagne, stats, talents, énergie et soutien influencent les chances ; ici la réussite est garantie.'},
 {id:'shield',title:'Contrer une menace',duration:'3 min',agents:2,brief:'Une attaque vise Berlin au tour 3. IRIS est sur place : protégez le pays pendant qu’APÉRO lance un hack de soutien depuis le QG.',skills:'Échéance · Protection · Hack depuis le QG',goals:['Protéger Berlin','Hacker depuis le QG','Intercepter ou repousser l’attaque'],lesson:'IRIS : Menaces → Protéger l’infrastructure. APÉRO : fiche agent → Hack d’un pays → Allemagne. La protection demande deux tours : contrôlez la couverture à la date de l’attaque, pas seulement aujourd’hui.'},
 {id:'recovery',title:'Garder son équipe efficace',duration:'2 min',agents:2,brief:'IRIS est fatiguée au QG ; BISHOP est très exposé à Berlin. Faites reposer IRIS, choisissez Profil bas pour BISHOP et demandez un financement dans Gouvernement.',skills:'Énergie · Exposition · Soutien gouvernemental',goals:['Repos au QG','Profil bas sur le terrain','Demander un financement'],lesson:'L’énergie limite l’enchaînement des missions et l’exposition augmente le risque. Les faveurs consomment de la confiance et partagent un délai. Les modules, dans Modules d’opération, utilisent des crédits et des emplacements : consultez leur effet avant de les activer.'},
 {id:'simulation',title:'Une mini-partie de 10 tours',duration:'6 min',agents:4,npcs:1,brief:'Commandez votre cellule pendant dix tours avec un service britannique contrôlé par Bot Brillant 1. Enquêtez sur Vesper, surveillez les menaces et gérez votre équipe. Les suggestions deviennent discrètes après les premiers tours.',skills:'Enquête · Protection · Récupération · Alliés',goals:['Jouer les dix tours','Consulter le bilan pédagogique'],lesson:'Gardez APÉRO au QG pour vérifier ou hacker ; répartissez les autres entre enquête et protection. Les décisions britanniques sont autonomes. Vos actions restent garanties pour apprendre ; les PNJ utilisent les chances normales. Le bilan décrit vos résultats sans exiger une victoire.'}
].map((m,i)=>({...m,number:String(i+1).padStart(2,'0'),place:i===5?'Berlin / Ankara / Paris':'Exercice préparé',next:i<5?'Passez au module suivant.':'Formation terminée : lancez une campagne depuis le menu principal.'}));
export function compactObjective(s){
 if(!isCompactTutorial(s))return null;
 const id=s.tutorial.mission,f=s.factions.FR,k=f.known.s0,orders=[];
 const add=(agentId,type,target=null)=>orders.push({agentId,type,target});
 const pending=()=>orders.filter(o=>!s.agents.find(a=>a.id===o.agentId)?.task);
 const guide=(byType,fallback='Ordres en cours. Terminez le tour pour les faire avancer.')=>pending().map(o=>byType[o.type]).filter(Boolean).map(translateText).join(' ')||translateText(fallback);
 const result=(title,text,done=false,extra={})=>({step:s.turn-1,title,text,orders,done,failed:false,...extra});
 if(id==='simulation'){
  if(s.turn>10||s.ended){
   const tally=(nation)=>({
    arrests:s.suspects.filter(t=>t.arrested&&t.arrestedBy===nation).length,
    orders:Object.values(s.campaignStats?.factions?.[nation]||{}).reduce((n,row)=>n+(row.count||0),0),
    score:s.factions[nation]?.score||0
   });
   const player=tally('FR'),ally=tally('GB');
   const summary=x=>`${x.orders} ordre(s) résolu(s), ${x.arrests} arrestation(s), ${x.score} prestige`;
   return result('Dix tours · Bilan de formation',`Votre service : ${summary(player)}. Service britannique (PNJ) : ${summary(ally)}. Crise : ${s.crisis}/100. ${player.orders===0?'Vous avez observé les opérations. Rejouez pour pratiquer.':'Consultez les Archives pour revoir la contribution de vos agents.'} Le bilan de formation ne déclare pas de victoire de campagne.`,true);
  }
  const suggestion=npcTutorialObjective(s);
  return {...suggestion,title:`Mini-partie · Tour ${s.turn}/10`,unguided:s.turn>2,text:s.turn<=2?'Gardez APÉRO au QG ; enquêtez à Ankara et préparez la protection de Berlin. Affectez les agents disponibles puis terminez le tour.':s.turn<=5?'Enquête et protection avancent en parallèle. Consultez les échéances dans Menaces.':s.turn<=8?'Préparez une arrestation et surveillez l’énergie et l’exposition. Les suggestions restent dans Instructions.':'Terminez vos opérations : le bilan arrive après la résolution du tour 10.'};
 }
 if(id==='basics'){
  if(s.agents[0].country!=='DE')add('p0','travel','DE');else if(!f.access.DE)add('p0','contacts');
  return result(orders.length?'Votre premier ordre':'Les bases sont acquises',orders.length?COMPACT_MISSIONS[0].brief+' '+COMPACT_MISSIONS[0].lesson:'Un ordre confirmé est planifié ; terminer le tour le résout. Vous avez rejoint Berlin et ouvert un accès local.',!orders.length,{instruction:guide({travel:'Sélectionnez l’Allemagne, puis Déployer un agent. Choisissez IRIS et confirmez son voyage.',contacts:'IRIS est à Berlin. Ouvrez le dossier Vesper et choisissez Activer un contact.'},'Ordre affecté : terminez le tour pour le résoudre.')});
 }
 if(id==='inquiry'){
  const e=f.evidence.filter(e=>!e.contested);
  if(e.length<2)add('p12','collect','s0');
  if(!e.some(e=>e.verified))add('p15','analyze',e[0].id);
  return result(orders.length?'Collecter et vérifier ensemble':'Dossier exploitable',COMPACT_MISSIONS[1].lesson,!orders.length,{instruction:guide({collect:'Dans le dossier Vesper, affectez BISHOP à la collecte.',analyze:'Affectez APÉRO à la vérification au QG.'})});
 }
 if(id==='intervention'){
  if(s.suspects[0].arrested)return result('Vesper arrêté','Préparation, mandat et localisation ont permis l’intervention.',true);
  if(!k.prepared)add('p12','prepare','s0');
  if(!f.authorized.DE)add('p0','authorize');
  if(k.locationUntil<s.turn)add('p14','surveil','s0');
  if(!orders.length)add('p14','arrest','s0');
  return result(orders.some(o=>o.type==='arrest')?'Intervenir maintenant':'Préparer puis intervenir',COMPACT_MISSIONS[2].lesson,false,{instruction:guide({prepare:'BISHOP : préparez le dossier.',authorize:'IRIS : obtenez le mandat.',surveil:'LEI : localisez Vesper.',arrest:`LEI : procédez à l’arrestation. La position est valable jusqu’à la fin du tour ${k.locationUntil}.`})});
 }
 if(id==='shield'){
  const plot=s.plots.find(p=>p.id==='filigrane-berlin');
  const attack=(s.attackReports||[]).find(r=>r.plotId===plot?.id&&r.country==='DE');
  const delayed=Boolean(plot&&((s.attackDelayReports||[]).some(r=>r.plotId===plot.id&&r.origin==='DE'&&r.country==='DE'&&r.reason==='protection')||
   // Fracture only marks a non-relocated plot as adapted when protection postpones it.
   plot.adapted&&plot.country==='DE'&&plot.turn>3));
  const defended=Boolean(plot&&(attack?.status==='INTERCEPTÉE'&&attack.participants.includes('FR')||plot.resolved&&s.credited?.[plot.id+':FR']));
  const hacked=(f.cyberSupport?.DE||0)>0||(s.operationReports||[]).some(r=>r.type==='cyberSupport'&&r.faction==='FR'&&r.country==='DE'&&r.status==='RÉUSSITE');
  if(attack?.status==='RÉUSSIE'||plot?.resolved&&!defended&&!delayed)
   return result('Berlin a été touchée','Le hack soutient les opérations, mais ne protège pas Berlin à lui seul. Recommencez et lancez la protection avec IRIS au plus tard au tour 2.',false,{failed:true});
  if((defended||delayed)&&hacked)
   return result(defended?'Attaque interceptée':`Attaque repoussée au tour ${plot.turn}`,defended?'Votre couverture était active au moment de l’attaque. Le hack de soutien était aussi en place.':`La couverture a repoussé cette attaque jusqu’au tour ${plot.turn}. En campagne, vérifiez si la couverture sera encore active à cette nouvelle échéance.`,true);
  if(!delayed&&!defended&&s.turn<=2&&(f.defense.DE||0)<3)add('p0','protect');
  if(!hacked)add('p15','cyberSupport','DE');
  const instruction=guide({protect:'Dans Menaces, affectez IRIS à la protection de Berlin avant la fin du tour 2.',cyberSupport:'Depuis le QG, affectez APÉRO au hack de l’Allemagne.'},`Terminez le tour. Consultez Menaces pour vérifier la couverture prévue au tour ${plot?.turn??3}.`);
  return result('Couvrir Berlin à temps',COMPACT_MISSIONS[3].lesson,false,{freeChoice:true,instruction});
 }
 const iris=s.agents.find(a=>a.id==='p0'),bishop=s.agents.find(a=>a.id==='p12');
 if(iris.fatigue>10)add('p0','rest');if(bishop.exposure>35)add('p12','hide');
 const funded=(s.campaignStats?.support?.FR?.government?.funding?.count||0)>0;
 return result(!orders.length&&funded?'Équipe prête à repartir':'Récupérer et financer',COMPACT_MISSIONS[4].lesson,!orders.length&&funded,{freeChoice:true,instruction:guide({rest:'Faites reposer IRIS au QG.',hide:'Placez BISHOP en profil bas.'},funded?'Terminez le tour pour résoudre les ordres.':'Demandez un financement dans Gouvernement.')+(pending().length&&!funded?' Demandez aussi un financement dans Gouvernement.':'')});
}

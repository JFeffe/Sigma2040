// Explicit per-chapter capabilities; never inferred from mutable save flags.
export const NPC_TUTORIALS=Object.freeze(['allies','network','command']);
export const isNpcTutorial=s=>s?.tutorial?.version===1&&NPC_TUTORIALS.includes(s.tutorial.mission);
export const tutorialGuaranteed=(s,faction=s?.player)=>!!s?.tutorial&&(!isNpcTutorial(s)||s.tutorial.mission==='allies'&&faction==='FR');
export const tutorialRecruitment=s=>isNpcTutorial(s);
export const tutorialParticipants=id=>id==='allies'?['FR','GB']:NPC_TUTORIALS.includes(id)?['FR','GB','US','CN']:['FR'];
export const tutorialRiskNote=s=>!isNpcTutorial(s)?'Les actions autorisées réussissent à 100 % ici. Aucun joueur PNJ n’intervient. Votre campagne est conservée séparément.':s.tutorial.mission==='allies'?'Vos actions réussissent à 100 % ; le service britannique joue avec la véritable IA BB1 et les chances normales. Votre campagne reste séparée.':'Trois services PNJ utilisent la véritable IA BB1. Vos actions ont les chances et les risques de la campagne : échec, blessure, capture et décès possibles. Renforts et recrutement sont disponibles. Votre campagne reste séparée.';

export const tutorialSeed=id=>id==='network'?20414:id==='command'?20416:197;

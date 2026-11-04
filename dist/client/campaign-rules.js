import {isNpcTutorial} from './tutorial-mode.js?v=218';
import {isTutorial} from './tutorial-rules.js?v=218';
const LEGACY=Object.freeze({maxTurns:40,crisisPerTurn:2,firstAttack:7,attackInterval:4,attackCount:9});
export const CURRENT_RULES=Object.freeze({maxTurns:30,crisisPerTurn:3,firstAttack:3,attackInterval:2,attackCount:14});
const COOP_BUILD_212=Object.freeze({...CURRENT_RULES,maxTurns:35,crisisPerTurn:2,attackDamage:5});
export const COOP_RULES=Object.freeze({...CURRENT_RULES,attackDamage:30});
const TRAINING=Object.freeze({...CURRENT_RULES,maxTurns:40,crisisPerTurn:0,attackCount:0});
export const campaignRules=s=>isNpcTutorial(s)?s.tutorial.mission==='allies'?{...TRAINING,maxTurns:14}:s.tutorial.mission==='network'?{...CURRENT_RULES,maxTurns:20}:CURRENT_RULES:isTutorial(s)?TRAINING:s?.gameMode==='cooperative'&&s.coopCampaignRules===1?COOP_BUILD_212:s?.gameMode==='cooperative'&&s.coopCampaignRules===2?COOP_RULES:s?.pressureRules===1?CURRENT_RULES:LEGACY;

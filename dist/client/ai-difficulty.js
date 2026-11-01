export const AI_LEVELS={bb1:'Bot Brillant 1',bb2:'Bot Brillant 2'};
export const LEGACY_AI_LEVELS=['easy','normal','expert'];
export const normalizeAI=value=>Object.hasOwn(AI_LEVELS,value)?value:LEGACY_AI_LEVELS.includes(value)||value==null?'bb1':null;
export const aiLevel=s=>normalizeAI(s.aiDifficulty)||'bb1';
export function aiDifficultyControl(value='bb2',multiplayer=false,editable=true){value=normalizeAI(value)||'bb2';return `<section class="decision-box setup-difficulty"><h3>Bot</h3><div class="suspect-actions">${Object.entries(AI_LEVELS).map(([id,label])=>`<button class="btn ${id===value?'primary':''}" data-cmd="${multiplayer?'mp-ai-difficulty':'ai-difficulty'}" data-id="${id}" aria-pressed="${id===value}" ${editable?'':'disabled'}>${label}</button>`).join('')}</div></section>`;}

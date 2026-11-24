export const AI_LEVELS={bb1:'Facile',bb2:'Normal'};
export const LEGACY_AI_LEVELS=['easy','normal','expert'];
export const normalizeAI=value=>Object.hasOwn(AI_LEVELS,value)?value:LEGACY_AI_LEVELS.includes(value)||value==null?'bb1':null;
export const aiLevel=s=>normalizeAI(s.aiDifficulty)||'bb1';
export function aiDifficultyControl(value='bb2',multiplayer=false,editable=true){
 const selected=normalizeAI(value)||'bb2';
 const title='Difficulté de l’IA';
 if(!editable){
  return `<section class="setup-difficulty is-readonly"><h3>${title}</h3><p class="setup-difficulty-value">${AI_LEVELS[selected]}</p></section>`;
 }
 const command=multiplayer?'mp-ai-difficulty':'ai-difficulty';
 return `<section class="setup-difficulty"><h3>${title}</h3>
  <div class="suspect-actions" role="group" aria-label="${title}">
   ${Object.entries(AI_LEVELS).map(([id,label])=>`<button class="btn ${id===selected?'primary':''}" data-cmd="${command}" data-id="${id}" aria-pressed="${id===selected}">${label}</button>`).join('')}
  </div>
 </section>`;
}

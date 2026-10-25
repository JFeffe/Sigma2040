import {DISPLAY_ROSTER,STAT_NAMES,TALENTS,ACTIONS} from './data.js?v=197';
import {esc,icon,nationalityFlags,talentIcon,portrait,sortedTalents} from './ui.js?v=197';
import {fullBody} from './visuals.js?v=197';
const faces={solo:new Set(),multi:new Set()};
const slots={solo:[null,null,null,null],multi:[null,null,null,null]};
const filters={solo:{sort:'default',talent:''},multi:{sort:'default',talent:''}};
export function resetRecruitFilters(mode='solo'){filters[mode]={sort:'default',talent:''};faces[mode].clear();slots[mode]=[null,null,null,null];}
export function setRecruitFilter(mode,key,value){if(!filters[mode])return;if(key==='sort'&&['default','0','1','2'].includes(value))filters[mode].sort=value;if(key==='talent'&&(value===''||Object.hasOwn(TALENTS,value)))filters[mode].talent=value;}
export function visibleRecruits(mode='solo'){const {sort,talent}=filters[mode];const list=DISPLAY_ROSTER.filter(a=>!talent||a.talents.includes(talent));return sort==='default'?list:list.sort((a,b)=>b.stats[Number(sort)]-a.stats[Number(sort)]);}
export function recruitControls(mode='solo'){const f=filters[mode];return `<div class="recruit-controls"><label>Classer par<select id="recruit-sort" data-recruit-filter="sort" data-recruit-mode="${mode}">${[['default','Défaut'],['0','Analyse'],['1','Habileté'],['2','Sang-froid']].map(([value,label])=>`<option value="${value}" ${f.sort===value?'selected':''}>${label}</option>`).join('')}</select></label><label>Talent<select id="recruit-talent" data-recruit-filter="talent" data-recruit-mode="${mode}"><option value="" ${!f.talent?'selected':''}>-</option>${Object.entries(TALENTS).filter(([id])=>id!=='chef').sort((a,b)=>a[1][0].localeCompare(b[1][0],'fr',{sensitivity:'base'})).map(([id,[name]])=>`<option value="${id}" ${f.talent===id?'selected':''}>${esc(name)}</option>`).join('')}</select></label><div class="recruit-view-controls" role="group" aria-label="Vue des agents"><button class="btn small" data-cmd="recruit-view" data-id="portrait" data-recruit-mode="${mode}">Tous les portraits</button><button class="btn small" data-cmd="recruit-view" data-id="full" data-recruit-mode="${mode}">Tous les plein pied</button></div></div>`;}
export function statActions(index){return Object.values(ACTIONS).filter(a=>!a.disabled&&!a.safe&&a.stat===index).map(a=>a.name);}
export function statHelp(index){return `${STAT_NAMES[index]} :\n${statActions(index).map(n=>'• '+n).join('\n')}`;}
export function recruitPortrait(a){return fullBody(a);}
export function recruitProfile(a){return `<div class="recruit-body">${recruitPortrait(a)}</div><div class="recruit-info"><div class="recruit-name"><h3>${esc(a.name)}</h3><div class="recruit-role"><span>${esc(a.role)}</span>${nationalityFlags(a)}</div></div><div class="recruit-stat-tiles">${a.stats.map((n,i)=>`<span class="recruit-stat stat-${i}" data-rich-tooltip><span class="recruit-stat-label">${icon(['scan','target','shield'][i])}<span>${STAT_NAMES[i]}</span></span><strong>${n}</strong><template><strong>${STAT_NAMES[i]}</strong><ul>${statActions(i).map(name=>`<li>${esc(name)}</li>`).join('')}</ul>${i===2?'<p>Départage les arrestations simultanées à chances égales sur une même cible.</p>':''}</template></span>`).join('')}</div><div class="recruit-talent-grid">${sortedTalents(a).map(t=>`<span data-rich-tooltip>${talentIcon(t)}<span>${esc(TALENTS[t][0])}</span><template><strong>${esc(TALENTS[t][0])}</strong><p>${esc(TALENTS[t][1])}</p></template></span>`).join('')}</div></div>`;}

export function recruitSlots(ids,mode='solo'){
 const next=slots[mode].map(id=>ids.includes(id)?id:null);
 for(const id of ids)if(!next.includes(id)){const i=next.indexOf(null);if(i>=0)next[i]=id;}
 slots[mode]=next;return [...next];
}
export function toggleRecruitSelection(ids,id,mode='solo'){
 const next=recruitSlots(ids,mode);
 if(next.includes(id))next[next.indexOf(id)]=null;
 else if(next.includes(null))next[next.indexOf(null)]=id;
 slots[mode]=next;return next.filter(Boolean);
}
export function selectedRecruitSlots(ids,mode='solo'){
 return `<div class="selected-recruits" aria-label="Votre unité, premier emplacement réservé au chef">${recruitSlots(ids,mode).map((id,i)=>{const a=DISPLAY_ROSTER.find(a=>a.id===id);return `<div class="selected-recruit-slot ${a?'occupied':''}" aria-label="${a?esc(a.name):'Emplacement libre'}${i===0?' · Chef':''}">${a?portrait(a)+`<button class="recruit-remove" data-cmd="${mode==='multi'?'mp-select':'select-recruit'}" data-id="${a.id}" aria-label="Retirer ${esc(a.name)} de l’unité" title="Retirer ${esc(a.name)}">${icon('close')}</button>`:''}${i===0?`<span class="recruit-chief" title="Chef · Coordination : +5 aux coéquipiers dans le même pays" aria-label="Chef · Coordination : +5 aux coéquipiers dans le même pays">${icon('crown')}</span>`:''}</div>`;}).join('')}</div>`;
}
export function isRecruitPortrait(id,mode='solo'){return faces[mode].has(id);}
export function setRecruitView(mode,id,portraitView){
 const ids=id?[id]:DISPLAY_ROSTER.map(a=>a.id);
 for(const key of ids){if(portraitView)faces[mode].add(key);else faces[mode].delete(key);}
}
function flipControl(a,mode,back){return `<button class="recruit-flip" data-cmd="recruit-flip" data-id="${a.id}" data-recruit-mode="${mode}" aria-label="${back?'Voir le plein pied':'Voir le portrait'} de ${esc(a.name)}">${icon('rotate')}</button><button class="recruit-details" data-cmd="recruit-details" data-id="${a.id}" aria-label="Dossier de ${esc(a.name)}">${icon('help')}</button>`;}
function portraitProfile(a){return `${portrait(a)}<div class="recruit-portrait-heading"><h3>${esc(a.name)}</h3>${nationalityFlags(a)}</div><div class="recruit-portrait-footer"><div class="portrait-stats">${a.stats.map((n,i)=>`<span class="stat-${i}" data-rich-tooltip aria-label="${STAT_NAMES[i]} : ${n}">${icon(['scan','target','shield'][i])}<strong>${n}</strong><template><strong>${STAT_NAMES[i]}</strong><ul>${statActions(i).map(name=>`<li>${esc(name)}</li>`).join('')}</ul></template></span>`).join('')}</div><div class="portrait-talents">${sortedTalents(a).map(t=>`<span data-rich-tooltip aria-label="${esc(TALENTS[t][0])}">${talentIcon(t)}<template><strong>${esc(TALENTS[t][0])}</strong><p>${esc(TALENTS[t][1])}</p></template></span>`).join('')}</div></div>`;}
export function recruitCard(a,ids,mode='solo',options={}){
 const back=isRecruitPortrait(a.id,mode),selected=ids.includes(a.id),cmd=options.cmd||(mode==='multi'?'mp-select':'select-recruit');
 return `<article class="recruit-card ${selected?'selected':''} ${back?'is-portrait':''}" data-recruit-id="${a.id}" data-recruit-mode="${mode}"><div class="recruit-card-inner"><div class="recruit-face recruit-front" ${back?'inert aria-hidden="true"':''}><button class="recruit-select" ${options.disabled?'disabled':''} data-cmd="${cmd}" data-id="${a.id}" aria-label="${options.preview?'Prévisualiser':selected?'Désélectionner':'Sélectionner'} ${esc(a.name)}" aria-pressed="${selected}">${recruitProfile(a)}</button>${flipControl(a,mode,false)}</div><div class="recruit-face recruit-back" ${back?'':'inert aria-hidden="true"'}><button class="recruit-select" ${options.disabled?'disabled':''} data-cmd="${cmd}" data-id="${a.id}" aria-label="${options.preview?'Prévisualiser':selected?'Désélectionner':'Sélectionner'} ${esc(a.name)}" aria-pressed="${selected}">${portraitProfile(a)}</button>${flipControl(a,mode,true)}</div></div></article>`;
}
// Update only the flip state so the CSS transition survives and selection is untouched.
export function updateRecruitFaces(root,mode,id,portraitView){
 setRecruitView(mode,id,portraitView);
 for(const card of root.querySelectorAll('.recruit-card[data-recruit-id]')){
  if(card.dataset.recruitMode!==mode)continue;
  const back=isRecruitPortrait(card.dataset.recruitId,mode),changed=card.classList.contains('is-portrait')!==back;
  if(!changed)continue;
  const hadFocus=card.contains(root.activeElement);
  card.classList.toggle('is-portrait',back);
  for(const [selector,hidden] of [['.recruit-front',back],['.recruit-back',!back]]){const face=card.querySelector(selector);face.inert=hidden;if(hidden)face.setAttribute('aria-hidden','true');else face.removeAttribute('aria-hidden');}
  if(hadFocus)card.querySelector(back?'.recruit-back .recruit-flip':'.recruit-front .recruit-flip').focus({preventScroll:true});
 }
}

export function recruitDetails(id){const a=DISPLAY_ROSTER.find(a=>a.id===id);if(!a)return '';return `<article class="recruit-dossier"><div class="recruit-dossier-art">${recruitPortrait(a)}</div><div class="recruit-dossier-info"><header><h2>${esc(a.name)}</h2><p>${esc(a.role)} ${nationalityFlags(a)}</p></header><div class="recruit-dossier-stats">${a.stats.map((n,i)=>`<div>${icon(['scan','target','shield'][i])}<span>${STAT_NAMES[i]}</span><strong>${n}</strong></div>`).join('')}</div><section><h3>Talents</h3>${sortedTalents(a).map(t=>`<div class="recruit-dossier-talent">${talentIcon(t)}<div><strong>${esc(TALENTS[t][0])}</strong><p>${esc(TALENTS[t][1])}</p></div></div>`).join('')}</section><section class="recruit-dossier-lore"><h3>Parcours</h3><p>${esc(a.bio)}</p></section></div></article>`;}

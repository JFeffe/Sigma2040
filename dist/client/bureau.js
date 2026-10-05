// Bureau des enquêtes : portage de la maquette validée (module.js / style.css),
// branché sur le moteur réel. Même structure et mêmes interactions ; seules la source
// des données, la palette et les demandes de suivi changent.
import {COOPERATION} from './cooperation.js?v=175';
import * as E from './engine.js?v=175';
import {ACTIONS as GAME_ACTIONS, COUNTRY, COUNTRIES, STAT_NAMES} from './data.js?v=175';
import {proofTitle} from './intelligence.js?v=175';
import {portraitAsset, icon} from './ui.js?v=175';
import {suspectPortrait} from './fracture-profiles.js?v=175';

const asset = p => new URL(p, location.href).href;
const opened = new Set();
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let justOpened = null;
let ctx = null, dialog = null, root = null, styles = '', selected = null, popover = null, toastTimer = null;

/* ---------------- correspondance maquette → moteur ---------------- */
export const METHODS = {contact: ['contacts', 'influence', 'drone'], authorize: ['authorize'], collect: ['collect', 'hack', 'intimidate'], verify: ['analyze'], prepare: ['prepare'], locate: ['surveil', 'intimidate', 'drone'], arrest: ['arrest'], equip:['equip']};
const stepKey = step => step.startsWith('collect') ? 'collect' : step.startsWith('verify') ? 'verify' : step;
const slotOf = step => Number(step.slice(-1));
const icons = {collect: 'file', verify: 'check', prepare: 'target', locate: 'radar', contact: 'people', authorize: 'seal', arrest: 'cuffs',equip:'target'};
const country = c => COUNTRY[c]?.name || c;
const flag = c => COUNTRY[c] ? `<img class="flag" src="${asset(`./assets/flags/${c.toLowerCase()}.svg`)}" alt="" width="18" height="13">` : '';
const place = c => `${flag(c)}${country(c)}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const portrait = a => { const src = portraitAsset(a); return `<span class="agent-portrait" role="img" aria-label="Portrait de ${esc(a.name)}" style="${src ? `background-image:url('${asset(src)}')` : ''}">${src ? '' : esc(a.name.slice(0, 2))}</span>`; };

// Vue d'un dossier pour le joueur : ce que la maquette appelait « target ».
export function caseOf(s, id) {
  const t = s.suspects.find(t => t.id === id), k = E.knownTargets(s).find(k => k.id === id), f = s.factions[s.player];
  const ev = k ? f.evidence.filter(e => s.proofs.find(p => p.id === e.id)?.suspect === id) : [];
  const ok = ev.filter(e => !e.contested);
  return {id, name: t.name, role: t.role, cell: t.cell, country: k?.country || null, known: !!k, arrested: t.arrested, arrestedBy: t.arrestedBy,
    identified: !!k?.identified, prepared: !!k?.prepared, intimidated: !!k?.intimidated, flightUntil: k?.flightUntil || 0, locationUntil: k?.locationUntil || 0,
    proofs: [ok[0] || null, ok[1] || null], contested: ev.filter(e => e.contested).length, rejected: ev.filter(e => e.contested).map(e => proofTitle(s.proofs.find(p => p.id === e.id)))};
}
const validLocation = (s, t) => t.locationUntil >= s.turn;
const team = s => E.team(s).filter(a => !['dead', 'retired'].includes(a.status));

function done(s, t, step) {
  const key = stepKey(step), f = s.factions[s.player];
  return key === 'contact' ? !!f.access[t.country] : key === 'authorize' ? !!f.authorized[t.country]
    : key === 'collect' ? !!t.proofs[slotOf(step)] : key === 'verify' ? !!t.proofs[slotOf(step)]?.verified : key === 'prepare' ? t.prepared
    : key === 'locate' ? validLocation(s, t) : key === 'arrest' ? t.arrested : false;
}
// Paramètre « cible » attendu par le moteur pour chaque action.
function engineTarget(t, step, type) {
  if (type === 'analyze') return t.proofs[slotOf(step)]?.id || null;
  if (['contacts', 'influence', 'authorize','equip'].includes(type)) return null;
  return t.id;
}
// Où l'action se déroule (null : pays de l'agent, pour la découverte).
function operationCountry(s, t, step, type) {
  if (GAME_ACTIONS[type].home) return s.player;
  return t.country;
}
// Mission en cours rattachée à une étape (les pièces se remplissent dans l'ordre).
export function taskFor(s, t, step) {
  const key = stepKey(step), mine = team(s).filter(a => a.task);
  if (key === 'verify') return t.proofs[slotOf(step)] ? E.analysisAgent(s, s.player, t.proofs[slotOf(step)].id) : null;
  if (key === 'collect') {
    const running = mine.filter(a => METHODS.collect.includes(a.task.type) && a.task.target === t.id && a.country === t.country);
    const free = [0, 1].filter(i => !t.proofs[i]);
    return running[free.indexOf(slotOf(step))] || null;
  }
  if (key === 'contact') return mine.find(a => METHODS.contact.includes(a.task.type) && a.country === t.country) || null;
  if (key === 'authorize') return mine.find(a => a.task.type === 'authorize' && a.country === t.country) || null;
  if (key === 'locate') return mine.find(a => METHODS.locate.includes(a.task.type) && (a.task.type === 'drone' ? a.country === t.country : a.task.target === t.id)) || null;
  return mine.find(a => a.task.type === key && a.task.target === t.id) || null;
}

// Raison courte au niveau du dossier, comme dans la maquette.
function blocked(s, t, step, type) {
  const key = stepKey(step), f = s.factions[s.player];
  if (t.arrested) return 'Dossier clos';
  if (done(s, t, step) && key !== 'locate') return 'Étape acquise';
  if (!t.known) return 'Dossier non découvert';
  if (key === 'collect' && ['collect', 'hack'].includes(type) && !f.access[t.country]) return 'Accès local requis';
  if (type === 'contacts' && t.country && f.access[t.country]) return 'Accès déjà ouvert : utilise une autre piste';
  if (type === 'intimidate' && t.intimidated) return 'Déjà utilisé pour ce dossier';
  if (GAME_ACTIONS[type].tech && E.getTechSlots(s, s.player) >= 2) return 'Les deux modules technologiques sont occupés';
  if (key === 'collect' && t.proofs.filter(Boolean).length >= 2) return 'Deux preuves déjà réunies';
  if (key === 'verify' && !t.proofs[slotOf(step)]) return 'Recueillir cette preuve d’abord';
  if (key === 'prepare' && !(t.proofs.filter(Boolean).length >= 2 && t.proofs.some(p => p?.verified))) return 'Deux preuves, dont une vérifiée, requises';
  if (key === 'arrest' && !t.prepared) return 'Préparer l’arrestation d’abord';
  if (key === 'arrest' && !validLocation(s, t)) return 'Localisation valide requise';
  return '';
}
export function agentReason(s, t, step, type, a) {
  const reason = blocked(s, t, step, type);
  if (reason) return reason;
  if (a.status === 'captured') return 'Agent détenu';
  if (a.task) return 'Agent en mission';
  const where = operationCountry(s, t, step, type);
  if (where && a.country !== where) return 'Agent dans un autre pays';
  if (!where && a.country === a.faction) return 'Action à l’étranger uniquement';
  return E.options(s, a.id, type, engineTarget(t, step, type)).error || '';
}
const eligible = (s, t, step, type) => team(s).filter(a => !agentReason(s, t, step, type, a));

/* ---------------- montage (identique à la maquette) ---------------- */
export function initBureau(context) { ctx = context; }
let stylePromise = null, campaign = null;
function mountBureau() {
  if (dialog) return;
  dialog = document.createElement('dialog');
  dialog.id = 'bureau';
  dialog.setAttribute('aria-label', 'Bureau des enquêtes');
  const host = document.createElement('div');
  host.id = 'sigma-bureau';
  dialog.append(host);
  document.body.append(dialog);
  root = host.attachShadow({mode: 'open'});
  dialog.addEventListener('cancel', e => {e.preventDefault();if(popover)hidePopover(true);else ctx.exit();});
  dialog.addEventListener('close', () => { hidePopover(false); root.innerHTML = ''; document.querySelector('.deck-tab[data-cmd="bureau"]')?.focus({preventScroll: true}); });

  root.addEventListener('keydown', e => { if (e.key === 'Tab' && popover && e.target.matches?.('[data-agent]') && !e.shiftKey) { const b = root.querySelector('.agent-tooltip input:not([disabled])') || root.querySelector('.agent-tooltip [data-assign]:not([disabled])') || root.querySelector('.agent-tooltip .tooltip-close'); if (b) { e.preventDefault(); b.focus(); } } });
  dialog.addEventListener('keydown', e => {if(e.key==='Escape'){e.preventDefault();if(popover)hidePopover(true);else ctx.exit();}e.stopPropagation();});
  root.addEventListener('click', e => { if (popover && !e.target.closest('.agent-tooltip') && !e.target.closest('[data-agent]')) hidePopover(); });
  window.addEventListener('resize', positionPopover);
  root.addEventListener('scroll', () => positionPopover(), true);
  root.addEventListener('animationend', e => { if (!e.target.closest?.('.agent-tooltip')) positionPopover(); }, true);
}
export async function openBureau(caseId = null) {
  const s = ctx?.state();
  if (!s || !ctx.ready()) return;
  mountBureau();
  try {
    stylePromise ||= fetch(asset('./bureau.css?v=175')).then(r => {if (!r.ok) throw Error('Styles du bureau indisponibles.'); return r.text();});
    styles = await stylePromise;
  } catch (error) { stylePromise = null; ctx.notify?.(error.message); return; }
  if (!ctx.ready()) return;
  syncCampaign();
  if (caseId && s.suspects.some(t => t.id === caseId)) selected = caseId;
  if (!selected) selected = (E.knownTargets(s).find(t => !t.arrested) || {id: 's0'}).id;
  render();
  if (!dialog.open) dialog.show();
}
export function refreshBureau() {
  if (!dialog?.open) return;
  if (!ctx.state() || !ctx.ready()) { dialog.close(); return; }
  syncCampaign();
  render();
}
export function closeBureau() { if (dialog?.open) dialog.close(); }
function syncCampaign() {
  const s = ctx.state(), key = `${s.seed}:${s.player}`;
  if (key !== campaign || !s.suspects.some(t => t.id === selected&&!t.arrested)) {
    campaign = key; selected = (E.knownTargets(s).find(t => !t.arrested) || s.suspects.find(t=>!t.arrested)||s.suspects[0]).id; opened.clear(); hidePopover(false);
  }
}

// Raison réelle quand personne ne peut agir (moteur), en quelques mots.
function agentGap(s, t, step, type) {
  const where = operationCountry(s, t, step, type), local = team(s).filter(a => !where ? a.country !== a.faction : a.country === where);
  const free = local.filter(a => !a.task && a.status !== 'captured');
  if (!local.length) return where === s.player ? 'Personne au QG' : 'Aucun agent sur place';
  if (!free.length) return local.some(a => a.task) ? 'Agents sur place en mission' : 'Agent détenu';
  const err = E.options(s, free[0].id, type, engineTarget(t, step, type)).error || '';
  const map = [[/accès/i, 'Accès local requis'], [/Deux preuves recevables/, 'Deux preuves déjà réunies'], [/Toutes les pièces/, 'Plus de pièce à recueillir'], [/intimidation/i, 'Déjà utilisé pour ce dossier'], [/modules/, 'Modules occupés'], [/épuisé/, 'Agent épuisé'], [/Budget/, 'Crédits insuffisants'], [/progression diplomatique/, 'Déjà fait ce tour']];
  return (map.find(([re]) => re.test(err)) || [null, err])[1];
}
// Si rien n'est faisable dans une étape : une seule raison, la plus utile.
function commonBlock(s, t, step) {
  const reasons = METHODS[stepKey(step)].map(type => blocked(s, t, step, type) || (eligible(s, t, step, type).length ? '' : agentGap(s, t, step, type)));
  if (reasons.some(r => !r)) return '';
  const where = reasons.find(r => /Aucun agent|Personne au QG|en mission|détenu/.test(r));
  if (where) return where;
  return [...new Set(reasons)].slice(0, 2).join(' · ');
}
function methods(s, t, step) {
  if (done(s, t, step) && stepKey(step) !== 'locate') return '';
  return `<div class="methods ${justOpened === step ? 'opening' : ''}">${METHODS[stepKey(step)].map(type => {
    const d = GAME_ACTIONS[type], reason = blocked(s, t, step, type), agents = eligible(s, t, step, type), where = operationCountry(s, t, step, type);
    const gap = !reason && !agents.length ? agentGap(s, t, step, type) : '';
    const why = reason || gap;
    const faces = agents.map(a => {
      const o = E.options(s, a.id, type, engineTarget(t, step, type)), pct = d.safe ? 'Auto' : `${o.chance} %`;
      return `<label class="agent-pick"><input type="checkbox" data-pick="${a.id}" data-step="${step}" data-type="${type}" aria-label="Sélectionner ${esc(a.name)}"><span>${esc(a.name)} · É ${100-a.fatigue} · Exp ${a.exposure}</span></label><button class="portrait-button" data-agent="${a.id}" data-step="${step}" data-type="${type}" aria-label="${esc(a.name)} — ${esc(d.name)} · ${pct}" aria-haspopup="dialog" aria-expanded="false">${portrait(a)}<span class="odds ${d.safe ? 'auto' : o.chance >= 70 ? 'high' : o.chance >= 50 ? 'mid' : 'low'}">${pct}</span></button>`;
    }).join('');
    return `<div class="method-row ${agents.length ? 'ready' : 'blocked'}"><div class="m-head"><strong>${esc(d.name)}</strong><small>${where ? place(where) : 'Pays de l’agent'}${d.home ? ' · QG' : ''} · ${d.duration} t.</small></div>${why ? `<p class="why">${esc(why)}</p>` : ''}${faces ? `<div class="agents-inline">${faces}</div><button data-batch="${type}" data-step="${step}">Affecter les agents cochés</button>` : ''}</div>`;
  }).join('')}</div>`;
}
function node(s, t, step, title, sub = '') {
  const twin = step === 'collect1' && !t.proofs[0] && !t.proofs[1] && !taskFor(s, t, 'collect0') && !taskFor(s, t, 'collect1');
  const isDone = step !== 'locate' && done(s, t, step), busy = taskFor(s, t, step);
  const available = !isDone && !twin && METHODS[stepKey(step)].some(type => eligible(s, t, step, type).length);
  const block = twin ? '' : !isDone && !busy && !available ? commonBlock(s, t, step) : '';
  const lines = [sub, twin ? 'Mêmes actions que la pièce 1, en parallèle.' : '', block ? `<span class="why">${esc(block)}</span>` : ''].filter(Boolean);
  const state = isDone ? 'done' : available ? 'available' : busy ? 'pending' : 'locked';
  const canOpen = !isDone && !twin, open = canOpen && opened.has(step);
  const attrs = canOpen ? `data-toggle="${step}" role="button" tabindex="0" aria-expanded="${open}"` : '';
  const label = {done: 'Acquis', pending: 'En cours', available: '', locked: 'À faire'}[state];
  return `<section class="node-block is-${state} ${step === 'arrest' ? 'is-arrest' : ''} ${open ? 'open' : ''} ${canOpen ? 'can-open' : ''}"><div class="node ${state}" ${attrs}><span class="symbol">${icon(isDone ? 'check' : busy ? 'clock' : icons[stepKey(step)])}</span><span class="node-text"><strong>${title}</strong>${lines.map(l => `<small>${l}</small>`).join('')}</span>${label ? `<em>${label}</em>` : ''}${canOpen ? `<svg class="chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}</div>${busy ? `<div class="taskline">${portrait(busy)}<span><b>${esc(busy.name)}</b> · ${esc(GAME_ACTIONS[busy.task.type].name)}</span><small>${busy.task.queued ? 'Planifié' : `${busy.task.remaining} t.`}</small></div>` : ''}${open ? methods(s, t, step) : ''}</section>`;
}
function progress(t) { return [t.known, ...t.proofs.map(Boolean), t.proofs.some(p => p?.verified), t.prepared, t.arrested].filter(Boolean).length / 6 * 100; }
function sidebar(s) {
  return `<nav class="sidebar" aria-label="Enquêtes"><span class="eyebrow">${s.suspects.filter(t=>!t.arrested).length} enquêtes actives</span>${['JANUS', 'PRISME', 'CENDRE', 'L’ARCHITECTE'].map((name, i) => `<div class="group"><div class="group-label"><span>${name}</span><span>${s.suspects.filter(t=>t.cell===i&&!t.arrested).length}</span></div>${s.suspects.filter(x => x.cell === i&&!x.arrested).map(x => {
    const t = caseOf(s, x.id);
    return `<button class="case ${selected === t.id ? 'active' : ''}" data-case="${t.id}" aria-current="${selected === t.id ? 'page' : 'false'}"><strong>${t.known || t.arrested ? esc(t.name) : i === 3 ? 'L’Architecte' : `Dossier ${Number(t.id.slice(1)) + 1}`}</strong><small>${t.arrested ? 'Cible arrêtée' : t.known ? `${place(t.country)} · ${t.flightUntil ? `<span class="flee">départ fin T${t.flightUntil}</span>` : 'Enquête ouverte'}` : 'Non découvert'}</small><div class="rail"><i style="width:${progress(t)}%"></i></div></button>`;
  }).join('')}</div>`).join('')}</nav>`;
}
function activity(s, t) {
  const reports = (s.operationReports || []).filter(r => r.faction === s.player && (r.targetName === t.name || t.country && ['contacts', 'influence', 'authorize'].includes(r.type) && r.country === t.country)).slice(0, 8);
  const tone = r => r.status === 'RÉUSSITE' ? ['ok', 'Réussite'] : r.status === 'ÉCHEC' ? ['ko', 'Échec'] : ['stop', 'Interrompue'];
  return `<section class="activity"><header class="panel-head"><strong>Journal du dossier</strong></header>${reports.length ? `<ul class="log">${reports.map(r => {
    const a = s.agents.find(x => x.id === r.agentId) || {name: r.agent, templateId: r.templateId};
    const [cls, label] = tone(r);
    return `<li class="${cls}">${portrait(a)}<div class="entry"><strong>${esc(GAME_ACTIONS[r.type]?.name || r.type)}</strong><small><b>${esc(r.agent)}</b> · ${COUNTRY[r.country] ? place(r.country) : ''} · Tour ${r.turn}</small></div><span class="res ${cls}">${label}</span></li>`;
  }).join('')}</ul>` : '<p class="empty">Aucune opération sur ce dossier pour l’instant.</p>'}</section>`;
}
export function bureauCaseMarkup(s, id = selected) {
  const t = caseOf(s, id), left = t.locationUntil - s.turn + 1;
  const name = t.known || t.arrested ? esc(t.name) : t.id === 's6' ? 'L’Architecte' : `Dossier ${Number(t.id.slice(1)) + 1}`;
  const photo = t.known || t.arrested ? suspectPortrait({...s.suspects.find(x => x.id === t.id), identified: t.identified}, 'suspect-face') : '<div class="suspect-face unknown">?</div>';
  const head = `<div class="heading">${photo}<div><span class="file-id">DOSSIER ${String(Number(t.id.slice(1)) + 1).padStart(2, '0')} / 07 · ${['JANUS', 'PRISME', 'CENDRE', 'ARCHITECTE'][t.cell]}</span><h1>${name}</h1>${t.known ? `<p class="role">${esc(t.role)}</p>` : ''}</div></div>`;
  if (!t.known && !t.arrested) return `<div class="layout">${sidebar(s)}<main class="content">${head}<p class="unknown-case">Dossier non découvert.</p></main></div>`;
  const loc = validLocation(s, t);
  const required = [['2 preuves · 1 vérifiée', t.proofs.filter(Boolean).length >= 2 && t.proofs.some(p => p?.verified)], ['Arrestation préparée', t.prepared], [loc ? `Position valide · ${left} t.` : 'Position valide', loc]];
  const ready = required.every(r => r[1]);
  const move = t.arrested ? '' : t.flightUntil ? `<span class="move alert">✈ Départ prévu à la fin du tour ${t.flightUntil}</span>` : '<span class="move calm">✓ Aucun départ prévu</span>';
  const collect = [0, 1].map(i => `<div>${node(s, t, 'collect' + i, `Recueillir la preuve ${i + 1}`, t.proofs[i] ? esc(proofTitle(s.proofs.find(p => p.id === t.proofs[i].id))) : !t.proofs[i] && t.contested ? 'Falsification écartée : recueillir une autre pièce.' : '')}</div>`).join('');
  const verify = [0, 1].map(i => node(s, t, 'verify' + i, `Vérifier la preuve ${i + 1}`, t.proofs[i]?.verified ? 'Preuve authentifiée.' : i === 1 ? 'Optionnel : une preuve vérifiée suffit.' : '')).join('');
  return `<div class="layout">${sidebar(s)}<main class="content">${head}
  <div class="country-line"><span class="where">${place(t.country)} : ${esc(COOPERATION[s.factions[s.player].cooperation[t.country]]?.name||'Relation inconnue')}</span>${move}${required.map(([label, ok]) => `<span class="move ${ok ? 'calm' : 'todo'}">${ok ? '✓' : '○'} ${label}</span>`).join('')}</div>
  <section class="unlock ${ready || t.arrested ? 'ready' : ''}" aria-label="Débloquer l’arrestation"><header><span class="lock">${ready || t.arrested ? '🔓' : '🔒'}</span><strong>Débloquer l’arrestation</strong></header>
   <div class="unlock-steps">${node(s, t, 'locate', 'Localiser la cible', loc ? `<span class="ok">Position valide encore ${left} tour${left > 1 ? 's' : ''}</span>` : 'Temporaire · perdue si la cible change de pays.')}${node(s, t, 'arrest', 'Procéder à l’arrestation', t.arrested ? `Cible arrêtée${t.arrestedBy ? ` · ${place(t.arrestedBy)}` : ''}` : '')}</div>
  </section>
  <div class="map"><section class="path" aria-label="Parcours"><header class="panel-head"><strong>Monter le dossier</strong></header>
   <div class="row"><span class="row-label">Recueillir 2 preuves · terrain ${place(t.country)}</span><div class="proofs">${collect}</div></div>
   <div class="row"><span class="row-label">Vérifier au QG · ${place(s.player)}</span><div class="proofs">${verify}</div></div>
   <div class="row"><span class="row-label">Préparer · terrain ${place(t.country)}</span>${node(s, t, 'prepare', 'Préparer l’arrestation', t.prepared ? 'Acquis, même si la cible se déplace.' : '')}</div></section>
  <aside class="optional" aria-label="Appuis optionnels"><header><span class="tag">Facultatif</span><strong>Appuis dans le pays</strong><small>Permanents</small></header>${node(s, t, 'contact', 'Activer un contact')}${node(s, t, 'authorize', 'Obtenir un mandat')}${node(s,t,'equip','Récupérer une arme')}</aside></div>
  ${t.rejected.length ? `<section class="activity"><header class="panel-head"><strong>Preuves falsifiées écartées</strong></header><ul>${t.rejected.map(name => `<li class="ko">${esc(name)} · ne compte pas parmi les deux preuves recevables</li>`).join('')}</ul></section>` : ''}${activity(s, t)}</main></div>`;
}
function teamBar(s){return `<section class="bureau-team"><div class="bureau-roster">${team(s).map(a=>`<label>${portrait(a)}<span><strong>${esc(a.name)}</strong><small>Énergie ${100-a.fatigue}/100 · Exposition ${a.exposure}</small><small>${a.task?esc(GAME_ACTIONS[a.task.type].name):a.status==='captured'?'Détenu':'Disponible'}</small></span><input type="checkbox" data-travel-agent="${a.id}" ${a.task||a.status==='captured'?'disabled':''} aria-label="Déplacer ${esc(a.name)}"></label>`).join('')}</div><div class="bureau-travel"><select data-destination aria-label="Destination">${COUNTRIES.map(c=>`<option value="${c.id}" ${c.id===caseOf(s,selected).country?'selected':''}>${esc(c.name)}</option>`).join('')}</select><select data-travel-mode aria-label="Mode de voyage"><option value="travel">Voyager sous passeport</option><option value="sneak">Passage clandestin</option></select><button data-send-team>Envoyer les agents cochés</button></div></section>`;}
async function assignGroup(ids,type,target){const errors=[],sent=[];for(const id of ids){try{const readOnly=ctx.readOnlyReason?.();if(readOnly)throw Error(readOnly);await ctx.assign({id,type,target,useCredits:false});sent.push(id);}catch(e){errors.push(e.message);}}refreshBureau();notify(`${sent.length} ordre(s) affecté(s).${errors.length?' '+[...new Set(errors)].join(' · '):''}`);}
function render() {
  const s = ctx.state(), f = s.factions[s.player];
  const keep = popover && {agentId: popover.agentId, step: popover.step, type: popover.type, pinned: popover.pinned, boost: popover.boost};
  const scroller = root.querySelector('.app'), top = scroller?.scrollTop || 0;
  hidePopover(false);
  root.innerHTML = `<style>${styles}</style><div class="app"><header class="top"><div class="brand"><span class="sigma">Σ</span><div><strong>SIGMA <span style="color:#9b929b;font-weight:400">2040</span></strong><small>BUREAU DES ENQUÊTES</small></div></div><div class="stats"><span class="home">QG<b>${flag(s.player)}</b></span><span>Tour<b>${s.turn}</b></span><span>Prestige<b>${Number.isInteger(f.score) ? f.score : f.score.toFixed(1)}</b></span><span>Crédits<b>${f.budget}</b></span><button class="close" data-close aria-label="Fermer le bureau des enquêtes">✕</button></div></header>${s.suspects.some(t=>!t.arrested)?bureauCaseMarkup(s):'<p class="empty">Toutes les cibles sont arrêtées.</p>'}${teamBar(s)}</div>`;
  root.querySelector('.app').scrollTop = top;
  root.querySelector('[data-close]').onclick = () => ctx.exit();
  root.querySelectorAll('[data-batch]').forEach(b=>b.onclick=async()=>{
    const ids=[...root.querySelectorAll(`[data-pick][data-type="${b.dataset.batch}"][data-step="${b.dataset.step}"]:checked`)].map(x=>x.dataset.pick);
    if(!ids.length){notify('Cochez au moins un agent.');return;}b.disabled=true;
    const target=engineTarget(caseOf(ctx.state(),selected),b.dataset.step,b.dataset.batch);await assignGroup(ids,b.dataset.batch,target);
  });
  root.querySelector('[data-send-team]').onclick=async()=>{const ids=[...root.querySelectorAll('[data-travel-agent]:checked')].map(x=>x.dataset.travelAgent),target=root.querySelector('[data-destination]').value,type=root.querySelector('[data-travel-mode]').value;if(!ids.length){notify('Cochez au moins un agent.');return;}await assignGroup(ids,type,target);};
  root.querySelectorAll('[data-case]').forEach(b => b.onclick = () => { selected = b.dataset.case; render(); root.querySelector('.app').scrollTop = 0; });
  root.querySelectorAll('[data-toggle]').forEach(n => {
    const flip = () => {
      const k = n.dataset.toggle, again = () => { render(); root.querySelector(`[data-toggle="${k}"]`)?.focus({preventScroll: true}); };
      if (opened.has(k)) {
        opened.delete(k);
        const list = n.parentElement.querySelector('.methods');
        if (list && !calm()) { list.classList.add('closing'); n.parentElement.classList.remove('open'); n.setAttribute('aria-expanded', 'false'); setTimeout(again, 190); } else again();
      } else { opened.add(k); justOpened = k; again(); justOpened = null; }
    };
    n.onclick = flip;
    n.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
  });
  root.querySelectorAll('[data-agent]').forEach(b => {
    b.onpointerenter = e => { if (e.pointerType !== 'touch') openPopover(b, false); };
    b.onpointerleave = e => {  };
    b.onfocus = () => openPopover(b, false);
    b.onclick = e => { e.stopPropagation(); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); openPopover(b, true); };
  });
  if (keep) { const a = root.querySelector(`[data-agent="${keep.agentId}"][data-step="${keep.step}"][data-type="${keep.type}"]`); if (a) { openPopover(a, keep.pinned); popover.boost = keep.boost; drawPopover(); } }
}

/* ---------------- fiche d'affectation ---------------- */
function hidePopover(restoreFocus = false) {
  const old = popover;
  popover = null;
  root.querySelector('.agent-tooltip')?.remove();
  if (old?.anchor?.isConnected) { old.anchor.setAttribute('aria-expanded', 'false'); old.anchor.removeAttribute('aria-controls'); if (restoreFocus) { old.anchor.onfocus = null; old.anchor.focus(); old.anchor.onfocus = () => openPopover(old.anchor, false); } }
}
function openPopover(anchor, pinned = false) {
  if (popover?.anchor === anchor) { popover.pinned ||= pinned; return; }
  hidePopover();
  popover = {anchor, agentId: anchor.dataset.agent, step: anchor.dataset.step, type: anchor.dataset.type, pinned, boost: false};
  anchor.setAttribute('aria-expanded', 'true');
  anchor.setAttribute('aria-controls', 'agent-action-card');
  drawPopover();
}
function drawPopover() {
  if (!popover) return;
  const s = ctx.state(), p = popover, t = caseOf(s, selected), a = s.agents.find(a => a.id === p.agentId), d = GAME_ACTIONS[p.type], target = engineTarget(t, p.step, p.type);
  const base = E.options(s, a.id, p.type, target), boosted = E.options(s, a.id, p.type, target, true);
  if (d.safe || base.boostGain === 0) p.boost = false;
  const o = p.boost ? boosted : base, canBoost = !d.safe && !boosted.error;
  const blockedBy = ctx.readOnlyReason?.() || (ctx.observer() ? 'Observateur : consultation uniquement' : s.ended ? 'Campagne terminée' : o.error);
  const pr = p.type === 'analyze' ? s.proofs.find(x => x.id === target) : null;
  const what = pr ? esc(t.name) : ['contacts', 'influence', 'authorize'].includes(p.type) ? place(a.country) : esc(t.name);
  const sub = pr ? esc(proofTitle(pr)) : d.home ? `QG · ${place(s.player)}` : ['contacts', 'influence', 'authorize'].includes(p.type) ? 'Appui permanent dans le pays' : place(a.country);
  const level = o.chance >= 70 ? 'high' : o.chance >= 50 ? 'mid' : 'low';
  const gainOk = E.missionExposure(a,p.type,true),gainKo = E.missionExposure(a,p.type,false);
  const factors = [[`${STAT_NAMES[o.stat]} ${a.stats[o.stat]}`, 'stat'], ...o.explanations.filter(x => !/Renfort/.test(x)).map(x => [x.replace('Coopération des autorités · ', 'Autorités ').replace(/-(\d)/, '−$1'), /[−-]\s?\d/.test(x) ? 'neg' : 'pos'])];
  const costs = [['clock', 'Durée', `${o.duration} t.`, ''], ['case', 'Crédits', p.boost ? `−${E.ECONOMY.boostCost}` : '0', p.boost ? 'gold' : ''], ['bolt', 'Énergie', `−${o.fatigue * o.duration}`, 'neg'], ['eye', 'Exposition', gainOk === gainKo ? `+${gainOk}` : `+${gainOk} / +${gainKo}`, gainKo || gainOk ? 'neg' : '']];
  const isNew = !root.querySelector('.agent-tooltip');
  const el = root.querySelector('.agent-tooltip') || document.createElement('section');
  el.className = `agent-tooltip ${isNew && !calm() ? 'enter' : ''}`; el.id = 'agent-action-card'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', `${d.name} avec ${a.name}`);
  el.innerHTML = `<div class="tt">
   <header class="tt-head"><span class="tt-kicker">${esc(d.name)}</span><button class="tooltip-close" aria-label="Fermer la fiche">×</button></header>
   <div class="tt-target"><strong>${esc(a.name)} · Énergie ${100-a.fatigue}/100 · Exposition ${a.exposure}</strong><strong>${what}</strong><small>${sub}</small></div>
   ${d.safe ? '<div class="tt-odds high"><b>Auto</b><span>réussite garantie</span></div>' : `<div class="tt-odds ${level}"><b data-count="${o.chance}">${p.shown ?? o.chance}</b><span>%</span><i class="bar"><b style="width:${o.chance}%"></b></i></div>`}
   <p class="tt-effect">${esc(d.desc)}</p>
   <ul class="tt-factors">${factors.map(([x, c]) => `<li class="${c}">${esc(x)}</li>`).join('')}</ul>
   <dl class="tt-costs">${costs.map(([ic, k, v, c]) => `<div class="${c}"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
   ${o.clandestine ? '<p class="tt-warn">Sans mandat : −15 et risque de capture</p>' : ''}
   ${d.safe ? '' : `<label class="tt-boost ${p.boost ? 'on' : ''} ${!p.boost && !canBoost ? 'off' : ''}"><input type="checkbox" ${p.boost ? 'checked' : ''} ${!p.boost && !canBoost ? 'disabled' : ''}><span class="switch" aria-hidden="true"></span><span class="ico" aria-hidden="true">⚡</span><span class="lbl"><b>Renfort</b><small>${E.ECONOMY.boostCost} crédits</small></span><em>+${base.boostGain} %</em></label>`}
   <button class="tt-go" data-assign ${blockedBy ? 'disabled' : ''}>${blockedBy ? esc(blockedBy) : `<span>Affecter</span><b>${esc(a.name)}</b><i aria-hidden="true">›</i>`}</button>
  </div>`;
  if (!el.isConnected) root.append(el);
  if (isNew) el.addEventListener('animationend', () => el.classList.remove('enter'), {once: true});
  // Le pourcentage défile vers sa nouvelle valeur quand on coche le renfort.
  const num = el.querySelector('[data-count]');
  if (num && p.shown != null && p.shown !== o.chance && !calm()) {
    const from = p.shown, to = o.chance, t0 = performance.now();
    num.parentElement.classList.add('bump');
    const step = now => { const k = Math.min(1, (now - t0) / 380), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); num.textContent = v; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  } else if (num) num.textContent = o.chance;
  p.shown = o.chance;
  el.onpointerleave = e => { if (!popover?.pinned && e.relatedTarget !== popover?.anchor && !popover?.anchor.contains(e.relatedTarget)) hidePopover(false); };
  el.onfocusout = e => { if (popover && e.relatedTarget && !el.contains(e.relatedTarget) && e.relatedTarget !== popover.anchor) hidePopover(false); };
  el.querySelector('.tooltip-close').onclick = () => hidePopover(true);
  const box = el.querySelector('input');
  if (box) box.onchange = e => { p.boost = e.target.checked; p.pinned = true; const keepTop = root.querySelector('.app').scrollTop; drawPopover(); root.querySelector('.app').scrollTop = keepTop; positionPopover(); root.querySelector('.agent-tooltip input')?.focus({preventScroll: true}); };
  el.querySelector('[data-assign]').onclick = () => {
    const btn = el.querySelector('[data-assign]'), end = s.turn + o.duration - 1;
    btn.disabled = true;
    if (blockedBy) return;
    const request = {id: a.id, type: p.type, target, useCredits: !!p.boost};
    Promise.resolve().then(() => ctx.assign(request))
      .then(() => { hidePopover(false); refreshBureau(); if (dialog.open) notify(`${a.name} affecté : ${d.name}. Résolution à la fin du tour ${end}.`); })
      .catch(err => { btn.disabled = false; notify(err.message); });
  };
  positionPopover();
  requestAnimationFrame(positionPopover);
}
// Au-dessus du portrait et collée à lui : on glisse du portrait à la fiche sans la perdre.
function positionPopover() {
  if (!popover) return;
  const card = root.querySelector('.agent-tooltip');
  if (!card) return;
  const bounds=dialog.getBoundingClientRect(),width=Math.min(760,bounds.width-32);
  card.style.width=width+'px';card.style.maxHeight=Math.max(160,bounds.height-32)+'px';
  card.classList.remove('below');card.style.left=(bounds.left+Math.max(16,(bounds.width-width)/2))+'px';card.style.top=(bounds.top+16)+'px';

}
function notify(message) {
  clearTimeout(toastTimer);
  root.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = message;
  root.append(el);
  toastTimer = setTimeout(() => el.remove(), 4200);
}

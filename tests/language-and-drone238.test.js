import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {ACTIONS, TALENTS} from '../dist/client/data.js';
import {cooperationInfo} from '../dist/client/cooperation.js';
import {agentReason, caseOf} from '../dist/client/bureau.js';
import {countryOperationsMarkup} from '../dist/client/country-operations.js';
import {inquiryActionInputs, inquiryCandidate} from '../dist/client/country-inquiry.js';
import {actionResources} from '../dist/client/presentation.js';
import {technologyPanel} from '../dist/client/technology-ui.js';
import {actionRow, wikiPanel} from '../dist/client/wiki.js';

const fresh = () => E.createGame('FR', ['p0', 'p12', 'p13', 'p14'], 42);
const languageActions = {
 contacts: 'contacts',
 collect: 'enquete',
 authorize: 'diplomatie',
 findSafehouse: 'infiltration',
 equip: 'contacts',
 influence: 'diplomatie',
 intimidate: 'combat',
};

test('Languages adds exactly five points on seven foreign actions and stacks with the other talent', () => {
 const s = fresh(), t = E.knownTargets(s)[0], [a] = E.team(s);
 a.country = t.country;
 a.stats = [5, 5, 5];
 s.factions.FR.access[t.country] = true;
 assert.deepEqual(Object.keys(ACTIONS).filter(type => ACTIONS[type].talents.includes('langues')), Object.keys(languageActions));

 for (const [type, talent] of Object.entries(languageActions)) {
  const target = ['collect', 'intimidate'].includes(type) ? t.id : null;
  a.talents = [];
  const base = E.options(s, a.id, type, target);
  if (['contacts', 'influence', 'authorize'].includes(type)) {
   assert.equal(base.rawChance, 50 + (type === 'authorize' ? cooperationInfo(s, a.faction, a.country).mandate : 0), type);
  }
  assert.doesNotMatch(base.explanations.join(' '), /Langue −5/);
  a.talents = ['langues'];
  assert.equal(E.options(s, a.id, type, target).rawChance, base.rawChance + 5, type);
  a.talents = [talent, 'langues'];
  assert.equal(E.options(s, a.id, type, target).rawChance, base.rawChance + 15, type);
  assert.match(actionRow(type)[1], /Langues étrangères : \+5/);
  assert.ok(TALENTS.langues[1].includes(ACTIONS[type].name));
 }
 const candidate = inquiryCandidate(s, t, 'intimidate', a);
 const html = inquiryActionInputs('intimidate', candidate);
 assert.match(html, /Combat \+10/);
 assert.equal((html.match(/Langues étrangères \+5/g) || []).length, 1);

 assert.ok(!E.options(s, a.id, 'surveil', t.id).talents.includes('langues'));
 a.country = a.faction;
 assert.ok(!E.options(s, a.id, 'collect', t.id).talents.includes('langues'));
 assert.doesNotMatch(wikiPanel('stats'), /−5 sans le talent/);
});

test('Drone specialists can launch at full capacity and use zero slots in the engine and pop-ups', () => {
 const s = fresh(), t = E.knownTargets(s)[0], [protection, ordinary, specialist] = E.team(s);
 ordinary.country = specialist.country = t.country;
 ordinary.talents = [];
 specialist.talents = ['drones'];
 specialist.stats = [...ordinary.stats];
 E.assign(s, protection.id, 'protect');
 E.assign(s, ordinary.id, 'drone', t.id);
 assert.equal(E.getTechSlots(s, s.player), 2);

 const target = caseOf(s, t.id);
 assert.equal(agentReason(s, target, 'locate', 'drone', specialist), '');
 const regular = E.options(s, ordinary.id, 'drone', t.id);
 const expert = E.options(s, specialist.id, 'drone', t.id);
 assert.equal(expert.error, null);
 assert.match(expert.explanations.join(' '), /Talents \+10/);
 assert.equal(expert.rawChance, regular.rawChance + 10);
 assert.match(actionResources('drone', ordinary), /Module · 1 place/);
 assert.match(actionResources('drone', specialist), /Aucun module requis · Drones/);
 assert.match(inquiryActionInputs('drone', inquiryCandidate(s, t, 'drone', specialist)), /Aucun module requis · Drones/);
 assert.match(countryOperationsMarkup(s, t.country, {group: 'access', type: 'drone', agent: specialist.id}), /Aucun module requis · Drones/);
 assert.match(wikiPanel('support'), /Avec Drones : 0 place/);

 E.assign(s, specialist.id, 'drone', t.id);
 assert.equal(E.getTechSlots(s, s.player), 2);
 const occupied = technologyPanel(s, s.player);
 assert.equal((occupied.match(/console-slot occupied/g) || []).length, 2);
 assert.doesNotMatch(occupied, new RegExp(specialist.name));
 E.cancel(s, specialist.id);
 assert.equal(E.getTechSlots(s, s.player), 2);

 E.cancel(s, ordinary.id);
 E.activateTech(s, 'ai');
 assert.throws(() => E.assign(s, ordinary.id, 'drone', t.id), /modules d’opération sont occupés/i);
 E.assign(s, specialist.id, 'drone', t.id);
 specialist.task.chance = 100;
 s.humanFactions = Object.keys(s.factions);
 E.advance(s);
 assert.equal(specialist.task, null);
 assert.ok(s.factions.FR.access[t.country]);
 assert.ok(E.locationExpiry(s, 'FR', t.id) >= s.turn);
});

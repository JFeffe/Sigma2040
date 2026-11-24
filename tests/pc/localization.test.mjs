import assert from 'node:assert/strict';
import test from 'node:test';
import { BUILD_VERSION } from '../../resources/app/client/build-version.js';
import { ACTIONS, ROSTER, SUSPECTS, TECH } from '../../resources/app/client/data.js';

const client = name => import('../../resources/app/client/' + name + '.js?v=' + BUILD_VERSION);
const { setGameLanguage, translateText, formatText } = await client('localization');

test('English exposes accurate order names and descriptions, preserving agents and targets', () => {
  setGameLanguage('en');
  try {
    assert.equal(translateText('Se reposer au QG'), 'Rest at HQ');
    assert.equal(translateText('Molette : zoom'), 'Scroll to zoom');
    assert.equal(translateText('Pays cible'), 'Target country');
    assert.equal(translateText('Comprendre le soutien gouvernemental'), 'Government support rules');
    assert.equal(translateText('Résultat 2 sur 3'), 'Result 2 of 3');
    assert.equal(translateText('Tensions mondiales : crise +3.'), 'Global tensions increased the crisis level by 3.');
    assert.equal(formatText('{0} tour pour agir', 1), '1 turn to act');
    assert.equal(formatText('{0} tours pour agir', 3), '3 turns to act');
    assert.equal(
      translateText('Menace détectée : Déstabilisation financière en Turquie, prévue à la fin du tour 3. Protégez le pays ou démantelez la Cellule JANUS.'),
      'Threat detected: Financial destabilization in Turkey, scheduled for the end of turn 3. Protect the country or dismantle JANUS Cell.'
    );
    assert.equal(translateText('Turquie'), 'Turkey');
    assert.equal(translateText('L’Architecte'), 'The Architect');
    for (const { name } of [...ROSTER, ...SUSPECTS]) {
      if (name !== 'L’Architecte') assert.equal(translateText(name), name);
    }
    for (const { desc } of [...Object.values(ACTIONS), ...Object.values(TECH)]) {
      const english = translateText(desc);
      assert.notEqual(english, desc);
      assert.doesNotMatch(english, /\b(?:unmanage|tour\(s\)|d'energy|with jet)\b/i);
    }
  } finally {
    setGameLanguage('fr');
  }
});

test('Compound mission logs, risks and tooltips are translated together', () => {
  setGameLanguage('en');
  try {
    assert.equal(translateText('Dé à 20 faces : ÉCHEC'), '20-sided die (FAILURE)');
    assert.equal(translateText('Coopération des autorités · Soutien total +5'), 'Cooperation with local authorities · Full support +5');
    assert.equal(translateText('IRIS : voyager sous passeport, échec. Aucune progression.'), 'IRIS: Travel with a passport, failure. No progress.');
    assert.equal(translateText('« Sur place. Liaison établie. »'), '“On the spot. Link established.”');
    assert.equal(translateText('✕ Attaque réussie'), '✕ Attack succeeded');
    assert.equal(
      translateText('75 % sans nouvelle blessure ni capture, 17,5 % de blessure, 7,5 % de capture.'),
      '75% chance of neither further injury nor capture, 17.5% chance of injury, 7.5% chance of capture.'
    );
  } finally {
    setGameLanguage('fr');
  }
});

test('Windows confirmations use the selected game language and await the player’s choice', async () => {
  const { confirmInGame } = await client('dialog-behavior');
  const original = globalThis.shadowMandatePC;
  const calls = [];
  let respond;
  globalThis.shadowMandatePC = {
    confirm(text, language) {
      calls.push({ text, language });
      return new Promise(resolve => { respond = resolve; });
    }
  };
  setGameLanguage('en');
  try {
    const question = 'Sauvegarder et fermer la session ? Les invités seront déconnectés.';
    const result = confirmInGame(question);
    assert.deepEqual(calls, [{ text: 'Save and close the session? Guests will be disconnected.', language: 'en' }]);
    assert.equal(await confirmInGame(question), false);
    respond(true);
    assert.equal(await result, true);
    setGameLanguage('fr');
    const french = confirmInGame(question);
    assert.deepEqual(calls.at(-1), { text: question, language: 'fr' });
    respond(false);
    assert.equal(await french, false);
  } finally {
    setGameLanguage('fr');
    if (original === undefined) delete globalThis.shadowMandatePC;
    else globalThis.shadowMandatePC = original;
  }
});

test('the PC menu exposes recovery status and links to saves via Options', async () => {
  const { mainMenu } = await client('main-menu');
  const html = mainMenu(null, { desktop: true, saveStatus: 'Campagne à récupérer' });
  assert.match(html, /Campagne à récupérer/);
  assert.match(html, /data-cmd="options"/);
  assert.match(mainMenu(null, { desktop: true, options: true }), /data-cmd="save-menu"/);
  assert.match(html, /data-cmd="quit-game"/);
  assert.doesNotMatch(html, /data-cmd="(?:mp-entry|save-menu)"/);
});

test('the release badge formats correctly and the history retains the previous build', async () => {
  const { menuChromeMarkup } = await client('main-menu');
  const { patchNotesPage, PATCH_NOTES } = await client('patch-notes');
  setGameLanguage('en');
  try {
    assert.equal(PATCH_NOTES[0].version, BUILD_VERSION);
    assert.ok(PATCH_NOTES.some(release => release.version === '240'));
    assert.match(menuChromeMarkup(true), new RegExp('class="menu-build">BUILD ' + BUILD_VERSION + '<'));
    assert.equal([...menuChromeMarkup(false).matchAll(/data-cmd="menu-back"/g)].length, 1);
    assert.equal(translateText('Retour'), 'Back');
    const page = patchNotesPage();
    assert.match(page, new RegExp('UNREAD · LATEST UPDATE · VERSION ' + BUILD_VERSION));
    assert.doesNotMatch(page, /Q VERSION|VERSION\d{3}/);
  } finally {
    setGameLanguage('fr');
  }
});

test('English save cards show the country, turn, restore and delete controls', async () => {
  const { saveScreen, saveDeletionConfirmation } = await client('save-ui');
  const { emptyCampaignSlots } = await client('campaign-slots');
  setGameLanguage('en');
  try {
    const record = { status: 'ready', player: 'FR', turn: 7, savedAt: Date.UTC(2026, 10, 21) };
    const slots = emptyCampaignSlots();
    slots[0] = { current: { status: 'invalid' }, previous: record };
    slots[2].current = record;
    const html = saveScreen(slots);
    assert.equal([...html.matchAll(/data-save-slot=/g)].length, 4);
    assert.match(html, /<h3>Slot 4<\/h3>/);
    assert.match(html, /France<\/strong> <span>· Turn 7<\/span>/);
    assert.match(html, /<time datetime="2026-11-21T00:00:00.000Z"/);
    assert.match(html, /data-cmd="save-restore"/);
    assert.equal([...html.matchAll(/data-cmd="save-delete"/g)].length, 2);
    assert.doesNotMatch(html, /data-cmd="(?:save-export[^"]*|import|export)"|id="saveFile"/);
    const confirmation = saveDeletionConfirmation(0, slots[0], true);
    assert.match(confirmation, /Supprimer cette sauvegarde \?/);
    assert.match(confirmation, /La copie de récupération sera aussi supprimée\./);
    assert.match(confirmation, /La campagne ouverte sera fermée\./);
    assert.equal(translateText('Supprimer cette sauvegarde ?'), 'Delete this save?');
  } finally {
    setGameLanguage('fr');
  }
});


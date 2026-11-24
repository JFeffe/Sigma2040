import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import storeModule from '../../resources/app/campaign-store.cjs';
import * as E from '../../resources/app/client/engine.js';
import { createCampaignSaves, firstFreeCampaignSlot } from '../../resources/app/client/campaign-slots.js';

const { createCampaignStore, createCampaignSlotStore } = storeModule;

async function fixture(t) {
  const parent = await fs.realpath(os.tmpdir());
  const directory = await fs.mkdtemp(path.join(parent, 'shadow-mandate-saves-'));
  t.after(async () => {
    const resolved = await fs.realpath(directory);
    assert.equal(path.dirname(resolved), parent);
    assert.match(path.basename(resolved), /^shadow-mandate-saves-/);
    await fs.rm(resolved, { recursive: true, force: true });
  });
  return { directory, store: createCampaignStore(directory, E.validateSave) };
}

function campaign(seed = 42) {
  return E.createGame('FR', ['p0', 'p12', 'p13', 'p14'], seed);
}

test('autosaves keep the last valid turn while orders change in the current turn', async t => {
  const { directory, store } = await fixture(t);
  const state = campaign(), initial = JSON.stringify(state);
  assert.deepEqual(await store.read(), { current: { status: 'missing' }, previous: { status: 'missing' } });
  await store.write(initial);

  E.assign(state, 'p0', 'rest');
  const turnOne = JSON.stringify(state);
  const saved = await store.write(turnOne);
  assert.equal((await store.read()).previous.raw, initial);

  E.advance(state);
  const turnTwo = JSON.stringify(state);
  await store.write(turnTwo);
  E.assign(state, 'p0', 'rest');
  const updated = JSON.stringify(state);
  await store.write(updated);
  await store.write(updated);

  const slots = await createCampaignStore(directory, E.validateSave).read();
  assert.equal(slots.current.raw, updated);
  assert.equal(slots.previous.raw, turnOne);
  assert.ok(Math.abs(slots.previous.savedAt - saved.savedAt) < 1000);
  assert.equal(slots.current.turn, 2);
  assert.equal(slots.previous.turn, 1);
});

test('an invalid primary is reported and an explicitly chosen recovery stays intact', async t => {
  const { directory, store } = await fixture(t);
  const first = JSON.stringify(campaign(41));
  await store.write(first);
  await store.write(JSON.stringify(campaign(42)));
  const primary = path.join(directory, 'campaign.json');
  await fs.writeFile(primary, 'bad JSON', 'utf8');

  const slots = await store.read();
  assert.equal(slots.current.status, 'invalid');
  assert.equal(slots.previous.raw, first);
  assert.equal(await fs.readFile(primary, 'utf8'), 'bad JSON');
  await assert.rejects(store.restore(JSON.stringify(campaign(43))), /Recovery copy changed/);
  await store.restore(first);
  assert.equal((await store.read()).current.raw, first);
  assert.equal((await store.read()).previous.raw, first);
});

test('rapid saves and an explicit import commit in order', async t => {
  const { store } = await fixture(t);
  const state = campaign(), first = JSON.stringify(state);
  E.assign(state, 'p0', 'rest');
  const second = JSON.stringify(state);
  E.assign(state, 'p12', 'rest');
  const third = JSON.stringify(state);

  await Promise.all([store.write(first), store.write(second), store.write(third, true)]);
  await store.flush();
  const slots = await store.read();
  assert.equal(slots.current.raw, third);
  assert.equal(slots.previous.raw, second);
  await assert.rejects(store.write('bad JSON'));
  assert.deepEqual(await store.read(), slots);
});

test('failure to replace the current file leaves the recovery copy available', async t => {
  const { directory, store } = await fixture(t);
  const first = JSON.stringify(campaign(41));
  await store.write(first);
  await store.write(JSON.stringify(campaign(42)));
  const primary = path.join(directory, 'campaign.json');
  await fs.unlink(primary);
  await fs.mkdir(primary);

  await assert.rejects(store.restore(first));
  const slots = await store.read();
  assert.equal(slots.previous.raw, first);
  assert.equal(slots.previous.status, 'ready');
  assert.ok((await fs.readdir(directory)).every(name => !name.endsWith('.tmp')));
});

test('writing after an unreadable campaign does not replace the valid fallback', async t => {
  const { directory, store } = await fixture(t);
  const first = JSON.stringify(campaign(41));
  await store.write(first);
  await store.write(JSON.stringify(campaign(42)));
  await fs.writeFile(path.join(directory, 'campaign.json'), 'bad JSON');
  const fresh = JSON.stringify(campaign(43));
  await store.write(fresh, true);
  const slots = await store.read();
  assert.equal(slots.current.raw, fresh);
  assert.equal(slots.previous.raw, first);
});

test('four PC slots keep legacy files and isolate each campaign, checkpoint and conflicting write', async t => {
  const { directory, store: legacy } = await fixture(t);
  const first = JSON.stringify(campaign(42));
  await legacy.write(first);

  const store = createCampaignSlotStore(directory, E.validateSave);
  assert.equal((await store.read())[0].current.raw, first);
  const otherCampaigns = [campaign(43), campaign(44), campaign(45)];
  await Promise.all(otherCampaigns.map((state, index) => store.write(JSON.stringify(state), false, index + 1, null)));
  const before = await store.read();
  assert.deepEqual(before.map(slot => slot.current.seed), [42, 43, 44, 45]);

  const third = otherCampaigns[1];
  E.advance(third);
  const raw = JSON.stringify(third);
  await store.write(raw, false, 2, before[2].current.raw);
  await assert.rejects(store.write(first, false, 2, before[2].current.raw), /Campaign slot changed/);
  assert.throws(() => store.write(first, false, 4), /Invalid campaign slot/);
  await store.flush();

  const after = await createCampaignSlotStore(directory, E.validateSave).read();
  assert.deepEqual(after.map(slot => slot.current.seed), [42, 43, 44, 45]);
  assert.deepEqual(after.map(slot => slot.current.turn), [1, 1, 2, 1]);
  assert.equal(after[2].current.raw, raw);
  assert.equal(after[2].previous.raw, before[2].current.raw);
  assert.equal(await fs.readFile(path.join(directory, 'campaign.json'), 'utf8'), first);
});

test('deleting a slot rejects stale confirmations and clears the slot and its recovery file', async t => {
  const { directory } = await fixture(t);
  const store = createCampaignSlotStore(directory, E.validateSave);
  const other = JSON.stringify(campaign(41));
  await store.write(other, false, 1, null);
  await store.write(JSON.stringify(campaign(42)), false, 0, null);
  const before = await store.read();
  await store.write(JSON.stringify(campaign(43)), true, 0, before[0].current.raw);

  await assert.rejects(store.remove(0, before[0]), /Campaign slot changed/);
  const slots = await store.read();
  assert.equal(slots[0].current.seed, 43);
  assert.equal(slots[0].previous.seed, 42);
  await store.remove(0, slots[0]);

  const after = await createCampaignSlotStore(directory, E.validateSave).read();
  assert.deepEqual(after[0], { current: { status: 'missing' }, previous: { status: 'missing' } });
  assert.equal(after[1].current.raw, other);
});

test('deleting the migrated active campaign prevents a queued autosave or legacy load from recreating it', async t => {
  const { directory } = await fixture(t);
  const files = createCampaignSlotStore(directory, E.validateSave);
  const store = { readCampaigns: files.read, writeCampaign: files.write, deleteCampaign: files.remove };
  let legacy = campaign();
  const saves = createCampaignSaves(store, E.validateSave, () => legacy, () => { legacy = null; });
  const loaded = await saves.load();
  assert.equal(saves.activeSlot, 0);

  const removing = saves.remove(0, saves.slots[0]);
  const autosaving = saves.update(loaded);
  assert.equal(await removing, true);
  await autosaving;
  assert.equal(await saves.load(), null);
});

test('a fifth campaign only replaces the confirmed slot and rejects stale slot snapshots', async t => {
  const { directory } = await fixture(t);
  const store = createCampaignSlotStore(directory, E.validateSave);
  const empty = await store.read();
  const firstFour = [41, 42, 43, 44].map(seed => JSON.stringify(campaign(seed)));
  await Promise.all(firstFour.map((raw, slot) => store.write(raw, true, slot, empty[slot])));
  const fifth = JSON.stringify(campaign(50));
  await assert.rejects(store.write(fifth, true, 1, empty[1]), /Campaign slot changed/);
  const full = await store.read();
  assert.equal(firstFreeCampaignSlot(full), -1);
  assert.deepEqual(full.map(slot => slot.current.raw), firstFour);

  // A recovery file can change independently while the primary still matches the confirmation.
  const checkpoint = JSON.stringify(campaign(45));
  await fs.writeFile(path.join(directory, 'slot-3', 'campaign.previous.json'), checkpoint);
  await assert.rejects(store.write(fifth, true, 2, full[2]), /Campaign slot changed/);
  const updated = await store.read();
  assert.equal(updated[2].previous.raw, checkpoint);
  await store.write(fifth, true, 2, updated[2]);

  const after = await store.read();
  assert.deepEqual(after.map(slot => slot.current.raw), [firstFour[0], firstFour[1], fifth, firstFour[3]]);
  assert.equal(after[2].previous.raw, firstFour[2]);
});


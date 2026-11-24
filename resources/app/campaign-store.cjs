'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const MAX_CAMPAIGN_BYTES = 8 * 1024 * 1024;

function matchesSaveRecord(actual, expected) {
  return actual.status === expected?.status && actual.raw === expected.raw && actual.savedAt === expected.savedAt;
}

function createCampaignStore(directory, validateSave) {
  const currentFile = path.join(directory, 'campaign.json');
  const previousFile = path.join(directory, 'campaign.previous.json');
  let pending = Promise.resolve();

  function queue(operation) {
    const result = pending.then(operation);
    pending = result.catch(() => {});
    return result;
  }

  function describe(raw, savedAt) {
    if (typeof raw !== 'string' || Buffer.byteLength(raw) > MAX_CAMPAIGN_BYTES) {
      throw new Error('Invalid campaign size');
    }
    const state = validateSave(JSON.parse(raw));
    return {
      status: 'ready', raw, savedAt, player: state.player, turn: state.turn,
      seed: state.seed, gameMode: state.gameMode, ended: state.ended,
    };
  }

  async function readSlot(file) {
    let raw, savedAt;
    try {
      const entry = await fs.open(file, 'r');
      try {
        const stat = await entry.stat();
        if (!stat.isFile() || stat.size > MAX_CAMPAIGN_BYTES) return { status: 'invalid' };
        savedAt = stat.mtimeMs;
        raw = await entry.readFile('utf8');
      } finally {
        await entry.close();
      }
    } catch (error) {
      return { status: error.code === 'ENOENT' ? 'missing' : 'unavailable' };
    }
    try {
      return describe(raw, savedAt);
    } catch {
      return { status: 'invalid' };
    }
  }

  async function replaceFile(file, entry) {
    await fs.mkdir(directory, { recursive: true });
    const temporary = file + '.' + randomUUID() + '.tmp';
    try {
      const handle = await fs.open(temporary, 'wx');
      try {
        await handle.writeFile(entry.raw, 'utf8');
        await handle.utimes(entry.savedAt / 1000, entry.savedAt / 1000);
        await handle.sync();
      } finally {
        await handle.close();
      }
      await fs.rename(temporary, file);
    } finally {
      await fs.rm(temporary, { force: true }).catch(() => {});
    }
  }

  return {
    read: () => queue(async () => {
      const [current, previous] = await Promise.all([readSlot(currentFile), readSlot(previousFile)]);
      return { current, previous };
    }),
    write: (raw, checkpoint = false, expected) => queue(async () => {
      const next = describe(raw, Date.now());
      const current = await readSlot(currentFile);
      const previous = expected && typeof expected === 'object' ? await readSlot(previousFile) : null;
      if (current.status === 'unavailable' || previous?.status === 'unavailable') throw new Error('Campaign storage unavailable');
      const matches = previous
        ? matchesSaveRecord(current, expected.current) && matchesSaveRecord(previous, expected.previous)
        : expected === undefined || expected === (current.raw ?? null);
      if (!matches) throw new Error('Campaign slot changed');
      if (current.status === 'ready') {
        if (current.raw === raw) return current;
        const advance = current.turn !== next.turn || current.seed !== next.seed || current.player !== next.player;
        if (checkpoint === true || advance || (previous ?? await readSlot(previousFile)).status !== 'ready') {
          await replaceFile(previousFile, current);
        }
      }
      await replaceFile(currentFile, next);
      return next;
    }),
    restore: (expected, expectedCurrent) => queue(async () => {
      const previous = await readSlot(previousFile);
      if (previous.status !== 'ready' || previous.raw !== expected) throw new Error('Recovery copy changed');
      const current = await readSlot(currentFile);
      if (current.status === 'unavailable') throw new Error('Campaign storage unavailable');
      if (expectedCurrent !== undefined && expectedCurrent !== (current.raw ?? null)) throw new Error('Campaign slot changed');
      // Keep the independent recovery file intact, including if replacing the current file fails.
      await replaceFile(currentFile, previous);
      return previous;
    }),
    remove: expected => queue(async () => {
      const [current, previous] = await Promise.all([readSlot(currentFile), readSlot(previousFile)]);
      for (const [key, record] of Object.entries({ current, previous })) {
        if (record.status === 'unavailable' || !matchesSaveRecord(record, expected?.[key])) {
          throw new Error('Campaign slot changed or unavailable');
        }
      }
      // If removing the recovery copy fails, the playable campaign is still intact.
      await fs.rm(previousFile, { force: true });
      await fs.rm(currentFile, { force: true });
    }),
    flush: () => pending,
  };
}

function createCampaignSlotStore(directory, validateSave) {
  // The existing campaign and its recovery file are already the first slot.
  const slots = Array.from({ length: 4 }, (_, index) =>
    createCampaignStore(index ? path.join(directory, 'slot-' + (index + 1)) : directory, validateSave));
  function requireSlot(index) {
    if (!Number.isInteger(index) || !slots[index]) throw new Error('Invalid campaign slot');
    return slots[index];
  }
  return {
    read: () => Promise.all(slots.map(slot => slot.read())),
    write: (raw, checkpoint, index = 0, expected) => requireSlot(index).write(raw, checkpoint, expected),
    restore: (raw, index = 0, expected) => requireSlot(index).restore(raw, expected),
    remove: (index, expected) => requireSlot(index).remove(expected),
    flush: () => Promise.all(slots.map(slot => slot.flush())),
  };
}

module.exports = { createCampaignStore, createCampaignSlotStore };

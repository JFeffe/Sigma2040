export const CAMPAIGN_SLOT_COUNT = 4;
export const MAX_CAMPAIGN_BYTES = 8 * 1024 * 1024;

export function isCampaignSlot(slot) {
  return Number.isInteger(slot) && slot >= 0 && slot < CAMPAIGN_SLOT_COUNT;
}

export function emptyCampaignSlots(status = 'missing') {
  return Array.from({ length: CAMPAIGN_SLOT_COUNT }, () => ({
    current: { status },
    previous: { status: 'missing' },
  }));
}

export function firstFreeCampaignSlot(slots) {
  return slots.findIndex(({ current, previous }) => current.status === 'missing' && previous.status === 'missing');
}

export function latestCampaignSlot(slots) {
  return slots.reduce((latest, { current }, slot) => {
    if (current.status !== 'ready') return latest;
    return latest < 0 || current.savedAt > slots[latest].current.savedAt ? slot : latest;
  }, -1);
}

export function canDeleteCampaignSlot({ current, previous }) {
  return current.status !== 'unavailable' && previous.status !== 'unavailable'
    && (current.status !== 'missing' || previous.status !== 'missing');
}

function matchesSaveRecord(actual, expected) {
  return actual.status === expected?.status && actual.raw === expected.raw && actual.savedAt === expected.savedAt;
}

function storageSlotSnapshot(snapshot) {
  // An unreadable legacy campaign can occupy slot 1 before it is migrated.
  return snapshot?.current?.legacy ? { ...snapshot, current: { status: 'missing' } } : snapshot;
}

export function createBrowserCampaignStore(validateSave) {
  let connection;
  const previous = { status: 'missing' };

  function database() {
    connection ??= new Promise((resolve, reject) => {
      const request = indexedDB.open('shadow-mandate-2040-campaigns', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('slots', { keyPath: 'slot' });
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          connection = undefined;
        };
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    }).catch(error => {
      connection = undefined;
      throw error;
    });
    return connection;
  }

  async function transaction(mode, request, handle) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('slots', mode);
      const store = tx.objectStore('slots');
      let value, error;
      tx.oncomplete = () => resolve(value);
      tx.onabort = () => reject(error ?? tx.error);
      request(store).onsuccess = event => {
        try {
          value = handle(event.target.result, store);
        } catch (cause) {
          error = cause;
          tx.abort();
        }
      };
    });
  }

  function describe(record) {
    if (!record) return { status: 'missing' };
    try {
      const state = validateSave(JSON.parse(record.raw));
      if (!Number.isFinite(record.savedAt) || !Number.isFinite(new Date(record.savedAt).getTime())) return { status: 'invalid' };
      return {
        status: 'ready', raw: record.raw, savedAt: record.savedAt,
        player: state.player, turn: state.turn, seed: state.seed, gameMode: state.gameMode, ended: state.ended,
      };
    } catch {
      return { status: 'invalid' };
    }
  }

  return {
    readCampaigns: () => transaction('readonly', store => store.getAll(), records => {
      const slots = emptyCampaignSlots();
      for (const record of records) {
        if (isCampaignSlot(record.slot)) slots[record.slot].current = describe(record);
      }
      return slots;
    }),
    async writeCampaign(raw, _checkpoint, slot = 0, expected) {
      if (!isCampaignSlot(slot) || typeof raw !== 'string' || new Blob([raw]).size > MAX_CAMPAIGN_BYTES) {
        throw new Error('Invalid campaign or slot');
      }
      const record = { slot, raw, savedAt: Date.now() };
      const next = describe(record);
      if (next.status !== 'ready') throw new Error('Invalid campaign');
      return transaction('readwrite', store => store.get(slot), (saved, store) => {
        const current = describe(saved);
        const matches = expected && typeof expected === 'object'
          ? matchesSaveRecord(current, expected.current) && matchesSaveRecord(previous, expected.previous)
          : expected === undefined || expected === (current.raw ?? null);
        if (!matches) throw new Error('Campaign slot changed');
        if (current.raw === raw) return current;
        store.put(record);
        return next;
      });
    },
    deleteCampaign(slot, expected) {
      if (!isCampaignSlot(slot)) throw new Error('Invalid campaign slot');
      return transaction('readwrite', store => store.get(slot), (saved, store) => {
        const current = describe(saved);
        if (!matchesSaveRecord(current, expected?.current) || !matchesSaveRecord(previous, expected?.previous)) {
          throw new Error('Campaign slot changed');
        }
        store.delete(slot);
      });
    },
  };
}

export function createCampaignSaves(store, validateSave, readLegacy, forgetLegacy) {
  let slots = emptyCampaignSlots();
  let active = null;
  let pending = Promise.resolve();
  let hasLegacyError = false;

  function queue(task) {
    const result = pending.then(task);
    pending = result.catch(() => {});
    return result;
  }

  async function refresh() {
    await pending;
    try {
      slots = await store.readCampaigns();
      if (hasLegacyError && firstFreeCampaignSlot(slots) === 0) slots[0].current = { status: 'invalid', legacy: true };
    } catch {
      slots = emptyCampaignSlots('unavailable');
    }
  }

  function select(slot) {
    const record = slots[slot]?.current;
    if (record?.status !== 'ready') return null;
    const campaign = validateSave(JSON.parse(record.raw));
    active = { slot, raw: record.raw };
    return campaign;
  }

  async function load() {
    active = null;
    await refresh();
    const unavailable = slots.every(({ current }) => current.status === 'unavailable');
    if (firstFreeCampaignSlot(slots) === 0 || unavailable) {
      let legacy;
      try {
        legacy = readLegacy();
      } catch {
        hasLegacyError = true;
        if (!unavailable) slots[0].current = { status: 'invalid', legacy: true };
      }
      if (legacy) {
        if (unavailable) {
          active = { slot: 0, raw: null };
          return legacy;
        }
        try {
          slots[0].current = await store.writeCampaign(JSON.stringify(legacy), false, 0, { ...slots[0] });
        } catch {
          // Another tab may have migrated the same campaign before this write.
          await refresh();
          if (latestCampaignSlot(slots) < 0) {
            active = { slot: 0, raw: null };
            return legacy;
          }
        }
      }
    }
    return select(latestCampaignSlot(slots));
  }

  function update(campaign) {
    if (!active) return Promise.resolve();
    const selection = active;
    const raw = JSON.stringify(campaign);
    return queue(async () => {
      if (active !== selection) return;
      const current = await store.writeCampaign(raw, false, selection.slot, selection.raw);
      selection.raw = current.raw;
      slots[selection.slot].current = current;
    });
  }

  function replace(campaign, slot, expected, recoveryRaw) {
    return queue(async () => {
      const current = recoveryRaw === undefined
        ? await store.writeCampaign(JSON.stringify(campaign), true, slot, storageSlotSnapshot(expected))
        : await store.restoreCampaign(recoveryRaw, slot, expected);
      slots[slot].current = current;
      active = { slot, raw: current.raw };
    });
  }

  function remove(slot, expected) {
    return queue(async () => {
      await store.deleteCampaign(slot, storageSlotSnapshot(expected));
      if (slot === 0) {
        forgetLegacy?.();
        hasLegacyError = false;
      }
      slots[slot] = { current: { status: 'missing' }, previous: { status: 'missing' } };
      const wasActive = active?.slot === slot;
      if (wasActive) active = null;
      return wasActive;
    });
  }

  return {
    get slots() { return slots; },
    get activeSlot() { return active?.slot; },
    refresh,
    load,
    select,
    update,
    replace,
    remove,
  };
}

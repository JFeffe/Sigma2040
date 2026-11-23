// Keys used by campaigns and preferences before the game's public name changed.
const previousPrefixes = [
  ['shadow-mandate-2040-', 'sigma2040-'],
  ['shadow-mandate-', 'sigma-'],
];

export function legacyStorageKey(key) {
  const prefix = previousPrefixes.find(([current]) => key.startsWith(current));
  return prefix ? prefix[1] + key.slice(prefix[0].length) : key;
}

export function readStorageItem(storage, key) {
  const value = storage?.getItem(key);
  if (value != null) return value;
  const previousKey = legacyStorageKey(key);
  return previousKey === key ? null : storage?.getItem(previousKey) ?? null;
}

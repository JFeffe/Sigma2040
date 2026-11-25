import {legacyStorageKey,readStorageItem} from './storage-keys.js?v=246';

export const CAMPAIGN_KEY='shadow-mandate-2040-campaign-v1';
export const ECONOMY_BACKUP_KEY='shadow-mandate-2040-before-free-actions-v82';
// Keep the original bytes before the next autosave migrates the campaign.
// If preserving them fails, let the caller report the storage error instead of overwriting them.
export function readCampaign(storage,validate){
 const raw=readStorageItem(storage,CAMPAIGN_KEY);if(!raw)return null;
 const parsed=JSON.parse(raw),legacy=parsed.economyRules===undefined;
 const state=validate(parsed);
 if(legacy&&!readStorageItem(storage,ECONOMY_BACKUP_KEY))storage.setItem(ECONOMY_BACKUP_KEY,raw);
 return state;
}

export function forgetLegacyCampaign(storage){
 try{
  storage?.removeItem(CAMPAIGN_KEY);
  storage?.removeItem(legacyStorageKey(CAMPAIGN_KEY));
 }catch{}
}

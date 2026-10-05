export const exposureLevel=a=>Math.min(4,Math.floor(Math.max(0,a.exposure)/20));
export const exposureLabel=a=>['Discret','Repérable','Surveillé','Compromis','Très exposé'][exposureLevel(a)];
export const exposurePenalty=(a,type='arrest')=>['sneak','arrest','rescue','blackmail'].includes(type)?[0,0,6,9,12][exposureLevel(a)]:['collect','surveil','prepare','hack'].includes(type)?[0,0,0,5,10][exposureLevel(a)]:0;
export const activeSightings=(s,f=s.player)=>Object.entries(s.factions[f].publicAgents||{}).filter(([,a])=>a.source==='counter'&&a.until>=s.turn).map(([id,a])=>({id,...a}));

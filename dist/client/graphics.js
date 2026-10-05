const KEY='sigma2040-graphics-quality';
export const GRAPHICS={ '1080p':{width:1920,height:1080,terrain:640},'1440p':{width:2560,height:1440,terrain:800},'4k':{width:3840,height:2160,terrain:1200} };
let quality='1080p';try{const saved=localStorage.getItem(KEY);if(Object.hasOwn(GRAPHICS,saved))quality=saved;}catch{}
export const graphicsQuality=()=>quality;
export const terrainLimit=()=>GRAPHICS[quality].terrain;
export function renderRatio(width,height,dpr=globalThis.devicePixelRatio||1,mode=quality){const p=GRAPHICS[mode]||GRAPHICS['1080p'];if(!(width>0&&height>0))return 1;const landscape=width>=height;return Math.min(Math.max(.1,Number(dpr)||1),(landscape?p.width:p.height)/width,(landscape?p.height:p.width)/height);}
export function applyGraphics(){if(typeof document!=='undefined')document.documentElement.dataset.graphics=quality;}
export function setGraphicsQuality(value){quality=Object.hasOwn(GRAPHICS,value)?value:'1080p';try{localStorage.setItem(KEY,quality);}catch{}applyGraphics();if(typeof window!=='undefined')window.dispatchEvent(new Event('graphicschange'));}
export function graphicsMarkup(){return `<section class="feedback-settings"><h3>Qualité graphique</h3><label for="graphicsQuality">Résolution du globe et des effets</label><select id="graphicsQuality">${[['1080p','1080p · Fluide (par défaut)'],['1440p','1440p · Équilibré'],['4k','4K · Haute qualité']].map(([id,label])=>`<option value="${id}" ${quality===id?'selected':''}>${label}</option>`).join('')}</select><p>Sur un écran 4K, choisissez 1080p pour alléger le rendu. Les textes et menus restent nets à la résolution de votre écran. Application immédiate, réglage conservé sur cet appareil.</p></section>`;}

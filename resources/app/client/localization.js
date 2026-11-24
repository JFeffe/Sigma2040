import {readPreference,writePreference} from './browser-preferences.js?v=243';
import {ENGLISH_MESSAGES} from './locale-en.js?v=243';

const LANGUAGE_KEY='shadow-mandate-2040-language';
let language=readPreference(LANGUAGE_KEY)==='en'?'en':'fr';
const normalize=text=>text.normalize('NFC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const slot=/\{(\d+)\}/g;
const slotWithoutGroups=/\{\d+\}/g;
const escapeRegex=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const words=/[\p{L}\p{N}]+/gu;
const textAttributes=['title','aria-label','aria-description','aria-valuetext','alt','placeholder','data-label'];
const skipElements='[translate="no"],[contenteditable="true"],script,style,textarea,template,noscript';
let lookup;
const cache=new Map();

export const gameLanguage=()=>language;

export function setGameLanguage(value){
 if((value!=='fr'&&value!=='en')||value===language)return false;
 language=value;
 writePreference(LANGUAGE_KEY,value);
 return true;
}

function createLookup(){
 const exact=new Map(),byCase=new Map(),byWord=new Map(),withoutWord=[];
 for(const [french,english] of Object.entries(ENGLISH_MESSAGES)){
  const key=normalize(french),slots=[...key.matchAll(slot)];
  if(!slots.length){
   exact.set(key,english);
   if(key!==key.toUpperCase())byCase.set(key.toLowerCase(),english);
   continue;
  }
  const parts=key.split(slotWithoutGroups);
  if(parts.slice(1,-1).includes(''))continue;
  const anchors=parts.flatMap((part,i)=>[...part.matchAll(words)].filter(word=>
   word[0].length>1&&(i===0||word.index>0)&&(i===parts.length-1||word.index+word[0].length<part.length)
  ).map(word=>word[0]));
  const anchor=anchors.sort((a,b)=>b.length-a.length)[0];
  const pattern={
   regex:new RegExp('^'+parts.map(escapeRegex).join('(.*?)')+'$','u'),
   english,
   slots:slots.map(match=>match[1]),
   weight:parts.join('').length
  };
  if(anchor){
   if(!byWord.has(anchor))byWord.set(anchor,[]);
   byWord.get(anchor).push(pattern);
  }else if(/[\p{L}]{2}/u.test(parts.join('')))withoutWord.push(pattern);
 }
 return {exact,byCase,byWord,withoutWord};
}

function translate(key,depth=0){
 lookup??=createLookup();
 if(lookup.exact.has(key))return lookup.exact.get(key);
 if(depth>=4||!/[\p{L}]{2}/u.test(key))return key;
 const lower=key.toLowerCase(),english=lookup.byCase.get(lower);
 if(english&&key===key.toUpperCase())return english.toUpperCase();
 if(english&&key===lower)return english;
 const quoted=key.match(/^«\s*(.+?)\s*»$/u);
 if(quoted)return "“"+translate(quoted[1],depth+1)+"”";
 const marker=key.match(/^([—–✓✕↻•]+) (.+)$/u);
 if(marker)return marker[1]+" "+translate(marker[2],depth+1);
 const candidates=new Set(lookup.withoutWord);
 for(const word of key.matchAll(words))for(const pattern of lookup.byWord.get(word[0])||[])candidates.add(pattern);
 for(const pattern of [...candidates].sort((a,b)=>b.weight-a.weight)){
  const match=pattern.regex.exec(key);
  if(!match)continue;
  const values=new Map(pattern.slots.map((id,i)=>[id,match[i+1]]));
  const translated=pattern.english.replace(slot,(placeholder,id)=>{
   const value=values.get(id);
   return value===undefined?placeholder:translate(value,depth+1);
  });
  if(translated!==key)return translated;
 }
 // Some reports are assembled from several independently displayed labels.
 const pieces=key.split(/( · | — | \/ | \| | ; |, )/u);
 if(pieces.length>1)return pieces.map((piece,i)=>i%2?piece:translate(piece,depth+1)).join('');
 const sentences=key.split(/(?<=[.!?…]) (?=[\p{L}])/u);
 if(sentences.length>1)return sentences.map(sentence=>translate(sentence,depth+1)).join(' ');
 const beforePeriod=key.endsWith('.')?lookup.exact.get(key.slice(0,-1)):null;
 if(beforePeriod)return beforePeriod+'.';
 return key.replace(/\b[Ll]'Architecte\b/g,name=>name[0]==='L'?'The Architect':'the Architect');
}

export function translateText(text){
 if(language!=='en'||typeof text!=='string')return text;
 const key=normalize(text);
 if(!key)return text;
 if(cache.size>=8192)cache.clear();
 if(!cache.has(key))cache.set(key,translate(key));
 const english=cache.get(key).replace(/(\d),(\d+)(?=\s*%)/g,'$1.$2');
 return english===key?text:text.replace(/\S[\s\S]*\S|\S/u,()=>english);
}

export function formatText(template,...values){
 const pattern=language==='en'?(ENGLISH_MESSAGES[template]??template):template;
 return pattern.replace(slot,(placeholder,id)=>values[id]??placeholder);
}

function translateNode(node){
 if(node.nodeType===1){
  if(node.matches(skipElements))return;
  for(const attr of textAttributes){
   if(!node.hasAttribute(attr))continue;
   const source=node.getAttribute(attr),label=translateText(source);
   if(label!==source)node.setAttribute(attr,label);
  }
  if(node.localName==='option'){
   if(node.hasAttribute('label'))node.label=translateText(node.label);
   const source=node.textContent,label=translateText(source);
   if(label!==source){
    const value=node.value;
    node.textContent=label;
    if(!node.hasAttribute('value'))node.value=value;
   }
   return;
  }
 }else if(node.nodeType===3){
  const label=translateText(node.data);
  if(label!==node.data)node.data=label;
  return;
 }
 for(let child=node.firstChild;child;child=child.nextSibling)translateNode(child);
}

// Localize only at display boundaries. Logs, orders and save data keep their original values.
export function localizeContent(root){
 if(root&&language==='en')translateNode(root);
}

export function setLocalizedHTML(root,html){
 root.innerHTML=html;
 localizeContent(root);
}

export function languageSettingsMarkup(){
 return `<section class="feedback-settings"><h3 id="gameLanguageLabel">Langue du jeu</h3>
  <select id="gameLanguage" aria-labelledby="gameLanguageLabel">
   <option lang="fr" translate="no" value="fr" ${language==='fr'?'selected':''}>Français</option>
   <option lang="en" translate="no" value="en" ${language==='en'?'selected':''}>English</option>
  </select>
 </section>`;
}

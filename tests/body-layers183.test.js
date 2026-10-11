import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fullBody} from '../dist/client/visuals.js';
import {DISPLAY_ROSTER} from '../dist/client/data.js';
import {recruitCard,recruitDetails} from '../dist/client/recruit-selection.js';
import {BUILD_VERSION} from '../dist/client/build-version.js';

const additions=[['p27','link'],['p29','monroe'],['p30','tara'],['p28','viktor']];
const updates=[['p0','iris'],['p12','bishop'],['p13','amber'],['p14','lei'],['p15','apero'],['p16','mira'],['p17','midnight'],['p18','mercer'],['p19','marlowe'],['p20','nox'],['p21','adler'],['p22','dante'],['p23','selin'],['p24','rocket'],['p25','alba'],['p26','raven']];
const layered=[...additions,...updates];
const originalHashes={
  "link-full.webp": "6eb57fe308fdfcb59138b372e47eac7bd2e2a70382b0daf677c92b149e129499",
  "link-portrait.webp": "6001004c8d0b9046878577afb6785e6aac9931f834518bfc948cfc34495a888c",
  "monroe-full.webp": "9ff13ee350d55507d56c153c3d9b98ce5be9f117a7fc99a0fa5cb100723d980e",
  "monroe-portrait.webp": "8ed2bcedd57e3048543c1e2a9081e631ecc6c0d830b2e8ab856ec6d6a60b5b28",
  "tara-full.webp": "5414721825420c58c9d8c72aa2b352086d4a4f2dff8b831bd94cc77519bee112",
  "tara-portrait.webp": "900e572c5e1227c5188274f8aa6357565ce41323d35d3ec39ac17f11c33463ef",
  "viktor-full.webp": "bced8b89432e7e625d42526fada199b2847676d807ddc420d99baad1e295d33e",
  "viktor-portrait.webp": "fa5a1de800257d45bb73df82223c0f5b2d81974f0a0db0cabc5f6a3d1c395f42",
  "agent-full-background.png": "b379eaabba6c0cb73c46582944f556fac6c68c89f17349c1944821ee6d936a10"
};
test('Twenty full bodies keep an identical background frame behind each centered character',()=>{
 const reference=fullBody(DISPLAY_ROSTER.find(a=>a.id===layered[0][0]));
 const commonFrame=reference.match(/viewBox="([^"]+)"/)[1];
 const commonBackground=reference.match(/<image\b[^>]*>/)[0];
 for(const [id,slug] of layered){
  const agent=DISPLAY_ROSTER.find(a=>a.id===id);
  for(const a of [agent,{...agent,id:`FR:${id}`,templateId:id}]){
   const markup=fullBody(a),images=[...markup.matchAll(/<image\b[^>]*>/g)].map(m=>m[0]);
   assert.equal(images.length,2);
   assert.equal(markup.match(/viewBox="([^"]+)"/)[1],commonFrame,a.name);
   assert.equal(images[0],commonBackground,a.name);
   assert.match(images[0],new RegExp(`agent-full-background.png\\?v=${BUILD_VERSION}`));
   assert.match(images[1],new RegExp(`${slug}-full${updates.some(([key])=>key===id)?'-transparent':''}.webp\\?v=${BUILD_VERSION}`));
   for(const image of images)assert.match(image,/width="1024" height="1536"/);
   assert.match(markup,/preserveAspectRatio="xMidYMid meet"/);
  }
  assert.match(recruitCard(agent,[]),/agent-body-background/);
  assert.match(recruitDetails(id),/agent-body-foreground/);
 }
});
test('The supplied background and all eight original character images remain byte-identical',()=>{
 for(const [filename,hash] of Object.entries(originalHashes)){
  const bytes=readFileSync(new URL(`../dist/client/assets/${filename}`,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,filename);
 }
});
test('Legacy artwork outside the current roster retains its fallback rendering',()=>{
 const markup=fullBody({id:'legacy-agent',name:'Agent historique',portrait:0});
 assert.doesNotMatch(markup,/agent-full-background/);
 assert.match(markup,/agent-bodies.png/);
 assert.equal([...markup.matchAll(/<image\b/g)].length,1);
});
test('The current cache version is used throughout the updated runtime module graph',()=>{
 const dir=new URL('../dist/client/',import.meta.url);
 for(const filename of readdirSync(dir).filter(f=>/\.(js|css|html)$/.test(f))){
  const source=readFileSync(new URL(filename,dir),'utf8');
  assert.doesNotMatch(source,/\?v=182\b/,filename);
 }
});

import test from 'node:test';import assert from 'node:assert/strict';

function mockMusicPlayback({autoplay=true}={}){
 const nodes=[],handlers={};
 let frame,preference,allowed=autoplay;
 globalThis.localStorage={getItem:()=>null,setItem:(k,v)=>{preference=JSON.parse(v);}};
 globalThis.document={hidden:false,body:{append:a=>nodes.push(a)},querySelectorAll:()=>[],addEventListener:(key,fn)=>{handlers[key]=fn;}};
 globalThis.requestAnimationFrame=fn=>{frame=fn;};
 globalThis.Audio=class{
  constructor(){this.paused=true;this.currentTime=0;this.duration=100;this.readyState=4;this.ended=false;this.attempts=0;}
  setAttribute(){}
  addEventListener(){}
  async play(){
   this.attempts++;
   if(!allowed)throw new DOMException('Autoplay denied','NotAllowedError');
   this.paused=false;
  }
  pause(){this.paused=true;}
 };
 return {nodes,handlers,draw:now=>frame(now),savedPreference:()=>preference,allowPlayback:()=>{allowed=true;}};
}

test('Music starts with the opening track, crossfades and remembers volume without duplicate players',async()=>{
 const {nodes,handlers,draw,savedPreference}=mockMusicPlayback();
 const m=await import('../dist/client/music.js');
 assert.equal(m.musicGain(100),.5);assert.equal(m.musicGain(0),0);assert.ok(m.musicGain(10)<m.musicGain(20));
 m.initMusic();
 await Promise.resolve();
 assert.equal(nodes.length,2);assert.equal(nodes[0].paused,false);
 assert.ok(Math.abs(nodes[0].volume-.02)<1e-8);assert.equal(nodes[1].volume,0);
 assert.equal(nodes[0].src,'./assets/music/ticking-shadows.mp3');
 await m.nextTrack();for(let n=1;n<=20;n++)draw(n*100);assert.ok(nodes[0].volume>0&&nodes[1].volume>0);assert.ok(Math.abs(nodes[0].volume**2+nodes[1].volume**2-.0004)<.0001);
 m.setMusic('enabled',false);assert.ok(nodes.every(a=>a.paused));m.setMusic('enabled',true);await Promise.resolve();for(let n=21;n<=65;n++)draw(n*100);assert.ok(nodes[0].paused);assert.ok(Math.abs(nodes[1].volume-.02)<1e-8);
 m.setMusic('volume',35);assert.ok(Math.abs(nodes[1].volume-.06125)<1e-8);assert.equal(savedPreference().volume,35);
 document.hidden=true;handlers.visibilitychange();assert.ok(nodes.every(a=>a.paused));document.hidden=false;handlers.visibilitychange();await Promise.resolve();assert.equal(nodes[1].paused,false);assert.equal(nodes.length,2);
});

test('When the browser blocks autoplay, the first click starts the same opening track',async()=>{
 const {nodes,handlers,allowPlayback}=mockMusicPlayback({autoplay:false});
 const m=await import('../dist/client/music.js?autoplay-blocked');
 m.initMusic();
 await Promise.resolve();
 assert.equal(nodes[0].attempts,1);
 assert.equal(nodes[0].paused,true);

 allowPlayback();
 handlers.click();
 await Promise.resolve();
 assert.equal(nodes.length,2);
 assert.equal(nodes[0].attempts,2);
 assert.equal(nodes[0].paused,false);
 assert.equal(nodes[0].src,'./assets/music/ticking-shadows.mp3');
});

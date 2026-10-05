import test from 'node:test';import assert from 'node:assert/strict';
test('Music defaults to 20%, crossfades, pauses and remembers volume without duplicate players',async()=>{
 const nodes=[],handlers={};let frame;globalThis.localStorage={getItem:()=>null,setItem:(k,v)=>{globalThis.savedMusic=JSON.parse(v);}};
 globalThis.document={hidden:false,body:{append:a=>nodes.push(a)},querySelectorAll:()=>[],addEventListener:(key,fn)=>{handlers[key]=fn;}};globalThis.requestAnimationFrame=fn=>{frame=fn;};
 globalThis.Audio=class{constructor(){this.paused=true;this.currentTime=0;this.duration=100;this.readyState=4;this.ended=false;this.events={};}setAttribute(){}addEventListener(key,fn){this.events[key]=fn;}async play(){this.paused=false;}pause(){this.paused=true;}};
 const m=await import('../dist/client/music.js');assert.equal(m.musicGain(100),.5);assert.equal(m.musicGain(0),0);assert.ok(m.musicGain(10)<m.musicGain(20));m.initMusic();assert.equal(nodes.length,0);await m.startMusic();assert.equal(nodes.length,2);assert.ok(Math.abs(nodes[0].volume-.02)<1e-8);assert.equal(nodes[1].volume,0);
 await m.nextTrack();for(let n=1;n<=20;n++)frame(n*100);assert.ok(nodes[0].volume>0&&nodes[1].volume>0);assert.ok(Math.abs(nodes[0].volume**2+nodes[1].volume**2-.0004)<.0001);
 m.setMusic('enabled',false);assert.ok(nodes.every(a=>a.paused));m.setMusic('enabled',true);await Promise.resolve();for(let n=21;n<=65;n++)frame(n*100);assert.ok(nodes[0].paused);assert.ok(Math.abs(nodes[1].volume-.02)<1e-8);
 m.setMusic('volume',35);assert.ok(Math.abs(nodes[1].volume-.06125)<1e-8);assert.equal(globalThis.savedMusic.volume,35);
 document.hidden=true;handlers.visibilitychange();assert.ok(nodes.every(a=>a.paused));document.hidden=false;handlers.visibilitychange();await Promise.resolve();assert.equal(nodes[1].paused,false);assert.equal(nodes.length,2);
});

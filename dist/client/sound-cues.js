const tone=(frequency,at,duration,level=.11,wave='sine',end=frequency,attack=.015)=>
 ({frequency,at,duration,level,wave,end,attack});
const noise=(frequency,at,duration,level,end=frequency,attack=.004)=>
 tone(frequency,at,duration,level,'noise',end,attack);
const signal=frequencies=>frequencies.map((hz,index)=>tone(hz,index*.1,.15));

const cues={
 transmission:signal([620,790]),
 alert:signal([420,300]),
 discovery:signal([650,880,1050]),
 'turn-end':[
  noise(1450,0,.065,.16,650),
  tone(136,.025,.18,.17,'triangle',80,.004),
  tone(254,.06,.12,.08,'sine',200,.004),
 ],
 imminent:[
  tone(156,0,.16,.19,'triangle',116,.01),
  tone(156,.24,.17,.19,'triangle',116,.01),
 ],
 intercepted:[
  noise(800,0,.08,.12,420),
  tone(132,0,.15,.16,'triangle',73,.005),
  tone(740,.09,.23,.15,'sine',740,.018),
 ],
 'logo-assembled':[
  noise(2300,0,.055,.115,1400,.009),
  noise(4300,.035,.047,.18,2300),
  tone(184,.035,.15,.125,'triangle',85,.004),
  tone(960,.035,.12,.085,'sine',670,.003),
 ],
};

let context,noiseBuffer,freeAt=0,lastKind,lastStart=-Infinity;

function createNoise(){
 const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.1),context.sampleRate);
 const samples=buffer.getChannelData(0);
 for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
 return buffer;
}

function playLayer(layer,start,volume){
 const {frequency,duration,level,wave,end,attack}=layer;
 const gain=context.createGain();
 let source,filter;
 if(wave==='noise'){
  noiseBuffer??=createNoise();
  source=context.createBufferSource();source.buffer=noiseBuffer;
  filter=context.createBiquadFilter();filter.type='bandpass';filter.Q.value=1.2;
  filter.frequency.setValueAtTime(frequency,start);
  filter.frequency.exponentialRampToValueAtTime(end,start+duration);
  source.connect(filter);filter.connect(gain);
 }else{
  source=context.createOscillator();source.type=wave;
  source.frequency.setValueAtTime(frequency,start);
  if(end!==frequency)source.frequency.exponentialRampToValueAtTime(end,start+duration);
  source.connect(gain);
 }
 gain.gain.setValueAtTime(0,start);
 gain.gain.linearRampToValueAtTime(Math.max(.0001,volume*level),start+attack);
 gain.gain.exponentialRampToValueAtTime(.0001,start+duration-.02);
 gain.connect(context.destination);
 source.start(start);source.stop(start+duration);
 source.onended=()=>{source.disconnect();filter?.disconnect();gain.disconnect();};
}

export function playSound(kind,volume){
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
 const layers=cues[kind];
 if(!Audio||!layers)return;
 try{
  context??=new Audio();
  if(context.state==='suspended'){
   // Avoid queuing the intro sound for a much later interaction on autoplay-blocked pages.
   if(globalThis.navigator?.userActivation?.hasBeenActive===false)return;
   context.resume().catch(()=>{});
  }
  const now=context.currentTime;
  if(kind===lastKind&&['transmission','alert','discovery'].includes(kind)&&now-lastStart<.3)return;
  const start=Math.max(now,freeAt);
  if(start-now>1.15)return;
  for(const layer of layers)playLayer(layer,start+layer.at,volume);
  freeAt=start+Math.max(...layers.map(layer=>layer.at+layer.duration))+.035;
  lastStart=start;lastKind=kind;
 }catch{}
}

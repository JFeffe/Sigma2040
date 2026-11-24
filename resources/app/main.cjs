'use strict';
const {app,BrowserWindow,protocol,session,net,dialog,ipcMain}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const {createCampaignSlotStore}=require('./campaign-store.cjs');
const scheme='shadow-mandate';
const appURL=scheme+'://game/index.html';
const relay=new URL('https://sigma-2040.docile-hero-2836.chatgpt.site/api/relay');
const maxRelayBytes=300_000;
protocol.registerSchemesAsPrivileged([{scheme,privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,codeCache:true}}]);
app.setName('Shadow Mandate');
app.setAppUserModelId('com.shadowmandate.game');
const explicit=process.env.LOCALAPPDATA;
const appData=process.platform==='win32'&&explicit&&path.isAbsolute(explicit)?explicit:app.getPath('appData');
const profile=path.join(appData,'Shadow Mandate');
fs.mkdirSync(profile,{recursive:true});
app.setPath('userData',profile);

let window,store,gameLanguage,quitPending=false,quitReady=false;
const isLanguage=value=>value==='fr'||value==='en';
const usesEnglish=()=>gameLanguage?gameLanguage==='en':app.getLocale().startsWith('en');
function showGameError(french,english,detail=''){
  dialog.showErrorBox('Shadow Mandate',(usesEnglish()?english:french)+(detail?'\n'+detail:''));
}
function isGameURL(value){
  try{
    const url=new URL(value);
    return url.protocol===scheme+':'&&url.host==='game'&&!url.username&&!url.password;
  }catch{return false;}
}
function relayError(error,status){
  return Response.json({error},{status,headers:{'cache-control':'no-store'}});
}
async function requestRelay(request){
  if(request.method!=='POST')return relayError('Méthode non autorisée.',405);
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return relayError('Message invalide.',415);
  if(Number(request.headers.get('content-length'))>maxRelayBytes)return relayError('Message trop volumineux.',413);
  try{
    const body=await request.arrayBuffer();
    if(body.byteLength>maxRelayBytes)return relayError('Message trop volumineux.',413);
    const upstream=await fetch(relay,{
      method:'POST',headers:{'content-type':'application/json',origin:relay.origin},
      body,redirect:'error',signal:AbortSignal.timeout(10_000)
    });
    if(!upstream.headers.get('content-type')?.includes('application/json'))return relayError('Réponse inattendue du relais multijoueur.',502);
    return new Response(upstream.body,{
      status:upstream.status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
    });
  }catch{return relayError('Relais multijoueur indisponible. Vérifiez votre connexion Internet.',503);}
}
function fromGame(event){
  if(!window||event.sender!==window.webContents||!event.senderFrame||event.senderFrame.parent) return false;
  const url=new URL(event.senderFrame.url);
  return url.protocol===scheme+':'&&url.hostname==='game'&&url.pathname==='/index.html';
}
function installGameCommands(){
  const handlers={
    'shadow-mandate:read-campaigns':()=>store.read(),
    'shadow-mandate:write-campaign':(raw,checkpoint,slot,expected)=>store.write(raw,checkpoint,slot,expected),
    'shadow-mandate:restore-campaign':(raw,slot,expected)=>store.restore(raw,slot,expected),
    'shadow-mandate:confirm':async(message,language)=>{
      if(typeof message!=='string'||message.length>1000||!isLanguage(language))return false;
      const buttons=language==='en'?['Confirm','Cancel']:['Confirmer','Annuler'];
      const {response}=await dialog.showMessageBox(window,{
        type:'question',title:'Shadow Mandate',message,buttons,defaultId:0,cancelId:1,noLink:true
      });
      return response===0;
    },
  };
  for(const [channel,handler] of Object.entries(handlers)){
    ipcMain.handle(channel,(event,...args)=>{
      if(!fromGame(event)||quitPending)throw Error('Command unavailable');
      return handler(...args);
    });
  }
  ipcMain.on('shadow-mandate:language',(event,language)=>{
    if(fromGame(event)&&isLanguage(language))gameLanguage=language;
  });
  ipcMain.on('shadow-mandate:quit',event=>{if(fromGame(event))app.quit();});
}
if(!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
  app.whenReady().then(async()=>{
    const root=path.resolve(__dirname,'client');
    const {validateSave}=await import(pathToFileURL(path.join(root,'engine.js')).href);
    store=createCampaignSlotStore(path.join(profile,'saves'),validateSave);
    installGameCommands();
    const desktop=session.fromPartition('persist:shadow-mandate');
    const clipboardAllowed=(contents,permission,origin)=>
      permission==='clipboard-sanitized-write'&&contents===window?.webContents&&isGameURL(origin)&&isGameURL(contents?.getURL());
    desktop.setPermissionCheckHandler(clipboardAllowed);
    desktop.setPermissionRequestHandler((contents,permission,answer,details)=>answer(clipboardAllowed(contents,permission,details.requestingUrl)));
    desktop.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*','file://*/*']},(_d,cb)=>cb({cancel:true}));
    desktop.protocol.handle(scheme,async request=>{
      try{
        const u=new URL(request.url);
        if(!isGameURL(request.url)) return new Response('Introuvable',{status:404});
        if(u.pathname==='/api/relay') return requestRelay(request);
        if(request.method!=='GET'&&request.method!=='HEAD') return new Response('Méthode interdite',{status:405});
        if(u.pathname.startsWith('/api/')) return new Response('Introuvable',{status:404});
        const decoded=decodeURIComponent(u.pathname);
        const segments=(decoded==='/'?'/index.html':decoded).slice(1).split('/');
        if(segments.some(s=>!s||s.startsWith('.')||/[:\\\x00]/.test(s))) return new Response('Introuvable',{status:404});
        const local=path.join(root,...segments);
        if(!(await fs.promises.stat(local)).isFile()) return new Response('Introuvable',{status:404});
        const fileResponse=await net.fetch(pathToFileURL(local).href,{method:request.method,headers:request.headers,bypassCustomProtocolHandlers:true});
        const headers=new Headers(fileResponse.headers);
        const types={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg'};
        const type=types[path.extname(local).toLowerCase()];
        if(type) headers.set('Content-Type',type);
        if(/\.(?:html|js|css)$/i.test(local)) headers.set('Cache-Control','no-cache');
        headers.set('X-Content-Type-Options','nosniff');
        headers.set('Referrer-Policy','no-referrer');
        return new Response(fileResponse.body,{status:fileResponse.status,statusText:fileResponse.statusText,headers});
      }catch{return new Response('Introuvable',{status:404});}
    });
    const icon=path.join(__dirname,'icon.png');
    window=new BrowserWindow({
      width:1440,height:900,minWidth:840,minHeight:610,title:'Shadow Mandate',autoHideMenuBar:true,
      show:false,backgroundColor:'#0b1220',...(fs.existsSync(icon)?{icon}:{}),
      webPreferences:{session:desktop,preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,devTools:false}
    });
    window.removeMenu();
    window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(scheme+'://game/'))event.preventDefault();});
    window.webContents.on('will-attach-webview',(event)=>event.preventDefault());
    window.webContents.on('render-process-gone',(_event,details)=>{
      if(details.reason!=='clean-exit') showGameError('Le jeu s’est fermé de façon imprévue. Relancez-le pour reprendre votre sauvegarde.',
        'The game closed unexpectedly. Restart it to resume your campaign.');
    });
    window.once('ready-to-show',()=>window.show());
    await window.loadURL(appURL);
  }).catch(err=>{showGameError('Impossible de lancer le jeu. Vérifiez que tous les fichiers du dossier ont été extraits.',
      'Could not start the game. Check that all game files have been extracted.',err.message);app.quit();});
}
app.on('before-quit',event=>{
  if(!store||quitReady)return;
  event.preventDefault();
  if(quitPending)return;
  quitPending=true;
  store.flush().then(()=>{quitReady=true;app.quit();});
});
app.on('window-all-closed',()=>app.quit());

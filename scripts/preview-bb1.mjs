// Dependency-free local preview for PO evaluation. This is not the production
// multiplayer relay; bind to loopback and use a separate browser origin/port.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const root=resolve('dist/client'),port=Number(process.argv[2]||4180);
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2'};
createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}const data=await readFile(file);res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);}catch{res.writeHead(404).end();}}).listen(port,'127.0.0.1',()=>console.log('BB1 preview: http://127.0.0.1:'+port));

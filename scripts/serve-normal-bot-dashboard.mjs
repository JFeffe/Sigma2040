import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.argv[2]||'docs/bots/races/validation'),port=Number(process.argv[3]||4174);
createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/dashboard.html':pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const data=await readFile(file);
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.mjs':'application/javascript','.js':'application/javascript','.css':'text/css','.gz':'application/gzip'}[extname(file)]||'application/octet-stream'));
  res.end(data);
 }catch{res.writeHead(404).end();}
}).listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}/dashboard.html`));

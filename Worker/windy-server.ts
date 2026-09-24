import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
// A process-owned, loopback-only document, not a weather proxy or public web server.
export async function startWindy(key:string, root=join(dirname(fileURLToPath(import.meta.url)),'Windy')) {
 if(!/^[A-Za-z0-9_-]{20,160}$/.test(key))throw new Error('Invalid Windy testing key');
 const token=randomBytes(24).toString('hex');
 const names=new Map([['view.html','text/html; charset=utf-8'],['map.js','text/javascript'],['leaflet.js','text/javascript']]);
 const assets=new Map([...names].map(([name,mime])=>[name,{mime,data:readFileSync(join(root,name))}]));
 const html=assets.get('view.html')!;
 html.data=Buffer.from(html.data.toString().replace('__WINDY_CONFIG__',JSON.stringify({key})));
 const policy="default-src 'none'; script-src 'self' 'unsafe-inline' https://api.windy.com https://*.windy.com; style-src 'self' 'unsafe-inline' https://*.windy.com; img-src 'self' data: blob: https://*.windy.com https://windy.com; connect-src https://*.windy.com https://windy.com; font-src https://*.windy.com data:; worker-src blob:; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; sandbox allow-scripts allow-same-origin";
 const server=createServer((req,res)=>{
  const address=server.address();const port=typeof address==='object'&&address?address.port:0;
  const allowed=req.method==='GET'&&req.headers.host===`127.0.0.1:${port}`&&req.socket.remoteAddress==='127.0.0.1'&&req.url?.startsWith(`/${token}/`);
  const name=allowed?req.url!.slice(token.length+2):'',asset=assets.get(name);
  if(!allowed||!asset){res.writeHead(404,{'Cache-Control':'no-store'});res.end();return}
  res.writeHead(200,{'Content-Type':asset.mime,'Content-Length':asset.data.length,'Content-Security-Policy':policy,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'});res.end(asset.data);
 });
 server.maxConnections=16;server.requestTimeout=5000;server.headersTimeout=5000;server.keepAliveTimeout=1000;
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.off('error',reject);resolve()})});
 const address=server.address();if(!address||typeof address==='string')throw new Error('Map document unavailable');
 return {url:`http://127.0.0.1:${address.port}/${token}/view.html`,close:()=>{server.closeAllConnections();server.close()}};
}

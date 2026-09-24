import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {resolve} from 'node:path';
import {startWindy} from '../windy-server.ts';
const root=resolve('Resources/Windy');
const read=(url,options={})=>new Promise((done,fail)=>{const req=request(url,options,res=>{let data='';res.setEncoding('utf8');res.on('data',chunk=>data+=chunk);res.on('end',()=>done({code:res.statusCode,headers:res.headers,data}))});req.on('error',fail);req.end()});
test('Windy document is bounded to a private loopback path and does not expose keys in its address',async()=>{
 const key='test_key_01234567890123456789',server=await startWindy(key,root);
 try {
  assert(!server.url.includes(key));const response=await read(server.url);assert.equal(response.code,200);assert(response.data.includes(key));
  assert.equal(response.headers['cache-control'],'no-store');assert(response.headers['content-security-policy'].includes('sandbox allow-scripts allow-same-origin'));assert(!response.headers['access-control-allow-origin']);
  assert.equal((await read(new URL('/view.html',server.url))).code,404);
  assert.equal((await read(server.url,{headers:{Host:'malicious.example'}})).code,404);
  assert.equal((await read(server.url,{method:'POST'})).code,404);
  assert.equal((await read(server.url+'?key=x')).code,404);
  assert.equal((await read(new URL('settings.json',server.url))).code,404);
  assert.equal((await read(new URL('map.js',server.url))).code,200);
 } finally {server.close()}
 await assert.rejects(read(server.url));
});
test('Windy key values cannot inject markup or start a server',async()=>{await assert.rejects(startWindy('</script><script>alert(1)',root));await assert.rejects(startWindy('',root))});

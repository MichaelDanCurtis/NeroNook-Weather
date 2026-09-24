import {GET as weather} from './observatory/app/api/weather/route';
import {GET as marine} from './observatory/app/api/marine/route';
import {GET as air} from './observatory/app/api/air/route';
import {GET as alerts} from './observatory/app/api/alerts/route';
import {GET as locations} from './observatory/app/api/locations/route';
import {GET as radar} from './observatory/app/api/radar/route';
import {GET as satellite} from './observatory/app/api/satellite/route';
import {GET as cyclones} from './observatory/app/api/cyclones/route';
import {GET as wind} from './observatory/app/api/wind/route';
import {GET as tides} from './observatory/app/api/tides/route';
import {validPlace} from './observatory/lib/weather';
import {createInterface} from 'node:readline';
const providers=new Set(['api.weather.gov','api.open-meteo.com','marine-api.open-meteo.com','air-quality-api.open-meteo.com','geocoding-api.open-meteo.com','api.met.no','api.rainviewer.com','nowcoast.noaa.gov','www.nhc.noaa.gov','mapservices.weather.noaa.gov','api.tidesandcurrents.noaa.gov']);
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 if(url.protocol!=='https:'||!providers.has(url.hostname)||url.username||url.password||url.port)throw new Error('Unsupported weather provider');
 const response=await nativeFetch(input,{...init,redirect:'error',signal:AbortSignal.any([init?.signal??new AbortController().signal,AbortSignal.timeout(18000)])});
 if(!response.body)return response;
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8_000_000){await reader.cancel();throw new Error('Weather response too large')}chunks.push(value)}
 return new Response(Buffer.concat(chunks),{status:response.status,statusText:response.statusText,headers:response.headers});
};
const feeds={weather,marine,air,alerts,radar,satellite,cyclones,tides,wind};
let active=0;
async function request(m:any){
 if(!m||typeof m.id!=='string'||m.id.length>60)throw new Error('Invalid request');
 if(m.action==='search'){
  if(typeof m.query!=='string'||m.query.trim().length<2||m.query.length>100)throw new Error('Enter a place name');
  const r=await locations(new Request('https://local.invalid/?'+new URLSearchParams({q:m.query})));
  return {id:m.id,feed:'search',ok:r.ok,data:await r.json()};
 }
 if(m.action!=='feed'||!Object.hasOwn(feeds,m.feed)||!validPlace(m.place))throw new Error('Invalid weather request');
 const p=m.place, q=new URLSearchParams({lat:String(p.lat),lon:String(p.lon),country:p.countryCode,tz:p.timezone});
 const r=await feeds[m.feed as keyof typeof feeds](new Request('https://local.invalid/?'+q));
 return {id:m.id,feed:m.feed,ok:r.ok,data:await r.json()};
}
const lines=createInterface({input:process.stdin,crlfDelay:Infinity});
lines.on('line',line=>{if(line.length>16384)return;let m:any;try{m=JSON.parse(line)}catch{return}if(active>=16){process.stdout.write(JSON.stringify({id:m.id,feed:m.feed,ok:false,data:{error:'Weather requests busy. Refresh shortly.'}})+'\n');return}active++;request(m).then(r=>process.stdout.write(JSON.stringify(r)+'\n')).catch(e=>process.stdout.write(JSON.stringify({id:m?.id,feed:m?.feed,ok:false,data:{error:e instanceof Error?e.message:'Feed unavailable'}})+'\n')).finally(()=>active--)});
lines.on('close',()=>process.exit(0));

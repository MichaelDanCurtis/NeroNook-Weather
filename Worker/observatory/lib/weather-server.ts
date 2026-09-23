// The edge cache survives Worker instances; memory alone does not.
export type FeedResult<T>={data:T;fetchedAt:number;stale?:boolean;warning?:string};
type Entry={data:unknown;fetchedAt:number;freshUntil:number;staleUntil:number;lastModified?:string};
type Cooldown={until:number;status:number};
const memory=new Map<string,Entry|Cooldown>();
const pending=new Map<string,Promise<FeedResult<unknown>>>();
const edge=()=>typeof caches==='undefined'?undefined:(caches as CacheStorage&{default?:Cache}).default;
async function keyFor(key:string){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));return 'https://weather-observatory-mcurtis.mdcurtis.chatgpt.site/__feed-cache/v2/'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}
async function read<T>(key:string):Promise<T|undefined>{const saved=memory.get(key);if(saved)return saved as T;try{const r=await edge()?.match(await keyFor(key));if(r)return await r.json() as T}catch{}return undefined}
async function write(key:string,value:Entry|Cooldown,seconds:number){if(memory.size>=256)memory.delete(memory.keys().next().value!);memory.set(key,value);try{await edge()?.put(await keyFor(key),Response.json(value,{headers:{'Cache-Control':`public, max-age=${Math.ceil(seconds)}`}}))}catch{/* Provider availability must not depend on cache availability. */}}
export function providerName(url:string){const host=new URL(url).hostname;return host.endsWith('open-meteo.com')?'Open-Meteo':host==='api.weather.gov'?'NOAA / NWS':host==='api.met.no'?'MET Norway':host.includes('noaa.gov')?'NOAA':host.endsWith('rainviewer.com')?'RainViewer':host.endsWith('usgs.gov')?'USGS':host.endsWith('nasa.gov')?'NASA':host==='celestrak.org'?'CelesTrak':host==='api.adsb.lol'?'ADSB.lol':'Weather provider'}
export function retryDelay(header:string|null,now=Date.now()){if(!header)return 900;const seconds=Number(header);const date=Date.parse(header);return Number.isFinite(seconds)&&seconds>=0?Math.max(1,Math.ceil(seconds)):Number.isFinite(date)?Math.max(1,Math.ceil((date-now)/1000)):900}
export class ProviderError extends Error{status:number;retryAfter:number;constructor(name:string,status:number,retryAfter=60){super(status===429?`${name} is rate-limited. Refreshes are paused for ${Math.ceil(retryAfter/60)} minutes.`:`${name} is temporarily unavailable (${status}).`);this.status=status;this.retryAfter=retryAfter}}
export async function providerFeed<T>(url:string,seconds=300,allowStale=true):Promise<FeedResult<T>>{
 const requestKey=url+":"+allowStale;
 if(pending.has(requestKey))return pending.get(requestKey) as Promise<FeedResult<T>>;
 const request=(async()=>{
  const saved=await read<Entry>(url),now=Date.now();
  if(saved&&saved.freshUntil>now)return {data:saved.data as T,fetchedAt:saved.fetchedAt};
  const name=providerName(url),hostKey='cooldown:'+new URL(url).hostname;
  try{
   const paused=await read<Cooldown>(hostKey);if(paused&&paused.until>now)throw new ProviderError(name,paused.status,Math.ceil((paused.until-now)/1000));
   const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'WeatherObservatory/1.0 (https://weather-observatory-mcurtis.mdcurtis.chatgpt.site)',...(saved?.lastModified?{'If-Modified-Since':saved.lastModified}:{})},signal:AbortSignal.timeout(12000)});
   if(!response.ok&&response.status!==304){const delay=response.status===429?retryDelay(response.headers.get('Retry-After')):60;if(response.status===429){await write(hostKey,{until:Date.now()+delay*1000,status:429},delay);console.warn('Public weather provider rate limited',{provider:name,status:429,retryAfter:delay})}throw new ProviderError(name,response.status,delay)}
   const data=(response.status===304&&saved?saved.data:await response.json()) as T&{error?:unknown};if(data.error)throw new Error(`${name} could not serve this location`);
   const receivedAt=Date.now(),fetchedAt=response.status===304&&saved?saved.fetchedAt:receivedAt;const ttl=Math.max(seconds,(Date.parse(response.headers.get('Expires')||'')-receivedAt)/1000||0);await write(url,{data,fetchedAt,freshUntil:receivedAt+ttl*1000,staleUntil:receivedAt+(ttl+3600)*1000,lastModified:response.headers.get('Last-Modified')||saved?.lastModified},ttl+3600);return {data,fetchedAt};
  }catch(error){if(allowStale&&saved&&saved.staleUntil>Date.now())return {data:saved.data as T,fetchedAt:saved.fetchedAt,stale:true,warning:`${name} refresh unavailable. Showing the last successful data.`};throw error}
 })();pending.set(requestKey,request);try{return await request}finally{pending.delete(requestKey)}
}
// Callers without a stale-data indicator receive only fresh responses.
export async function providerJSON<T>(url:string,seconds=300):Promise<T>{return (await providerFeed<T>(url,seconds,false)).data}
export function coordinates(request:Request){const u=new URL(request.url);const a=u.searchParams.get('lat'),b=u.searchParams.get('lon');const lat=Number(a),lon=Number(b);if(a===null||b===null||a.trim()===''||b.trim()===''||!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180)throw new Error('A valid latitude and longitude are required');return {lat,lon}}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}})}
export function failure(error:unknown){const limited=error instanceof ProviderError&&error.status===429;return Response.json({error:error instanceof Error?error.message:'Weather service unavailable',...(limited?{retryAfter:error.retryAfter}:{})},{status:limited?429:502,headers:{'Cache-Control':'private, no-store',...(limited?{'Retry-After':String(error.retryAfter)}:{})}})}

const computing=new Map<string,Promise<unknown>>();
export async function sharedComputation<T extends {fetchedAt:number}>(key:string,seconds:number,run:()=>Promise<T>):Promise<T&{stale?:boolean;warning?:string}>{
 const cacheKey='computed:'+key;if(computing.has(cacheKey))return computing.get(cacheKey) as Promise<T>;
 const p=(async()=>{const saved=await read<Entry>(cacheKey);if(saved&&saved.freshUntil>Date.now())return saved.data as T;try{const data=await run();const now=Date.now();await write(cacheKey,{data,fetchedAt:data.fetchedAt,freshUntil:now+seconds*1000,staleUntil:now+(seconds+3600)*1000},seconds+3600);return data}catch(error){if(saved&&saved.staleUntil>Date.now())return {...saved.data as T,stale:true,warning:'Refresh unavailable. Showing the previous data.'};throw error}})();computing.set(cacheKey,p);try{return await p}finally{computing.delete(cacheKey)}
}

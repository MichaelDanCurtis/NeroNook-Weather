import {json,failure,sharedComputation} from '@/lib/weather-server';
import {parseSatelliteTimes} from '@/lib/satellite-times';
export async function GET(){try{
 const history=await sharedComputation('satellite-history-v2',300,async()=>{
  const r=await fetch('https://nowcoast.noaa.gov/geoserver/observations/satellite/ows?service=WMS&version=1.3.0&request=GetCapabilities',{headers:{'User-Agent':'WeatherObservatory/1.0 (personal weather display)',Accept:'application/xml'},signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error(`Satellite service unavailable (${r.status})`);
  const times=parseSatelliteTimes(await r.text());return {time:times.at(-1)!,times,fetchedAt:Date.now()};
 });return json(history);
}catch(e){return failure(e)}}

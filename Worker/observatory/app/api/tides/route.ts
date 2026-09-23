import {coordinates,json,failure} from '@/lib/weather-server';
import {tideForecast} from '@/lib/tides';
export async function GET(request:Request){let p;try{p=coordinates(request)}catch{return json({error:'Invalid coordinates'},400)}try{return json(await tideForecast(p.lat,p.lon,new URL(request.url).searchParams.get('station')||undefined))}catch(e){return failure(e)}}

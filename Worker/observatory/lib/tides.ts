import {distanceKm} from './observatories.ts';
import {providerFeed} from './weather-server.ts';
export type TideStation={id:string;name:string;lat:number;lng:number;type:string;distance?:number};
export type TidePoint={time:number;height:number;type?:'H'|'L'};
export type Tides={supported:boolean;station?:TideStation;nearby:TideStation[];curve:TidePoint[];events:TidePoint[];fetchedAt:number;datum:'MLLW';warning?:string;stale?:boolean};
export function nearestTideStations(stations:TideStation[],lat:number,lon:number){return stations.filter(s=>s.type==='R'&&Number.isFinite(s.lat)&&Number.isFinite(s.lng)).map(s=>({...s,distance:distanceKm({lat,lon},{lat:s.lat,lon:s.lng})})).filter(s=>s.distance<=100).sort((a,b)=>a.distance-b.distance).slice(0,8)}
export function parseTides(rows:{t:string;v:string;type?:string}[]):TidePoint[]{return rows.map(p=>({time:Date.parse(p.t.replace(' ','T')+'Z')/1000,height:Number(p.v),...(p.type==='H'||p.type==='L'?{type:p.type as 'H'|'L'}:{})})).filter(p=>Number.isFinite(p.time)&&Number.isFinite(p.height)).sort((a,b)=>a.time-b.time)}
export async function tideForecast(lat:number,lon:number,stationId?:string):Promise<Tides>{
 const catalog=await providerFeed<{stations:TideStation[]}>('https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions',86400);
 const nearby=nearestTideStations(catalog.data.stations,lat,lon),station=stationId?nearby.find(s=>s.id===stationId):nearby[0];
 if(stationId&&!station)throw new Error('Choose a nearby reference tide station');
 if(!station)return {supported:false,nearby,curve:[],events:[],fetchedAt:Date.now(),datum:'MLLW'};
 const today=Math.floor(Date.now()/86400000)*86400000,date=(t:number)=>new Date(t).toISOString().slice(0,10).replaceAll('-','');
 const params=new URLSearchParams({product:'predictions',application:'WeatherObservatory',begin_date:date(today),end_date:date(today+3*86400000),datum:'MLLW',station:station.id,time_zone:'gmt',units:'metric',format:'json'});
 const [curve,events]=await Promise.all(['6','hilo'].map(interval=>providerFeed<{predictions:{t:string;v:string;type?:string}[]}>(`https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${params}&interval=${interval}`,21600)));
 if(!curve.data.predictions?.length||!events.data.predictions?.length)throw new Error('Tide predictions unavailable for this station');
 return {supported:true,station,nearby,curve:parseTides(curve.data.predictions),events:parseTides(events.data.predictions),fetchedAt:Math.min(curve.fetchedAt,events.fetchedAt),datum:'MLLW',stale:curve.stale||events.stale,warning:curve.warning||events.warning};
}

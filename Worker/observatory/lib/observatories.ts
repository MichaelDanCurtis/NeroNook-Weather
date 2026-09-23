import {ISLANDS,numeric,type Place,type Marine,type ObservatoryMode} from './weather.ts';
export const MOUNTAINS:Place[]=[
{name:'Seattle',region:'Washington',country:'United States',countryCode:'US',lat:47.6062,lon:-122.3321,timezone:'America/Los_Angeles',elevation:56},
{name:'Snoqualmie Pass',region:'Washington Cascades',country:'United States',countryCode:'US',lat:47.4229,lon:-121.4137,timezone:'America/Los_Angeles',elevation:923},
{name:'Stevens Pass',region:'Washington Cascades',country:'United States',countryCode:'US',lat:47.7448,lon:-121.089,timezone:'America/Los_Angeles',elevation:1238},
{name:'Crystal Mountain',region:'Washington Cascades',country:'United States',countryCode:'US',lat:46.935,lon:-121.474,timezone:'America/Los_Angeles',elevation:1341},
{name:'Mount Baker',region:'Washington Cascades',country:'United States',countryCode:'US',lat:48.862,lon:-121.655,timezone:'America/Los_Angeles',elevation:1280},
];
export const WORLD_PLACES:Place[]=[
{name:'Tarifa',region:'Andalusia',country:'Spain',countryCode:'ES',lat:36.0143,lon:-5.6044,timezone:'Europe/Madrid'},
{name:'Cape Town',region:'Western Cape',country:'South Africa',countryCode:'ZA',lat:-33.9258,lon:18.4232,timezone:'Africa/Johannesburg'},
{name:'Chamonix',region:'French Alps',country:'France',countryCode:'FR',lat:45.9237,lon:6.8694,timezone:'Europe/Paris',elevation:1035},
{name:'Queenstown',region:'Otago',country:'New Zealand',countryCode:'NZ',lat:-45.0312,lon:168.6626,timezone:'Pacific/Auckland',elevation:310},
];
export const PRESET_PLACES=[...ISLANDS,...MOUNTAINS,...WORLD_PLACES];
export function placeWeatherMode(place:Place,marine?:Marine|null):ObservatoryMode{
 const mountains=[...MOUNTAINS,...WORLD_PLACES.filter(p=>p.name==='Chamonix'||p.name==='Queenstown')];
 if(mountains.some(p=>distanceKm(place,p)<5)||(numeric(place.elevation)&&place.elevation>=700))return 'mountain';
 const coasts=[...ISLANDS,...WORLD_PLACES.filter(p=>p.name==='Tarifa'||p.name==='Cape Town')];
 if(coasts.some(p=>distanceKm(place,p)<5))return 'coast';
 // A marine response can snap far from an inland place: only use a nearby ocean cell.
 if(marine&&numeric(marine.latitude)&&numeric(marine.longitude)&&distanceKm(place,{lat:marine.latitude,lon:marine.longitude})<=60&&numeric(marine.current?.wave_height))return 'coast';
 return 'local';
}
export function recentLocations(places:Place[]){return places.filter((p,i)=>places.findIndex(other=>distanceKm(p,other)<1)===i).slice(0,6)}
export function wrapLongitude(lon:number){return ((lon+180)%360+360)%360-180}
export function regionalGrid(lat:number,lon:number){const center=Math.max(-70,Math.min(70,lat));return [-7.5,-2.5,2.5,7.5].flatMap(dlat=>[-18,-9,0,9,18].map(dlon=>({lat:Number((center+dlat).toFixed(2)),lon:Number(wrapLongitude(lon+dlon).toFixed(2))})))}
export function distanceKm(a:{lat:number;lon:number},b:{lat:number;lon:number}){const rad=Math.PI/180;const x=Math.sin((b.lat-a.lat)*rad/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lon-a.lon)*rad/2)**2;return 6371*2*Math.asin(Math.min(1,Math.sqrt(x)))}
export function cycloneBasin(lon:number){return lon>=-100&&lon<30?'atlantic':lon<-100?'pacific':'other'}

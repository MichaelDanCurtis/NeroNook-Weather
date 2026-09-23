import {providerJSON,json,failure} from "@/lib/weather-server";
import type {Cyclone} from "@/lib/weather";
const service="https://mapservices.weather.noaa.gov/tropical/rest/services/tropical/NHC_tropical_weather/MapServer";
type Storm={id:string;binNumber:string;name:string;classification:string;intensity:string;pressure:string;latitudeNumeric:number;longitudeNumeric:number;movementDir:number;movementSpeed:number;lastUpdate:string;publicAdvisory?:{url:string};forecastGraphics?:{url:string}};
export async function GET(){try{
const [d,meta]=await Promise.allSettled([providerJSON<{activeStorms:Storm[]}>("https://www.nhc.noaa.gov/CurrentStorms.json",300),providerJSON<{layers:{id:number;name:string}[]}>(service+"?f=json",3600)]);
if(d.status==="rejected")throw d.reason;if(!Array.isArray(d.value.activeStorms))throw new Error("Cyclone feed incomplete");
const raw=d.value.activeStorms.filter(s=>/^(ep|cp|al)/i.test(s.id));
const storms:Cyclone[]=raw.map(s=>({id:s.id,name:s.name,classification:s.classification,intensity:Number(s.intensity),pressure:Number(s.pressure),lat:s.latitudeNumeric,lon:s.longitudeNumeric,movementDir:s.movementDir,movementSpeed:s.movementSpeed,updated:s.lastUpdate,advisory:s.publicAdvisory?.url?.startsWith("https://www.nhc.noaa.gov/")?s.publicAdvisory.url:"https://www.nhc.noaa.gov/?cpac",graphics:s.forecastGraphics?.url?.startsWith("https://www.nhc.noaa.gov/")?s.forecastGraphics.url:"https://www.nhc.noaa.gov/?cpac"}));
const layers=meta.status==="fulfilled"?meta.value.layers||[]:[];
const selected=layers.filter(l=>raw.some(s=>l.name===`${s.binNumber} Forecast Track`||l.name===`${s.binNumber} Forecast Cone`||l.name===`${s.binNumber} Forecast Points`)||l.name==="Seven-Day: Potential Development Region");
const result=await Promise.allSettled(selected.map(async l=>{const query=new URLSearchParams({where:"1=1",outFields:"*",outSR:"4326",f:"geojson"});const geo=await providerJSON<GeoJSON.FeatureCollection>(`${service}/${l.id}/query?${query}`,300);if(!Array.isArray(geo.features))throw new Error("Track layer unavailable");return {layer:l.name,features:geo.features.map(f=>({...f,properties:{...f.properties,layerName:l.name}}))}}));
return json({storms,features:{type:"FeatureCollection",features:result.flatMap(r=>r.status==="fulfilled"?r.value.features:[])},tracksAvailable:meta.status==="fulfilled"&&selected.filter(l=>/Forecast/.test(l.name)).length===raw.length*3&&result.every((r,i)=>!selected[i].name.includes("Forecast")||r.status==="fulfilled"),outlookAvailable:result.some(r=>r.status==="fulfilled"&&r.value.layer.includes("Potential")),fetchedAt:Date.now()});
}catch(e){return failure(e)}}

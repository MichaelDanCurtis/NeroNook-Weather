export type ObservatoryMode="coast"|"mountain"|"local";
export type Place = {elevation?:number;name:string;region:string;country:string;countryCode:string;lat:number;lon:number;timezone:string};
export const DEFAULT_PLACE:Place = {name:"San Francisco",region:"California",country:"United States",countryCode:"US",lat:37.7749,lon:-122.4194,timezone:"America/Los_Angeles"};
export type Unit = "F"|"C";
export type Series = Record<string,(number|null)[]> & {time:number[]};
export type Forecast = {elevation?:number;precipitationNote?:string;provider?:string;providerUrl?:string;summary?:string;issuedAt?:string;notice?:string;stale?:boolean;warning?:string;latitude:number;longitude:number;timezone:string;utc_offset_seconds:number;current:Record<string,number|null>;hourly:Series;daily:Series;fetchedAt:number};
export type Air = {current:Record<string,number|null>;fetchedAt:number};
export type RadarFrame = {time:number;path:string};
export type Radar = {host:string;radar:{past:RadarFrame[]};fetchedAt:number};
export type Alert = {id:string;event:string;headline:string;severity:string;description:string;instruction:string|null;expires:string;url:string|null};
export type Alerts = {alerts:Alert[];supported:boolean;fetchedAt:number};
export type NextForecast = {horizonHours?:number;cycle?:"latest"|"synoptic";status:"ready"|"unconfigured";initTime?:string;fetchedAt:number;hours?:{time:number;mean:number;p10:number;p90:number;wind:number;rain:number}[]};
export function numeric(x:unknown):x is number{return typeof x==="number"&&Number.isFinite(x)}
export function temperature(c:unknown,unit:Unit,digits=0){return numeric(c)?(unit==="F"?c*9/5+32:c).toFixed(digits):"—"}
export function value(n:unknown,digits=0){return numeric(n)?n.toFixed(digits):"—"}
export function windSpeed(n:unknown,u:Unit){return numeric(n)?value(u==="F"?n/1.609344:n):"—"}
export function rainAmount(n:unknown,u:Unit){return numeric(n)?value(u==="F"?n/25.4:n,u==="F"?2:1):"—"}
export function direction(n:unknown){return numeric(n)?["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"][Math.round(n/22.5)%16]:"—"}
export function weatherName(c:unknown){if(!numeric(c))return "Conditions unavailable";if(c===0)return "Clear skies";if(c<=2)return "Partly cloudy";if(c===3)return "Overcast";if(c<=48)return "Foggy";if(c<=57)return "Drizzle";if(c<=67)return "Rain";if(c<=77)return "Snow";if(c<=82)return "Rain showers";if(c<=86)return "Snow showers";return "Thunderstorms"}
export function localTime(t:number|undefined,tz:string,opts:Intl.DateTimeFormatOptions={hour:"numeric",minute:"2-digit"}){if(!t)return "—";try{return new Intl.DateTimeFormat("en-US",{timeZone:tz,...opts}).format(new Date(t*1000))}catch{return "—"}}
export function age(t:number|undefined,now:number){if(!t)return "Not received";const min=Math.max(0,Math.floor((now-t)/60000));return min<1?"Just now":min<60?`${min} min ago`:`${Math.floor(min/60)}h ${min%60}m ago`}
export function validPlace(p:unknown):p is Place{if(!p||typeof p!=="object")return false;const a=p as Place;try{new Intl.DateTimeFormat("en-US",{timeZone:a.timezone})}catch{return false}return typeof a.name==="string"&&a.name.length>0&&a.name.length<120&&typeof a.region==="string"&&typeof a.country==="string"&&typeof a.countryCode==="string"&&numeric(a.lat)&&Math.abs(a.lat)<=90&&numeric(a.lon)&&Math.abs(a.lon)<=180&&(a.elevation===undefined||(numeric(a.elevation)&&a.elevation>=-500&&a.elevation<=9000))}
export type Marine={latitude:number;longitude:number;current:Record<string,number|null>;hourly:Series;fetchedAt:number};
export type Cyclone={id:string;name:string;classification:string;intensity:number;pressure:number;lat:number;lon:number;movementDir:number;movementSpeed:number;updated:string;advisory:string;graphics:string};
export type Cyclones={storms:Cyclone[];features:GeoJSON.FeatureCollection;tracksAvailable:boolean;outlookAvailable:boolean;fetchedAt:number};
export type Satellite={time:string;fetchedAt:number};
export type WindMap={points:{lat:number;lon:number;speed:number;direction:number;time:number}[];fetchedAt:number};
export function knots(kmh:unknown){return numeric(kmh)?value(kmh/1.852):"—"}
export function waveHeight(m:unknown,u:Unit){return numeric(m)?value(u==="F"?m*3.28084:m,1):"—"}
export const ISLANDS:Place[]=[
{name:"Honolulu",region:"Oʻahu",country:"United States",countryCode:"US",lat:21.3069,lon:-157.8583,timezone:"Pacific/Honolulu"},
{name:"Kailua",region:"Oʻahu",country:"United States",countryCode:"US",lat:21.3972,lon:-157.727,timezone:"Pacific/Honolulu"},
{name:"Hanalei",region:"Kauaʻi",country:"United States",countryCode:"US",lat:22.2033,lon:-159.4986,timezone:"Pacific/Honolulu"},
{name:"Poʻipū",region:"Kauaʻi",country:"United States",countryCode:"US",lat:21.8735,lon:-159.4534,timezone:"Pacific/Honolulu"},
{name:"Kahului",region:"Maui",country:"United States",countryCode:"US",lat:20.8947,lon:-156.47,timezone:"Pacific/Honolulu"},
{name:"Kailua-Kona",region:"Hawaiʻi",country:"United States",countryCode:"US",lat:19.64,lon:-155.9969,timezone:"Pacific/Honolulu"},
{name:"Hilo",region:"Hawaiʻi",country:"United States",countryCode:"US",lat:19.7297,lon:-155.09,timezone:"Pacific/Honolulu"}];
export type MapWind={provider?:string;initTime?:string;stale?:boolean;warning?:string;times:number[];points:{lat:number;lon:number;speed:(number|null)[];direction:(number|null)[]}[];fetchedAt:number};
export type MapWaves={times:number[];points:{lat:number;lon:number;height:(number|null)[];period:(number|null)[];direction:(number|null)[]}[];fetchedAt:number};

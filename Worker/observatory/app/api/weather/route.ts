import {coordinates,providerFeed,json,failure} from "@/lib/weather-server";
import {isHawaii,nwsForecast} from "@/lib/nws-weather";
import {metForecast} from "@/lib/met-weather";
import type {Forecast} from "@/lib/weather";
export async function GET(request:Request){let point;try{point=coordinates(request)}catch{return json({error:"Invalid coordinates"},400)}try{
const u=new URL(request.url),country=u.searchParams.get("country")||"",tz=u.searchParams.get("tz")||"UTC";try{new Intl.DateTimeFormat("en",{timeZone:tz})}catch{return json({error:"Invalid timezone"},400)}
if(["US","PR","VI","GU","MP","AS"].includes(country)||isHawaii(point.lat,point.lon)){try{return json(await nwsForecast(point.lat,point.lon))}catch{console.warn("NOAA forecast unavailable; trying Open-Meteo")}}
const params=new URLSearchParams({latitude:String(point.lat),longitude:String(point.lon),timezone:"auto",timeformat:"unixtime",forecast_days:"7",current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m",hourly:"temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day,shortwave_radiation,pressure_msl,snowfall,freezing_level_height,snow_depth",daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max"});
try{const {data,...metadata}=await providerFeed<Forecast>(`https://api.open-meteo.com/v1/forecast?${params}`,300);
if(!data.current||!Array.isArray(data.hourly?.time)||!data.daily?.time?.length)throw new Error("Forecast response incomplete");return json({...data,...metadata,provider:"Open-Meteo",providerUrl:"https://open-meteo.com/"});}catch{return json(await metForecast(point.lat,point.lon,tz))}}catch(e){return failure(e)}}

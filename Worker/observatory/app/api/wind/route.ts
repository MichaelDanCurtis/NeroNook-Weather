import {coordinates, providerFeed, json, failure} from '../../../lib/weather-server';
import {windGrid,normalizeRegionalWind} from '../../../lib/regional-wind';
// Sampled regional forecast; never presented as a continuous/global wind field.
export async function GET(request: Request) {
 try {
  const {lat,lon}=coordinates(request),grid=windGrid(lat,lon);
  const query=new URLSearchParams({latitude:grid.map(p=>p.lat).join(','),longitude:grid.map(p=>p.lon).join(','),hourly:'wind_speed_10m,wind_direction_10m',forecast_hours:'13',timeformat:'unixtime'});
  const {data,...metadata}=await providerFeed<any[]>(`https://api.open-meteo.com/v1/forecast?${query}`,3600);
  return json({provider:'Open-Meteo',...normalizeRegionalWind(data,grid),...metadata});
 } catch(e) { return failure(e) }
}

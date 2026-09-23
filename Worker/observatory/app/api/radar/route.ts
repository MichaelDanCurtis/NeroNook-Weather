import {providerFeed,json,failure} from "@/lib/weather-server";
import type {Radar} from "@/lib/weather";
export async function GET(){try{const {data,...metadata}=await providerFeed<Radar>("https://api.rainviewer.com/public/weather-maps.json",600);if(!Array.isArray(data.radar?.past)||!data.radar.past.length)throw new Error("Radar frames unavailable");return json({host:"https://tilecache.rainviewer.com",radar:{past:data.radar.past.filter(f=>Number.isFinite(f.time)&&/^\/v2\/radar\/[a-zA-Z0-9_-]+$/.test(f.path))},...metadata})}catch(e){return failure(e)}}

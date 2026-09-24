export function windGrid(lat:number,lon:number){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>80||Math.abs(lon)>180)throw new Error('Regional wind samples are unavailable at this latitude');
 return [-2,-1,0,1,2].flatMap(dy=>[-2,-1,0,1,2].map(dx=>({lat:Number((lat+dy).toFixed(3)),lon:Number((((lon+dx+540)%360)-180).toFixed(3))})));
}
export function normalizeRegionalWind(data:any,grid:{lat:number;lon:number}[]){
 if(!Array.isArray(data)||data.length!==grid.length||!Array.isArray(data[0]?.hourly?.time))throw new Error('Regional wind forecast unavailable');
 const times=data[0].hourly.time.slice(0,13);
 if(!times.length||!times.every((t:unknown,i:number)=>typeof t==='number'&&Number.isFinite(t)&&(i===0||t>times[i-1])))throw new Error('Invalid wind forecast times');
 const points=data.map((d,i)=>({...grid[i],speed:times.map((t:number,j:number)=>d.hourly?.time?.[j]===t&&Number.isFinite(d.hourly?.wind_speed_10m?.[j])&&d.hourly.wind_speed_10m[j]>=0?d.hourly.wind_speed_10m[j]:null),direction:times.map((t:number,j:number)=>d.hourly?.time?.[j]===t&&Number.isFinite(d.hourly?.wind_direction_10m?.[j])&&d.hourly.wind_direction_10m[j]>=0&&d.hourly.wind_direction_10m[j]<=360?d.hourly.wind_direction_10m[j]:null)}));
 if(!points.some(p=>p.speed.some((v:number|null,i:number)=>v!==null&&p.direction[i]!==null)))throw new Error('No wind readings were available');
 return {times,points};
}

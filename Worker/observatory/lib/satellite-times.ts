export type SatelliteHistory={time:string;times:string[];fetchedAt:number;warning?:string};
export function parseSatelliteTimes(xml:string,now=Date.now()):string[]{
 const start=xml.indexOf('<Name>global_longwave_imagery_mosaic</Name>');
 if(start<0)throw new Error('Satellite layer unavailable');
 const layer=xml.slice(start,xml.indexOf('</Layer>',start));
 const dimension=/<Dimension\b([^>]*\bname=["']time["'][^>]*)>([^<]*)<\/Dimension>/.exec(layer);
 if(!dimension)throw new Error('Satellite observation times unavailable');
 const values=dimension[2].split(',').map(t=>Date.parse(t.trim())).filter(t=>Number.isFinite(t)&&t<=now+300000&&t>=now-48*3600000);
 // Only advertised observations are used. A WMS default can name a time that is absent from its history.
 const sorted=[...new Set(values)].sort((a,b)=>a-b).slice(-24);
 if(!sorted.length)throw new Error('No recent satellite observations are available');
 return sorted.map(t=>new Date(t).toISOString());
}
export function nextPlaybackIndex(index:number,count:number){return count>0?(index+1+count)%count:0}

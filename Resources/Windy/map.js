'use strict';
let api=null,lastLocation='',ready=false,syncing=false;
const note=document.getElementById('nero-load');
function config(){const p=new URLSearchParams(location.hash.slice(1)),lat=Number(p.get('lat')),lon=Number(p.get('lon'));return{lat:Number.isFinite(lat)&&Math.abs(lat)<=85?lat:0,lon:Number.isFinite(lon)&&Math.abs(lon)<=180?lon:0,overlay:p.get('layer')==='temp'?'temp':'wind',unit:p.get('unit')==='C'?'C':'F',recenter:p.get('recenter')||'0'}}
// Apply metrics after Windy's first redraw; its early store can precede the legend model.
function syncUnits(){
 if(!api||!ready||syncing)return;syncing=true;
 try{const c=config();for(const [layer,unit] of [['wind',c.unit==='F'?'mph':'km/h'],['temp','°'+c.unit]]){
  const overlay=api.overlays[layer];if(overlay.metric===unit)continue;
  overlay.setMetric(unit);
  if(overlay.metric!==unit){const previous=overlay.metric;overlay.setMetric(previous);overlay.setMetric(unit)}
 }}finally{syncing=false}
}
function apply(){if(!api)return;const c=config();api.store.set('overlay',c.overlay);api.store.set('particlesAnim',c.overlay==='wind'&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'on':'off');syncUnits();const point=`${c.lat}|${c.lon}|${c.recenter}`;if(lastLocation!==point){lastLocation=point;api.map.setView([c.lat,c.lon],6)}api.map.invalidateSize()}
window.addEventListener('hashchange',apply);window.addEventListener('resize',()=>api?.map.invalidateSize());
window.addEventListener('pagehide',()=>{try{api?.store.set('particlesAnim','off');api?.map.remove()}catch{}});
const timeout=setTimeout(()=>{if(!ready){note.hidden=false;note.textContent='Windy has not loaded. Check the connection or testing key in Weather settings.'}},25000);
try{
 if(typeof windyInit!=='function')throw Error();const c=config();
 windyInit({key:windyConfig.key,verbose:false,lat:c.lat,lon:c.lon,zoom:6,product:'gfs',overlay:c.overlay,level:'surface',hourFormat:'12h',englishLabels:true},value=>{api=value;api.broadcast.on('metricChanged',()=>{if(!syncing)queueMicrotask(syncUnits)});api.broadcast.on('redrawFinished',()=>{ready=true;syncUnits();clearTimeout(timeout);note.hidden=true});apply();api.map.on('click',e=>api.picker.open({lat:e.latlng.lat,lon:e.latlng.lng}))});
}catch{clearTimeout(timeout);note.textContent='Windy is unavailable. Check the connection or testing key in Weather settings.'}

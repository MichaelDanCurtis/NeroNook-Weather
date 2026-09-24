'use strict';
const $=id=>document.getElementById(id), text=(id,value)=>$(id).textContent=value;
let state={}, page='forecast', metric='temperature_2m', hour=0, layer='radar', frameIndex=0;
const finite=n=>typeof n==='number'&&Number.isFinite(n), num=(n,d=0)=>finite(n)?n.toFixed(d):'—';
const temp=n=>finite(n)?num(state.unit==='F'?n*9/5+32:n):'—';
const speed=n=>finite(n)?num(state.unit==='F'?n/1.609344:n):'—', speedUnit=()=>state.unit==='F'?'mph':'km/h';
const height=n=>finite(n)?num(state.unit==='F'?n*3.28084:n,1):'—', heightUnit=()=>state.unit==='F'?'ft':'m';
const direction=n=>finite(n)?['N','NE','E','SE','S','SW','W','NW'][Math.round(n/45)%8]:'—';
function time(t,options={hour:'numeric',minute:'2-digit'}){if(!finite(t))return '—';try{return new Intl.DateTimeFormat('en-US',{timeZone:state.place?.timezone||'UTC',...options}).format(new Date(t*1000))}catch{return '—'}}
function age(ms){if(!finite(ms))return 'Not received';const m=Math.max(0,Math.floor((Date.now()-ms)/60000));return m<1?'Just updated':m<60?`${m}m ago`:`${Math.floor(m/60)}h ${m%60}m ago`}
function condition(c){if(!finite(c))return 'Conditions unavailable';if(c===0)return 'Clear skies';if(c<=2)return 'Partly cloudy';if(c===3)return 'Overcast';if(c<=48)return 'Fog';if(c<=57)return 'Drizzle';if(c<=67)return 'Rain';if(c<=77)return 'Snow';if(c<=82)return 'Rain showers';if(c<=86)return 'Snow showers';return 'Thunderstorms'}
// Original vector weather artwork. Input only selects fixed shapes.
function icon(code,night=false){
 const cloudy=!finite(code)||code>0, rain=finite(code)&&((code>=51&&code<=67)||(code>=80&&code<=82)||code>=95), snow=finite(code)&&((code>=71&&code<=77)||(code>=85&&code<=86));
 const sun=night?'<path d="M61 15a22 22 0 1 0 25 32A23 23 0 0 1 61 15" fill="#c7e8ec"/>':'<g stroke="#f5cd80" stroke-width="2.5" stroke-linecap="round"><path d="M61 8v-5M61 68v-5M32 35h-5M96 35h-5M40 14l-4-4M82 57l4 4M40 57l-4 4M82 14l4-4"/><circle cx="61" cy="35" r="20" fill="#f5d58a" stroke="none"/></g>';
 const cloud='<path d="M27 73C9 73 8 49 25 46C25 22 61 17 70 41C92 34 111 50 103 66C100 74 92 77 83 77H30" fill="#bacfd6"/><path d="M27 73C9 73 8 49 25 46C25 22 61 17 70 41C90 35 104 46 104 58" fill="none" stroke="#e9f6f6" stroke-width="1.2" opacity=".8"/>';
 const drops='<g stroke="#78bed9" stroke-width="4" stroke-linecap="round"><path d="m35 87-4 7m26-7-4 7m26-7-4 7"/></g>';
 const flakes='<g fill="#c6ecf7"><circle cx="31" cy="91" r="2.5"/><circle cx="55" cy="87" r="2.5"/><circle cx="78" cy="92" r="2.5"/></g>';
 return `<svg class="weather-icon" viewBox="0 0 120 105" aria-hidden="true">${code===0||code===1||code===2?sun:''}${cloudy?cloud:''}${rain?drops:''}${snow?flakes:''}${code>=95?'<path d="m62 68-14 23h13l-8 19 26-28H65l9-14" fill="#f3d071"/>':''}</svg>`;
}
async function emit(name,values={}){try{await window.nero.emit(name,values)}catch{text('forecast-health','Module connection unavailable')}}
function render(){
 const s=state,c=s.current||{},d=s.daily||{},h=s.hourly||{};
 text('place',s.ready?`${s.place.name}${s.automatic?' · This Mac':''}`:'Weather where you are');text('unit',`°${s.unit||'F'}`);
 $('waiting').hidden=!!s.ready;document.querySelectorAll('.page').forEach(el=>el.hidden=!s.ready||el.id!==(page==='map'?'map-page':page));
 text('waiting-message',s.message||'Finding this Mac’s location…');
 if(!s.ready){destroyMap();return}
 text('temperature',temp(c.temperature_2m)+'°');$('condition-icon').innerHTML=icon(c.weather_code,c.is_day===0);
 text('condition',condition(c.weather_code));text('valid-time',time(c.time,{hour:'numeric'}));text('feels',`Feels like ${temp(c.apparent_temperature)}° · H ${temp(d.temperature_2m_max?.[0])}° / L ${temp(d.temperature_2m_min?.[0])}°`);
 text('wind',`${speed(c.wind_speed_10m)} ${speedUnit()} ${direction(c.wind_direction_10m)}`);text('humidity',`${num(c.relative_humidity_2m)}%`);
 text('aqi',num(s.air?.us_aqi)+(s.errors?.air?' · stale':''));$('aqi').classList.toggle('warn',!!s.errors?.air);$('aqi').title=`CAMS modeled US AQI · ${age(s.fetched?.air)}${s.errors?.air?' · '+s.errors.air:''}`;
 text('forecast-source',`${s.provider||'Weather provider'} · ${age(s.fetched?.weather)} · Model forecast`);
 text('forecast-health',s.errors?.weather?'Previous reading · refresh unavailable':s.loading?.includes('weather')?'Refreshing…':'');
 const alerts=s.alerts||[];text('alerts',s.errors?.alerts?'Alerts unavailable':!finite(s.fetched?.alerts)?'Checking alerts…':!s.alertsSupported?'Alerts not covered here':alerts.length?`${alerts.length} weather alert${alerts.length>1?'s':''} ↗`:'No active NWS alerts');$('alerts').classList.toggle('warn',!!alerts.length||!!s.errors?.alerts);
 hour=Math.min(hour,Math.max(0,(h.time?.length||1)-1));renderHourly();renderDays();renderCoast();
 if(page==='map')renderMap();
}
function chart(element,times,values,{selected=-1,format=n=>num(n),zero=false,label='Hourly forecast'}={}){
 const good=values.filter(finite);if(!good.length){element.innerHTML='<div class="empty-chart">Readings unavailable here</div>';return}
 let lo=Math.min(...good),hi=Math.max(...good);if(zero)lo=Math.min(0,lo);if(lo===hi){lo-=1;hi+=1}
 const pad=(hi-lo)*.12;hi+=pad;if(!zero)lo-=pad;
 const W=500,H=145,left=30,right=485,top=15,bottom=115,n=values.length,x=i=>left+i/Math.max(1,n-1)*(right-left),y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);
 let paths=[],run=[];values.forEach((v,i)=>{if(finite(v))run.push([x(i),y(v)]);else if(run.length){paths.push(run);run=[]}});if(run.length)paths.push(run);
 let shapes=[0,.5,1].map(t=>{const v=lo+t*(hi-lo),yy=y(v);return `<line class="gridline" x1="${left}" x2="${right}" y1="${yy}" y2="${yy}"/><text x="0" y="${yy+4}">${format(v)}</text>`}).join('');
 for(const p of paths){const line=p.map((xy,i)=>(i?'L':'M')+xy.join(',')).join(' ');shapes+=`<path class="area" d="${line} L${p.at(-1)[0]},${bottom} L${p[0][0]},${bottom}Z"/><path class="trace" d="${line}"/>`}
 for(const i of [...new Set([0,Math.floor((n-1)/3),Math.floor((n-1)*2/3),n-1])])shapes+=`<text x="${x(i)}" y="139" text-anchor="${i===0?'start':i===n-1?'end':'middle'}">${time(times[i],{hour:'numeric'})}</text>`;
 if(selected>=0&&selected<n){shapes+=`<line class="cursor" x1="${x(selected)}" x2="${x(selected)}" y1="8" y2="${bottom}"/>`;if(finite(values[selected]))shapes+=`<circle class="dot" cx="${x(selected)}" cy="${y(values[selected])}" r="5"/>`}
 element.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${label} chart">${shapes}</svg>`;
}
function renderHourly(){const h=state.hourly||{},times=h.time||[],values=(h[metric]||[]).map(v=>!finite(v)?null:metric==='temperature_2m'?(state.unit==='F'?v*9/5+32:v):metric==='wind_speed_10m'?(state.unit==='F'?v/1.609344:v):v),unit=metric==='temperature_2m'?'°':metric==='wind_speed_10m'?' '+speedUnit():'%';
 text('hour-reading',`${time(times[hour])} · ${num(values[hour])}${unit}`);$('hour-select').max=Math.max(0,times.length-1);$('hour-select').value=hour;$('hour-select').disabled=!times.length;
 chart($('hour-chart'),times,values,{selected:hour,zero:metric==='precipitation_probability',label:metric==='temperature_2m'?'Temperature':metric==='precipitation_probability'?'Rain chance':'Wind speed'});
 text('hour-note',metric==='precipitation_probability'?'Chance of precipitation · missing values are gaps':'Forecast at your selected location · drag to explore');
}
function renderDays(){const d=state.daily||{},times=d.time||[],all=[...(d.temperature_2m_min||[]),...(d.temperature_2m_max||[])].filter(finite),low=Math.min(...all),span=Math.max(1,Math.max(...all)-low);$('days').replaceChildren();
 times.forEach((t,i)=>{const el=document.createElement('button');el.className='day';const lo=d.temperature_2m_min?.[i],hi=d.temperature_2m_max?.[i];
 el.innerHTML=`<span class="day-name"></span><span class="day-icon">${icon(d.weather_code?.[i])}</span><span class="day-temp">${temp(hi)}°<span>${temp(lo)}°</span></span><span class="temp-track">${finite(lo)&&finite(hi)?`<i style="left:${(lo-low)/span*100}%;width:${Math.max(2,(hi-lo)/span*100)}%"></i>`:''}</span><span class="day-rain">Rain ${num(d.precipitation_probability_max?.[i])}%</span>`;
 el.querySelector('.day-name').textContent=i===0?'Today':time(t,{weekday:'short'});el.setAttribute('aria-label',`${time(t,{weekday:'long'})}, ${condition(d.weather_code?.[i])}, high ${temp(hi)}, low ${temp(lo)}`);el.onclick=()=>showDay(i);$('days').append(el)});
}
function showDay(i){const d=state.daily||{};const box=$('day-content');box.replaceChildren();const title=document.createElement('h1');title.textContent=time(d.time?.[i],{weekday:'long',month:'short',day:'numeric'});box.append(title);const desc=document.createElement('p');desc.textContent=condition(d.weather_code?.[i]);box.append(desc);const grid=document.createElement('div');grid.className='day-details-grid';for(const [name,value] of [['High / Low',`${temp(d.temperature_2m_max?.[i])}° / ${temp(d.temperature_2m_min?.[i])}°`],['Rain chance',num(d.precipitation_probability_max?.[i])+'%'],['Sunrise',time(d.sunrise?.[i])],['Sunset',time(d.sunset?.[i])]]){const div=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');small.textContent=name;strong.textContent=value;div.append(small,strong);grid.append(div)}box.append(grid);$('day-detail').hidden=false;document.querySelectorAll('header,main').forEach(e=>e.inert=true);$('close-day').focus()}
function renderCoast(){const m=state.marine||{},station=state.tideStation||{},curve=state.tideCurve||[],events=state.tides||[];
 text('wave-height',height(m.wave_height));text('wave-unit',heightUnit());text('wave-period',`${num(m.wave_period,1)} s`);text('wave-direction',direction(m.wave_direction));text('swell',`${height(m.swell_wave_height)} ${heightUnit()}`);
 text('marine-cell',finite(m.wave_height)&&finite(state.marinePoint?.latitude)?`Ocean model cell ${num(state.marinePoint.latitude,2)}, ${num(state.marinePoint.longitude,2)}`:'No ocean-model reading at this location');
 text('station',station.name||'No nearby reference station');text('tide-note',state.tidesSupported?`NOAA tide predictions · ${num(station.distance)} km from selected location · ${heightUnit()} above MLLW`:'NOAA reference tides are not available at every location.');
 chart($('tide-chart'),curve.map(p=>p[0]),curve.map(p=>finite(p[1])?(state.unit==='F'?p[1]*3.28084:p[1]):null),{format:n=>num(n,1),label:'Tide predictions'});
 $('tide-events').replaceChildren();events.slice(0,4).forEach(e=>{const div=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');small.textContent=`${e.type==='H'?'HIGH':'LOW'} · ${time(e.time)}`;strong.textContent=`${height(e.height)} ${heightUnit()}`;div.append(small,strong);$('tide-events').append(div)});
 const h=state.marineHours||{};$('wave-hours').replaceChildren();(h.time||[]).forEach((t,i)=>{if(i%3!==0||i>21)return;const div=document.createElement('div');div.innerHTML=`<small>${time(t,{hour:'numeric'})}</small><strong>${height(h.wave_height?.[i])} <small>${heightUnit()}</small></strong><span>${num(h.wave_period?.[i],1)} s period</span>`;$('wave-hours').append(div)});
 text('coast-source',`Marine ${age(state.fetched?.marine)} · Tides ${age(state.fetched?.tides)}`);text('coast-health',state.errors?.marine||state.errors?.tides?'Some coast data unavailable / stale':!finite(m.wave_height)?'Wave model unavailable here':'');
}
let map=null,baseTiles=null,overlay=null,coverage=null,marker=null,mapLocation='',savedMap=null,mapKey='',timer=null,playing=false,baseFailed=false,overlayFailed=false,overlayLoaded=false,windGroup=null;
const tileURL=(kind,id)=>`nook-view://surface/_plugin/tiles/${kind}/${id}/{z}/{x}/{y}`;
function destroyMap(){stopPlay();if(map){savedMap={center:map.getCenter(),zoom:map.getZoom(),place:mapLocation};map.remove()}map=null;baseTiles=overlay=coverage=marker=windGroup=null;mapKey=''}
function setupMap(){if(map)return;map=L.map('map',{zoomControl:false,attributionControl:false,minZoom:3,maxZoom:12,zoomAnimation:false,fadeAnimation:false});baseFailed=false;
 baseTiles=L.tileLayer(tileURL('base','0'),{maxZoom:12,keepBuffer:0,className:'basemap-tile',updateWhenIdle:true}).on('tileerror',()=>{baseFailed=true;mapNotice()}).addTo(map);
 const p=state.place;mapLocation=p.id;map.setView(savedMap?.place===p.id?savedMap.center:[p.lat,p.lon],savedMap?.place===p.id?savedMap.zoom:7);
 marker=L.circleMarker([p.lat,p.lon],{radius:5,color:'#dbfff2',weight:2,fillColor:'#54c6a5',fillOpacity:1}).addTo(map);marker.bindTooltip(document.createTextNode(p.name));
 map.on('movestart',()=>stopPlay());map.invalidateSize();
}
function frames(){return layer==='radar'?state.radar||[]:layer==='infrared'?state.satellite||[]:layer==='wind'?state.windTimes||[]:[]}
function frameTime(frame){return typeof frame==='object'?frame.time:frame}
function mapNotice(){let messages=[];if(baseFailed)messages.push('Some map tiles failed.');if(['radar','infrared'].includes(layer)&&frames().length&&!overlayLoaded&&!overlayFailed)messages.push('Loading imagery…');if(overlayFailed)messages.push('Some imagery failed; coverage is incomplete.');const feed=layer==='infrared'?'satellite':layer;if(state.errors?.[feed])messages.push('Previous data / refresh unavailable.');if(layer!=='base'&&!frames().length)messages.push(state.loading?.includes(feed)?'Loading this layer…':'This layer is unavailable.');text('map-notice',messages.join(' '));}
function renderMap(){setupMap();const p=state.place;if(p.id!==mapLocation){mapLocation=p.id;savedMap=null;stopPlay();map.setView([p.lat,p.lon],7);marker.setLatLng([p.lat,p.lon]);marker.bindTooltip(document.createTextNode(p.name));mapKey=''}
 text('map-place',p.name);text('map-temp',temp(state.current?.temperature_2m)+'°');text('map-condition',condition(state.current?.weather_code));
 const fs=frames(),key=layer+'|'+JSON.stringify(fs)+'|'+p.id+'|'+(layer==='wind'?state.unit:'');
 if(key!==mapKey){const previous=mapKey?Number($('frame').value):-1;mapKey=key;frameIndex=previous<0?Math.max(0,fs.length-1):Math.min(frameIndex,Math.max(0,fs.length-1));if(layer==='wind'&&previous<0)frameIndex=0;renderLayer()}
 mapNotice();
}
function clearOverlay(){for(const item of [overlay,windGroup,...(layer!=='radar'?[coverage]:[])])if(item&&map.hasLayer(item))map.removeLayer(item);overlay=windGroup=null;if(layer!=='radar')coverage=null;overlayFailed=false;overlayLoaded=false}
function renderLayer(){if(!map)return;clearOverlay();const fs=frames();frameIndex=Math.min(frameIndex,Math.max(0,fs.length-1));$('frame').max=Math.max(0,fs.length-1);$('frame').value=frameIndex;$('frame').disabled=fs.length<2;$('play').disabled=fs.length<2;$('latest').textContent=layer==='wind'?'Now':'Latest';$('latest').disabled=!fs.length;
 text('frame-title',layer==='radar'?'Radar composite':layer==='infrared'?'Infrared observation':layer==='wind'?'Regional wind forecast':'Reference map');
 text('frame-time',fs.length?time(frameTime(fs[frameIndex]),{weekday:'short',hour:'numeric',minute:'2-digit'}):layer==='base'?'Selected location':'No frames available');
 const legend=$('map-legend');legend.replaceChildren();
 if(layer==='radar'){legend.innerHTML='<div>Rain reflectivity · 15 → 45+ dBZ</div><div class="legend-line"></div><div>Dark = no coverage · blank is not proof of clear skies</div>';text('map-credit','© OpenStreetMap contributors · RainViewer');}
 if(layer==='infrared'){legend.textContent='Infrared brightness · NOAA source colors';text('map-credit','© OpenStreetMap contributors · NOAA nowCOAST');}
 if(layer==='wind'){legend.textContent='10 m wind · sampled model points · arrows point downwind';text('map-credit','© OpenStreetMap contributors · Open-Meteo · CC BY 4.0');}
 if(layer==='base'){legend.textContent='Scroll to zoom · drag to explore';text('map-credit','© OpenStreetMap contributors');}
 if(!fs.length||layer==='base'){mapNotice();return}
 const currentKey=layer+':'+frameIndex+':'+mapLocation;
 if(layer==='wind'){
  overlayLoaded=true;windGroup=L.layerGroup().addTo(map);for(const p of state.windPoints||[]){const v=p.speed?.[frameIndex],d=p.direction?.[frameIndex];if(!finite(v)||!finite(d)||!finite(p.lat)||!finite(p.lon))continue;const color=v<10?'#b0e9db':v<25?'#82c9e9':v<45?'#e7d488':'#edaa9f';
   const arrow=L.divIcon({className:'wind-arrow',html:`<svg viewBox="0 0 28 28" style="transform:rotate(${d+180}deg)"><path d="M14 24V4m-6 7 6-7 6 7" stroke="${color}" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,iconSize:[28,28],iconAnchor:[14,14]});const popup=document.createElement('div');popup.textContent=`${speed(v)} ${speedUnit()} from ${direction(d)} · ${time(fs[frameIndex])} · Open-Meteo forecast`;L.marker([p.lat,p.lon],{icon:arrow,alt:popup.textContent,title:popup.textContent}).bindPopup(popup).addTo(windGroup)}mapNotice();return
 }
 const id=layer==='radar'?fs[frameIndex].id:String(fs[frameIndex]);overlay=L.tileLayer(tileURL(layer,id),{maxNativeZoom:layer==='radar'?7:12,maxZoom:12,opacity:layer==='radar'?.8:.78,keepBuffer:0,updateWhenIdle:true});
 overlay.on('tileerror',()=>{if(currentKey!==layer+':'+frameIndex+':'+mapLocation)return;overlayFailed=true;mapNotice()});
 overlay.on('load',()=>{if(currentKey!==layer+':'+frameIndex+':'+mapLocation)return;overlayLoaded=true;mapNotice()});overlay.addTo(map);
 if(layer==='radar'&&!coverage){coverage=L.tileLayer(tileURL('coverage','0'),{maxNativeZoom:7,maxZoom:12,opacity:.5,zIndex:450,keepBuffer:0,updateWhenIdle:true}).on('tileerror',()=>{if(currentKey===layer+':'+frameIndex+':'+mapLocation){overlayFailed=true;mapNotice()}}).addTo(map)}mapNotice();
}
function stopPlay(){playing=false;if(timer)clearTimeout(timer);timer=null;text('play','▶');$('play').setAttribute('aria-label','Play weather timeline')}
function play(){if(playing){stopPlay();return}if(frames().length<2)return;playing=true;text('play','Ⅱ');$('play').setAttribute('aria-label','Pause weather timeline');let waited=0;const next=()=>{if(!playing||page!=='map'||document.hidden){stopPlay();return}if(!overlayLoaded&&waited<12){waited++;timer=setTimeout(next,750);return}if(overlayFailed||(!overlayLoaded&&waited>=12)){stopPlay();return}waited=0;frameIndex=(frameIndex+1)%frames().length;renderLayer();timer=setTimeout(next,1400)};timer=setTimeout(next,1400)}
function setPage(value){if(page!==value&&value!=='map')destroyMap();page=value;document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('selected',b.dataset.page===page));render()}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>setPage(b.dataset.page));document.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>{metric=b.dataset.metric;document.querySelectorAll('[data-metric]').forEach(x=>x.classList.toggle('selected',x===b));renderHourly()});
document.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{stopPlay();layer=b.dataset.layer;mapKey='';frameIndex=layer==='wind'?0:Math.max(0,frames().length-1);$('frame').value=frameIndex;document.querySelectorAll('[data-layer]').forEach(x=>x.classList.toggle('selected',x===b));if(layer==='wind')emit('wind');renderMap()});
$('hour-select').oninput=e=>{hour=Number(e.target.value);renderHourly()};$('hour-chart').onpointermove=e=>{const box=$('hour-chart').getBoundingClientRect(),n=state.hourly?.time?.length||0;if(n){hour=Math.max(0,Math.min(n-1,Math.round(((e.clientX-box.left)/box.width*500-30)/455*(n-1))));renderHourly()}};
$('settings').onclick=$('choose-place').onclick=()=>emit('settings');$('alerts').onclick=()=>emit('alerts');$('unit').onclick=()=>emit('unit',{unit:state.unit==='F'?'C':'F'});$('refresh').onclick=()=>emit('refresh');$('frame').oninput=e=>{stopPlay();frameIndex=Number(e.target.value);renderLayer()};$('play').onclick=play;$('latest').onclick=()=>{stopPlay();frameIndex=layer==='wind'?0:frames().length-1;renderLayer()};$('recenter').onclick=()=>{if(map)map.setView([state.place.lat,state.place.lon],7)};
$('close-day').onclick=()=>{$('day-detail').hidden=true;document.querySelectorAll('header,main').forEach(e=>e.inert=false);$('days').querySelector('button')?.focus()};document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('close-day').click();stopPlay()}});document.addEventListener('visibilitychange',()=>{if(document.hidden)destroyMap();else if(page==='map'&&state.ready)renderMap()});window.addEventListener('pagehide',destroyMap);
window.nero.onState(value=>{try{state=JSON.parse(value.data||'{}');render()}catch{text('waiting-message','Weather data could not be displayed. Open settings to refresh.')}});

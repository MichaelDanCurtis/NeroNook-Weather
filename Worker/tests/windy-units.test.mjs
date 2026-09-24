import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('late provider defaults cannot reset Weather units after initialization',async()=>{
 const events={},windowEvents={},note={hidden:false},changes=[];
 const overlay=metric=>({metric,setMetric(unit){this.metric=unit;changes.push(unit);events.metricChanged?.()}});
 const api={overlays:{wind:overlay('kt'),temp:overlay('°C')},store:{set(){}},broadcast:{on(name,fn){events[name]=fn}},map:{setView(){},invalidateSize(){},on(){}},picker:{open(){}}};
 const context=vm.createContext({URLSearchParams,Number,matchMedia:()=>({matches:false}),queueMicrotask,document:{getElementById:()=>note},location:{hash:'#layer=temp&lat=47&lon=-122&unit=F'},window:{addEventListener(n,f){windowEvents[n]=f}},setTimeout:()=>1,clearTimeout(){},windyConfig:{key:'fixture'},windyInit(opts,callback){assert.equal(opts.product,'gfs');callback(api)}});
 vm.runInContext(readFileSync('Resources/Windy/map.js','utf8'),context);
 assert.equal(note.hidden,false);events.redrawFinished();assert.equal(api.overlays.temp.metric,'°F');assert.equal(api.overlays.wind.metric,'mph');
 api.overlays.temp.metric='°C';events.metricChanged();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(api.overlays.temp.metric,'°F');events.redrawFinished();assert.equal(note.hidden,true);
 context.location.hash='#layer=temp&lat=47&lon=-122&unit=C';windowEvents.hashchange();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(api.overlays.temp.metric,'°C');assert.equal(api.overlays.wind.metric,'km/h');
 assert(changes.length<12,'unit feedback must settle, without an event loop');
});

test('unit recovery handles a stored metric whose rendered model missed the startup change',()=>{
 const events={},stored={wind:'mph',temp:'°F'},note={hidden:false};
 const overlay=(name,metric)=>({metric,setMetric(unit){if(stored[name]===unit)return;stored[name]=unit;this.metric=unit;events.metricChanged?.()}});
 const api={overlays:{wind:overlay('wind','mph'),temp:overlay('temp','°C')},store:{set(){}},broadcast:{on(n,f){events[n]=f}},map:{setView(){},invalidateSize(){},on(){}},picker:{open(){}}};
 const ctx=vm.createContext({URLSearchParams,Number,matchMedia:()=>({matches:false}),queueMicrotask,document:{getElementById:()=>note},location:{hash:'#layer=temp&lat=47&lon=-122&unit=F'},window:{addEventListener(){}},setTimeout:()=>1,clearTimeout(){},windyConfig:{key:'fixture'},windyInit(opts,cb){cb(api)}});
 vm.runInContext(readFileSync('Resources/Windy/map.js','utf8'),ctx);events.redrawFinished();
 assert.equal(api.overlays.temp.metric,'°F');assert.equal(stored.temp,'°F');assert.equal(note.hidden,true);
});

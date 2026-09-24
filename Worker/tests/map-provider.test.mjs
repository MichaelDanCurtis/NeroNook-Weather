import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function harness(){
 const source=readFileSync(new URL('../../Resources/Views/observatory.js',import.meta.url),'utf8');
 const elements=new Map(),created=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',append(frame){created.push(frame)}});return elements.get(id)};
 const context=vm.createContext({URL,URLSearchParams,Math,document:{createElement(){return {writes:0,setAttribute(){},remove(){this.removed=true},set src(value){this.url=value;this.writes++},get src(){return this.url}}}},$:element,text:(id,value)=>element(id).textContent=value,destroyRaster(){}});
 vm.runInContext(`let state={mapProvider:'earth',earthURL:'https://earth.nullschool.net/',windyURL:'http://127.0.0.1:53210/token/view.html',place:{id:'Seattle',lat:47.6062,lon:-122.3321},unit:'F'},layer='wind';\n`+source.slice(source.indexOf('let windyFrame='),source.indexOf('function setupMap()')),context);
 return {run:code=>vm.runInContext(code,context),created,elements};
}
test('Earth preserves exploration on refresh and changes only for layer, place or recenter',()=>{
 const h=harness();h.run('renderWindy()');const frame=h.created[0];assert.match(frame.url,/earth\.nullschool\.net\/\#current\/wind/);assert.match(frame.url,/orthographic=-122\.3,47\.6,1200/);
 h.run('renderWindy();state.unit="C";renderWindy()');assert.equal(frame.writes,1);
 h.run('layer="temp";renderWindy()');const temperature=h.created[1];assert.equal(frame.removed,true);assert.match(temperature.url,/overlay=temp/);assert.equal(temperature.writes,1);
 h.run('recenterCount++;renderWindy()');assert.equal(temperature.writes,2);
});
test('Switching provider releases the previous viewer and missing credentials show setup',()=>{
 const h=harness();h.run('renderWindy()');const earth=h.created[0];h.run('state.mapProvider="windy";renderWindy()');const windy=h.created[1];assert.equal(earth.removed,true);assert.match(windy.url,/layer=wind.*unit=F/);
 h.run('state.windyURL="";renderWindy()');assert.equal(windy.removed,true);assert.equal(h.elements.get('windy-empty').hidden,false);
 h.run('state.mapProvider="earth";renderWindy()');assert.equal(h.created.length,3);
 h.run('destroyMap()');assert.equal(h.created[2].removed,true);
});
test('Unknown remote destinations cannot be loaded as Earth',()=>{
 const h=harness();h.run('state.earthURL="https://untrusted.example/";renderWindy()');assert.equal(h.created.length,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function harness(){
 const source=readFileSync(new URL('../../Resources/Views/observatory.js',import.meta.url),'utf8');
 const observers=[],node={};
 class Observer{constructor(callback){this.callback=callback;observers.push(this)}observe(value){assert.equal(value,node)}disconnect(){this.disconnected=true}}
 const context=vm.createContext({ResizeObserver:Observer,$:()=>node,stopPlay(){}});
 vm.runInContext(source.slice(source.indexOf('let map=null'),source.indexOf('let windyFrame=')),context);
 return {observers,run:code=>vm.runInContext(code,context)};
}
test('map resizing preserves exploration and replaces its observer',()=>{
 const h=harness();h.run('map={calls:[],invalidateSize(options){this.calls.push(options)}};watchMapSize()');
 h.observers[0].callback();
 assert.equal(h.run('map.calls.length'),1);
 assert.equal(h.run('map.calls[0].pan'),false);
 assert.equal(h.run('map.calls[0].debounceMoveend'),true);
 h.run('watchMapSize()');assert.equal(h.observers[0].disconnected,true);
});
test('leaving a map releases its observer and ignores old callbacks after remount',()=>{
 const h=harness();
 h.run('let old={calls:0,invalidateSize(){this.calls++},getCenter(){return [1,2]},getZoom(){return 7},remove(){this.removed=true}};map=old;watchMapSize();destroyRaster()');
 assert.equal(h.observers[0].disconnected,true);
 h.run('map={calls:0,invalidateSize(){this.calls++}};watchMapSize()');
 h.observers[0].callback();assert.equal(h.run('old.calls'),0);assert.equal(h.run('map.calls'),0);
 h.observers[1].callback();assert.equal(h.run('map.calls'),1);
});

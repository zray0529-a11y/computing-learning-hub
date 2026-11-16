import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {bundleThree} from '../scripts/bundle-three.mjs';
import {createAtlasCameraFlight} from '../site-src/atlas-scene.mjs';

const context={console,URL,AbortController};context.globalThis=context;
try{vm.runInNewContext(bundleThree(),context,{timeout:10000});}catch(error){throw new Error(error.message);}
const {Vector3}=context.KnowledgeThree;

function fixture() {
 const queue=new Map();let next=1,time=0,renders=0,reduced=false,visible=true;
 const camera={position:new Vector3(4,10,14),zoom:1.7};
 const controls={target:new Vector3(1,0.15,2),cursor:new Vector3(0,0,0),update(){}};
 const win={performance:{now:()=>time},requestAnimationFrame:fn=>{const id=next++;queue.set(id,fn);return id;},cancelAnimationFrame:id=>queue.delete(id)};
 const flight=createAtlasCameraFlight({camera,controls,win,requestRender:()=>renders++,reducedMotion:()=>reduced,canRun:()=>visible});
 return {camera,controls,flight,queue,get renders(){return renders;},set reduced(value){reduced=value;},set visible(value){visible=value;},tick(value){time=value;const callbacks=[...queue.values()];queue.clear();callbacks.forEach(fn=>fn(time));}};
}

const near=(actual,expected)=>assert.ok(actual.distanceTo(expected)<1e-10,`${actual.toArray()} differs from ${expected.toArray()}`);

test('a concept flight preserves angle, zoom and OrbitControls cursor offset, then stops rendering',()=>{
 const f=fixture(),offset=f.camera.position.clone().sub(f.controls.target),cursorOffset=f.controls.cursor.clone().sub(f.controls.target);
 const target=new Vector3(11,0,-9);
 f.flight.flyTo(target);target.set(99,99,99);
 assert.equal(f.queue.size,1);
 f.tick(260);
 near(f.controls.target,new Vector3(1,0.15,2).lerp(new Vector3(11,0,-9),0.875));
 near(f.camera.position.clone().sub(f.controls.target),offset);
 near(f.controls.cursor.clone().sub(f.controls.target),cursorOffset);
 f.tick(520);
 near(f.controls.target,new Vector3(11,0,-9));
 assert.equal(f.camera.zoom,1.7);assert.equal(f.queue.size,0);assert.equal(f.renders,2);
});

test('a second choice replaces the flight; manual cancellation and disposal leave no scheduled work',()=>{
 const f=fixture();f.flight.flyTo(new Vector3(8,0,4));f.tick(100);
 f.flight.flyTo(new Vector3(-6,0,-5));assert.equal(f.queue.size,1);
 f.tick(620);near(f.controls.target,new Vector3(-6,0,-5));assert.equal(f.queue.size,0);
 f.flight.flyTo(new Vector3(2,0,3));f.flight.cancel();assert.equal(f.queue.size,0);
 const target=f.controls.target.clone(),renders=f.renders;f.tick(900);near(f.controls.target,target);assert.equal(f.renders,renders);
 f.flight.flyTo(new Vector3(7,0,3));f.flight.dispose();assert.equal(f.queue.size,0);
 f.flight.flyTo(new Vector3(1,0,1));f.tick(2000);near(f.controls.target,target);assert.equal(f.renders,renders);
});

test('reduced motion focuses immediately and hidden scenes stop without a background animation loop',()=>{
 const f=fixture();f.reduced=true;f.flight.flyTo(new Vector3(7,0,8));
 near(f.controls.target,new Vector3(7,0,8));assert.equal(f.queue.size,0);assert.equal(f.renders,1);
 f.reduced=false;f.flight.flyTo(new Vector3(-3,0,8));f.tick(100);
 f.reduced=true;f.flight.finish();near(f.controls.target,new Vector3(-3,0,8));assert.equal(f.queue.size,0);
 f.reduced=false;f.flight.flyTo(new Vector3(4,0,9));f.visible=false;const renders=f.renders;f.tick(700);
 assert.equal(f.queue.size,0);assert.equal(f.renders,renders);
 f.flight.flyTo(new Vector3(9,0,9));assert.equal(f.queue.size,0);
});

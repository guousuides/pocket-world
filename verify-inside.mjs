import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as math from './dist/room-math.js';
import * as physics from './dist/room-physics.js';
import {RoomRenderer}from'./dist/room-renderer.js';
const{walkable,movePlayer,rayBox,itemBounds}=physics;
assert(walkable(.72,1.61));assert(!walkable(-1,.1),'Bed collision');assert(!walkable(-.8,1.1),'Table collision');assert(!walkable(.3,-.2),'Chair collision');assert(!walkable(1.7,0),'Wall collision');
for(const delta of [[0,-30],[30,0],[0,30],[-30,0],[30,-30]]){const p=movePlayer([.72,1.57,1.61],...delta);assert(walkable(p[0],p[2]),'Large movement cannot tunnel through furniture');}
assert.equal(rayBox([0,1,0],[0,0,-1],[-1,0,-3],[1,2,-2]),2);assert.equal(rayBox([2,1,0],[0,0,-1],[-1,0,-3],[1,2,-2]),Infinity);
const geometry=JSON.parse(await fs.readFile('dist/room-geometry.json','utf8')),data=JSON.parse(await fs.readFile('dist/room.json','utf8'));
for(const id of ['book','note','phone','archive'])assert(geometry.meshes.some(m=>m.interaction===id),'Physical model '+id+' exists');
const source=(await fs.readFile('dist/inside.js','utf8')).replace(/^import.*;\r?\n/gm,'');
for(const[width,height]of[[1440,900],[390,844]]){
 const els=new Map(),listeners={};let now=0,rendered=0;
 class Element{constructor(){this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};this.hidden=true;this.open=false;this.dataset={};this.handlers={};this.isConnected=true;}append(){}setAttribute(){}focus(){}remove(){}addEventListener(name,fn){this.handlers[name]=fn;}showModal(){this.open=true;}close(){this.open=false;this.handlers.close?.();}getBoundingClientRect(){return{left:0,top:0,right:500,bottom:500};}setPointerCapture(){}closest(){return null;}}
 const get=s=>{if(!els.has(s))els.set(s,new Element());return els.get(s);};
 const go=['book','pc','note','archive'].map(id=>{const e=new Element();e.dataset.go=id;return e;});
 const sandbox={...math,...physics,RoomRenderer:class{constructor(){}render(args){assert([...args.vp].every(Number.isFinite));assert([...args.itemModel].every(Number.isFinite));rendered++;}},console,Math,Date,Float32Array,innerWidth:width,innerHeight:height,devicePixelRatio:1,performance:{now:()=>now},document:{querySelector:get,querySelectorAll:s=>s==='[data-go]'?go:[],createElement:()=>new Element(),body:new Element(),addEventListener:(k,fn)=>listeners[k]=fn,pointerLockElement:null},matchMedia:()=>({matches:false}),fetch:async p=>({ok:true,json:async()=>p.includes('geometry')?geometry:data}),setTimeout:fn=>{fn();return 1;},clearTimeout(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},addEventListener(){},location:{reload(){}}};
 vm.createContext(sandbox);const api=await vm.runInContext(`(async()=>{${source}\nreturn{goTo,findItem,rayFor,take,heldMatrices,returnHeld,readHeld,readSpot,updateMovement,tick,keys,getState:()=>({eye:[...eye],held,readingSpot,page}),setTime:t=>{},setAngles:(y,p)=>{yaw=y;pitch=p;}};})()`,sandbox);
 for(const id of ['book','note','archive']){api.goTo(id);let hit=api.findItem(api.rayFor());assert.equal(hit?.id,id,`${id} is reachable from its destination`);assert(hit.reachable,`${id} within arm reach`);api.take(id);now+=1000;let matrices=api.heldMatrices(now);assert([...matrices.itemModel].every(Number.isFinite));assert.equal(api.getState().held.phase,'hold');api.readHeld();assert.equal(get('#room-reader').open,true);assert(get('#reader-copy').textContent.length>10);api.returnHeld();now+=1000;api.heldMatrices(now);assert.equal(api.getState().held,null);assert.equal(get('#room-reader').open,false);}
 api.goTo('pc');let hit=api.findItem(api.rayFor());assert.equal(hit?.id,'pc');api.take('pc');assert.equal(get('#room-reader').open,true);get('#reader-close').onclick();
 const state=api.getState(),angle=physics.lookAngles(state.eye,itemBounds.phone.center);api.setAngles(angle.yaw,angle.pitch);hit=api.findItem(api.rayFor());assert.equal(hit?.id,'phone');assert(hit.reachable);api.take('phone');now+=1000;api.heldMatrices(now);api.readHeld();assert.equal(get('#room-reader').open,true);api.returnHeld();now+=1000;api.heldMatrices(now);
 api.tick(now);assert.equal(rendered,1);
 console.log(`PASS first-person ${width}x${height}: movement bounds, four pickup/read/return flows, PC, finite perspective and hand matrices`);
}
// Run the real mesh upload, material packing and renderer command path with a GPU stub.
let draws=0,totalFloats=0;let shaderId=0;const constants=new Map();const gl=new Proxy({createProgram:()=>({}),createShader:()=>({}),getShaderParameter:()=>true,getProgramParameter:()=>true,createBuffer:()=>({}),createTexture:()=>({}),createFramebuffer:()=>({}),createRenderbuffer:()=>({}),getAttribLocation:()=>0,getUniformLocation:()=>({}),checkFramebufferStatus:()=>100,get FRAMEBUFFER_COMPLETE(){return 100;},bufferData:(t,v)=>{assert([...v].every(Number.isFinite));totalFloats+=v.length;},drawArrays:()=>draws++},{get(t,k){if(k in t)return t[k];if(k===k.toUpperCase()){if(!constants.has(k))constants.set(k,constants.size+1000);return constants.get(k);}return()=>{};}});
globalThis.devicePixelRatio=1;globalThis.innerWidth=1440;globalThis.innerHeight=900;
const canvas={width:0,height:0,getContext:()=>gl},renderer=new RoomRenderer(canvas,geometry.meshes);renderer.render({vp:math.identity(),eye:[.72,1.57,1.61],evening:0,held:null,itemModel:math.identity(),handModel:null});assert(draws>=10);assert(totalFloats>1000000);console.log('PASS real renderer mesh packing, smooth normals, material attributes, shadow and scene draw paths');

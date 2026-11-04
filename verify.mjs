import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const datasets={};for(const file of ['campus.json','room.json','room-geometry.json'])datasets[file]=JSON.parse(await fs.readFile(new URL('./dist/'+file,import.meta.url),'utf8'));
const source=await fs.readFile(new URL('./dist/app.js',import.meta.url),'utf8');
// Verify geometry, responsive projection and interactions without claiming browser QA.
for(const scene of ['campus','room'])for(const [width,height] of [[1440,900],[390,844]]){
 const data=datasets[scene+'.json'];
 const elements=new Map();let uploaded;
 class Element{
  constructor(){this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};this.children=[];this.hidden=true;this.attributes={};this.listeners={};this.isConnected=true;}
  append(e){this.children.push(e);} replaceChildren(){this.children=[];} setAttribute(k,v){this.attributes[k]=v;} addEventListener(k,fn){this.listeners[k]=fn;} focus(){} remove(){} showModal(){this.open=true;} close(){this.open=false;} setPointerCapture(){} getBoundingClientRect(){return{left:0,top:0,right:500,bottom:500};}
 }
 const gl=new Proxy({bufferData:(type,v)=>{uploaded=v},getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>0,createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({})},{get(t,k){return k in t?t[k]:()=>{};}});
 const get=s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s);};get('#world').getContext=()=>gl;
 const sandbox={console,URLSearchParams,location:{search:"?scene="+scene},Float32Array,Math,Date,Intl,innerWidth:width,innerHeight:height,devicePixelRatio:1,document:{querySelector:s=>s==='dialog[open]'?null:get(s),querySelectorAll:()=>[get('#details'),get('#location-dialog')],createElement:()=>new Element(),body:new Element(),addEventListener(){},activeElement:new Element()},matchMedia:()=>({matches:false}),fetch:async path=>({ok:true,json:async()=>datasets[path.replace("./","")]}),requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:fn=>fn(),setInterval(){},addEventListener(){}};
 vm.createContext(sandbox);
 const result=await vm.runInContext(`(async()=>{${source}\nreturn {openSpot,closePanel,draw,project,markers,getCount:()=>count};})()`,sandbox);
 assert(uploaded?.length>10000,'Model must contain geometry');assert([...uploaded].every(Number.isFinite),'All geometry must be finite');assert.equal(get('#fallback').hidden,true,'WebGL setup must succeed');assert.equal(result.markers.length,data.spots.length);
 for(const b of data.buildings){const [x,y]=result.project([b.x,b.h,b.z]);assert(x>0&&x<width&&y>0&&y<height,`Building ${b.id} must fit ${width}x${height}`);}
 for(const s of data.spots){result.openSpot(s.id);assert.equal(get('#panel').hidden,false);assert.equal(get('#shelf').children.length,3);for(const book of get('#shelf').children){book.onclick();assert.equal(get('#details').open,true);assert(get('#detail-content').innerHTML.includes('<h2>'));get('#close-details').onclick();assert.equal(get('#details').open,false);}result.closePanel();assert.equal(get('#panel').hidden,true);}
 get('#day').onclick();assert.equal(get('#day').textContent,'☾');get('#day').onclick();assert.equal(get('#day').textContent,'☀');get('#locations').onclick();assert.equal(get('#location-dialog').open,true);get('#location-list').children[0].onclick();assert.equal(get('#location-dialog').open,false);assert.equal(get('#panel').hidden,false);get('#reset').onclick();assert.equal(get('#panel').hidden,true);
 console.log(`PASS ${scene} ${width}x${height}: ${uploaded.length/9} vertices, ${data.buildings.length} visible objects, ${data.spots.length} shelves, ${data.spots.length*3} book details, theme and navigation`);
}
for(const file of ['nishiwaseda-study.glb','my-room.glb']){const glb=await fs.readFile(new URL('./dist/'+file,import.meta.url));assert.equal(glb.toString('ascii',0,4),'glTF');assert.equal(glb.readUInt32LE(4),2);assert.equal(glb.readUInt32LE(8),glb.length);const scene=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)));const expected=file==='my-room.glb'?4:3;assert.equal(scene.nodes.filter(n=>n.name?.startsWith('HOTSPOT_')).length,expected);console.log('PASS Blender '+file+': valid glTF 2.0 container, '+expected+' named hotspots');}

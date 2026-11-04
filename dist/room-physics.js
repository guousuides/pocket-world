import{clamp}from'./room-math.js';
// Furniture footprints, in metres. A small player capsule can slide along edges.
export const obstacles=[
 {id:'bed',minX:-1.56,maxX:-.53,minZ:-1.38,maxZ:.8},
 {id:'table',minX:-1.6,maxX:-.16,minZ:.73,maxZ:1.51},
 {id:'desk',minX:-.55,maxX:1.43,minZ:-1.65,maxZ:-.83},
 {id:'cabinet',minX:1.07,maxX:1.61,minZ:-1.1,maxZ:.36},
 {id:'chair',minX:.035,maxX:.57,minZ:-.46,maxZ:.15}
];
export function walkable(x,z,radius=.115){if(x< -1.57+radius||x>1.57-radius||z< -1.75+radius||z>1.79-radius)return false;return !obstacles.some(b=>x>b.minX-radius&&x<b.maxX+radius&&z>b.minZ-radius&&z<b.maxZ+radius);}
export function movePlayer(position,dx,dz){const p=[...position],steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.035));for(let i=0;i<steps;i++){const x=p[0]+dx/steps,z=p[2]+dz/steps;if(walkable(x,p[2]))p[0]=x;if(walkable(p[0],z))p[2]=z;}return p;}
export function rayBox(origin,dir,min,max){let lo=0,hi=Infinity;for(let i=0;i<3;i++){if(Math.abs(dir[i])<1e-8){if(origin[i]<min[i]||origin[i]>max[i])return Infinity;continue;}let a=(min[i]-origin[i])/dir[i],b=(max[i]-origin[i])/dir[i];if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return Infinity;}return lo;}
export function facing(yaw,pitch){return[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];}
export function lookAngles(from,to){const x=to[0]-from[0],y=to[1]-from[1],z=to[2]-from[2];return{yaw:Math.atan2(x,-z),pitch:clamp(Math.atan2(y,Math.hypot(x,z)),-1.35,1.15)};}
export const itemBounds={
 book:{min:[-1.38,.88,-1.63],max:[-.92,.94,-1.3],center:[-1.14,.905,-1.46],spot:'books',label:'作品集を取る'},
 note:{min:[-1.0,.74,.93],max:[-.66,.8,1.24],center:[-.83,.76,1.09],spot:'note',label:'ノートを取る'},
 phone:{min:[.97,.84,-1.17],max:[1.11,.88,-.95],center:[1.04,.857,-1.06],spot:'pc',label:'スマートフォンを取る'},
 pc:{min:[.14,.82,-1.48],max:[.67,1.17,-1.08],center:[.4,1,-1.28],spot:'pc',label:'PCを見る'},
 archive:{min:[.89,.355,.7],max:[1.07,.48,.88],center:[.98,.4,.79],spot:'trash',label:'ボツ案のメモを拾う'}
};

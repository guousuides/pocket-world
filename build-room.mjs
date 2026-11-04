// Shared, dependency-free mesh source for the website and the Blender export.
import fs from 'node:fs/promises';
const meshes=[];
const palette={wall:'#e9e5da',trim:'#f5f0e5',floor:'#cbb899',wood:'#815037',edge:'#67402d',dark:'#282c2c',silver:'#b1b6b1',linen:'#eee8d9'};
let group='Room';
const sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function mesh(name,color){const m={name:group+' / '+name,color,positions:[]};meshes.push(m);return m;}
function tri(m,a,b,c){m.positions.push(...a,...b,...c);}
function quad(m,a,b,c,d){tri(m,a,b,c);tri(m,a,c,d);}
function box(name,x,y,z,w,h,d,color,rx=0,ry=0){const m=mesh(name,color),raw=[[-w/2,0,-d/2],[w/2,0,-d/2],[w/2,h,-d/2],[-w/2,h,-d/2],[-w/2,0,d/2],[w/2,0,d/2],[w/2,h,d/2],[-w/2,h,d/2]];const p=raw.map(([a,b,c])=>{const by=b*Math.cos(rx)-c*Math.sin(rx),cz=b*Math.sin(rx)+c*Math.cos(rx);return[x+a*Math.cos(ry)+cz*Math.sin(ry),y+by,z-a*Math.sin(ry)+cz*Math.cos(ry)];});for(const f of [[4,5,6,7],[1,0,3,2],[5,1,2,6],[0,4,7,3],[7,6,2,3],[0,1,5,4]])quad(m,...f.map(i=>p[i]));return m;}
function rounded(name,x,y,z,w,h,d,r,color){const m=mesh(name,color),ring=[];for(let k=0;k<4;k++){const cx=k===0||k===3?w/2-r:-w/2+r,cz=k<2?d/2-r:-d/2+r;for(let i=0;i<=5;i++){const angle=k*Math.PI/2+i*Math.PI/10;ring.push([x+cx+Math.cos(angle)*r,z+cz+Math.sin(angle)*r]);}}for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];tri(m,[x,y+h,z],[b[0],y+h,b[1]],[a[0],y+h,a[1]]);tri(m,[x,y,z],[a[0],y,a[1]],[b[0],y,b[1]]);quad(m,[a[0],y,a[1]],[a[0],y+h,a[1]],[b[0],y+h,b[1]],[b[0],y,b[1]]);}return m;}
function cylinder(name,x,y,z,r,h,color,sides=20,r2=r){const m=mesh(name,color);for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2,b=(i+1)/sides*Math.PI*2,A=[x+r*Math.cos(a),y,z+r*Math.sin(a)],B=[x+r*Math.cos(b),y,z+r*Math.sin(b)],C=[x+r2*Math.cos(b),y+h,z+r2*Math.sin(b)],D=[x+r2*Math.cos(a),y+h,z+r2*Math.sin(a)];quad(m,A,D,C,B);tri(m,[x,y+h,z],C,D);tri(m,[x,y,z],A,B);}return m;}
function ellipsoid(name,x,y,z,rx,ry,rz,color){const m=mesh(name,color);const p=(a,b)=>[x+rx*Math.sin(a)*Math.cos(b),y+ry*Math.cos(a),z+rz*Math.sin(a)*Math.sin(b)];for(let i=0;i<10;i++)for(let j=0;j<20;j++){const a=.001+i/10*(Math.PI-.002),b=j/20*Math.PI*2,a2=.001+(i+1)/10*(Math.PI-.002),b2=(j+1)/20*Math.PI*2;quad(m,p(a,b),p(a,b2),p(a2,b2),p(a2,b));}return m;}
function rod(name,a,b,r,color){const m=mesh(name,color),v=sub(b,a),len=Math.hypot(...v),n=v.map(x=>x/len),ref=Math.abs(n[1])>.9?[1,0,0]:[0,1,0],u=cross(n,ref),ul=Math.hypot(...u),U=u.map(x=>x/ul),V=cross(n,U);for(let i=0;i<10;i++){const at=t=>a.map((x,k)=>x+r*(U[k]*Math.cos(t)+V[k]*Math.sin(t))),bt=t=>b.map((x,k)=>x+r*(U[k]*Math.cos(t)+V[k]*Math.sin(t))),t=i/10*Math.PI*2,t2=(i+1)/10*Math.PI*2;quad(m,at(t),at(t2),bt(t2),bt(t));}return m;}
function flatShadow(x,z,w,d){rounded('Soft contact shadow',x,.008,z,w,.003,d,.08,'#b8a98f');}
group='Architecture';
box('Floating foundation',0,-.14,0,3.3,.14,3.8,'#c4b8a2');
// Individually staggered oak boards, matching the light floor in the photograph.
for(let r=0;r<18;r++){let z=-1.79+r*.205;for(let c=0;c<5;c++){const x=-2.1+c*.93+(r%2)*.4,w=Math.min(.92,1.59-x)-Math.max(0,-1.59-x);if(w<=0)continue;const left=Math.max(-1.59,x);box('Oak floorboard',left+w/2,0,z,w,.023,.199,['#d8c8ad','#d3c0a2','#dbcbb1','#cdbb9e'][(r*7+c*3)%4]);}}
box('Rear wall left',-1.145,0,-1.86,.99,2.65,.11,palette.wall);box('Rear wall right',1.47,0,-1.86,.35,2.65,.11,palette.wall);box('Window parapet',.31,0,-1.86,1.92,.86,.11,palette.wall);box('Window lintel',.31,2.24,-1.86,1.92,.41,.11,palette.wall);
box('Left cutaway wall',-1.65,0,0,.1,2.65,3.8,palette.wall);box('Right wall return',1.65,0,-1.6,.1,2.65,.55,palette.wall);box('Left skirting',-1.586,.025,0,.035,.075,3.7,'#d0c3ae');box('Rear skirting',0,.025,-1.795,3.2,.075,.035,'#d0c3ae');
box('Curtain pelmet',.23,2.29,-1.69,2.75,.3,.24,'#eeeadf');
// Blue-grey window panes, aluminium sash and the diagonal safety-wire pattern.
box('Window dark exterior',.31,.86,-1.89,1.92,1.4,.025,'#5c686b');
for(const x of [-.66,.3,1.27])box('Aluminium window frame',x,.86,-1.775,.035,1.4,.04,'#a4a9a1');for(const y of [.86,1.02,2.24])box('Horizontal sash',.31,y,-1.77,1.97,.03,.06,'#aab0a6');
for(let x=-.63;x<1.23;x+=.14){rod('Wired glass diagonal',[x,.99,-1.755],[Math.min(x+.3,1.24),1.5,-1.755],.0018,'#84918b');rod('Wired glass diagonal',[x,1.5,-1.755],[Math.min(x+.3,1.24),2.2,-1.755],.0018,'#84918b');}
box('Window sill',.31,.84,-1.72,2.02,.045,.18,'#f3efe2');
function curtain(name,x,w,z,color,length,fold){const m=mesh(name,color);const top=2.28,bottom=top-length,cols=44,rows=14;const point=(i,j)=>{const u=i/cols,v=j/rows;return[x+(u-.5)*w,top-v*length,z+Math.sin(u*Math.PI*fold)*(.032+.017*v)+Math.sin(v*2.6+u*3)*.015+Math.cos(u*15)*v*.008];};for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)quad(m,point(i,j),point(i,j+1),point(i+1,j+1),point(i+1,j));}
curtain('Left cream curtain',-.77,.6,-1.56,'#d5c9ad',1.85,15);curtain('Right cream curtain',1.2,.44,-1.56,'#d8ccb2',1.85,13);curtain('Left sheer curtain',-.3,.42,-1.66,'#e5e4d9',1.8,11);curtain('Right sheer curtain',.9,.25,-1.64,'#e1e1d8',1.83,9);
group='Bed';
flatShadow(-1.01,-.15,1.05,2.22);box('Wooden bed frame',-1.04,.18,-.28,.99,.24,2.12,'#a47443');rounded('Mattress',-1.04,.41,-.28,.97,.16,2.09,.06,'#eee9dd');
for(const z of [-1.28,.72]){box('Bed end rail',-1.04,.52,z,.97,.1,.06,'#aa7945');for(const x of [-1.49,-.59]){cylinder('Turned wooden post',x,.17,z,.035,.78,'#a77644');ellipsoid('Bedpost finial',x,.96,z,.047,.045,.047,'#b0804c');}}
rounded('Pillow',-1.04,.57,-1.0,.77,.11,.38,.12,'#eee8dc');rounded('Light duvet',-1.02,.56,-.04,.95,.095,1.5,.08,'#d8dcd3');
// Small printed motifs and soft, uneven folds in the bedding.
for(let i=0;i<28;i++){const x=-1.4+(i*17%71)/100,z=-.69+(i*23%130)/100;ellipsoid('Bedding print',x,.658,z,.026,.002,.04,['#b6c0b4','#bdc7bc','#c6cec3'][i%3]);}
for(let i=0;i<6;i++)rod('Duvet fold',[-1.45,.659,-.6+i*.23],[-.65,.66,-.5+i*.23],.004,'#e3e6dd');
ellipsoid('Pink soft toy body',-1.13,.74,.15,.15,.09,.17,'#d9a4b0');ellipsoid('Pink soft toy head',-1.2,.8,.04,.105,.1,.1,'#e3b1b9');ellipsoid('Soft toy ear',-1.24,.9,.0,.035,.085,.035,'#e4b2bb');ellipsoid('Soft toy ear',-1.15,.9,.02,.035,.085,.035,'#e4b2bb');
// The pale garment draped over the bed rail.
const cloth=mesh('Blush fabric on headboard','#d7c2b9');for(let i=0;i<18;i++)for(let j=0;j<14;j++){const p=(u,v)=>[-1.43+u*.75,.6+Math.sin(v*Math.PI)*.49,-1.17+v*.28+Math.sin(u*28)*.018];quad(cloth,p(i/18,j/14),p(i/18,(j+1)/14),p((i+1)/18,(j+1)/14),p((i+1)/18,j/14));}
group='Desk';
flatShadow(.43,-1.22,1.86,.75);rounded('Rounded walnut desktop',.43,.755,-1.22,1.91,.055,.75,.13,palette.wood);for(const x of [-.42,1.26])for(const z of [-1.48,-.95])box('Black desk leg',x,.025,z,.045,.73,.045,'#292c29');box('Desk modesty panel',.43,.17,-1.53,1.73,.45,.035,'#383b31');
// Stylized generic laptop display. No photograph or private screen content is used.
rounded('Laptop chassis',.4,.817,-1.28,.48,.021,.31,.016,'#c3c7c2');box('Laptop keyboard inset',.4,.84,-1.28,.41,.003,.14,'#747d79');for(let r=0;r<4;r++)for(let c=0;c<11;c++)box('Laptop key',.215+c*.036,.844,-1.33+r*.03,.026,.003,.02,'#d0d1c9');box('Trackpad',.4,.842,-1.17,.16,.002,.065,'#a6aca6');
box('Laptop display frame',.4,.84,-1.425,.48,.31,.018,'#b3bab5',-.16);box('Laptop screen',.4,.861,-1.412,.439,.264,.006,'#293c43',-.16);box('Screen sidebar',.222,.88,-1.402,.065,.22,.004,'#344952',-.16);
for(const[x,y,w,h,color]of[[.33,.987,.1,.083,'#8da9aa'],[.46,.987,.12,.083,'#b4bba5'],[.33,.89,.1,.07,'#586f77'],[.46,.89,.12,.07,'#b2a28d']])box('Screen thumbnail',x,y,-1.393-(y-.86)*.16,w,h,.003,color,-.16);
rounded('Mechanical keyboard',.43,.817,-.94,.53,.027,.16,.017,'#333d38');for(let r=0;r<4;r++)for(let c=0;c<14;c++)box('Mechanical key',.19+c*.035,.845,-.997+r*.035,.028,.009,.026,r===3&&c<5?'#b4804e':'#aaa99d');
ellipsoid('Mouse',.9,.843,-.95,.044,.026,.068,'#333b36');rod('Mouse cable',[.92,.83,-1.01],[1.02,.83,-1.3],.0035,'#414944');
// Distinctive white desk lamp rising in front of the window.
rounded('Lamp base',.28,.817,-1.58,.24,.025,.14,.035,'#e9e6d7');rod('Lamp upright',[.29,.85,-1.57],[.3,1.43,-1.57],.016,'#dedfcd');rod('Lamp angled joint',[.3,1.43,-1.57],[.24,1.56,-1.57],.018,'#e9e7d4');rounded('Long light bar',.22,1.56,-1.57,.88,.025,.045,.018,'#edecd8');box('Lamp diffuser',.22,1.554,-1.55,.81,.008,.018,'#fff3ca');
for(let i=0;i<5;i++)box('Loose study papers',-.23+i*.01,.817+i*.003,-1.17,.35,.002,.25,'#efeee3',0,(i-2)*.04);rounded('Green pencil pouch',-.23,.84,-1.22,.27,.065,.13,.05,'#579477');rod('Pouch zip',[-.34,.906,-1.2],[-.12,.906,-1.2],.002,'#d5c8a2');
box('Notebook under phone',1.04,.817,-1.07,.25,.025,.21,'#e8e3d1');rounded('Phone',1.04,.845,-1.06,.1,.012,.19,.012,'#747b70');box('Phone screen',1.04,.858,-1.06,.085,.002,.16,'#a4b4af');
for(let i=0;i<4;i++){const x=.97+i*.058;rod('Cable on desk',[x,.823,-1.45],[x-.1,.823,-1.16],.0025,'#e4e3d7');rod('Cable loop',[x-.1,.823,-1.16],[x+.04,.823,-1.04],.0025,'#e4e3d7');}box('Power strip',1.23,.82,-1.48,.1,.055,.22,'#e7e4d7');
group='Chair';
flatShadow(.3,-.26,.78,.8);cylinder('Chair gas lift',.3,.12,-.22,.027,.38,'#303633');
for(let i=0;i<5;i++){const a=i/5*Math.PI*2,x=.3+Math.cos(a)*.37,z=-.22+Math.sin(a)*.37;rod('Five-star base',[.3,.16,-.22],[x,.07,z],.023,'#282e2b');cylinder('Caster',x,.026,z,.039,.065,'#242b27',12);}
rounded('Black seat',.3,.46,-.26,.6,.065,.53,.09,'#303633');rounded('Seat cushion',.3,.525,-.28,.52,.045,.43,.08,'#b2ad9c');
// Curved, slightly leaning mesh chair back with an inset fabric panel.
for(const [name,w,h,col,zz] of [['Chair back frame',.59,.67,'#272e2b',.0],['Chair mesh',.51,.58,'#3d4440',.012]]){const m=mesh(name,col);for(let i=0;i<16;i++)for(let j=0;j<12;j++){const p=(u,v)=>[.3+(u-.5)*w,.54+v*h,zz+.1*v+Math.pow((u-.5)*2,2)*.045];quad(m,p(i/16,j/12),p(i/16,(j+1)/12),p((i+1)/16,(j+1)/12),p((i+1)/16,j/12));quad(m,p(i/16,j/12),p((i+1)/16,j/12),p((i+1)/16,(j+1)/12),p(i/16,(j+1)/12));}}
for(const x of [.005,.595]){rod('Arm support',[x,.5,-.1],[x,.74,-.13],.017,'#292f2b');rounded('Armrest',x,.74,-.17,.065,.035,.29,.025,'#282e2b');}
group='Book corner';
box('Bedside book cabinet',-1.17,.02,-1.49,.49,.77,.45,'#665044');box('Cabinet top',-1.17,.79,-1.49,.52,.025,.47,'#80725f');
for(const[x,z,w,d,h,col,rot]of[[-1.17,-1.47,.37,.26,.035,'#e8e4d5',.03],[-1.19,-1.48,.35,.24,.033,'#8d936f',-.08],[-1.14,-1.46,.38,.26,.028,'#e4ded0',.11]]){box('Stacked book',x,.819+(col==='#8d936f'?.036:col==='#e4ded0'?.071:0),z,w,h,d,col,0,rot);}
rounded('Dark carry case',-1.29,.83,-1.63,.26,.19,.13,.035,'#333c37');
// Visible spines on a shallow shelf, an interactive interpretation of the book corner.
box('Small shelf recess',-1.17,.2,-1.25,.4,.44,.02,'#423c30');for(let i=0;i<6;i++)box('Book spine',-1.33+i*.057,.23,-1.235,.043,.23+(i%3)*.045,.07,['#8e493c','#62715b','#b8a782','#54686c','#c3b493','#786354'][i]);
group='Front table';
flatShadow(-.88,1.12,1.44,.78);rounded('Foreground tabletop',-.88,.7,1.12,1.44,.045,.78,.07,'#78604c');for(const x of [-1.47,-.3]){box('Metal table upright',x,.025,1.12,.045,.675,.045,'#373d37');box('T-shaped table foot',x,.025,1.12,.065,.035,.69,'#343a34');}
box('Closed notebook',-.83,.747,1.09,.3,.023,.23,'#a28b65',0,-.08);box('Notebook pages',-.83,.753,1.09,.282,.014,.215,'#e8e2cf',0,-.08);box('Notebook cover',-.83,.769,1.09,.3,.004,.23,'#817653',0,-.08);rod('Pen',[-.67,.753,1.3],[-.44,.753,1.28],.007,'#343b37');
rounded('Tissue packet',-1.31,.748,1.02,.23,.055,.17,.035,'#eeeadd');box('Tissue opening',-1.31,.804,1.02,.08,.003,.025,'#cfcab9');
cylinder('Water bottle',-.38,.747,.95,.042,.23,'#c0d0c6',24);cylinder('Bottle label',-.38,.82,.95,.043,.09,'#dddeda',24);cylinder('Bottle neck',-.38,.977,.95,.024,.035,'#b7c7be');cylinder('White bottle cap',-.38,1.012,.95,.026,.025,'#e8e7dc');box('Blue label detail',-.38,.84,1,.038,.045,.003,'#8da7ae');
group='Right cabinet';
flatShadow(1.35,-.35,.53,1.49);box('Tall wooden cabinet',1.35,.025,-.38,.51,1.06,1.4,'#8e6441');box('Cabinet top',1.35,1.085,-.38,.55,.035,1.44,'#a17e55');box('Cabinet front panel',1.35,.1,.327,.43,.88,.018,'#9b7250');rod('Cabinet handle',[1.32,.71,.349],[1.4,.71,.349],.008,'#b6ae93');
box('Desk mat',1.35,1.122,-.42,.47,.004,1.12,'#b9b79d');for(let i=0;i<3;i++)box('Cabinet paper stack',1.27+i*.02,1.13+i*.004,-.14,.3,.003,.22,'#ebe3ca',0,-.05+i*.06);
cylinder('Green small tube',1.2,1.14,-.51,.021,.14,'#64815c');cylinder('Tube cap',1.2,1.28,-.51,.022,.025,'#ece8da');cylinder('Burgundy tube',1.29,1.14,-.46,.025,.18,'#8b4d48');
rounded('Headphone case',1.38,1.13,-.88,.29,.12,.23,.035,'#343e37');
// Small decorative pagoda visible at the rear of the cabinet.
cylinder('Pagoda base',1.45,1.13,-1.0,.055,.035,'#4e5042',8);for(let i=0;i<7;i++){cylinder('Pagoda tier',1.45,1.17+i*.033,-1,.05-i*.004,.016,'#505143',8,.036-i*.003);cylinder('Pagoda pillar',1.45,1.186+i*.033,-1,.018,.018,'#6b6952',8);}rod('Pagoda finial',[1.45,1.38,-1],[1.45,1.49,-1],.005,'#68634b');
group='Floor details';
cylinder('Green wastebasket',.98,.025,.79,.145,.32,'#8cb46a',24,.18);cylinder('Wastebasket rim',.98,.34,.79,.181,.018,'#b9ce95',24);cylinder('Wastebasket opening',.98,.359,.79,.158,.004,'#7d985c',24);for(let i=0;i<11;i++){const a=i/11*Math.PI*2;ellipsoid('Bag rim fold',.98+Math.cos(a)*.16,.353,.79+Math.sin(a)*.16,.03,.024,.027,'#c7d8ad');}
// A neutral storage basket underneath the front table.
rounded('Under-table basket',-1.15,.025,1.45,.43,.29,.36,.045,'#b4ae97');rounded('Basket contents',-1.15,.28,1.45,.38,.04,.3,.035,'#3c4338');

// Interior-only closure. Keep the original open dollhouse view available.
group='Interior shell';
for(const m of [
 box('Right plaster wall',1.65,0,0,.1,2.65,3.8,palette.wall),
 box('Ceiling',0,2.65,0,3.3,.09,3.8,'#eeeade'),
 box('Entrance wall left',-.5,0,1.86,2.2,2.65,.1,palette.wall),
 box('Entrance header',1.1,2.08,1.86,1.0,.57,.1,palette.wall),
 box('Entrance wall right',1.59,0,1.86,.12,2.65,.1,palette.wall),
 box('Door left jamb',.62,0,1.8,.055,2.08,.16,'#c3b393'),
 box('Door upper jamb',1.1,2.04,1.8,1,.055,.16,'#c3b393'),
 box('Door beyond',1.28,0,2.02,.8,2.06,.035,'#c1ad89',0,.12)
])m.interiorOnly=true;
rounded('Wall switch',-1.57,1.32,-1.02,.035,.1,.075,.01,'#e3ddcc');
rounded('Ceiling light mount',.1,2.6,.1,.34,.035,.34,.12,'#deded0');
rounded('Ceiling diffuser',.1,2.55,.1,.32,.06,.32,.12,'#f1edda');

group='Book corner';
box('Portfolio lower cover',-1.14,.887,-1.46,.383,.005,.266,'#6b7c66',0,.11);
box('Portfolio upper cover',-1.14,.918,-1.46,.383,.005,.266,'#6b7c66',0,.11);
box('Portfolio title plaque',-1.14,.923,-1.46,.2,.0015,.11,'#b0b496',0,.11);
for(let i=0;i<3;i++)box('Portfolio title rule',-1.14,.925,-1.49+i*.022,.13-i*.02,.001,.003,'#69785d',0,.11);
group='Floor details';
ellipsoid('Archive paper',.98,.4,.79,.065,.045,.065,'#ded7c5');
for(let i=0;i<4;i++)rod('Archive paper fold',[.94+i*.02,.428,.76],[.96+i*.015,.44,.82],.002,'#bfbba7');

for(const m of meshes){
 if(m.name.startsWith('Book corner / Portfolio')||(m.name==='Book corner / Stacked book'&&m.color==='#e4ded0'))m.interaction='book';
 if(m.name.startsWith('Front table / ')&&/Closed notebook|Notebook pages|Notebook cover/.test(m.name))m.interaction='note';
 if(m.name==='Desk / Phone'||m.name==='Desk / Phone screen')m.interaction='phone';
 if(m.name.startsWith('Floor details / Archive paper'))m.interaction='archive';
 if(/curtain|Duvet fold|soft toy|Soft toy|Bedding print|Bottle|Water bottle|Mouse|Bedpost finial|Turned wooden post|Chair gas lift|Caster|Pagoda|Wastebasket|wastebasket|Tube|small tube|Bag rim|Cable|cable|Lamp upright|Lamp angled|Pen|support|handle/i.test(m.name))m.smooth=true;
}
// Filter degenerate triangles once, so both renderers receive valid normals.
for(const m of meshes){const out=[];for(let i=0;i<m.positions.length;i+=9){const p=m.positions.slice(i,i+9),a=p.slice(0,3),b=p.slice(3,6),c=p.slice(6,9);if(Math.hypot(...cross(sub(b,a),sub(c,a)))>1e-10)out.push(...p);}m.positions=out;}
const result={note:'写真1枚から構成した簡略模型。寸法と見えない部分は推定。',meshes};
await fs.writeFile(new URL('./dist/room-geometry.json',import.meta.url),JSON.stringify(result));
console.log(`Room built: ${meshes.length} mesh parts, ${meshes.reduce((n,m)=>n+m.positions.length/9,0)} triangles`);

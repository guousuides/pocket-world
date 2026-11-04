import{RoomRenderer}from'./room-renderer.js';
import{add,sub,scale,dot,normalize,cross,identity,multiply,translation,rotationX,rotationY,rotationZ,perspective,lookAt,transformPoint,clamp,mix,smooth}from'./room-math.js';
import{movePlayer,walkable,rayBox,facing,lookAngles,itemBounds,obstacles}from'./room-physics.js';
const $=s=>document.querySelector(s),canvas=$('#world'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.body.classList.add('inside');document.title='Pocket World — 部屋の中へ';$('#room-scene').setAttribute('aria-current','page');canvas.tabIndex=0;canvas.setAttribute('aria-label','部屋の一人称ビュー。WASDまたは矢印で移動、ドラッグで見回し、Eで物を取る。');
const ui=document.createElement('section');ui.id='inside-ui';ui.innerHTML=`
 <div class="room-vignette" aria-hidden="true"></div>
 <div class="room-caption"><span class="eyebrow">MY ROOM / FIRST PERSON</span><p>つくる日々の、その中へ。</p></div>
 <div class="room-top-tools"><a href="?scene=room&view=model">模型で見る ↗</a><button id="inside-light" aria-label="夕方の光に切り替え">☀ 光</button><button id="mouse-lock">マウスで見回す</button><button id="inside-help" aria-label="操作ガイドを開く">?</button></div>
 <div id="crosshair" aria-hidden="true"><i></i></div>
 <div id="grab-prompt" hidden><span id="grab-key">E</span><span id="grab-label"></span></div>
 <div class="welcome-note" id="welcome-note"><span class="eyebrow">MAKE YOURSELF AT HOME</span><h1>僕の部屋へ、ようこそ。</h1><p>ドラッグで見回す。WASDで近づく。<br>本やノートに手を伸ばしてみてください。</p><button id="start-room">部屋を歩く <span>→</span></button></div>
 <nav class="room-destinations" aria-label="部屋の移動先"><span>近くへ移動</span><button data-go="book">奥の本</button><button data-go="pc">机の前</button><button data-go="note">ノート</button></nav>
 <div class="room-controls"><span><kbd>W A S D</kbd> 移動</span><span>ドラッグで見回す</span><span><kbd>E</kbd> 手に取る</span></div>
 <div class="touch-walk" aria-label="移動操作"><button data-key="KeyW" aria-label="前に進む">↑</button><div><button data-key="KeyA" aria-label="左に移動">←</button><button data-key="KeyS" aria-label="後ろに下がる">↓</button><button data-key="KeyD" aria-label="右に移動">→</button></div></div>
 <section id="held-controls" hidden><div><span class="eyebrow">IN YOUR HAND</span><h2 id="held-title"></h2></div><button id="read-held"><kbd>R</kbd> ひらく</button><button id="return-held"><kbd>Q</kbd> もとに戻す</button></section>
 <div id="room-toast" role="status" aria-live="polite"></div><div id="room-fade" aria-hidden="true"></div>
 <dialog id="room-reader"><button id="reader-close" class="reader-close" aria-label="閉じる">×</button><div class="reader-book"><section class="reader-cover"><span class="eyebrow" id="reader-type"></span><span class="reader-volume" id="reader-volume"></span><h2 id="reader-title"></h2><span class="reader-stamp">POCKET WORLD<br>PERSONAL ARCHIVE</span></section><section class="reader-page"><span id="reader-badge" class="reader-badge"></span><p id="reader-copy"></p><p class="reader-note">制作物の展示はサンプルです。実際の作品・写真・リンクに差し替えられます。</p><nav><button id="reader-prev" aria-label="前の記録">←</button><span id="reader-count"></span><button id="reader-next" aria-label="次の記録">→</button></nav></section></div><button id="reader-return" class="reader-return">読み終えて、もとに戻す ↩</button></dialog>
 <dialog id="room-help"><button id="help-close" class="reader-close" aria-label="閉じる">×</button><span class="eyebrow">A SMALL GUIDE</span><h2>部屋での過ごし方</h2><p>ドラッグで見回し、WASD・矢印キーで移動します。スマホでは画面左下の矢印を使えます。</p><p>近くの本・ノート・スマートフォンを狙って、クリックまたはEキーで手に取ります。Rキーでひらき、Qキーでもとの場所へ戻せます。PCはその場で見られます。</p><p>下の「奥の本」「机の前」「ノート」から、その場所の前に直接移動できます。Escで読書やマウス固定を解除できます。</p><p>写真1枚をもとにした再現の途中です。寸法や写っていない壁は推定しています。</p></dialog>`;
document.body.append(ui);
let geometry,data,renderer;
try{[geometry,data]=await Promise.all(['room-geometry.json','room.json'].map(p=>fetch('./'+p).then(r=>{if(!r.ok)throw Error('部屋のファイルを読み込めません');return r.json();})));renderer=new RoomRenderer(canvas,geometry.meshes);}catch(e){$('#loading').innerHTML='<p>3D表示を開始できませんでした。</p><a href="?scene=room&view=model">模型版を開く →</a>';console.error(e);throw e;}
let eye=[.72,1.57,1.61],yaw=-.15,pitch=-.23,evening=0,desiredEvening=0,held=null,aimed=null,previous=0,paused=false,walking=false,bob=0,readingSpot=null,page=0,drag=null,moved=false,lock=false;
const keys=new Set(),reader=$('#room-reader');let toastTimer;
const say=t=>{$('#room-toast').textContent=t;$('#room-toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#room-toast').classList.remove('show'),2800);};
function enter(){$('#welcome-note').classList.add('dismissed');document.body.classList.add('has-entered');canvas.focus({preventScroll:true});}
$('#start-room').onclick=enter;
function releaseMouse(){if(document.pointerLockElement===canvas)document.exitPointerLock?.();}
$('#mouse-lock').onclick=()=>{enter();if(document.pointerLockElement===canvas)releaseMouse();else try{const p=canvas.requestPointerLock?.();p?.catch(()=>say('ドラッグでも見回せます'));}catch{say('ドラッグでも見回せます');}};
document.addEventListener('pointerlockchange',()=>{lock=document.pointerLockElement===canvas;$('#mouse-lock').textContent=lock?'Escで見回し解除':'マウスで見回す';});
$('#inside-light').onclick=()=>{desiredEvening=desiredEvening?0:1;$('#inside-light').textContent=desiredEvening?'☾ 夕方':'☀ 昼';$('#inside-light').setAttribute('aria-label',desiredEvening?'昼の光に切り替え':'夕方の光に切り替え');};
function showHelp(){keys.clear();releaseMouse();$('#room-help').showModal();}
$('#inside-help').onclick=showHelp;$('#about').onclick=showHelp;$('#help-close').onclick=()=>$('#room-help').close();
function modalOpen(){return reader.open||$('#room-help').open;}
function rayFor(x=innerWidth/2,y=innerHeight/2){const f=facing(yaw,pitch),right=[Math.cos(yaw),0,Math.sin(yaw)],up=normalize(cross(right,f));const tan=Math.tan(fieldOfView()/2);return normalize(add(f,add(scale(right,(x/innerWidth*2-1)*tan*innerWidth/innerHeight),scale(up,(1-y/innerHeight*2)*tan))));}
function fieldOfView(){return(innerWidth<760?78:67)*Math.PI/180;}
function findItem(ray){let best=null,distance=Infinity;for(const[id,b]of Object.entries(itemBounds)){if(id===held?.id)continue;const pad=id==='phone'?.025:.025,min=b.min.map(v=>v-pad),max=b.max.map(v=>v+pad),t=rayBox(eye,ray,min,max);if(t<distance){best=id;distance=t;}}if(!best)return null;
 // Occlusion against actual furniture heights, rather than interacting through it.
 for(const b of obstacles){const heights={bed:.66,table:.745,desk:.812,cabinet:1.12,chair:1.18};if(rayBox(eye,ray,[b.minX,0,b.minZ],[b.maxX,heights[b.id],b.maxZ])<distance-.04)return null;}
 return{id:best,distance,reachable:distance<1.55};}
function updatePrompt(){const p=$('#grab-prompt');if(held||modalOpen()){p.hidden=true;$('#crosshair').classList.remove('can-grab');return;}aimed=findItem(rayFor());p.hidden=!aimed;$('#crosshair').classList.toggle('can-grab',!!aimed?.reachable);if(aimed){$('#grab-key').textContent=aimed.reachable?'E':'↗';$('#grab-label').textContent=aimed.reachable?itemBounds[aimed.id].label:'もう少し近づく';}}
function take(id){if(held||modalOpen())return;enter();if(id==='pc'){readSpot('pc',true);return;}held={id,phase:'take',started:performance.now(),amount:0};keys.clear();$('#held-title').textContent={book:'作品集',note:'制作のノート',phone:'スマートフォン'}[id];$('#held-controls').hidden=false;$('#held-controls').classList.add('busy');say('手元に持ってきます');}
function interact(ray=rayFor()){if(held){if(held.phase==='hold')readHeld();return;}const item=findItem(ray);if(!item)return;if(!item.reachable){say('もう少し近づくと、手に取れます');return;}take(item.id);}
function returnHeld(){if(!held||held.phase!=='hold')return;reader.close();held.phase='return';held.started=performance.now();$('#held-controls').classList.add('busy');keys.clear();}
$('#return-held').onclick=returnHeld;$('#read-held').onclick=readHeld;
function readHeld(){if(!held||held.phase!=='hold')return;readSpot(itemBounds[held.id].spot,false);}
function readSpot(id,isPC){readingSpot=data.spots.find(s=>s.id===id);page=0;reader.classList.toggle('digital-reader',isPC||held?.id==='phone');keys.clear();releaseMouse();paintPage();reader.showModal();}
function paintPage(){const b=readingSpot.books[page];$('#reader-type').textContent=b.type;$('#reader-volume').textContent='0'+(page+1);$('#reader-title').textContent=b.title;$('#reader-copy').textContent=b.copy;$('#reader-badge').textContent=/SAMPLE|WEB|3D|APP/.test(b.type)?'サンプル展示':'PERSONAL NOTE';$('#reader-count').textContent=`${page+1} / ${readingSpot.books.length}`;$('#reader-prev').disabled=page===0;$('#reader-next').disabled=page===readingSpot.books.length-1;reader.style.setProperty('--cover',b.color);$('#reader-return').textContent=held?'読み終えて、もとに戻す ↩':'部屋に戻る ↩';}
$('#reader-prev').onclick=()=>{if(page>0){page--;paintPage();}};$('#reader-next').onclick=()=>{if(page<readingSpot.books.length-1){page++;paintPage();}};$('#reader-close').onclick=()=>reader.close();$('#reader-return').onclick=()=>held?returnHeld():reader.close();reader.addEventListener('close',()=>canvas.focus({preventScroll:true}));
for(const dialog of [reader,$('#room-help')])dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
const destinations={book:{position:[-.27,1.57,-.53],look:itemBounds.book.center},pc:{position:[.8,1.57,-.55],look:itemBounds.pc.center},note:{position:[.18,1.57,1.25],look:itemBounds.note.center},archive:{position:[.73,1.57,1.26],look:itemBounds.archive.center}};
let travelling=false;
function goTo(id){if(held&&held.phase!=='hold')return;enter();keys.clear();const dest=destinations[id];if(!dest||!walkable(dest.position[0],dest.position[2]))return;travelling=true;$('#room-fade').classList.add('active');setTimeout(()=>{eye=[...dest.position];const a=lookAngles(eye,dest.look);yaw=a.yaw;pitch=a.pitch;$('#room-fade').classList.remove('active');travelling=false;canvas.focus({preventScroll:true});},reduced?0:180);}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>goTo(b.dataset.go));
const moveCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
document.addEventListener('keydown',e=>{if(modalOpen())return;if(e.target.closest?.('button,a,input,textarea'))return;if(moveCodes.has(e.code)){e.preventDefault();enter();keys.add(e.code);}if(e.repeat)return;if(e.code==='KeyE'){e.preventDefault();interact();}if(e.code==='KeyR')readHeld();if(e.code==='KeyQ')returnHeld();});
document.addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();drag=null;});document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();});
const touchKeys=new Map();document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();enter();keys.add(b.dataset.key);touchKeys.set(e.pointerId,b.dataset.key);b.setPointerCapture(e.pointerId);});const up=e=>{keys.delete(b.dataset.key);touchKeys.delete(e.pointerId);};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);});
canvas.addEventListener('pointerdown',e=>{if(modalOpen()||travelling)return;enter();drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY};moved=false;canvas.setPointerCapture(e.pointerId);});
function look(dx,dy){if(modalOpen()||travelling||(held&&held.phase!=='hold'))return;yaw+=dx*.0032;pitch=clamp(pitch-dy*.0032,-1.35,1.15);}
canvas.addEventListener('pointermove',e=>{if(lock||!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)moved=true;look(dx,dy);drag.lastX=e.clientX;drag.lastY=e.clientY;});
document.addEventListener('mousemove',e=>{if(lock)look(e.movementX,e.movementY);});
canvas.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;if(!moved)interact(lock?rayFor():rayFor(e.clientX,e.clientY));drag=null;});canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();if(modalOpen()||held&&held.phase!=='hold')return;enter();const amount=clamp(e.deltaY*.001,-.14,.14),f=facing(yaw,0);eye=movePlayer(eye,-f[0]*amount,-f[2]*amount);},{passive:false});
function updateMovement(dt){if(modalOpen()||travelling||held&&held.phase!=='hold'){walking=false;return;}let x=0,z=0;if(keys.has('KeyW')||keys.has('ArrowUp'))z++;if(keys.has('KeyS')||keys.has('ArrowDown'))z--;if(keys.has('KeyD')||keys.has('ArrowRight'))x++;if(keys.has('KeyA')||keys.has('ArrowLeft'))x--;const len=Math.hypot(x,z);walking=len>0;if(!len)return;const speed=.72*dt/len,forward=facing(yaw,0),right=[Math.cos(yaw),0,Math.sin(yaw)];eye=movePlayer(eye,(forward[0]*z+right[0]*x)*speed,(forward[2]*z+right[2]*x)*speed);}
function heldMatrices(now){if(!held)return{itemModel:identity(),handModel:null};const duration=reduced?1:held.phase==='return'?600:850;let t=clamp((now-held.started)/duration,0,1);if(held.phase==='take'){held.amount=smooth(clamp((t-.22)/.78,0,1));if(t===1){held.phase='hold';held.amount=1;$('#held-controls').classList.remove('busy');say('Rでひらく / Qでもとに戻す');}}else if(held.phase==='return'){held.amount=1-smooth(t);if(t===1){held=null;$('#held-controls').hidden=true;say('もとの場所に戻しました');return{itemModel:identity(),handModel:null};}}
 const a=held.amount,center=itemBounds[held.id].center,R=multiply(rotationY(-yaw),rotationX(pitch)),cameraWorld=multiply(translation(...eye),R),local=held.id==='phone'?[.17,-.22,-.43]:[.16,-.23,-.48],destination=transformPoint(cameraWorld,local),position=mix(center,destination,a);
 const objectRotation=multiply(rotationY(-yaw*a),multiply(rotationX((pitch+(held.id==='phone'?1.1:.96))*a),rotationZ(-.12*a)));
 const itemModel=multiply(translation(...position),multiply(objectRotation,translation(...scale(center,-1))));
 const handFinal=transformPoint(cameraWorld,[.27,-.36,-.39]),source=add(center,[.1,-.1,.1]);let handPos=mix(source,handFinal,a);if(held.phase==='take'&&t<.22){handPos=mix(transformPoint(cameraWorld,[.29,-.6,-.28]),source,smooth(t/.22));}
 const handModel=multiply(translation(...handPos),multiply(R,rotationZ(-.18)));return{itemModel,handModel};}
let frame;
function tick(now){frame=requestAnimationFrame(tick);const dt=Math.min(.04,(now-(previous||now))/1000);previous=now;updateMovement(dt);bob+=walking?dt*6:0;const visualEye=[eye[0],eye[1]+(!reduced&&walking?Math.sin(bob)*.006:0),eye[2]],dir=facing(yaw,pitch);const vp=multiply(perspective(fieldOfView(),innerWidth/innerHeight),lookAt(visualEye,add(visualEye,dir)));evening+=(desiredEvening-evening)*(reduced?1:Math.min(1,dt*3));const matrices=heldMatrices(now);renderer.render({vp,eye:visualEye,evening,held:held?.id,...matrices});updatePrompt();}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);keys.clear();say('3D表示が中断されました。ページを再読み込みしてください。');});
canvas.addEventListener('webglcontextrestored',()=>location.reload());
$('#loading').classList.add('done');setTimeout(()=>$('#loading').remove(),500);requestAnimationFrame(tick);

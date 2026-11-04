const params=new URLSearchParams(location.search);
const inside=params.get('scene')!=='campus'&&params.get('view')!=='model';
await import(inside?'./inside.js':'./app.js');

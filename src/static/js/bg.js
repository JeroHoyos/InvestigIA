/* ═══ BACKGROUND CANVAS ANIMATIONS ═══════════════════════════════════════ */
function initHeroBg(){
  const canvas = document.getElementById('hero-graph-bg');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes, raf, paused = false;

  function resize(){
    const el = canvas.parentElement;
    W = canvas.width  = (el.clientWidth  || window.innerWidth);
    H = canvas.height = (el.clientHeight || window.innerHeight - 60);
  }

  function mkNodes(){
    nodes = Array.from({length:55}, ()=>({
      x: Math.random()*W, y: Math.random()*H,
      vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35,
      r: Math.random()*3+2,
    }));
  }

  function draw(){
    if(paused){ raf=requestAnimationFrame(draw); return; }
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<130){
          ctx.beginPath();
          ctx.moveTo(nodes[i].x,nodes[i].y);
          ctx.lineTo(nodes[j].x,nodes[j].y);
          ctx.strokeStyle=`rgba(59,130,246,${.18*(1-d/130)})`;
          ctx.lineWidth=1;
          ctx.stroke();
        }
      }
    }
    nodes.forEach(n=>{
      ctx.beginPath();
      ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fillStyle='rgba(29,78,216,.35)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(n.x,n.y,n.r+2,0,Math.PI*2);
      ctx.strokeStyle='rgba(59,130,246,.12)';
      ctx.lineWidth=2;
      ctx.stroke();
    });
    nodes.forEach(n=>{
      n.x+=n.vx; n.y+=n.vy;
      if(n.x<0||n.x>W) n.vx*=-1;
      if(n.y<0||n.y>H) n.vy*=-1;
    });
    raf=requestAnimationFrame(draw);
  }

  function start(){ cancelAnimationFrame(raf); resize(); if(W>0&&H>0){ mkNodes(); draw(); } }

  // Delay to allow flex layout to compute dimensions
  setTimeout(start, 80);
  window.addEventListener('resize', start);

  // Pause animation when not on home page to save CPU
  const observer = new IntersectionObserver(entries=>{
    paused = !entries[0].isIntersecting;
  }, { threshold: 0 });
  observer.observe(canvas);
}

let _chatBgRaf = null;
function initChatBg(){
  const canvas = document.getElementById('chat-graph-bg');
  if(!canvas) return;
  cancelAnimationFrame(_chatBgRaf);
  const ctx = canvas.getContext('2d');
  const el = canvas.parentElement;
  let W = canvas.width  = el.clientWidth  || 400;
  let H = canvas.height = el.clientHeight || 500;
  const nodes = Array.from({length:35},()=>({
    x:Math.random()*W, y:Math.random()*H,
    vx:(Math.random()-.5)*.2, vy:(Math.random()-.5)*.2,
    r:Math.random()*2+1.5,
  }));
  function draw(){
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<nodes.length;i++)
      for(let j=i+1;j<nodes.length;j++){
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<120){ ctx.beginPath(); ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y);
          ctx.strokeStyle=`rgba(59,130,246,${.07*(1-d/120)})`; ctx.lineWidth=1; ctx.stroke(); }
      }
    nodes.forEach(n=>{
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fillStyle='rgba(29,78,216,.12)'; ctx.fill();
      n.x+=n.vx; n.y+=n.vy;
      if(n.x<0||n.x>W) n.vx*=-1;
      if(n.y<0||n.y>H) n.vy*=-1;
    });
    _chatBgRaf = requestAnimationFrame(draw);
  }
  draw();
}

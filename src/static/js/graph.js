/* ═══ GRAPH ═══════════════════════════════════════════════════════════════ */
function setGraphMode(mode){
  graphMode = mode;
  document.querySelectorAll('.graph-mode-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`gm-${mode}`)?.classList.add('active');
  buildGraph();
}

function buildGraph(){
  const main = document.getElementById('graph-main');
  const empty = document.getElementById('graph-empty');
  document.getElementById('node-detail-panel').classList.remove('open');
  if(!globalPapers.length){ empty.style.display='flex'; return; }
  empty.style.display='none';
  const W = main.clientWidth, H = main.clientHeight;

  if(graphMode==='citations'){
    main.classList.add('tree-mode');
    const years = [...new Set(globalPapers.map(p=>parseInt(p.year)||2020))].sort();
    const neededW = Math.max(W, 60*2 + years.length * 220);
    const svg = d3.select('#graph-svg').attr('width',neededW).attr('height',H); svg.html('');
    const g = svg.append('g');
    graphZoom = d3.zoom().scaleExtent([0.1,10]).on('zoom',e=>g.attr('transform',e.transform));
    svg.call(graphZoom);
    buildCitationsTree(g,neededW,H);
  } else {
    main.classList.remove('tree-mode');
    const svg = d3.select('#graph-svg').attr('width',W).attr('height',H); svg.html('');
    const g = svg.append('g');
    graphZoom = d3.zoom().scaleExtent([0.05,10]).on('zoom',e=>g.attr('transform',e.transform));
    svg.call(graphZoom);
    if(graphMode==='authors')       buildAuthorsGraph(g,W,H);
    else if(graphMode==='keywords') buildKeywordsGraph(g,W,H);
  }
}

function buildPapersGraph(g,W,H){
  updateLegend([{c:'#0EA5E9',l:'ArXiv'},{c:'#7C3AED',l:'Scholar'},{c:'#059669',l:'Subido'}]);
  const nodes = globalPapers.map((p,i)=>({id:i,...p}));
  const links = [];
  nodes.forEach((n1,i)=>{
    nodes.forEach((n2,j)=>{
      if(j<=i) return;
      const kw1 = new Set((n1.keywords||'').split(',').map(k=>k.trim().toLowerCase()).filter(Boolean));
      const kw2 = new Set((n2.keywords||'').split(',').map(k=>k.trim().toLowerCase()).filter(Boolean));
      const shared = [...kw1].filter(k=>kw2.has(k));
      if(shared.length) links.push({source:i,target:j,shared});
    });
  });
  updateGStats(nodes.length, links.length);
  drawGraph(g,W,H,nodes,links,
    d=>d.source==='ArXiv'?'#0EA5E9':d.source==='Google Scholar'?'#7C3AED':'#059669',
    d=>`<strong>${(d.title||'').substring(0,60)}</strong><br/><small>${d.authors||''}</small><br/>${d.year||''} · <em>${d.source||''}</em>`,
    7, d=>d.id,
    d=>(d.title||'').split(' ').slice(0,3).join(' '));
}

function buildAuthorsGraph(g,W,H){
  updateLegend([{c:'#1D4ED8',l:'Autor'}]);
  const authorMap = {};
  globalPapers.forEach((p,pi)=>{
    (p.authors||'').split(',').map(a=>a.trim()).filter(Boolean).forEach(a=>{
      if(!authorMap[a]) authorMap[a]={id:a,papers:[]};
      authorMap[a].papers.push(pi);
    });
  });
  const nodes = Object.values(authorMap);
  const links = []; const seen = new Set();
  globalPapers.forEach(p=>{
    const auths = (p.authors||'').split(',').map(a=>a.trim()).filter(Boolean);
    for(let i=0;i<auths.length;i++) for(let j=i+1;j<auths.length;j++){
      const key=[auths[i],auths[j]].sort().join('||');
      if(!seen.has(key)){ seen.add(key); links.push({source:auths[i],target:auths[j]}); }
    }
  });
  updateGStats(nodes.length, links.length);
  drawGraph(g,W,H,nodes,links,()=>'#1D4ED8',
    d=>`<strong>${d.id}</strong><br/>${d.papers.length} paper(s)`,6,d=>d.id,
    d=>d.id.split(' ').pop());
}

function buildKeywordsGraph(g,W,H){
  updateLegend([{c:'#1D4ED8',l:'Concepto'},{c:'#0EA5E9',l:'Del título'},{c:'rgba(29,78,216,.25)',l:'Co-ocurrencia'}]);
  const kwCount = {}; const kwSource = {}; const coOcc = {};
  globalPapers.forEach(p=>{
    const kws = extractPaperKeywords(p);
    kws.forEach(k=>{
      kwCount[k]=(kwCount[k]||0)+1;
      kwSource[k] = p.keywords ? 'kw' : 'title';
    });
    for(let i=0;i<kws.length;i++) for(let j=i+1;j<kws.length;j++){
      const key=[kws[i],kws[j]].sort().join('||');
      coOcc[key]=(coOcc[key]||0)+1;
    }
  });
  if(!Object.keys(kwCount).length){ updateGStats(0,0); return; }
  const top = Object.entries(kwCount).sort((a,b)=>b[1]-a[1]).slice(0,45);
  const kwSet = new Set(top.map(([k])=>k));
  const nodes = top.map(([k,c])=>({id:k,count:c,fromKw:kwSource[k]==='kw'}));
  const links = Object.entries(coOcc)
    .filter(([key])=>{ const [a,b]=key.split('||'); return kwSet.has(a)&&kwSet.has(b); })
    .map(([key,weight])=>{ const [source,target]=key.split('||'); return {source,target,weight}; });
  updateGStats(nodes.length, links.length);
  const maxC = Math.max(...top.map(([,c])=>c),1);
  const rs = d3.scaleSqrt().domain([1,maxC]).range([5,22]);
  drawGraph(g,W,H,nodes,links,
    d=>d.fromKw?'#1D4ED8':'#0EA5E9',
    d=>`<strong>${d.id}</strong><br/>Frecuencia: ${d.count} paper(s)`,
    d=>rs(d.count||1), d=>d.id, d=>d.id);
}

function buildCitationsTree(g,W,H){
  updateLegend([
    {c:'#0EA5E9',l:'ArXiv'},{c:'#7C3AED',l:'Scholar'},{c:'#059669',l:'Subido'},
    {c:'rgba(29,78,216,.4)',l:'Línea de tiempo →'}
  ]);
  const tip = document.getElementById('graph-tooltip');

  const yearMap = {};
  globalPapers.forEach((p,i)=>{
    const yr = parseInt(p.year)||2020;
    if(!yearMap[yr]) yearMap[yr]=[];
    yearMap[yr].push({idx:i,...p,yr,cites:parseInt(p.citations)||0});
  });
  const years = Object.keys(yearMap).map(Number).sort();
  if(!years.length) return;

  const PAD = 60;
  const colW = Math.max(160, (W-PAD*2) / Math.max(years.length,1));
  const allNodes = [];

  years.forEach((yr,yi)=>{
    const papers = yearMap[yr];
    const cx = PAD + yi*colW + colW/2;
    const rowH = Math.max(60, (H-PAD*2)/Math.max(papers.length,1));
    papers.forEach((p,pi)=>{
      p.x = cx;
      p.y = PAD + pi*rowH + rowH/2;
      allNodes.push(p);
    });
  });

  const links = [];
  for(let yi=1;yi<years.length;yi++){
    const older = yearMap[years[yi-1]];
    const newer = yearMap[years[yi]];
    newer.forEach(n=>{
      const kw1 = new Set(extractPaperKeywords(n));
      let best=null, bestScore=0;
      older.forEach(o=>{
        const kw2 = new Set(extractPaperKeywords(o));
        const score = [...kw1].filter(k=>kw2.has(k)).length;
        if(score>bestScore){ bestScore=score; best=o; }
      });
      if(best) links.push({source:n,target:best,score:bestScore});
    });
  }
  updateGStats(allNodes.length, links.length);

  const defs = g.append('defs');
  defs.append('marker').attr('id','tree-arrow').attr('viewBox','0 -4 8 8')
    .attr('refX',18).attr('refY',0).attr('markerWidth',5).attr('markerHeight',5).attr('orient','auto')
    .append('path').attr('d','M0,-4L8,0L0,4').attr('fill','rgba(29,78,216,.45)');

  years.forEach((yr,yi)=>{
    const cx = PAD + yi*colW + colW/2;
    g.append('text').attr('x',cx).attr('y',22)
      .attr('text-anchor','middle').style('font-size','11px').style('font-weight','700')
      .style('fill','var(--blue)').text(yr);
    g.append('line')
      .attr('x1',cx).attr('y1',30).attr('x2',cx).attr('y2',H-10)
      .attr('stroke','rgba(29,78,216,.07)').attr('stroke-width',1).attr('stroke-dasharray','4,3');
  });

  g.selectAll('.tree-link').data(links).enter().append('path').attr('class','tree-link')
    .attr('d',d=>{
      const x1=d.source.x, y1=d.source.y, x2=d.target.x, y2=d.target.y;
      const mx=(x1+x2)/2;
      return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    })
    .attr('fill','none').attr('stroke','rgba(29,78,216,.25)').attr('stroke-width',1.5)
    .attr('marker-end','url(#tree-arrow)');

  const maxCite = Math.max(...allNodes.map(n=>n.cites),1);
  const rs = d3.scaleSqrt().domain([0,maxCite]).range([6,16]);
  const colorFn = d=>d.source==='ArXiv'?'#0EA5E9':d.source==='Google Scholar'?'#7C3AED':'#059669';

  const nodeSel = g.selectAll('g.tnd').data(allNodes).enter().append('g').attr('class','tnd')
    .attr('transform',d=>`translate(${d.x},${d.y})`);

  nodeSel.append('circle').attr('r',d=>rs(d.cites)+5)
    .attr('fill',colorFn).attr('stroke','#fff').attr('stroke-width',2);

  nodeSel.append('text').attr('dy','0.35em').attr('dx',d=>rs(d.cites)+8)
    .style('font-size','9px').style('font-weight','700').style('fill','var(--text)')
    .style('pointer-events','none').style('text-shadow','0 0 3px #fff,0 0 3px #fff')
    .text(d=>(d.title||'').split(' ').slice(0,3).join(' '));

  nodeSel.style('cursor','pointer')
    .on('click',(evt,d)=>{ evt.stopPropagation(); showNodeDetail(d); })
    .on('mouseenter',(evt,d)=>{
    const [mx,my]=d3.pointer(evt,document.getElementById('graph-main'));
    tip.innerHTML=`<strong>${(d.title||'').substring(0,60)}</strong><br/><small>${d.authors||''}</small><br/>${d.yr} · Citas: ${d.cites||'—'}`;
    tip.style.left=(mx+14)+'px'; tip.style.top=(my-8)+'px';
    tip.classList.add('show');
  }).on('mouseleave',()=>tip.classList.remove('show'));
}

function drawGraph(g,W,H,nodes,links,colorFn,tipFn,radiusFn,idFn,labelFn,directed){
  const tip = document.getElementById('graph-tooltip');
  const rFn = typeof radiusFn==='function' ? radiusFn : ()=>radiusFn;

  if(directed){
    const defs = g.append('defs');
    defs.append('marker').attr('id','arrow').attr('viewBox','0 -4 8 8')
      .attr('refX',14).attr('refY',0).attr('markerWidth',6).attr('markerHeight',6)
      .attr('orient','auto')
      .append('path').attr('d','M0,-4L8,0L0,4').attr('fill','rgba(29,78,216,.4)');
  }

  const sim = d3.forceSimulation(nodes)
    .force('link',d3.forceLink(links).id(idFn||((d)=>d.id)).distance(100).strength(0.3))
    .force('charge',d3.forceManyBody().strength(-160))
    .force('center',d3.forceCenter(W/2,H/2))
    .force('collision',d3.forceCollide().radius(d=>rFn(d)+8));

  const linkSel = g.selectAll('line').data(links).enter().append('line')
    .attr('stroke','rgba(29,78,216,.18)').attr('stroke-width',1.5)
    .attr('marker-end', directed ? 'url(#arrow)' : null);

  const nodeSel = g.selectAll('g.nd').data(nodes).enter().append('g').attr('class','nd')
    .call(d3.drag()
      .on('start',(event,d)=>{ if(!event.active) sim.alphaTarget(.3).restart(); d.fx=d.x;d.fy=d.y; })
      .on('drag', (event,d)=>{ d.fx=event.x; d.fy=event.y; })
      .on('end',  (event,d)=>{ if(!event.active) sim.alphaTarget(0); d.fx=null;d.fy=null; })
    );

  nodeSel.append('circle')
    .attr('r',d=>rFn(d))
    .attr('fill',colorFn)
    .attr('stroke','#fff').attr('stroke-width',2);

  const getLbl = labelFn || (d=>{ const l=(idFn||((x)=>x.id))(d); return typeof l==='string'?l.substring(0,20):''; });
  nodeSel.append('text')
    .attr('dy','0.35em').attr('dx',d=>rFn(d)+5)
    .style('font-size','10px').style('fill','var(--text)').style('pointer-events','none')
    .style('font-weight','600').style('text-shadow','0 0 3px #fff,0 0 3px #fff')
    .text(d=>getLbl(d));

  nodeSel.style('cursor','pointer')
    .on('mouseenter',(evt,d)=>{
      const [mx,my]=d3.pointer(evt,document.getElementById('graph-main'));
      tip.innerHTML=typeof tipFn==='function'?tipFn(d):'';
      tip.style.left=(mx+14)+'px'; tip.style.top=(my-8)+'px';
      tip.classList.add('show');
    }).on('mouseleave',()=>tip.classList.remove('show'))
    .on('click',(evt,d)=>{ evt.stopPropagation(); showNodeDetail(d); });

  const PAD = 20;
  sim.on('tick',()=>{
    nodes.forEach(d=>{
      d.x = Math.max(PAD, Math.min(W-PAD, d.x));
      d.y = Math.max(PAD, Math.min(H-PAD, d.y));
    });
    linkSel.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y)
           .attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
    nodeSel.attr('transform',d=>`translate(${d.x},${d.y})`);
  });
}

function showNodeDetail(d){
  let paper = null;
  if(d.idx !== undefined) paper = globalPapers[d.idx];
  if(!paper) paper = globalPapers.find(p=>p.title===d.title || p.title===d.id);
  if(!paper) paper = d;

  const src = paper.source || '';
  const badgeCls = src==='ArXiv'?'ndp-arxiv':src==='Google Scholar'?'ndp-scholar':'ndp-upload';
  document.getElementById('ndp-body').innerHTML = `
    <div class="ndp-title">${esc(paper.title||d.title||d.id||'—')}</div>
    <div class="ndp-badges">
      ${src?`<span class="ndp-badge ${badgeCls}">${esc(src)}</span>`:''}
      ${paper.open_access==='Sí'?'<span class="ndp-badge ndp-oa"><i class="fas fa-lock-open"></i> OA</span>':''}
      ${paper.citations?`<span class="ndp-badge" style="background:var(--amber-l);color:var(--amber)"><i class="fas fa-quote-right"></i> ${esc(paper.citations)}</span>`:''}
    </div>
    <div class="ndp-meta">
      ${paper.authors?`<div class="ndp-meta-row"><i class="fas fa-users"></i><span>${esc(paper.authors)}</span></div>`:''}
      ${paper.year?`<div class="ndp-meta-row"><i class="fas fa-calendar-alt"></i><span>${esc(paper.year)}</span></div>`:''}
      ${paper.journal?`<div class="ndp-meta-row"><i class="fas fa-book-open"></i><span>${esc(paper.journal)}</span></div>`:''}
      ${paper.doi?`<div class="ndp-meta-row"><i class="fas fa-fingerprint"></i><span>${esc(paper.doi)}</span></div>`:''}
    </div>
    ${paper.abstract?`<div class="ndp-abstract">${esc(paper.abstract)}</div>`:''}
    ${paper.url?`<a class="ndp-link" href="${encodeURI(paper.url)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Ver publicación</a>`:''}
  `;
  document.getElementById('node-detail-panel').classList.add('open');
}

function updateLegend(items){
  document.getElementById('graph-legend').innerHTML = items.map(i=>
    `<div class="legend-item"><div class="legend-dot" style="background:${i.c}"></div>${esc(i.l)}</div>`
  ).join('');
}

function updateGStats(nodes,links){
  const authors = new Set(globalPapers.flatMap(p=>(p.authors||'').split(',').map(a=>a.trim()).filter(Boolean)));
  const kws = new Set(globalPapers.flatMap(p=>(p.keywords||'').split(',').map(k=>k.trim().toLowerCase()).filter(Boolean)));
  document.getElementById('gs-nodes').textContent = nodes;
  document.getElementById('gs-links').textContent = links;
  document.getElementById('gs-authors').textContent = authors.size;
  document.getElementById('gs-kws').textContent = kws.size;
}

function zoomGraph(f){
  if(!graphZoom) return;
  d3.select('#graph-svg').transition().duration(300).call(graphZoom.scaleBy,f);
}

function resetGraphZoom(){
  if(!graphZoom) return;
  d3.select('#graph-svg').transition().duration(450).call(graphZoom.transform,d3.zoomIdentity);
}

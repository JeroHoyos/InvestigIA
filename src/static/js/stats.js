/* ═══ WORLD HEATMAP ═══════════════════════════════════════════════════════ */
const COUNTRY_NAMES = {
  'united states':840,'usa':840,'u.s.':840,'california':840,'mit ':840,'stanford':840,
  'china':156,'chinese':156,'beijing':156,'shanghai':156,'tsinghua':156,
  'united kingdom':826,'uk ':826,'england':826,'london':826,'oxford':826,'cambridge':826,
  'germany':276,'german':276,'berlin':276,'munich':276,'max planck':276,
  'france':250,'french':250,'paris':250,'inria':250,
  'japan':392,'japanese':392,'tokyo':392,'kyoto':392,
  'canada':124,'canadian':124,'toronto':124,'montreal':124,
  'australia':36,'australian':36,'sydney':36,'melbourne':36,
  'india':356,'indian':356,'iit ':356,'iitb':356,
  'brazil':76,'brazilian':76,'são paulo':76,'usp ':76,
  'italy':380,'italian':380,'rome':380,'milan':380,
  'spain':724,'spanish':724,'madrid':724,'barcelona':724,
  'netherlands':528,'dutch':528,'amsterdam':528,'delft':528,
  'switzerland':756,'swiss':756,'zurich':756,'eth ':756,'epfl':756,
  'sweden':752,'swedish':752,'stockholm':752,'kth ':752,
  'south korea':410,'korea':410,'korean':410,'seoul':410,'kaist':410,
  'russia':643,'russian':643,'moscow':643,
  'singapore':702,'nus ':702,'ntu ':702,
  'austria':40,'austrian':40,'vienna':40,
  'belgium':56,'belgian':56,'brussels':56,
  'denmark':208,'danish':208,'copenhagen':208,'dtu ':208,
  'finland':246,'finnish':246,'helsinki':246,'aalto':246,
  'norway':578,'norwegian':578,'oslo':578,
  'israel':376,'israeli':376,'tel aviv':376,'technion':376,
  'poland':616,'polish':616,'warsaw':616,
  'portugal':620,'portuguese':620,'lisbon':620,
  'mexico':484,'mexican':484,'unam':484,
  'argentina':32,'buenos aires':32,
  'chile':152,'chilean':152,'santiago':152,
  'colombia':170,'bogotá':170,'bogota':170,
  'taiwan':158,'taipei':158,'nthu':158,
  'hong kong':344,'hkust':344,'hku ':344,
  'czech':203,'prague':203,
  'turkey':792,'turkish':792,'ankara':792,
  'iran':364,'iranian':364,'tehran':364,
  'saudi arabia':682,'riyadh':682,'kaust':682,
  'south africa':710,'cape town':710,
  'new zealand':554,'auckland':554,
  'greece':300,'greek':300,'athens':300,
  'egypt':818,'cairo':818,
  'ukraine':804,'kyiv':804,
};

function detectCountriesFromPapers(){
  const counts = {};
  globalPapers.forEach(p=>{
    const text = ((p.abstract||'')+(p.authors||'')+(p.journal||'')+(p.title||'')).toLowerCase();
    for(const [name, iso] of Object.entries(COUNTRY_NAMES)){
      if(text.includes(name)){
        counts[iso] = (counts[iso]||0)+1;
      }
    }
  });
  return counts;
}

let _worldTopo = null;
async function buildHeatmap(){
  const svg = document.getElementById('world-map-svg');
  if(!svg) return;
  svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#94A3B8" font-size="12">Cargando mapa…</text>';

  const countryCounts = detectCountriesFromPapers();
  if(!Object.keys(countryCounts).length){
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#94A3B8" font-size="12">Sin datos geográficos detectados en los papers</text>';
    document.getElementById('map-legend-info').textContent = '';
    return;
  }

  try {
    if(!_worldTopo){
      const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      _worldTopo = await res.json();
    }
    const W = svg.clientWidth || 700, H = 280;
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const projection = d3.geoNaturalEarth1().scale(W/6.5).translate([W/2, H/2]);
    const pathGen = d3.geoPath().projection(projection);
    const countries = topojson.feature(_worldTopo, _worldTopo.objects.countries);

    const maxVal = Math.max(...Object.values(countryCounts), 1);
    const colorScale = d3.scaleSequential().domain([0,maxVal])
      .interpolator(d3.interpolate('#EFF6FF','#1D4ED8'));

    const d3svg = d3.select(svg);
    d3svg.html('');

    d3svg.append('path').datum({type:'Sphere'}).attr('d',pathGen)
      .attr('fill','#F8FAFC').attr('stroke','#E2E8F0').attr('stroke-width',0.5);

    d3svg.selectAll('.map-country').data(countries.features).enter()
      .append('path').attr('class','map-country')
      .attr('d',pathGen)
      .attr('fill',d=>{
        const c = countryCounts[parseInt(d.id)];
        return c ? colorScale(c) : 'var(--surf3)';
      })
      .attr('stroke','#fff').attr('stroke-width',.3)
      .append('title').text(d=>{
        const n = d.properties?.name||d.id;
        const c = countryCounts[parseInt(d.id)];
        return c ? `${n}: ${c} paper(s)` : n;
      });

    const total = Object.values(countryCounts).reduce((s,v)=>s+v,0);
    document.getElementById('map-legend-info').textContent =
      `${Object.keys(countryCounts).length} países detectados · ${total} menciones`;
  } catch(e){
    svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#94A3B8" font-size="12">Error cargando mapa (sin conexión)</text>`;
  }
}

/* ═══ STATS (BIM) ═════════════════════════════════════════════════════════ */
function buildStats(){
  Object.values(charts).forEach(c=>c.destroy()); charts={};
  if(!globalPapers.length) return;

  const total = globalPapers.length;
  const papersWithCites = globalPapers.filter(p=>parseInt(p.citations)>0);
  const allCites = globalPapers.map(p=>parseInt(p.citations)||0);
  const totalCites = allCites.reduce((s,c)=>s+c,0);
  const avgCite = papersWithCites.length ? (totalCites/papersWithCites.length).toFixed(1) : '—';

  const sorted = [...allCites].sort((a,b)=>b-a);
  let hIndex = 0;
  sorted.forEach((c,i)=>{ if(c>=i+1) hIndex=i+1; });

  const allAuthors = new Set(globalPapers.flatMap(p=>(p.authors||'').split(',').map(a=>a.trim()).filter(Boolean)));
  const allKws = new Set(globalPapers.flatMap(p=>extractPaperKeywords(p)));
  const avgAuth = total ? (globalPapers.reduce((s,p)=>{
    const n=(p.authors||'').split(',').filter(Boolean).length; return s+n;
  },0)/total).toFixed(1) : '—';

  document.getElementById('sk-total').textContent = total;
  document.getElementById('sk-hindex').textContent = hIndex || '—';
  document.getElementById('sk-avgcite').textContent = avgCite;
  document.getElementById('sk-authors').textContent = allAuthors.size || '—';
  document.getElementById('sk-kws').textContent = allKws.size || '—';
  document.getElementById('sk-avgauth').textContent = avgAuth;

  // ── Chart 1: Year trend ──
  const years = {};
  globalPapers.forEach(p=>{
    const y = p.year && /^\d{4}$/.test(p.year) ? p.year : null;
    if(y) years[y]=(years[y]||0)+1;
  });
  const yrKeys = Object.keys(years).sort();
  if(yrKeys.length){
    const datalabelPlugin={
      id:'datalabels',
      afterDraw(chart){
        const ctx=chart.ctx;
        chart.data.datasets.forEach((ds,i)=>{
          chart.getDatasetMeta(i).data.forEach((pt,j)=>{
            ctx.save(); ctx.fillStyle='#0F172A';
            ctx.font='bold 11px Inter,sans-serif'; ctx.textAlign='center';
            ctx.fillText(ds.data[j],pt.x,pt.y-9); ctx.restore();
          });
        });
      }
    };
    charts.year = new Chart(document.getElementById('chart-year'),{
      type:'line',
      data:{ labels:yrKeys, datasets:[{
        label:'Documentos', data:yrKeys.map(y=>years[y]),
        borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,.1)',
        fill:true, tension:.35,
        pointBackgroundColor:'#1D4ED8', pointBorderColor:'#fff',
        pointBorderWidth:2, pointRadius:5, pointHoverRadius:7,
      }]},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:ctx=>`${ctx.raw} papers`}},
        },
        scales:{
          x:{grid:{display:false},title:{display:true,text:'Año',font:{size:10},color:'#475569'}},
          y:{grid:{color:'#F1F5F9'},beginAtZero:true,title:{display:true,text:'Cantidad de Documentos',font:{size:10},color:'#475569'}}
        }
      },
      plugins:[datalabelPlugin]
    });
  }

  // ── Chart 2: Keyword frequency ──
  const kwFreq = {};
  globalPapers.forEach(p=>extractPaperKeywords(p).forEach(k=>{ kwFreq[k]=(kwFreq[k]||0)+1; }));
  const topKws = Object.entries(kwFreq).sort((a,b)=>b[1]-a[1]).slice(0,14);
  if(topKws.length){
    charts.kws = new Chart(document.getElementById('chart-keywords'),{
      type:'bar',
      data:{ labels:topKws.map(([k])=>k.length>20?k.substring(0,20)+'…':k),
             datasets:[{label:'Frecuencia',data:topKws.map(([,c])=>c),backgroundColor:'#0EA5E9',borderRadius:4}] },
      options:{ indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
        scales:{x:{grid:{color:'#F1F5F9'},beginAtZero:true},y:{grid:{display:false}}} }
    });
  }

  // ── Chart 3: Citation distribution histogram ──
  const citeValues = globalPapers.map(p=>parseInt(p.citations)||0);
  const nonZero = citeValues.filter(c=>c>0);
  if(nonZero.length){
    const zeroPct = (citeValues.filter(c=>c===0).length/citeValues.length*100).toFixed(1);
    const citeSorted = [...citeValues].sort((a,b)=>a-b);
    const median = citeSorted[Math.floor(citeSorted.length/2)];
    const p75 = citeSorted[Math.floor(citeSorted.length*0.75)];
    const p90 = citeSorted[Math.floor(citeSorted.length*0.90)];
    const maxCite = Math.max(...nonZero);
    const logMax = Math.log10(maxCite + 1);
    const rawEdges = [1];
    for(let i=1;i<=8;i++){
      const e = Math.round(Math.pow(10, logMax * i / 8));
      if(e > rawEdges[rawEdges.length-1]) rawEdges.push(e);
    }
    rawEdges.push(Infinity);
    const binEdges = rawEdges;
    const binLbls = rawEdges.slice(0,-1).map((e,i)=>{
      const nxt = rawEdges[i+1];
      if(nxt===Infinity) return `${e}+`;
      return nxt-1===e ? `${e}` : `${e}–${nxt-1}`;
    });
    const binCounts=new Array(binLbls.length).fill(0);
    const valToBin=v=>{ for(let i=0;i<binEdges.length-1;i++) if(v>=binEdges[i]&&v<binEdges[i+1]) return i; return binLbls.length-1; };
    nonZero.forEach(c=>{ binCounts[valToBin(c)]++; });

    const percLines=[[median,'#64748B','M',`Mediana: ${median}`],[p75,'#DC2626','25%',`Top 25%: ≥${p75}`],[p90,'#7C3AED','10%',`Top 10%: ≥${p90}`]];
    const percPlugin={
      id:'perclines',
      afterDraw(chart){
        if(!chart.chartArea) return;
        const {ctx,chartArea:{top,bottom,right}} = chart;
        const xScale = chart.scales.x;
        const seen = new Map();
        percLines.forEach(([val,color,short])=>{
          if(!val||val<=0) return;
          const bi=valToBin(val);
          if(!seen.has(bi)) seen.set(bi,[color,short]);
          else seen.get(bi)[1]+='/'+short;
        });
        let yOffset=0;
        seen.forEach(([color,short], bi)=>{
          const xPx=xScale.getPixelForValue(binLbls[bi]);
          if(!xPx||xPx<0) return;
          ctx.save();
          ctx.strokeStyle=color; ctx.setLineDash([4,3]); ctx.lineWidth=1.5;
          ctx.beginPath(); ctx.moveTo(xPx,top); ctx.lineTo(xPx,bottom); ctx.stroke();
          ctx.setLineDash([]);
          const lx=Math.min(xPx, right-38); const ly=bottom-8-yOffset;
          ctx.fillStyle=color; ctx.font='bold 9px Inter,sans-serif';
          ctx.textAlign='center'; ctx.fillText(short, lx, ly);
          yOffset+=13;
          ctx.restore();
        });
      }
    };
    charts.cit = new Chart(document.getElementById('chart-citations'),{
      type:'bar',
      data:{ labels:binLbls, datasets:[{
        label:'Artículos', data:binCounts,
        backgroundColor:'rgba(5,150,105,.35)', borderColor:'rgba(5,150,105,.8)',
        borderWidth:1, borderRadius:3,
      }]},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:ctx=>`${ctx.raw} artículo(s)`}},
          title:{display:true,text:`Distribución de citas · ${zeroPct}% tienen 0  ·  mediana: ${median}  ·  max: ${maxCite}`,font:{size:10,weight:'bold'},color:'#475569'},
        },
        scales:{
          x:{grid:{display:false},title:{display:true,text:'Número de citas',font:{size:10},color:'#475569'}},
          y:{grid:{color:'#F1F5F9'},beginAtZero:true,title:{display:true,text:'Frecuencia',font:{size:10},color:'#475569'}}
        }
      },
      plugins:[percPlugin]
    });
  } else {
    document.getElementById('chart-citations').parentElement.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--faint);font-size:.8rem">Sin datos de citas disponibles para esta búsqueda</div>';
  }

  // ── Chart 4: Bradford's Law ──
  const srcCount = {};
  globalPapers.forEach(p=>{
    const key = (p.journal||'').trim() || p.source || 'Sin clasificar';
    if(key === 'Sin clasificar' && p.source) {
      srcCount[p.source]=(srcCount[p.source]||0)+1; return;
    }
    const short = key.length>28 ? key.substring(0,28)+'…' : key;
    srcCount[short]=(srcCount[short]||0)+1;
  });
  const topSrc = Object.entries(srcCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
  charts.src = new Chart(document.getElementById('chart-source'),{
    type:'bar',
    data:{ labels:topSrc.map(([k])=>k),
           datasets:[{label:'Papers',data:topSrc.map(([,c])=>c),
             backgroundColor:topSrc.map((_,i)=>i<3?'#1D4ED8':i<6?'#0EA5E9':'#7C3AED'),borderRadius:4}] },
    options:{ indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{grid:{color:'#F1F5F9'},beginAtZero:true,ticks:{stepSize:1}},y:{grid:{display:false}}} }
  });
}

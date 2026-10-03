/* ═══ UTILITIES ═══════════════════════════════════════════════════════════ */
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function autoResize(el){ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,160)+'px'; }

function updateHomeKPIs(){ const el=document.getElementById('home-kpi-papers'); if(el) el.textContent=globalPapers.length; }

function parseMdTable(md){
  const rows = [];
  for(const line of md.split('\n')){
    const l = line.trim();
    if(l.startsWith('|') && l.endsWith('|') && !l.includes('---')){
      rows.push(l.slice(1,-1).split('|').map(c=>c.trim()));
    }
  }
  return rows;
}

async function downloadMatrix(fmt){
  const a = document.createElement('a');
  a.href = `/api/download/${fmt}/${sessionId}`;
  a.download = `matriz.${fmt==='xlsx'?'xlsx':'docx'}`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function extractPaperKeywords(p){
  const raw = [];
  (p.keywords||'').split(',').map(k=>k.trim().toLowerCase()).filter(k=>k.length>2).forEach(k=>{
    const cleaned = k.replace(/^[a-z]+\./,'').replace(/-/g,' ');
    raw.push(cleaned);
  });
  const STOP = new Set(['with','from','using','based','deep','neural','learning','model','method','approach','system','data','analysis','study','novel','paper','work','this','that','these','those','their','have','been','were','also','more','than','into','arxiv','preprint','results','between','effect','effects','patients','studies','review','within','among','after','before','during','other','number','total','type','types','both','each','only','such','well','high','higher','lower','large','small','used','show','showed','showed','found','through','across']);
  (p.title||'').toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/)
    .filter(w=>w.length>4 && !STOP.has(w))
    .slice(0,4).forEach(w=>raw.push(w));
  return [...new Set(raw)].filter(Boolean);
}

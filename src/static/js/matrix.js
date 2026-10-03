/* ═══ MATRIX (animated row-by-row) ═══════════════════════════════════════ */
function showMatrix(matrixMD){
  storeMatrix(matrixMD);
  const rows = parseMdTable(matrixMD);
  const wrap = document.createElement('div');
  wrap.className = 'matrix-wrap fade-in';

  const hdr = document.createElement('div'); hdr.className = 'matrix-hdr';
  hdr.innerHTML = `
    <div class="matrix-hdr-title"><i class="fas fa-table"></i> Matriz Bibliográfica</div>
    <div class="matrix-hdr-actions">
      <button class="matrix-dl-btn" onclick="downloadMatrix('xlsx')"><i class="fas fa-file-excel"></i> Excel</button>
      <button class="matrix-dl-btn" onclick="downloadMatrix('docx')"><i class="fas fa-file-word"></i> Word</button>
    </div>
  `;
  const body = document.createElement('div'); body.className = 'matrix-body';
  const table = document.createElement('table');
  body.appendChild(table); wrap.appendChild(hdr); wrap.appendChild(body);
  appendMsg(wrap);

  if(!rows.length){ body.innerHTML = marked.parse(matrixMD); return; }

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  rows[0].forEach(h=>{
    const th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th);
  });
  thead.appendChild(headerRow); table.appendChild(thead);

  const tbody = document.createElement('tbody'); table.appendChild(tbody);

  const headers = rows[0].map(h=>h.toLowerCase());
  const citeIdx  = headers.findIndex(h=>h.includes('cit'));
  const titleIdx = headers.findIndex(h=>h.includes('tít') || h.includes('titl'));

  rows.slice(1).forEach((row,ri)=>{
    setTimeout(()=>{
      const tr = document.createElement('tr'); tr.className = 'row-anim';
      row.forEach((cell,ci)=>{
        const td = document.createElement('td');
        if(ci===citeIdx && cell && cell!=='N/D'){
          td.className = 'cite-cell';
          td.innerHTML = `<i class="fas fa-quote-right" style="font-size:.65rem;margin-right:.2rem"></i>${esc(cell)}`;
        } else if(ci===titleIdx){
          td.className = 'title-cell'; td.textContent = cell;
        } else {
          td.textContent = cell;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
      body.scrollTop = body.scrollHeight;
    }, ri * 180);
  });

  const analysisMatch = matrixMD.match(/##\s*Análisis General([\s\S]*)/);
  if(analysisMatch){
    const delay = rows.length * 180 + 400;
    setTimeout(()=>{
      const analysisDiv = document.createElement('div');
      analysisDiv.className = 'msg-bubble fade-in';
      analysisDiv.style.maxWidth = '100%';
      analysisDiv.innerHTML = marked.parse('## Análisis General' + analysisMatch[1]);
      appendMsg(analysisDiv);
    }, delay);
    setTimeout(()=> showTrendsAndGaps(matrixMD), delay + 200);
  }
}

function _extractMdSection(md, sectionName){
  const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re = new RegExp(
    `\\*{0,2}${escaped}\\*{0,2}[:\\s]*((?:.|\\n)*?)(?=\\n\\s*-?\\s*\\*{2}[A-ZÁÉÍÓÚÑÜ]|\\n##|$)`,
    'i'
  );
  const m = md.match(re);
  if(!m) return [];
  return m[1].split('\n')
    .filter(l=>/^\s*[-*•]\s/.test(l))
    .map(l=>l.replace(/^\s*[-*•]\s*\*{0,2}/,'').replace(/\*{0,2}:?\s*$/,'').trim())
    .filter(Boolean)
    .slice(0,8);
}

function showTrendsAndGaps(md){
  const trends = _extractMdSection(md,'Tendencias dominantes');
  const gaps   = _extractMdSection(md,'Brechas identificadas');
  if(!trends.length && !gaps.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'tg-wrap fade-in';
  wrap.innerHTML = `
    <div class="tg-title"><i class="fas fa-microscope"></i> Tendencias y brechas de la literatura</div>
    <div class="tg-grid">
      ${trends.length ? `
        <div class="tg-card">
          <div class="tg-card-hdr tg-blue"><i class="fas fa-chart-line"></i> Tendencias Dominantes</div>
          <div class="tg-card-body"><ul class="tg-list tg-blue">${trends.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>
        </div>` : ''}
      ${gaps.length ? `
        <div class="tg-card">
          <div class="tg-card-hdr tg-sky"><i class="fas fa-magnifying-glass-plus"></i> Brechas de Investigación</div>
          <div class="tg-card-body"><ul class="tg-list tg-sky">${gaps.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></div>
        </div>` : ''}
    </div>
  `;
  appendMsg(wrap);
}

function showHypotheses(hypotheses){
  if(!hypotheses||!hypotheses.length) return;
  const wrap = document.createElement('div');
  wrap.className = 'hyp-wrap fade-in';
  wrap.innerHTML = `
    <div class="hyp-title"><i class="fas fa-lightbulb"></i> Hipótesis de investigación generadas por IA</div>
    <div class="hyp-grid">
      ${hypotheses.map((h,i)=>`
        <div class="hyp-card">
          <div class="hyp-badge">H${i+1}</div>
          <div class="hyp-text">${esc(h.hypothesis||'')}</div>
          <div class="hyp-gap"><i class="fas fa-magnifying-glass" style="font-size:.65rem;margin-right:.3rem;opacity:.6"></i>${esc(h.gap||'')}</div>
          <div class="hyp-method"><i class="fas fa-flask" style="font-size:.65rem;margin-top:2px;flex-shrink:0"></i>${esc(h.methodology||'')}</div>
          <div class="hyp-novelty">
            <div class="hyp-novelty-bar"><div class="hyp-novelty-fill" style="width:${(h.novelty||5)*10}%"></div></div>
            <div class="hyp-novelty-label">Novedad ${h.novelty||'?'}/10</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  appendMsg(wrap);
}

/* ═══ MATRIX STREAMING ════════════════════════════════════════════════════ */
let _matrixStreamed = false;
let _matrixStreamWrap = null;
let _matrixStreamTbody = null;
let _matrixStreamHeaderDone = false;
let _matrixStreamBuf = '';
let _mxpStreaming = false;

function _mxpShowLive(on){
  const pill = document.getElementById('mxp-live-pill');
  if(pill) pill.style.display = on ? 'inline-flex' : 'none';
  const btn = document.getElementById('nav-matrix');
  if(!btn) return;
  const existing = btn.querySelector('.nav-live-badge');
  if(on && !existing){
    const b = document.createElement('span');
    b.className = 'nav-live-badge';
    b.innerHTML = '<i class="fas fa-circle" style="font-size:.45rem"></i> LIVE';
    btn.appendChild(b);
  } else if(!on && existing){
    existing.remove();
  }
}

function _mxpInitTable(headers){
  const empty = document.getElementById('mxp-empty');
  const tbl   = document.getElementById('mxp-table');
  const thead = document.getElementById('mxp-thead');
  const tbody = document.getElementById('mxp-tbody');
  if(!tbl || !thead || !tbody) return;
  empty.style.display = 'none';
  tbl.style.display   = 'table';
  tbody.innerHTML     = '';
  thead.innerHTML     = '';
  const hr = document.createElement('tr');
  const thCb = document.createElement('th');
  thCb.innerHTML = '<input type="checkbox" class="mxp-check" id="mxp-check-all" onchange="_mxpToggleAll(this.checked)" title="Seleccionar todo"/>';
  hr.appendChild(thCb);
  headers.forEach((h,i)=>{
    if(!matrixVisibleCols.includes(i)) return;
    const th = document.createElement('th');
    th.innerHTML = `${esc(h)}<i class="fas fa-sort sort-icon"></i>`;
    th.title = 'Ordenar por '+h;
    th.onclick = ()=>mxpSortBy(i);
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  const countEl = document.getElementById('mxp-row-count');
  if(countEl) countEl.textContent = '0 filas';
}

function _mxpAppendRow(cells, idx){
  const tbl   = document.getElementById('mxp-table');
  const tbody = document.getElementById('mxp-tbody');
  if(!tbody || !tbl || tbl.style.display === 'none') return;
  const titleIdx = globalMatrixHeaders.findIndex(h=>/tít|titl/i.test(h));
  const citeIdx  = globalMatrixHeaders.findIndex(h=>/cit/i.test(h));
  const tr = document.createElement('tr');
  tr.className = 'mxp-row-live';
  const tdCb = document.createElement('td');
  const cb = document.createElement('input');
  cb.type='checkbox'; cb.className='mxp-check';
  cb.onchange = ()=>mxpToggleRow(idx);
  tdCb.appendChild(cb); tr.appendChild(tdCb);
  globalMatrixHeaders.forEach((_,ci)=>{
    if(!matrixVisibleCols.includes(ci)) return;
    const td = document.createElement('td');
    const cell = cells[ci]||'';
    if(ci===citeIdx && cell){
      td.className='td-cite';
      td.innerHTML=`<i class="fas fa-quote-right" style="font-size:.6rem;margin-right:.2rem"></i>${esc(cell)}`;
    } else if(ci===titleIdx){
      td.className='td-title'; td.textContent=cell;
    } else if(cell.length>80){
      td.className='td-cell';
      td.innerHTML=`<span class="cell-text">${esc(cell)}</span>`;
      td.title='Clic para expandir';
      td.onclick=()=>cellExpand(globalMatrixHeaders[ci],cell);
    } else {
      td.textContent=cell;
    }
    tr.appendChild(td);
  });
  tbody.appendChild(tr);
  const countEl = document.getElementById('mxp-row-count');
  if(countEl) countEl.textContent = `${idx+1} fila${idx+1!==1?'s':''}`;
  const wrap = document.getElementById('mxp-table-wrap');
  if(wrap) wrap.scrollTop = wrap.scrollHeight;
}

function handleMatrixChunk(text){
  _matrixStreamBuf += text;
  _matrixStreamed = true;

  if(!_matrixStreamWrap){
    _matrixStreamWrap = document.createElement('div');
    _matrixStreamWrap.className = 'matrix-stream-wrap fade-in';
    _matrixStreamWrap.innerHTML = `
      <div class="matrix-stream-hdr"><div class="pulse"></div> Generando matriz…</div>
      <div class="matrix-tbl-wrap"><table class="matrix-tbl" id="matrix-stream-tbl"></table></div>`;
    appendMsg(_matrixStreamWrap);
  }
  const tbl = document.getElementById('matrix-stream-tbl');

  const lines = _matrixStreamBuf.split('\n');
  _matrixStreamBuf = lines.pop();
  for(const line of lines){
    const s = line.trim();
    if(!s.startsWith('|') || !s.endsWith('|')) continue;
    if(s.includes('---')) continue;
    const cells = s.slice(1,-1).split('|').map(c=>c.trim());
    const tr = document.createElement('tr');
    tr.className = 'new-row';
    if(!_matrixStreamHeaderDone){
      const thead = tbl.querySelector('thead') || tbl.appendChild(document.createElement('thead'));
      cells.forEach(c=>{ const th=document.createElement('th'); th.textContent=c; tr.appendChild(th); });
      thead.appendChild(tr);
      if(!tbl.querySelector('tbody')) tbl.appendChild(document.createElement('tbody'));
      _matrixStreamTbody = tbl.querySelector('tbody');
      _matrixStreamHeaderDone = true;
      globalMatrixHeaders = cells;
      matrixVisibleCols   = cells.map((_,i)=>i);
      matrixSelRows       = new Set();
      globalMatrixRows    = [];
      _mxpStreaming       = true;
      _mxpShowLive(true);
      if(currentPage==='matrix-page') _mxpInitTable(cells);
    } else if(_matrixStreamTbody){
      cells.forEach(c=>{ const td=document.createElement('td'); td.textContent=c; tr.appendChild(td); });
      _matrixStreamTbody.appendChild(tr);
      const rowIdx = globalMatrixRows.length;
      globalMatrixRows.push(cells);
      if(currentPage==='matrix-page') _mxpAppendRow(cells, rowIdx);
    }
  }
  const msgs = document.getElementById('messages');
  msgs.scrollTop = msgs.scrollHeight;
}

function finalizeStreamedMatrix(fullMd){
  storeMatrix(fullMd);
  const hdr = _matrixStreamWrap?.querySelector('.matrix-stream-hdr');
  if(hdr) hdr.innerHTML = '<i class="fas fa-table"></i> Matriz bibliográfica';

  const analysisMatch = fullMd.match(/##\s*Análisis General([\s\S]*)/);
  if(analysisMatch){
    const div = document.createElement('div');
    div.className = 'msg-bubble fade-in';
    div.style.maxWidth='100%';
    div.innerHTML = marked.parse('## Análisis General' + analysisMatch[1]);
    appendMsg(div);
    setTimeout(()=> showTrendsAndGaps(fullMd), 200);
  }

  _matrixStreamWrap = null; _matrixStreamTbody = null;
  _matrixStreamHeaderDone = false; _matrixStreamBuf = '';
  _mxpStreaming = false; _mxpShowLive(false);
}

/* ═══ MATRIX PAGE ═════════════════════════════════════════════════════════ */
function storeMatrix(md){
  globalMatrixMD = md;
  const rows = parseMdTable(md);
  if(!rows.length) return;
  globalMatrixHeaders = rows[0];
  globalMatrixRows    = rows.slice(1);
  matrixSelRows       = new Set();
  matrixSortCol       = -1;
  matrixSortAsc       = true;
  matrixSearchQ       = '';
  matrixVisibleCols   = globalMatrixHeaders.map((_,i)=>i);
}

function renderMatrixPage(){
  const empty   = document.getElementById('mxp-empty');
  const tbl     = document.getElementById('mxp-table');
  const thead   = document.getElementById('mxp-thead');
  const tbody   = document.getElementById('mxp-tbody');
  const srchInp = document.getElementById('mxp-search');
  if(srchInp) srchInp.value = matrixSearchQ;

  if(!globalMatrixHeaders.length){
    empty.style.display='flex'; tbl.style.display='none';
    document.getElementById('mxp-row-count').textContent='0 filas';
    return;
  }
  empty.style.display='none'; tbl.style.display='table';

  _buildColPanel();

  thead.innerHTML = '';
  const hr = document.createElement('tr');
  const thCb = document.createElement('th');
  thCb.innerHTML = '<input type="checkbox" class="mxp-check" id="mxp-check-all" onchange="_mxpToggleAll(this.checked)" title="Seleccionar todo"/>';
  hr.appendChild(thCb);
  globalMatrixHeaders.forEach((h,i)=>{
    if(!matrixVisibleCols.includes(i)) return;
    const th = document.createElement('th');
    const sortIcon = `<i class="fas fa-sort sort-icon"></i>`;
    th.innerHTML = `${esc(h)}${sortIcon}`;
    if(matrixSortCol===i) th.classList.add('sorted');
    th.dataset.col = i;
    th.title = 'Ordenar por '+h;
    th.onclick = ()=>mxpSortBy(i);
    hr.appendChild(th);
  });
  thead.appendChild(hr);

  renderMatrixRows();
}

function renderMatrixRows(){
  const tbody = document.getElementById('mxp-tbody');
  if(!tbody) return;
  tbody.innerHTML='';

  const q = matrixSearchQ.toLowerCase();
  let rows = globalMatrixRows.map((r,i)=>({r,i}));

  if(q) rows = rows.filter(({r})=>r.some(c=>(c||'').toLowerCase().includes(q)));

  if(matrixSortCol>=0){
    rows.sort((a,b)=>{
      const va=a.r[matrixSortCol]||'', vb=b.r[matrixSortCol]||'';
      const na=parseFloat(va), nb=parseFloat(vb);
      const cmp = (!isNaN(na)&&!isNaN(nb)) ? na-nb : va.localeCompare(vb,'es',{numeric:true});
      return matrixSortAsc ? cmp : -cmp;
    });
  }

  document.getElementById('mxp-row-count').textContent=`${rows.length} fila${rows.length!==1?'s':''}`;

  const titleIdx = globalMatrixHeaders.findIndex(h=>/tít|titl/i.test(h));
  const citeIdx  = globalMatrixHeaders.findIndex(h=>/cit/i.test(h));

  rows.forEach(({r,i})=>{
    const tr = document.createElement('tr');
    if(matrixSelRows.has(i)) tr.classList.add('mxp-selected');

    const tdCb = document.createElement('td');
    const cb = document.createElement('input');
    cb.type='checkbox'; cb.className='mxp-check';
    cb.checked = matrixSelRows.has(i);
    cb.onchange = ()=>mxpToggleRow(i);
    tdCb.appendChild(cb); tr.appendChild(tdCb);

    globalMatrixHeaders.forEach((_,ci)=>{
      if(!matrixVisibleCols.includes(ci)) return;
      const td = document.createElement('td');
      const cell = r[ci]||'';
      const hi = q ? _highlightText(cell,q) : esc(cell);

      if(ci===citeIdx && cell){
        td.className='td-cite'; td.innerHTML=`<i class="fas fa-quote-right" style="font-size:.6rem;margin-right:.2rem"></i>${hi}`;
      } else if(ci===titleIdx){
        td.className='td-title'; td.innerHTML=hi;
      } else if(cell.length>80){
        td.className='td-cell';
        td.innerHTML=`<span class="cell-text">${hi}</span>`;
        td.title='Clic para expandir';
        td.onclick=()=>cellExpand(globalMatrixHeaders[ci],cell);
      } else {
        td.innerHTML=hi;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function _highlightText(text, q){
  const safe = esc(text);
  if(!q) return safe;
  const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
  return safe.replace(re,'<mark class="mxp-highlight">$1</mark>');
}

function _buildColPanel(){
  const panel = document.getElementById('mxp-col-panel');
  if(!panel) return;
  panel.innerHTML = globalMatrixHeaders.map((h,i)=>{
    const vis = matrixVisibleCols.includes(i);
    return `<button class="mxp-col-toggle${vis?'':' hidden'}" onclick="_mxpToggleCol(${i})" title="${esc(h)}">${esc(h.length>18?h.substring(0,18)+'…':h)}</button>`;
  }).join('');
}

function _mxpToggleCol(i){
  const idx = matrixVisibleCols.indexOf(i);
  if(idx>=0) matrixVisibleCols.splice(idx,1);
  else       matrixVisibleCols.push(i);
  matrixVisibleCols.sort((a,b)=>a-b);
  _buildColPanel();
  renderMatrixPage();
}

function _mxpToggleAll(checked){
  if(checked) globalMatrixRows.forEach((_,i)=>matrixSelRows.add(i));
  else        matrixSelRows.clear();
  updateCompareFab();
  renderMatrixRows();
}

function mxpSearch(q){
  matrixSearchQ = q;
  renderMatrixRows();
}

function mxpToggleRow(i){
  if(matrixSelRows.has(i)) matrixSelRows.delete(i);
  else                     matrixSelRows.add(i);
  updateCompareFab();
  const allCb = document.getElementById('mxp-check-all');
  if(allCb) allCb.checked = matrixSelRows.size===globalMatrixRows.length;
  document.querySelectorAll('#mxp-tbody tr').forEach((tr)=>{
    const cb = tr.querySelector('input[type=checkbox]');
    if(!cb) return;
    tr.classList.toggle('mxp-selected', cb.checked);
  });
}

function updateCompareFab(){
  const fab = document.getElementById('mxp-fab');
  const cnt = document.getElementById('mxp-fab-count');
  if(!fab) return;
  const n = matrixSelRows.size;
  fab.style.display = n>=2 ? 'flex' : 'none';
  if(cnt) cnt.textContent = n;
}

function openCompare(){
  const sel = [...matrixSelRows].sort((a,b)=>a-b);
  if(sel.length<2) return;
  const rows = sel.map(i=>globalMatrixRows[i]);

  const content = document.getElementById('mxp-cmp-content');
  const table = document.createElement('table');
  table.className = 'mxp-cmp-table';

  const thead = document.createElement('thead');
  const hdr = document.createElement('tr');
  const thAttr = document.createElement('th'); thAttr.className='mxp-attr-col'; thAttr.textContent='Atributo';
  hdr.appendChild(thAttr);
  rows.forEach((r,ri)=>{
    const th = document.createElement('th'); th.className='mxp-paper-col';
    const titleIdx = globalMatrixHeaders.findIndex(h=>/tít|titl/i.test(h));
    th.textContent = titleIdx>=0 ? (r[titleIdx]||`Paper ${ri+1}`) : `Paper ${ri+1}`;
    hdr.appendChild(th);
  });
  thead.appendChild(hdr); table.appendChild(thead);

  const tbody = document.createElement('tbody');
  globalMatrixHeaders.forEach((h,ci)=>{
    if(!matrixVisibleCols.includes(ci)) return;
    const values = rows.map(r=>r[ci]||'');
    const allSame = values.every(v=>v===values[0]);
    const tr = document.createElement('tr');
    if(allSame && values[0]) { tr.classList.add('mxp-equal'); }

    const tdAttr = document.createElement('td'); tdAttr.className='mxp-attr-val';
    tdAttr.innerHTML = esc(h) + (allSame && values[0] ? '<span class="mxp-equal-badge"><i class="fas fa-check"></i> IGUAL</span>' : '');
    tr.appendChild(tdAttr);

    values.forEach(v=>{
      const td = document.createElement('td'); td.className='mxp-cell-val';
      td.textContent = v;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  content.innerHTML='';
  content.appendChild(table);
  document.getElementById('mxp-modal-overlay').style.display='flex';
}

function closeCompare(){
  document.getElementById('mxp-modal-overlay').style.display='none';
}

function toggleColPanel(){
  const panel = document.getElementById('mxp-col-panel');
  const btn   = document.getElementById('mxp-col-btn');
  if(!panel) return;
  const show = panel.style.display==='none';
  panel.style.display = show ? 'flex' : 'none';
  btn?.classList.toggle('active', show);
}

function mxpSortBy(col){
  if(matrixSortCol===col) matrixSortAsc=!matrixSortAsc;
  else { matrixSortCol=col; matrixSortAsc=true; }
  renderMatrixPage();
}

function cellExpand(header, text){
  document.getElementById('mxp-cell-modal-title').textContent = header;
  document.getElementById('mxp-cell-modal-text').textContent  = text;
  document.getElementById('mxp-cell-modal').style.display     = 'flex';
}

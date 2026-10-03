/* ═══ EXPLORER ════════════════════════════════════════════════════════════ */
function applyFilters(){
  const q   = (document.getElementById('explorer-search')?.value||'').toLowerCase();
  const src = document.getElementById('explorer-source')?.value||'';
  const srt = document.getElementById('explorer-sort')?.value||'citations';
  let ps = [...globalPapers];
  if(q)   ps = ps.filter(p=>(p.title||'').toLowerCase().includes(q)||(p.authors||'').toLowerCase().includes(q)||(p.keywords||'').toLowerCase().includes(q)||(p.abstract||'').toLowerCase().includes(q));
  if(src) ps = ps.filter(p=>p.source===src);
  if(srt==='citations')  ps.sort((a,b)=>(parseInt(b.citations)||0)-(parseInt(a.citations)||0));
  else if(srt==='year-desc') ps.sort((a,b)=>(parseInt(b.year)||0)-(parseInt(a.year)||0));
  else if(srt==='year-asc')  ps.sort((a,b)=>(parseInt(a.year)||0)-(parseInt(b.year)||0));

  document.getElementById('explorer-count').textContent = `${ps.length} resultado${ps.length!==1?'s':''}`;
  const container = document.getElementById('explorer-papers'); container.innerHTML='';
  if(!ps.length){
    container.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>${globalPapers.length?'Sin resultados para esos filtros.':'Inicia una búsqueda en el Chat para ver papers aquí.'}</p></div>`;
    return;
  }
  ps.forEach(p=>{
    const cite = parseInt(p.citations)||0;
    const badgeClass = p.source==='ArXiv'?'badge-arxiv':p.source==='Google Scholar'?'badge-scholar':'badge-upload';
    const kws = (p.keywords||'').split(',').map(k=>k.trim()).filter(Boolean).slice(0,5);
    const card = document.createElement('div'); card.className='paper-card fade-in';
    card.innerHTML = `
      <div class="paper-card-top">
        <span class="paper-badge ${badgeClass}">${esc(p.source||'')}</span>
        <div style="display:flex;align-items:center;gap:.35rem">
          ${p.open_access==='Sí'?'<span class="paper-oa"><i class="fas fa-lock-open"></i> OA</span>':''}
          ${cite>0?`<span class="paper-cite-badge"><i class="fas fa-quote-right"></i> ${cite}</span>`:''}
        </div>
      </div>
      <div class="paper-title">${esc(p.title||'Sin título')}</div>
      <div class="paper-authors">${esc(p.authors||'Autores desconocidos')}</div>
      <div class="paper-meta-row">
        ${p.year?`<span><i class="fas fa-calendar-alt"></i>${p.year}</span>`:''}
        ${p.journal?`<span><i class="fas fa-book-open"></i>${esc(p.journal.substring(0,22))}</span>`:''}
        ${p.doi?`<span><i class="fas fa-fingerprint"></i>DOI</span>`:''}
      </div>
      ${p.abstract?`<div class="paper-abstract">${esc(p.abstract)}</div>`:''}
      ${kws.length?`<div class="paper-kws">${kws.map(k=>`<span class="kw-tag">${esc(k)}</span>`).join('')}</div>`:''}
      <div class="paper-footer">
        ${p.url?`<button class="paper-action-btn" onclick="window.open('${encodeURI(p.url)}','_blank')"><i class="fas fa-external-link-alt"></i> Ver paper</button>`:''}
        ${p.doi?`<button class="paper-action-btn" onclick="navigator.clipboard.writeText('${p.doi}')"><i class="fas fa-copy"></i> Copiar DOI</button>`:''}
      </div>
    `;
    container.appendChild(card);
  });
}

/* ═══ TEMPLATE PICKER ═════════════════════════════════════════════════════ */
const TPL_PREVIEW_COLS = {
  estado_arte:          ['Autores','Año','Técnica','Dataset','Métricas','Resultados','Limitaciones','Citas','DOI'],
  revision_sistematica: ['Autores','Estudio','Muestra','Metodología','Evidencia','Sesgo','Citas','DOI'],
  benchmarking:         ['Modelo','Dataset','Accuracy','F1','AUC-ROC','Tiempo','Código','Citas'],
};

function buildTplPreview(id){
  const cols = TPL_PREVIEW_COLS[id]||[];
  if(!cols.length) return '';
  const ths = cols.map(c=>`<th>${esc(c)}</th>`).join('');
  const tds = cols.map(()=>`<td>···</td>`).join('');
  return `<table><tr>${ths}</tr><tr>${tds}</tr></table>`;
}

let selectedTpl = '';

function showTemplatePicker(templates, papers){
  if(papers.length){
    const wrap = document.createElement('div');
    wrap.className = 'papers-preview fade-in';
    papers.slice(0,5).forEach(p=>{
      const mc = document.createElement('div'); mc.className='paper-mini-card';
      const cite = parseInt(p.citations)||0;
      mc.innerHTML = `
        <div class="paper-mini-title">${esc(p.title||'Sin título')}</div>
        <div class="paper-mini-meta">${esc(p.authors?.split(',')[0]||'')} · ${p.year||''}</div>
        ${cite>0?`<div class="paper-mini-cite"><i class="fas fa-quote-right"></i>${cite}</div>`:''}
      `;
      wrap.appendChild(mc);
    });
    if(papers.length>5){
      const more = document.createElement('div'); more.className='paper-mini-card';
      more.style.display='flex'; more.style.alignItems='center'; more.style.justifyContent='center';
      more.style.color='var(--muted)'; more.style.fontSize='.8rem';
      more.textContent = `+${papers.length-5} más`;
      wrap.appendChild(more);
    }
    appendMsg(wrap);
  }

  selectedTpl = '';
  const card = document.createElement('div');
  card.className = 'tpl-card fade-in'; card.id = 'tpl-picker';
  const tplGrid = templates.map(t=>`
    <button class="tpl-btn" id="tpl-${t.id}" onclick="selectTpl('${t.id}')">
      <div class="tpl-check">✓</div>
      <div class="tpl-top-row">
        <span class="tpl-icon">${t.icon||'📄'}</span>
        <span class="tpl-name">${esc(t.name)}</span>
      </div>
      <div class="tpl-desc">${esc(t.description||'')}</div>
      <div class="tpl-preview">${buildTplPreview(t.id)}</div>
    </button>
  `).join('');
  card.innerHTML = `
    <div class="tpl-hdr"><i class="fas fa-table"></i> Elige la plantilla de matriz bibliográfica</div>
    <div class="tpl-body">
      <div class="tpl-grid">${tplGrid}</div>
      <textarea class="tpl-custom" id="tpl-custom" rows="2" placeholder="O describe tu formato personalizado (opcional)…"></textarea>
      <button class="tpl-confirm-btn" onclick="confirmTpl()"><i class="fas fa-cogs"></i> Generar matriz</button>
    </div>
  `;
  appendMsg(card);
  disableInput();
}

function selectTpl(id){
  selectedTpl = id;
  document.querySelectorAll('.tpl-btn').forEach(b=>b.classList.remove('selected'));
  document.getElementById(`tpl-${id}`)?.classList.add('selected');
}

function confirmTpl(){
  const custom = document.getElementById('tpl-custom')?.value.trim()||'';
  document.getElementById('tpl-picker')?.remove();
  addUserMsg(selectedTpl ? `Plantilla: ${selectedTpl}` : (custom||'Tabla estándar'));
  wsSend({ template_id: selectedTpl, content: custom });
  showTyping('Generando matriz bibliográfica…');
}

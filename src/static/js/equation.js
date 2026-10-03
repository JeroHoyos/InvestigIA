/* ═══ EQUATION EDITOR ═════════════════════════════════════════════════════ */
let eqTerms = [];

function showEquationEditor(equation, explanation){
  eqTerms = parseEqTerms(equation);
  const card = document.createElement('div');
  card.className = 'eq-card fade-in'; card.id = 'eq-editor';
  card.innerHTML = `
    <div class="eq-hdr"><i class="fas fa-code"></i> Ecuación de búsqueda — edita los términos</div>
    <div class="eq-body">
      <div class="eq-groups">
        <div class="eq-group">
          <div class="eq-group-hdr and"><i class="fas fa-plus-circle"></i> AND <span class="desc">— todos deben aparecer</span></div>
          <div class="eq-group-body" id="eq-chips-and"></div>
          <div class="eq-add-row">
            <input class="eq-add-input" id="eq-in-and" placeholder="Añadir término AND…"/>
            <button class="eq-add-btn and" onclick="addTerm('and')">+</button>
          </div>
        </div>
        <div class="eq-group">
          <div class="eq-group-hdr or"><i class="fas fa-circle-half-stroke"></i> OR <span class="desc">— alguno debe aparecer</span></div>
          <div class="eq-group-body" id="eq-chips-or"></div>
          <div class="eq-add-row">
            <input class="eq-add-input" id="eq-in-or" placeholder="Añadir variante OR…"/>
            <button class="eq-add-btn or" onclick="addTerm('or')">+</button>
          </div>
        </div>
        <div class="eq-group">
          <div class="eq-group-hdr not"><i class="fas fa-ban"></i> NOT <span class="desc">— excluir si aparece</span></div>
          <div class="eq-group-body" id="eq-chips-not"></div>
          <div class="eq-add-row">
            <input class="eq-add-input" id="eq-in-not" placeholder="Añadir exclusión NOT…"/>
            <button class="eq-add-btn not" onclick="addTerm('not')">+</button>
          </div>
        </div>
      </div>
      <div class="eq-preview-row">
        <div class="eq-preview-label">Vista previa de la ecuación</div>
        <div class="eq-preview-box" id="eq-preview">—</div>
      </div>
      <div class="eq-count-row">
        <div class="eq-count-label">Papers por fuente: <strong><span id="eq-count-val">10</span></strong></div>
        <input type="range" id="eq-count-slider" min="1" max="25" value="10" oninput="document.getElementById('eq-count-val').textContent=this.value"/>
      </div>
    </div>
    <div class="eq-footer">
      <button class="eq-search-btn" onclick="confirmEquation()"><i class="fas fa-magnifying-glass"></i> Buscar en ArXiv y Google Scholar</button>
    </div>
  `;
  // Append first so DOM is ready, then init chips on next frame to avoid layout freeze
  appendMsg(card);
  requestAnimationFrame(()=>{
    renderEqChips();
    ['and','or','not'].forEach(t=>{
      const inp = document.getElementById(`eq-in-${t}`);
      if(inp) inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addTerm(t); } });
    });
  });
  disableInput();
}

function parseEqTerms(eq){
  const terms = []; let curType = 'and';
  const tokens = eq.split(/\s+(AND|OR|NOT)\s+/i);
  tokens.forEach(tok=>{
    const up = tok.trim().toUpperCase();
    if(up==='AND'){ curType='and'; return; }
    if(up==='OR'){  curType='or';  return; }
    if(up==='NOT'){ curType='not'; return; }
    const clean = tok.replace(/^\(+|\)+$/g,'').trim();
    if(clean) terms.push({ text:clean, type:curType });
  });
  if(!terms.length && eq.trim()) terms.push({ text:eq.trim(), type:'and' });
  return terms;
}

let _dragIdx = null;

function renderEqChips(){
  ['and','or','not'].forEach(type=>{
    const el = document.getElementById(`eq-chips-${type}`); if(!el) return;
    el.innerHTML = '';

    el.ondragover  = e => { e.preventDefault(); e.dataTransfer.dropEffect='move'; el.classList.add('dragover'); };
    el.ondragleave = e => { if(!el.contains(e.relatedTarget)) el.classList.remove('dragover'); };
    el.ondrop      = e => {
      e.preventDefault(); el.classList.remove('dragover');
      if(_dragIdx === null) return;
      eqTerms[_dragIdx].type = type;
      _dragIdx = null;
      renderEqChips();
    };

    eqTerms.filter(x=>x.type===type).forEach(term=>{
      const idx = eqTerms.indexOf(term);
      const chip = document.createElement('div');
      chip.className = `eq-chip ${type}`;
      chip.draggable = true;
      chip.title = 'Arrastra para mover de columna';
      chip.innerHTML = `<span class="eq-drag-handle">⠿</span><span class="eq-chip-text">${esc(term.text)}</span><span class="rm" title="Eliminar">×</span>`;

      chip.ondragstart = e => {
        _dragIdx = idx;
        e.dataTransfer.effectAllowed = 'move';
        requestAnimationFrame(()=>chip.classList.add('dragging'));
      };
      chip.ondragend = () => { chip.classList.remove('dragging'); _dragIdx = null; };

      chip.querySelector('.rm').addEventListener('click', e => {
        e.stopPropagation();
        eqTerms.splice(idx, 1);
        renderEqChips();
      });

      el.appendChild(chip);
    });
  });
  updatePreview();
}

function addTerm(type){
  const inp = document.getElementById(`eq-in-${type}`);
  const text = inp?.value.trim(); if(!text) return;
  eqTerms.push({ text, type });
  inp.value = '';
  inp.focus();
  renderEqChips();
}

function updatePreview(){
  const g = { and:[], or:[], not:[] };
  eqTerms.forEach(t=>g[t.type].push(t.text));
  let parts = [];
  if(g.and.length) parts.push('('+g.and.join(' OR ')+')');
  if(g.or.length)  parts.push('('+g.or.join(' OR ')+')');
  let eq = parts.join(' AND ');
  if(g.not.length) eq += ' NOT ('+g.not.join(' OR ')+')';
  const prev = document.getElementById('eq-preview'); if(!prev) return;
  prev.textContent = eq || '(vacío)';
}

function confirmEquation(){
  const count = parseInt(document.getElementById('eq-count-slider')?.value||'10');
  const eq    = document.getElementById('eq-preview')?.textContent||'';
  document.getElementById('eq-editor')?.remove();
  addUserMsg(`Búsqueda: ${eq.substring(0,60)}… · ${count} papers/fuente`);
  wsSend({ content: eq, count });
  showTyping('Buscando en ArXiv y Google Scholar…');
}

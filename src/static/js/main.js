/* ═══ INIT ════════════════════════════════════════════════════════════════ */
async function init(){
  sessionId = Math.random().toString(36).slice(2,11);
  setupListeners();
  connectWS();
  initHeroBg();
  setTimeout(initChatBg, 200);
}

/* ═══ LISTENERS ════════════════════════════════════════════════════════════ */
function setupListeners(){
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  const inp = document.getElementById('chat-input');
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} });
  inp.addEventListener('input',()=>autoResize(inp));
  const hero = document.getElementById('hero-input');
  hero.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();heroSearch();} });
  hero.addEventListener('input',()=>autoResize(hero));
  document.getElementById('upload-pdf-btn').addEventListener('click',()=>{
    document.getElementById('upload-panel').classList.toggle('show');
  });
  const uz = document.getElementById('upload-zone');
  uz.addEventListener('click',()=>document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change',e=>{ if(e.target.files.length) uploadPaper(e.target.files[0]); });
  uz.addEventListener('dragover',e=>{ e.preventDefault(); uz.style.background='var(--blue-l)'; });
  uz.addEventListener('dragleave',()=>uz.style.background='');
  uz.addEventListener('drop',e=>{ e.preventDefault(); uz.style.background=''; if(e.dataTransfer.files.length) uploadPaper(e.dataTransfer.files[0]); });
  document.getElementById('explorer-search').addEventListener('input', applyFilters);
  document.getElementById('explorer-source').addEventListener('change', applyFilters);
  document.getElementById('explorer-sort').addEventListener('change', applyFilters);
}

init();

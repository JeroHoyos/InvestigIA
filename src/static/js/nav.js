/* ═══ NAV ═════════════════════════════════════════════════════════════════ */
function showPage(name, navId){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  if(navId) document.getElementById(navId)?.classList.add('active');
  currentPage = name;
  if(name==='graph')       setTimeout(buildGraph,80);
  if(name==='stats')       setTimeout(buildStats,80);
  if(name==='explorer')    setTimeout(applyFilters,60);
  if(name==='chat')        setTimeout(initChatBg,80);
  if(name==='matrix-page'){
    if(_mxpStreaming && globalMatrixHeaders.length){
      _mxpInitTable(globalMatrixHeaders);
      globalMatrixRows.forEach((cells,i)=>_mxpAppendRow(cells,i));
    } else {
      setTimeout(renderMatrixPage,60);
    }
  }
}

function heroSearch(){
  const inp = document.getElementById('hero-input');
  const text = inp.value.trim();
  if(!text) return;
  inp.value = '';
  showPage('chat','nav-chat');
  setTimeout(()=>{
    addUserMsg(text);
    wsSend({ content: text });
    showTyping('Analizando tu tema de investigación…');
    disableInput();
  }, 80);
}

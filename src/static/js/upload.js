/* ═══ UPLOAD ══════════════════════════════════════════════════════════════ */
async function uploadPaper(file){
  if(!file.type.includes('pdf')){ addBotMsg('Solo se aceptan archivos PDF.'); return; }
  const fd = new FormData(); fd.append('file', file);
  try{
    showTyping('Extrayendo metadatos del PDF…');
    const r = await fetch(`/api/upload/paper/${sessionId}`,{method:'POST',body:fd});
    const d = await r.json(); removeTyping();
    if(d.success){ globalPapers.push(d.paper); updateHomeKPIs(); addBotMsg(`Paper subido: **${d.paper.title}**`); }
    else addBotMsg('Error: '+(d.error||'No se pudo subir el paper'));
  }catch(e){ removeTyping(); addBotMsg('Error al subir: '+e.message); }
  document.getElementById('upload-panel').classList.remove('show');
}

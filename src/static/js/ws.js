/* ═══ WEBSOCKET ═══════════════════════════════════════════════════════════ */
function connectWS(){
  const proto = location.protocol==='https:'?'wss:':'ws:';
  ws = new WebSocket(`${proto}//${location.host}/ws/${sessionId}`);
  ws.onopen  = ()=>setConn(true);
  ws.onclose = ()=>{ setConn(false); setTimeout(connectWS,2500); };
  ws.onerror = ()=>setConn(false);
  ws.onmessage = e=>{ try{ handleWS(JSON.parse(e.data)); }catch(err){ console.error(err); } };
}

function setConn(ok){
  document.getElementById('conn-dot').className = `dot ${ok?'online':'offline'}`;
  document.getElementById('conn-label').textContent = ok ? 'Conectado' : 'Desconectado';
}

function wsSend(data){ if(ws&&ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify(data)); }

function handleWS(msg){
  if(!msg||!msg.type) return;
  removeTyping();
  switch(msg.type){
    case 'question':
      currentInterruptType = 'question';
      addBotMsg(msg.content||'¿Qué necesitas investigar?');
      enableInput(); break;
    case 'status':
      showTyping(msg.content||'Procesando…'); break;
    case 'equation':
      currentInterruptType = 'equation';
      addBotMsg(msg.content||'Revisa la ecuación generada:');
      showEquationEditor(msg.equation||'', msg.explanation||''); break;
    case 'papers':
      currentInterruptType = 'papers';
      if(msg.papers?.length){ globalPapers = msg.papers; updateHomeKPIs(); }
      addBotMsg(msg.content||'¿Qué plantilla de matriz prefieres?');
      showTemplatePicker(msg.templates||[], msg.papers||[]); break;
    case 'matrix_chunk':
      handleMatrixChunk(msg.content||''); break;
    case 'qa':
      currentInterruptType = 'qa';
      if(msg.show_matrix){
        if(_matrixStreamed) finalizeStreamedMatrix(msg.matrix||'');
        else if(msg.matrix) showMatrix(msg.matrix);
        _matrixStreamed = false;
        if(msg.hypotheses?.length) showHypotheses(msg.hypotheses);
      }
      if(msg.last_answer) addBotMsg(msg.last_answer);
      enableInput(); break;
    case 'complete':
      addBotMsg(msg.content||'Sesión completada.'); disableInput(); break;
    case 'error':
      currentInterruptType = 'qa';
      if(_matrixStreamed){ finalizeStreamedMatrix(''); _matrixStreamed = false; }
      addBotMsg('⚠ '+(msg.content||'Error desconocido')); enableInput(); break;
  }
}

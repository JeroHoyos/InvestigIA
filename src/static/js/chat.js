/* ═══ CHAT MESSAGES ═══════════════════════════════════════════════════════ */
function addBotMsg(content){
  const c = document.getElementById('messages');
  const d = document.createElement('div');
  d.className = 'message bot fade-in';
  d.innerHTML = `<div class="msg-av bot"><img src="/static/InvestigIA.svg" style="width:100%;height:100%;object-fit:contain" alt=""></div><div class="msg-bubble">${marked.parse(content)}</div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function addUserMsg(content){
  const c = document.getElementById('messages');
  const d = document.createElement('div');
  d.className = 'message user fade-in';
  d.innerHTML = `<div class="msg-av user"><i class="fas fa-user"></i></div><div class="msg-bubble">${esc(content)}</div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function appendMsg(el){
  const c = document.getElementById('messages');
  c.appendChild(el);
  c.scrollTop = c.scrollHeight;
}

let typingEl = null;
function showTyping(label){
  removeTyping();
  const c = document.getElementById('messages');
  typingEl = document.createElement('div');
  typingEl.className = 'typing-indicator fade-in'; typingEl.id = 'typing-el';
  typingEl.innerHTML = `<div class="msg-av bot"><img src="/static/InvestigIA.svg" style="width:100%;height:100%;object-fit:contain" alt=""></div><div class="typing-bubble"><div class="typing-dots"><span></span><span></span><span></span></div><div class="typing-label">${esc(label)}</div></div>`;
  c.appendChild(typingEl); c.scrollTop = c.scrollHeight;
}

function removeTyping(){ document.getElementById('typing-el')?.remove(); typingEl = null; }

/* ═══ INPUT ═══════════════════════════════════════════════════════════════ */
function enableInput(){ const i=document.getElementById('chat-input'); i.disabled=false; document.getElementById('send-btn').disabled=false; i.focus(); }
function disableInput(){ document.getElementById('chat-input').disabled=true; document.getElementById('send-btn').disabled=true; }

function sendMessage(){
  if(currentInterruptType==='equation'||currentInterruptType==='papers') return;
  const inp = document.getElementById('chat-input');
  const text = inp.value.trim(); if(!text) return;
  addUserMsg(text); inp.value = ''; autoResize(inp);
  wsSend({ content: text });
  showTyping('Analizando tu pregunta…'); disableInput();
}

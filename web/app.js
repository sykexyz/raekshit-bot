document.addEventListener('const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
let API_KEY = localStorage.getItem('rx_key') || '';
let socket = null;
let currentType = 'join';

const fields = {
  join:   [{ k: 'invite',   p: 'invite code or url', pref: 'inv' }],
  leave:  [{ k: 'guildId',  p: 'guild id',          pref: 'gld' }],
  spam:   [{ k: 'channelId', p: 'channel id',        pref: 'chn' }, { k: 'message', p: 'message payload', pref: 'msg' }],
  dm:     [{ k: 'targetId', p: 'target user id',     pref: 'usr' }, { k: 'message', p: 'message payload', pref: 'msg' }],
  invite: [{ k: 'channelId', p: 'channel id',        pref: 'chn' }],
  react:  [{ k: 'channelId', p: 'channel id',        pref: 'chn' }, { k: 'messageId', p: 'message id', pref: 'mid' }, { k: 'emoji', p: 'emoji', pref: 'emo' }],
  nick:   [{ k: 'guildId',  p: 'guild id',           pref: 'gld' }, { k: 'nickname', p: 'new nickname', pref: 'nck' }],
};

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY, ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

function renderParams() {
  const wrap = $('#params');
  wrap.innerHTML = '';
  (fields[currentType] || []).forEach(f => {
    const div = document.createElement('div');
    div.className = 'inp-wrap';
    div.innerHTML = `<span class="inp-prefix">${f.pref}</span><input id="p_${f.k}" placeholder="${f.p}" />`;
    wrap.appendChild(div);
  });
}

async function refreshTokens() {
  const list = await api('/tokens');
  $('#stat-tokens').textContent = list.length;
  $('#toklist').innerHTML = list.length === 0
    ? '<div class="empty">// no tokens in pool. add one above.</div>'
    : list.map(t => `
      <div class="item">
        <span class="badge ${t.valid ? 'ok' : 'bad'}">${t.valid ? 'LIVE' : 'DEAD'}</span>
        <span class="mono dim">#${String(t.id).padStart(3,'0')}</span>
        <span class="item-name">${t.username || 'unknown'}</span>
        <span class="mono dim trunc">${t.token_preview}</span>
        <button class="x" data-id="${t.id}">✕</button>
      </div>
    `).join('');
  $$('#toklist .x').forEach(b => {
    b.onclick = async () => {
      await api(`/tokens/${b.dataset.id}`, { method: 'DELETE' });
      refreshTokens();
    };
  });
}

async function refreshActive() {
  const list = await api('/raids/active');
  $('#stat-active').textContent = list.length;
  $('#active').innerHTML = list.length === 0
    ? '<div class="empty">// no active operations</div>'
    : list.map(r => {
      const pct = r.total ? Math.round((r.success / r.total) * 100) : 0;
      return `
        <div class="op-card">
          <div class="op-head">
            <span class="op-id">OP #${r.raidId}</span>
            <button class="x" data-id="${r.raidId}">STOP</button>
          </div>
          <div class="op-bar"><div class="op-fill" style="width:${pct}%"></div></div>
          <div class="op-stats">
            <span class="ok">${r.success} ok</span>
            <span class="bad">${r.failed} fail</span>
            <span class="dim">${r.total} total</span>
          </div>
        </div>
      `;
    }).join('');
  $$('#active .x').forEach(b => {
    b.onclick = async () => {
      await api(`/raids/${b.dataset.id}/stop`, { method: 'POST' });
      refreshActive();
    };
  });
}

function appendLog(entry) {
  const el = document.createElement('div');
  el.className = `log ${entry.level || 'info'}`;
  const t = new Date(entry.ts);
  const stamp = isNaN(t) ? entry.ts : t.toLocaleTimeString('en-GB', { hour12: false });
  el.innerHTML = `<span class="log-ts">[${stamp}]</span>${entry.raidId ? `<span class="log-rid">#${entry.raidId}</span>` : ''}<span class="log-msg">${escapeHtml(entry.message)}</span>`;
  const logs = $('#logs');
  logs.appendChild(el);
  while (logs.children.length > 800) logs.removeChild(logs.firstChild);
  logs.scrollTop = logs.scrollHeight;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function initSocket() {
  socket = io();
  socket.on('log', appendLog);
  const recent = await api('/logs');
  recent.forEach(appendLog);
}

async function start() {
  renderParams();

  $$('#rtype .tab').forEach(t => {
    t.onclick = () => {
      $$('#rtype .tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      currentType = t.dataset.type;
      renderParams();
    };
  });

  await refreshTokens();
  await refreshActive();
  await initSocket();

  setInterval(refreshActive, 3000);
  setInterval(refreshTokens, 15000);

  $('#addtok').onclick = async () => {
    const token = $('#tok').value.trim();
    if (!token) return;
    try {
      await api('/tokens', { method: 'POST', body: JSON.stringify({ token, proxy: $('#proxy').value.trim() || null }) });
      $('#tok').value = ''; $('#proxy').value = '';
      await refreshTokens();
      await api('/tokens/check', { method: 'POST' });
      await refreshTokens();
    } catch (e) { flashError(e.message); }
  };

  $('#checktok').onclick = async () => {
    $('#checktok').disabled = true;
    $('#checktok').textContent = 'CHECKING…';
    try { await api('/tokens/check', { method: 'POST' }); await refreshTokens(); }
    finally {
      $('#checktok').disabled = false;
      $('#checktok').textContent = 'REVALIDATE';
    }
  };

  $('#startraid').onclick = async () => {
    const params = {};
    (fields[currentType] || []).forEach(f => {
      const v = $(`#p_${f.k}`)?.value.trim();
      if (v) params[f.k] = v;
    });
    const c = parseInt($('#count').value, 10);
    const d = parseInt($('#delay').value, 10);
    if (!isNaN(c)) params.count = c;
    if (!isNaN(d)) params.delay = d;
    try {
      const r = await api('/raids', { method: 'POST', body: JSON.stringify({ type: currentType, params }) });
      appendLog({ ts: new Date().toISOString(), level: 'success', message: `raid #${r.raidId} launched → ${currentType}`, raidId: r.raidId });
      await refreshActive();
    } catch (e) { flashError(e.message); }
  };

  $('#stopall').onclick = async () => {
    await api('/raids/stopall', { method: 'POST' });
    await refreshActive();
  };
}

function flashError(msg) {
  const el = $('#startraid');
  const orig = el.textContent;
  el.textContent = `ERROR: ${msg}`;
  el.style.borderColor = 'var(--bad)';
  setTimeout(() => { el.textContent = orig; el.style.borderColor = ''; }, 2400);
}

async function boot() {
  $('#loginbtn').onclick = async () => {
    API_KEY = $('#apikey').value.trim();
    try {
      await api('/health');
      localStorage.setItem('rx_key', API_KEY);
      $('#login').classList.add('hidden');
      $('#app').classList.remove('hidden');
      await start();
    } catch {
      $('#loginerr').textContent = '// access denied';
    }
  };

  $('#apikey').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#loginbtn').click();
  });

  if (API_KEY) {
    try {
      await api('/health');
      $('#login').classList.add('hidden');
      $('#app').classList.remove('hidden');
      await start();
    } catch {
      localStorage.removeItem('rx_key');
    }
  }
}

boot();

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
let API_KEY = localStorage.getItem('rx_key') || '';
let socket = null;
let currentType = 'join';

const fields = {
  join:   [{ k: 'invite',    p: 'invite code or discord.gg url', pref: 'INV' }],
  leave:  [{ k: 'guildId',   p: 'target guild id',               pref: 'GLD' }],
  spam:   [{ k: 'channelId', p: 'channel id',                    pref: 'CHN' }, { k: 'message', p: 'message payload', pref: 'MSG' }],
  dm:     [{ k: 'targetId',  p: 'target user id',                pref: 'USR' }, { k: 'message', p: 'message payload', pref: 'MSG' }],
  invite: [{ k: 'channelId', p: 'channel id',                    pref: 'CHN' }],
  react:  [{ k: 'channelId', p: 'channel id',                    pref: 'CHN' }, { k: 'messageId', p: 'message id', pref: 'MID' }, { k: 'emoji', p: 'emoji (e.g. 💀)', pref: 'EMO' }],
  nick:   [{ k: 'guildId',   p: 'guild id',                      pref: 'GLD' }, { k: 'nickname', p: 'new nickname', pref: 'NCK' }],
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
    ? '<div class="empty">// no tokens in pool. paste one above to arm terminal.</div>'
    : list.map(t => `
      <div class="item">
        <span class="badge ${t.valid ? 'ok' : 'bad'}">${t.valid ? 'ACTIVE' : 'DEAD'}</span>
        <span class="mono dim">#${String(t.id).padStart(3,'0')}</span>
        <span class="item-name">${escapeHtml(t.username || 'unknown')}</span>
        <span class="mono dim trunc">${escapeHtml(t.token_preview || '')}</span>
        <button class="x" data-id="${t.id}" title="Remove token">✕</button>
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
    ? '<div class="empty">// no active operations running</div>'
    : list.map(r => {
      const pct = r.total ? Math.round((r.success / r.total) * 100) : 0;
      return `
        <div class="op-card">
          <div class="op-head">
            <span class="op-id">OP #${r.raidId}</span>
            <button class="btn ghost danger mini-btn x" data-id="${r.raidId}">HALT</button>
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
  if (typeof io !== 'undefined') {
    socket = io();
    socket.on('connect', () => {
      $('#status').textContent = 'OPERATIONAL';
      $('#dot').style.background = 'var(--ok)';
      $('#dot').style.boxShadow = '0 0 10px var(--ok)';
    });
    socket.on('disconnect', () => {
      $('#status').textContent = 'DISCONNECTED';
      $('#dot').style.background = 'var(--danger)';
      $('#dot').style.boxShadow = '0 0 10px var(--danger)';
    });
    socket.on('log', appendLog);
  }
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
    $('#checktok').textContent = 'CHECKING...';
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
      appendLog({ ts: new Date().toISOString(), level: 'success', message: `operation #${r.raidId} launched → ${currentType.toUpperCase()}`, raidId: r.raidId });
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
  const orig = el.innerHTML;
  el.innerHTML = `<span class="shine-sweep"></span>ERROR: ${escapeHtml(msg)}`;
  el.style.borderColor = 'var(--danger)';
  setTimeout(() => { el.innerHTML = orig; el.style.borderColor = ''; }, 2600);
}

/* ==========================================================
   NOIR VISUAL EFFECTS ENGINE (CANVAS, CURSOR, THEME)
   ========================================================== */

// Theme Controller
function initTheme() {
  const saved = localStorage.getItem('rx_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  const btn = $('#theme-toggle');
  if (btn) {
    btn.onclick = () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', cur);
      localStorage.setItem('rx_theme', cur);
    };
  }
}

// Custom Cursor & Glass Spotlight Tracker
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

function initCursorAndGlass() {
  const cursor = $('#cursor');
  const dot = $('#cursor-dot');

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (cursor && dot) {
      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    }
  });

  document.addEventListener('mouseover', (e) => {
    if (cursor && e.target.closest('button, input, a, .tab, .x, .item, .op-card')) {
      cursor.classList.add('big');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (cursor && e.target.closest('button, input, a, .tab, .x, .item, .op-card')) {
      cursor.classList.remove('big');
    }
  });

  // Track pointer on .glass elements
  document.addEventListener('pointermove', (e) => {
    const cards = $$('.glass');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
    });
  });
}

// Particle Canvas (Slow luxury starfield)
function initStarCanvas() {
  const canvas = $('#bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
  });

  const count = Math.min(Math.floor((w * h) / 16000), 80);
  const stars = [];

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2.5 + 1.2,
      speedY: -(Math.random() * 0.25 + 0.08),
      speedX: (Math.random() - 0.5) * 0.08,
      opacity: Math.random() * 0.7 + 0.2,
      gold: Math.random() > 0.78,
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.015,
    });
  }

  let shootingStar = null;

  function spawnShootingStar() {
    if (Math.random() < 0.005 && !shootingStar) {
      shootingStar = {
        x: Math.random() * w * 0.8,
        y: Math.random() * h * 0.4,
        len: Math.random() * 120 + 80,
        speed: Math.random() * 8 + 6,
        opacity: 0.9,
      };
    }
  }

  function drawStar(x, y, s, color, rot, glow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    // 4-point star path
    ctx.moveTo(0, -s * 2);
    ctx.quadraticCurveTo(0, 0, s * 2, 0);
    ctx.quadraticCurveTo(0, 0, 0, s * 2);
    ctx.quadraticCurveTo(0, 0, -s * 2, 0);
    ctx.quadraticCurveTo(0, 0, 0, -s * 2);
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);

    spawnShootingStar();

    if (shootingStar) {
      const grad = ctx.createLinearGradient(
        shootingStar.x, shootingStar.y,
        shootingStar.x - shootingStar.len * 0.8, shootingStar.y - shootingStar.len * 0.5
      );
      grad.addColorStop(0, `rgba(212, 175, 55, ${shootingStar.opacity})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(shootingStar.x - shootingStar.len * 0.8, shootingStar.y - shootingStar.len * 0.5);
      ctx.stroke();

      shootingStar.x += shootingStar.speed;
      shootingStar.y += shootingStar.speed * 0.6;
      shootingStar.opacity -= 0.015;
      if (shootingStar.opacity <= 0) shootingStar = null;
    }

    stars.forEach(s => {
      s.y += s.speedY;
      s.x += s.speedX;
      s.rotation += s.rotSpeed;

      if (s.y < -10) { s.y = h + 10; s.x = Math.random() * w; }
      if (s.x < -10) s.x = w + 10;
      if (s.x > w + 10) s.x = -10;

      // Cursor proximity glow
      const dx = mouseX - s.x;
      const dy = mouseY - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isNear = dist < 140;

      const alpha = isNear ? Math.min(s.opacity * 1.8, 1) : s.opacity;
      const color = s.gold
        ? `rgba(212, 175, 55, ${alpha})`
        : `rgba(223, 226, 234, ${alpha})`;

      drawStar(s.x, s.y, isNear ? s.size * 1.4 : s.size, color, s.rotation, isNear);
    });

    requestAnimationFrame(loop);
  }

  loop();
}

/* ==========================================================
   BOOT & AUTH LIFECYCLE
   ========================================================== */
async function boot() {
  initTheme();
  initCursorAndGlass();
  initStarCanvas();

  $('#loginbtn').onclick = async () => {
    API_KEY = $('#apikey').value.trim();
    try {
      await api('/health');
      localStorage.setItem('rx_key', API_KEY);
      $('#login').classList.add('hidden');
      $('#app').classList.remove('hidden');
      await start();
    } catch {
      $('#loginerr').textContent = '// ACCESS DENIED: INVALID KEY';
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

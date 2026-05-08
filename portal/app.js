// ============================================
// CHERRYWOOD PORTAL
// ============================================

const SUPABASE_URL  = 'https://giwfigekjatujubjknjf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpd2ZpZ2VramF0dWp1YmprbmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEwMDMsImV4cCI6MjA4OTU3NzAwM30.p3OaPA5qYROqz8d0tNyhytl__n_bzH2l2MOX3olDn3A';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ============================================
// AUTH
// ============================================

// The email is not a secret — it identifies the single shared portal account.
// The password lives only in Supabase Auth and is verified server-side.
const PORTAL_EMAIL = 'portal@cherrywoodgolf.com';

// ── Inactivity logout — 10 minutes ──
const INACTIVITY_MS = 10 * 60 * 1000;
let _inactivityTimer = null;

function resetInactivityTimer() {
  clearTimeout(_inactivityTimer);
  _inactivityTimer = setTimeout(async () => {
    await db.auth.signOut();
    window.location.reload();
  }, INACTIVITY_MS);
}

function startInactivityTimer() {
  ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(evt =>
    document.addEventListener(evt, resetInactivityTimer, { passive: true })
  );
  resetInactivityTimer();
}

function stopInactivityTimer() {
  clearTimeout(_inactivityTimer);
  ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(evt =>
    document.removeEventListener(evt, resetInactivityTimer)
  );
}

function unlock() {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('appShell').hidden = false;
  startInactivityTimer();
  loadTournaments();
}

async function signOut() {
  stopInactivityTimer();
  await db.auth.signOut();
  window.location.reload();
}

// Restore an existing session on page load (e.g. after a refresh).
db.auth.getSession().then(({ data: { session } }) => {
  if (session) unlock();
});

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Checking…';

  const { error } = await db.auth.signInWithPassword({
    email:    PORTAL_EMAIL,
    password: document.getElementById('loginPassword').value,
  });

  if (error) {
    const err = document.getElementById('loginError');
    err.textContent = 'Incorrect password.';
    err.hidden = false;
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').focus();
  } else {
    unlock();
  }

  btn.disabled = false;
  btn.textContent = 'Enter';
});

// ============================================
// TAB ROUTING
// ============================================

const _sidebar    = document.getElementById('sidebar');
const _overlay    = document.getElementById('sidebarOverlay');
const _hamburger  = document.getElementById('hamburgerBtn');

function openSidebar()  { _sidebar.classList.add('sidebar--open');  _overlay.classList.add('sidebar-overlay--visible'); }
function closeSidebar() { _sidebar.classList.remove('sidebar--open'); _overlay.classList.remove('sidebar-overlay--visible'); }

_hamburger.addEventListener('click', () => _sidebar.classList.contains('sidebar--open') ? closeSidebar() : openSidebar());
_overlay.addEventListener('click', closeSidebar);

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    closeSidebar();
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = true; p.classList.remove('tab-panel--active'); });
    btn.classList.add('tab-btn--active');
    const panel = document.getElementById('tab' + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1));
    panel.hidden = false;
    panel.classList.add('tab-panel--active');
    if (btn.dataset.tab === 'tournaments') loadTournaments();
    if (btn.dataset.tab === 'eggs')        loadEggs();
  });
});

// ============================================
// HELPERS
// ============================================

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function loading() {
  return `<p style="padding:1.5rem;color:#888;font-style:italic;">Loading…</p>`;
}

function dbErr(table, error) {
  const msg = error ? `${error.message} (code: ${error.code})` : 'no rows returned';
  return `<div style="margin:1.5rem;padding:1rem 1.25rem;background:#fff0f0;border:2px solid #c00;border-radius:6px;font-family:monospace;font-size:0.85rem;color:#900;">
    <strong>⚠ DB Error — ${table}</strong><br>${msg}
  </div>`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });
}

// ============================================
// EGG ORDERS
// ============================================

let eggsFilter = 'pending';

async function loadEggs() {
  document.getElementById('eggsList').innerHTML = loading();
  let q = db.from('egg_orders').select('*').order('created_at', { ascending: false });
  if (eggsFilter === 'pending') q = q.eq('status', 'pending');
  const { data, error } = await q;
  if (error) { document.getElementById('eggsList').innerHTML = dbErr('egg_orders', error); return; }
  renderEggs(data || []);
}

function renderEggs(rows) {
  const list  = document.getElementById('eggsList');
  const empty = document.getElementById('eggsEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;
  rows.forEach(o => {
    const card = document.createElement('div');
    card.className = 'data-card' + (o.status === 'complete' ? ' data-card--muted' : '');
    card.innerHTML = `
      <div class="data-card__header">
        <span class="data-card__title">${esc(o.name)}</span>
        <span class="data-card__badge">${fmtDate(o.pickup_date)}</span>
      </div>
      <div class="data-card__body">
        <span>${esc(o.contact)}</span>
        <span>${o.dozens} dozen</span>
        ${o.notes ? `<span class="data-card__notes">${esc(o.notes)}</span>` : ''}
      </div>
      ${o.status !== 'complete'
        ? `<button class="btn btn--primary btn--sm" data-complete="${o.id}">Mark Picked Up</button>`
        : '<span class="tag tag--complete">Picked Up</span>'}
    `;
    card.querySelector('[data-complete]')?.addEventListener('click', async () => {
      await db.from('egg_orders').update({ status: 'complete' }).eq('id', o.id);
      loadEggs();
    });
    list.appendChild(card);
  });
}

document.querySelectorAll('#tabEggs .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tabEggs .filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    eggsFilter = btn.dataset.filter;
    loadEggs();
  });
});

// ============================================
// TOURNAMENTS
// ============================================

let currentEditingTournamentId = null;

async function loadTournaments() {
  document.getElementById('registrationsPanel').hidden = true;
  document.getElementById('tournamentsList').style.display = '';
  document.getElementById('tournamentsEmpty').hidden = true;
  document.getElementById('addTournamentBtn').style.display = '';

  document.getElementById('tournamentsList').innerHTML = loading();
  const { data, error } = await db.from('tournaments').select('*').order('date', { ascending: false });
  if (error) { document.getElementById('tournamentsList').innerHTML = dbErr('tournaments', error); return; }

  const ids = (data || []).map(t => t.id);
  let counts = {};
  if (ids.length) {
    const { data: regs } = await db
      .from('tournament_registrations')
      .select('tournament_id')
      .eq('status', 'confirmed')
      .in('tournament_id', ids);
    (regs || []).forEach(r => { counts[r.tournament_id] = (counts[r.tournament_id] || 0) + 1; });
  }

  renderTournaments(data || [], counts);
}

function renderTournaments(rows, counts) {
  const list  = document.getElementById('tournamentsList');
  const empty = document.getElementById('tournamentsEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;

  rows.forEach(t => {
    const count     = counts[t.id] || 0;
    const remaining = t.max_slots > 0 ? t.max_slots - count : null;
    const isSoldOut = remaining !== null && remaining <= 0;
    const d         = new Date(t.date + 'T00:00:00');
    const dateStr   = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    let slotStr = '';
    if (isSoldOut) slotStr = '<span style="color:#c0392b;font-weight:600;">SOLD OUT</span>';
    else if (remaining !== null) slotStr = `${count} / ${t.max_slots} registered`;
    else slotStr = `${count} registered`;

    let statusTag = '';
    if (t.status === 'cancelled') statusTag = '<span class="tag tag--cancelled">Cancelled</span>';
    else if (t.status === 'closed') statusTag = '<span class="tag" style="background:#f0e8d6;color:#6b4a1a;">Closed</span>';
    else if (isSoldOut) statusTag = '<span class="tag" style="background:#fde8e8;color:#a00;">Sold Out</span>';

    const card = document.createElement('div');
    card.className = 'data-card';
    card.innerHTML = `
      <div class="data-card__header">
        <span class="data-card__title">${esc(t.name)}</span>
        <span class="data-card__badge">${dateStr}</span>
      </div>
      <div class="data-card__body">
        <span>${t.type === 'team' ? '👥 Team' : '🏌️ Individual'}${t.type === 'team' && t.team_size ? ' · ' + t.team_size + ' players' : ''}${t.format ? ' · ' + esc(t.format) : ''}</span>
        <span>${slotStr} ${statusTag}</span>
        ${t.entry_fee ? `<span>$${parseFloat(t.entry_fee).toFixed(2)} entry fee</span>` : ''}
        ${t.notes ? `<span class="data-card__notes">📋 ${esc(t.notes)}</span>` : ''}
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem;">
        <button class="btn btn--ghost btn--sm" data-view="${t.id}" data-name="${esc(t.name)}">View Registrations (${count})</button>
        <button class="btn btn--ghost btn--sm" data-edit="${t.id}">Edit</button>
        ${t.status !== 'cancelled' ? `<button class="btn btn--ghost btn--sm" data-cancel-t="${t.id}" style="color:#a00;">Cancel Event</button>` : ''}
      </div>
    `;

    card.querySelector('[data-view]').addEventListener('click', e => {
      loadRegistrations(e.target.dataset.view, e.target.dataset.name);
    });
    card.querySelector('[data-edit]').addEventListener('click', () => editTournament(t));
    card.querySelector('[data-cancel-t]')?.addEventListener('click', async () => {
      if (!confirm(`Cancel "${t.name}"? This cannot be undone.`)) return;
      await db.from('tournaments').update({ status: 'cancelled' }).eq('id', t.id);
      loadTournaments();
    });

    list.appendChild(card);
  });
}

function editTournament(t) {
  currentEditingTournamentId = t.id;
  document.getElementById('tName').value     = t.name || '';
  document.getElementById('tDate').value     = t.date || '';
  document.getElementById('tTime').value     = t.time || '';
  document.getElementById('tDesc').value     = t.description || '';
  document.getElementById('tType').value     = t.type || 'individual';
  document.getElementById('tTeamSize').value = t.team_size || '';
  document.getElementById('tMaxSlots').value = t.max_slots || '';
  document.getElementById('tFormat').value   = t.format || '';
  document.getElementById('tEntryFee').value = t.entry_fee || '';
  document.getElementById('tStatus').value   = t.status || 'open';
  document.getElementById('tNotes').value    = t.notes || '';
  document.getElementById('tournamentForm').hidden = false;
  document.getElementById('tName').focus();
  window.scrollTo({ top: document.getElementById('tournamentForm').offsetTop - 80, behavior: 'smooth' });
}

document.getElementById('addTournamentBtn').addEventListener('click', () => {
  currentEditingTournamentId = null;
  clearTournamentForm();
  document.getElementById('tournamentForm').hidden = false;
  document.getElementById('tName').focus();
});

document.getElementById('cancelTournamentBtn').addEventListener('click', () => {
  document.getElementById('tournamentForm').hidden = true;
  clearTournamentForm();
});

document.getElementById('saveTournamentBtn').addEventListener('click', async () => {
  const name     = document.getElementById('tName').value.trim();
  const date     = document.getElementById('tDate').value;
  const maxSlots = document.getElementById('tMaxSlots').value;
  const errEl    = document.getElementById('tournamentFormError');
  const btn      = document.getElementById('saveTournamentBtn');
  errEl.hidden   = true;

  if (!name)     { errEl.textContent = 'Tournament name is required.'; errEl.hidden = false; return; }
  if (!date)     { errEl.textContent = 'Date is required.'; errEl.hidden = false; return; }
  if (!maxSlots) { errEl.textContent = 'Max slots is required.'; errEl.hidden = false; return; }

  btn.disabled = true; btn.textContent = 'Saving…';

  const payload = {
    name,
    date,
    time:        document.getElementById('tTime').value || null,
    description: document.getElementById('tDesc').value.trim() || null,
    type:        document.getElementById('tType').value,
    team_size:   parseInt(document.getElementById('tTeamSize').value) || null,
    max_slots:   parseInt(maxSlots),
    format:      document.getElementById('tFormat').value.trim() || null,
    entry_fee:   parseFloat(document.getElementById('tEntryFee').value) || null,
    status:      document.getElementById('tStatus').value,
    notes:       document.getElementById('tNotes').value.trim() || null,
  };

  const { error } = currentEditingTournamentId
    ? await db.from('tournaments').update(payload).eq('id', currentEditingTournamentId)
    : await db.from('tournaments').insert(payload);

  btn.disabled = false; btn.textContent = 'Save Tournament';

  if (error) { errEl.textContent = error.message; errEl.hidden = false; return; }

  document.getElementById('tournamentForm').hidden = true;
  clearTournamentForm();
  loadTournaments();
});

function clearTournamentForm() {
  ['tName','tDate','tTime','tDesc','tTeamSize','tMaxSlots','tFormat','tEntryFee','tNotes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('tType').value   = 'individual';
  document.getElementById('tStatus').value = 'open';
  document.getElementById('tournamentFormError').hidden = true;
  currentEditingTournamentId = null;
}

// ── Registrations sub-panel ──

async function loadRegistrations(tournamentId, name) {
  document.getElementById('tournamentsList').style.display = 'none';
  document.getElementById('tournamentsEmpty').hidden = true;
  document.getElementById('addTournamentBtn').style.display = 'none';
  document.getElementById('tournamentForm').hidden = true;
  document.getElementById('regPanelTitle').textContent = name;
  document.getElementById('registrationsPanel').hidden = false;

  const { data, error } = await db
    .from('tournament_registrations')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });

  if (error) { document.getElementById('registrationsList').innerHTML = dbErr('tournament_registrations', error); return; }
  renderRegistrations(data || [], tournamentId);
}

function renderRegistrations(rows, tournamentId) {
  const list  = document.getElementById('registrationsList');
  const empty = document.getElementById('registrationsEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;

  const activeCount = rows.filter(r => r.status !== 'cancelled').length;

  const wrap = document.createElement('div');
  wrap.style.overflowX = 'auto';

  const summary = document.createElement('p');
  summary.style.cssText = 'margin:0 0 0.75rem;font-size:0.85rem;color:#555;';
  summary.textContent = `${activeCount} team${activeCount !== 1 ? 's' : ''} registered`;
  wrap.appendChild(summary);

  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.88rem;';
  table.innerHTML = `
    <thead>
      <tr style="background:#1C3320;color:#fff;text-align:left;">
        <th style="padding:0.55rem 0.75rem;">#</th>
        <th style="padding:0.55rem 0.75rem;">Team</th>
        <th style="padding:0.55rem 0.75rem;">Captain</th>
        <th style="padding:0.55rem 0.75rem;">Phone</th>
        <th style="padding:0.55rem 0.75rem;">Cart</th>
        <th style="padding:0.55rem 0.75rem;">Registered</th>
        <th style="padding:0.55rem 0.75rem;"></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  let num = 0;
  rows.forEach((r, i) => {
    const cancelled = r.status === 'cancelled';
    if (!cancelled) num++;
    const tr = document.createElement('tr');
    tr.style.cssText = `border-bottom:1px solid #e8dfc8;${i % 2 === 1 ? 'background:#fdf9f2;' : ''}${cancelled ? 'opacity:0.4;' : ''}`;
    tr.innerHTML = `
      <td style="padding:0.55rem 0.75rem;color:#888;">${cancelled ? '—' : num}</td>
      <td style="padding:0.55rem 0.75rem;font-weight:${cancelled ? '400' : '600'};">${esc(r.team_name || '—')}</td>
      <td style="padding:0.55rem 0.75rem;">${esc(r.captain_name || '—')}</td>
      <td style="padding:0.55rem 0.75rem;white-space:nowrap;">${r.phone || '—'}</td>
      <td style="padding:0.55rem 0.75rem;">${r.cart ? 'Yes' : 'No'}</td>
      <td style="padding:0.55rem 0.75rem;color:#888;font-size:0.8rem;white-space:nowrap;">${fmtDate(r.created_at)}</td>
      <td style="padding:0.55rem 0.75rem;">
        ${!cancelled
          ? `<button class="btn btn--ghost btn--sm" data-del="${r.id}" data-name="${esc(r.team_name || r.captain_name)}" style="color:#a00;font-size:0.75rem;padding:0.2rem 0.5rem;">Delete</button>`
          : ''}
      </td>
    `;
    tr.querySelector('[data-del]')?.addEventListener('click', async e => {
      const name = e.target.dataset.name;
      if (!confirm(`Delete "${name}"?`)) return;
      await db.from('tournament_registrations').delete().eq('id', r.id);
      loadRegistrations(tournamentId, document.getElementById('regPanelTitle').textContent);
    });
    tbody.appendChild(tr);
  });

  wrap.appendChild(table);
  list.appendChild(wrap);
}

document.getElementById('closeRegPanel').addEventListener('click', () => {
  document.getElementById('registrationsPanel').hidden = true;
  document.getElementById('tournamentsList').style.display = '';
  document.getElementById('addTournamentBtn').style.display = '';
  loadTournaments();
});

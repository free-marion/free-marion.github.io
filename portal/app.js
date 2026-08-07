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

let PORTAL_ROLE  = null; // 'admin' | 'viewer' | 'staff' | null
let PORTAL_TOOLS = { tabs: [], actions: [] }; // populated on login for non-admins

// ---- permission helpers ----
function canSeeTab(key) {
  if (PORTAL_ROLE === 'admin') return true;
  if (key === 'tournaments' && PORTAL_ROLE) return true;
  return (PORTAL_TOOLS.tabs || []).includes(key);
}
function canDo(action) {
  if (PORTAL_ROLE === 'admin') return true;
  if (action === 'tournaments:create' && PORTAL_ROLE) return true;
  return (PORTAL_TOOLS.actions || []).includes(action);
}

const INACTIVITY_MS = 20 * 60 * 1000;
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

async function signInWithGoogle() {
  const btn   = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  errEl.hidden    = true;
  btn.disabled    = true;
  btn.textContent = 'Redirecting…';

  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://cherrywoodgolf.com/portal/' },
  });

  if (error) {
    btn.disabled    = false;
    btn.textContent = 'Sign in with Google';
    errEl.textContent = 'Sign-in failed. Try again.';
    errEl.hidden      = false;
  }
}

async function signOut() {
  stopInactivityTimer();
  try { await db.auth.signOut(); } catch (e) {}
  window.location.reload();
}

function unlock(role, user, tools) {
  PORTAL_ROLE  = role;
  PORTAL_TOOLS = tools || { tabs: [], actions: [] };
  const isAdmin = role === 'admin';

  document.getElementById('loginScreen').hidden        = true;
  document.getElementById('accessDeniedScreen').hidden = true;
  document.getElementById('appShell').hidden           = false;

  // Identity in header and welcome panel
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const firstName = name.split(' ')[0];
  document.getElementById('userLabel').textContent  = name;
  document.getElementById('welcomeName').textContent = firstName;

  const roleBadge = document.getElementById('roleLabel');
  if (!isAdmin) {
    roleBadge.textContent   = role === 'staff' ? 'Staff' : 'Viewer';
    roleBadge.style.display = 'inline-block';
  }

  // Show/hide sidebar tabs based on permissions
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    const key = btn.dataset.tab;
    if (key === 'home' || key === 'admin') return; // handled separately
    btn.hidden = !canSeeTab(key);
  });

  // Admin tab: admins only
  document.getElementById('adminTabBtn').hidden = !isAdmin;

  // Start all write-action buttons hidden; loaders re-show them if canDo() passes
  document.getElementById('addContactBtn').hidden = true;

  // Hide home welcome cards for tabs user can't see
  document.querySelectorAll('.welcome-card[data-tab]').forEach(card => {
    card.closest('button, a') && (card.closest('button,a').hidden = !canSeeTab(card.dataset.tab));
    if (!card.closest('button,a')) card.hidden = !canSeeTab(card.dataset.tab);
  });

  startInactivityTimer();
  loadTournaments();
}

function showAccessDenied(email) {
  document.getElementById('loginScreen').hidden        = true;
  document.getElementById('accessDeniedScreen').hidden = false;
  document.getElementById('deniedEmail').textContent   = email;
}

// Handles both OAuth redirect callback and session restore on page load.
db.auth.onAuthStateChange(async (event, session) => {
  // Skip token refreshes once the portal is already unlocked — avoids stacking
  // inactivity timers and resetting button visibility mid-session.
  if (event === 'TOKEN_REFRESHED' && PORTAL_ROLE) return;

  if (!session) return;
  const { data } = await db.from('profiles').select('role, tools').eq('id', session.user.id).single();
  const role  = data?.role;
  const tools = data?.tools || { tabs: [], actions: [] };
  if (role === 'admin' || role === 'viewer' || role === 'staff') {
    // Persist display name + email so the admin panel can show them
    const displayName = session.user.user_metadata?.full_name
      || session.user.user_metadata?.name
      || session.user.email;
    db.from('profiles').update({ display_name: displayName, email: session.user.email })
      .eq('id', session.user.id);
    unlock(role, session.user, tools);
  } else {
    showAccessDenied(session.user.email);
  }
});

// ============================================
// TAB ROUTING
// ============================================

const _sidebar   = document.getElementById('sidebar');
const _overlay   = document.getElementById('sidebarOverlay');
const _hamburger = document.getElementById('hamburgerBtn');

function openSidebar()  { _sidebar.classList.add('sidebar--open');    _overlay.classList.add('sidebar-overlay--visible'); }
function closeSidebar() { _sidebar.classList.remove('sidebar--open'); _overlay.classList.remove('sidebar-overlay--visible'); }

_hamburger.addEventListener('click', () =>
  _sidebar.classList.contains('sidebar--open') ? closeSidebar() : openSidebar()
);
_overlay.addEventListener('click', closeSidebar);

function switchTab(tabName) {
  closeSidebar();
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
  document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = true; p.classList.remove('tab-panel--active'); });
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (btn) btn.classList.add('tab-btn--active');
  const panel = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
  if (panel) { panel.hidden = false; panel.classList.add('tab-panel--active'); }
  if (tabName === 'tournaments') loadTournaments();
  if (tabName === 'eggs')        loadEggs();
  if (tabName === 'crm')         loadCRM();
  if (tabName === 'admin')       loadAdmin();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('.welcome-card').forEach(card => {
  card.addEventListener('click', () => switchTab(card.dataset.tab));
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
  const canPickup = canDo('eggs:pickup');
  const list      = document.getElementById('eggsList');
  const empty     = document.getElementById('eggsEmpty');
  list.innerHTML  = '';
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
        ? (canPickup
            ? `<button class="btn btn--primary btn--sm" data-complete="${o.id}">Mark Picked Up</button>`
            : `<span class="tag">Pending pickup</span>`)
        : '<span class="tag tag--complete">Picked Up</span>'}
    `;
    if (canPickup) {
      card.querySelector('[data-complete]')?.addEventListener('click', async () => {
        await db.from('egg_orders').update({ status: 'complete' }).eq('id', o.id);
        loadEggs();
      });
    }
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
  document.querySelector('.events-layout').style.display = '';
  document.getElementById('tournamentsEmpty').hidden = true;

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
  const isAdmin = canDo('tournaments:create');
  const list    = document.getElementById('tournamentsList');
  const empty   = document.getElementById('tournamentsEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;

  const TYPE_LABEL = { team: '👥 Team', venue: '🎉 Venue', individual: '🏌️ Individual' };

  rows.forEach(t => {
    const count     = counts[t.id] || 0;
    const remaining = t.max_slots > 0 ? t.max_slots - count : null;
    const isSoldOut = remaining !== null && remaining <= 0;
    const d         = new Date(t.date + 'T00:00:00');
    const dateStr   = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let statusTag = '';
    if (t.status === 'cancelled') statusTag = ' · <span class="tag tag--cancelled">Cancelled</span>';
    else if (t.status === 'closed') statusTag = ' · <span class="tag" style="color:#6b4a1a;">Closed</span>';
    else if (isSoldOut) statusTag = ' · <span class="tag" style="color:#a00;">Sold Out</span>';

    const row = document.createElement('div');
    row.className = 'event-row';
    row.innerHTML = `
      <div class="event-row__name">${esc(t.name)}</div>
      <div class="event-row__meta">${dateStr} · ${TYPE_LABEL[t.type] || TYPE_LABEL.individual} · ${count} registered${statusTag}</div>
      <div class="event-row__actions">
        <button class="btn btn--ghost btn--sm" data-view="${t.id}" data-name="${esc(t.name)}">Registrants (${count})</button>
        ${isAdmin ? `<button class="btn btn--ghost btn--sm" data-edit="${t.id}">Edit</button>` : ''}
        ${isAdmin && t.status !== 'cancelled' ? `<button class="btn btn--ghost btn--sm" data-cancel-t="${t.id}" style="color:#a00;">Cancel</button>` : ''}
      </div>
    `;

    row.querySelector('[data-view]').addEventListener('click', e => {
      loadRegistrations(e.target.dataset.view, e.target.dataset.name);
    });

    if (isAdmin) {
      row.querySelector('[data-edit]')?.addEventListener('click', () => editTournament(t));
      row.querySelector('[data-cancel-t]')?.addEventListener('click', async () => {
        if (!confirm(`Cancel "${t.name}"? This cannot be undone.`)) return;
        await db.from('tournaments').update({ status: 'cancelled' }).eq('id', t.id);
        loadTournaments();
      });
    }

    list.appendChild(row);
  });
}

// ── Type-aware field visibility ──
function applyTypeVisibility() {
  const type = document.getElementById('tType').value;
  document.querySelectorAll('[data-type-for]').forEach(el => {
    el.hidden = !el.dataset.typeFor.split(' ').includes(type);
  });
  const isVenue = type === 'venue';
  document.getElementById('tMaxSlotsLabel').textContent = isVenue ? 'Capacity *' : 'Max Registrations *';
  document.getElementById('tEntryFeeLabel').textContent = isVenue ? 'Venue Fee ($)' : 'Entry Fee ($)';
}
document.getElementById('tType').addEventListener('change', applyTypeVisibility);
applyTypeVisibility();

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
  document.getElementById('tAllowReg').checked = t.status === 'open';
  document.getElementById('tNotes').value    = t.notes || '';
  applyTypeVisibility();
  document.getElementById('eventFormTitle').textContent = `Editing: ${t.name}`;
  document.getElementById('cancelTournamentBtn').hidden = false;
  document.getElementById('tName').focus();
  window.scrollTo({ top: document.getElementById('tournamentForm').offsetTop - 80, behavior: 'smooth' });
}

document.getElementById('cancelTournamentBtn').addEventListener('click', () => {
  clearTournamentForm();
});

document.getElementById('saveTournamentBtn').addEventListener('click', () => {
  const name     = document.getElementById('tName').value.trim();
  const date     = document.getElementById('tDate').value;
  const maxSlots = document.getElementById('tMaxSlots').value;
  const errEl    = document.getElementById('tournamentFormError');
  errEl.hidden   = true;

  if (!name)     { errEl.textContent = 'Event name is required.'; errEl.hidden = false; return; }
  if (!date)     { errEl.textContent = 'Date is required.'; errEl.hidden = false; return; }
  if (!maxSlots) { errEl.textContent = 'Max registrations / capacity is required.'; errEl.hidden = false; return; }

  showConfirmModal();
});

function buildTournamentPayload() {
  const type = document.getElementById('tType').value;
  return {
    name:        document.getElementById('tName').value.trim(),
    date:        document.getElementById('tDate').value,
    time:        document.getElementById('tTime').value || null,
    description: document.getElementById('tDesc').value.trim() || null,
    type,
    team_size:   type === 'team' ? (parseInt(document.getElementById('tTeamSize').value) || null) : null,
    max_slots:   parseInt(document.getElementById('tMaxSlots').value),
    format:      document.getElementById('tFormat').value.trim() || null,
    entry_fee:   parseFloat(document.getElementById('tEntryFee').value) || null,
    status:      type === 'venue' ? 'closed' : (document.getElementById('tAllowReg').checked ? 'open' : 'closed'),
    notes:       document.getElementById('tNotes').value.trim() || null,
  };
}

const TYPE_NAME = { individual: 'Tournament — Individual', team: 'Tournament — Team', venue: 'Private Event / Venue Booking' };

function showConfirmModal() {
  const p = buildTournamentPayload();
  const d = new Date(p.date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  document.getElementById('confirmEventSummary').innerHTML = `
    <dl>
      <dt>Event</dt><dd>${esc(p.name)}</dd>
      <dt>Type</dt><dd>${TYPE_NAME[p.type]}</dd>
      <dt>Date</dt><dd>${dateStr}${p.time ? ' at ' + p.time : ''}</dd>
      ${p.team_size ? `<dt>Team size</dt><dd>${p.team_size} players</dd>` : ''}
      <dt>${p.type === 'venue' ? 'Capacity' : 'Max registrations'}</dt><dd>${p.max_slots}</dd>
      ${p.format ? `<dt>Format</dt><dd>${esc(p.format)}</dd>` : ''}
      ${p.entry_fee ? `<dt>Fee</dt><dd>$${p.entry_fee.toFixed(2)}</dd>` : ''}
      <dt>Public site</dt><dd>${p.type === 'venue' ? 'Private — not listed publicly' : (p.status === 'open' ? 'Listed, open for registration' : 'Listed, registration closed')}</dd>
    </dl>
  `;
  document.getElementById('confirmEventModal').hidden = false;
}

document.getElementById('confirmEventBackBtn').addEventListener('click', () => {
  document.getElementById('confirmEventModal').hidden = true;
});

document.getElementById('confirmEventSaveBtn').addEventListener('click', async () => {
  const btn   = document.getElementById('confirmEventSaveBtn');
  const errEl = document.getElementById('tournamentFormError');
  const payload = buildTournamentPayload();

  btn.disabled = true; btn.textContent = 'Saving…';

  const { error } = currentEditingTournamentId
    ? await db.from('tournaments').update(payload).eq('id', currentEditingTournamentId)
    : await db.from('tournaments').insert(payload);

  btn.disabled = false; btn.textContent = 'Confirm & Save';
  document.getElementById('confirmEventModal').hidden = true;

  if (error) { errEl.textContent = error.message; errEl.hidden = false; return; }

  clearTournamentForm();
  loadTournaments();
});

function clearTournamentForm() {
  ['tName','tDate','tTime','tDesc','tTeamSize','tMaxSlots','tFormat','tEntryFee','tNotes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('tType').value     = 'individual';
  document.getElementById('tAllowReg').checked = true;
  document.getElementById('tournamentFormError').hidden = true;
  document.getElementById('eventFormTitle').textContent = 'Create an Event';
  document.getElementById('cancelTournamentBtn').hidden = true;
  applyTypeVisibility();
  currentEditingTournamentId = null;
}

// ── Registrations sub-panel ──

async function loadRegistrations(tournamentId, name) {
  document.querySelector('.events-layout').style.display     = 'none';
  document.getElementById('regPanelTitle').textContent       = name;
  document.getElementById('registrationsPanel').hidden       = false;

  const { data, error } = await db
    .from('tournament_registrations')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });

  if (error) { document.getElementById('registrationsList').innerHTML = dbErr('tournament_registrations', error); return; }
  renderRegistrations(data || [], tournamentId);
}

function renderRegistrations(rows, tournamentId) {
  const isAdmin = canDo('tournaments:create');
  const list    = document.getElementById('registrationsList');
  const empty   = document.getElementById('registrationsEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;

  const activeCount = rows.filter(r => r.status !== 'cancelled').length;

  const wrap = document.createElement('div');
  wrap.style.overflowX = 'auto';

  const summary = document.createElement('p');
  summary.style.cssText = 'margin:0 0 0.75rem;font-size:0.85rem;color:#555;';
  summary.textContent = `${activeCount} registration${activeCount !== 1 ? 's' : ''}`;
  wrap.appendChild(summary);

  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.88rem;';
  table.innerHTML = `
    <thead>
      <tr style="background:#1C3320;color:#fff;text-align:left;">
        <th style="padding:0.55rem 0.75rem;">#</th>
        <th style="padding:0.55rem 0.75rem;">Player 1</th>
        <th style="padding:0.55rem 0.75rem;">Player 2</th>
        <th style="padding:0.55rem 0.75rem;">Phone</th>
        <th style="padding:0.55rem 0.75rem;">Cart</th>
        <th style="padding:0.55rem 0.75rem;">Registered</th>
        ${isAdmin ? '<th style="padding:0.55rem 0.75rem;"></th>' : ''}
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
      <td style="padding:0.55rem 0.75rem;font-weight:${cancelled ? '400' : '600'};">${esc(r.captain_name || '—')}</td>
      <td style="padding:0.55rem 0.75rem;">${esc(r.team_name || '—')}</td>
      <td style="padding:0.55rem 0.75rem;white-space:nowrap;">${r.phone || '—'}</td>
      <td style="padding:0.55rem 0.75rem;">${r.cart ? 'Yes' : 'No'}</td>
      <td style="padding:0.55rem 0.75rem;color:#888;font-size:0.8rem;white-space:nowrap;">${fmtDate(r.created_at)}</td>
      ${isAdmin ? `<td style="padding:0.55rem 0.75rem;">
        ${!cancelled ? `<button class="btn btn--ghost btn--sm" data-del="${r.id}" data-name="${esc(r.captain_name || r.team_name)}" style="color:#a00;font-size:0.75rem;padding:0.2rem 0.5rem;">Delete</button>` : ''}
      </td>` : ''}
    `;
    if (isAdmin) {
      tr.querySelector('[data-del]')?.addEventListener('click', async e => {
        const name = e.target.dataset.name;
        if (!confirm(`Delete "${name}"?`)) return;
        await db.from('tournament_registrations').delete().eq('id', r.id);
        loadRegistrations(tournamentId, document.getElementById('regPanelTitle').textContent);
      });
    }
    tbody.appendChild(tr);
  });

  wrap.appendChild(table);
  list.appendChild(wrap);
}

document.getElementById('closeRegPanel').addEventListener('click', () => {
  document.getElementById('registrationsPanel').hidden = true;
  document.querySelector('.events-layout').style.display = '';
  loadTournaments();
});

// ============================================
// CRM
// ============================================

let _crmAllContacts   = [];    // full result set — search filters client-side
let _crmDebounceTimer = null;

async function loadCRM() {
  // Show/hide write button based on permission
  document.getElementById('addContactBtn').hidden = !canDo('crm:write');

  // Always reset to list view when the tab is switched to
  _showCrmList();
  document.getElementById('crmContactsList').innerHTML = loading();
  document.getElementById('crmEmpty').hidden = true;

  const { data, error } = await db
    .from('contacts')
    .select('*')
    .order('last_name');

  if (error) {
    document.getElementById('crmContactsList').innerHTML = dbErr('contacts', error);
    return;
  }
  _crmAllContacts = data || [];
  renderContacts(_crmAllContacts);
}

function _showCrmList() {
  document.getElementById('crmContactsList').style.display = '';
  document.getElementById('crmEmpty').hidden               = true;
  document.getElementById('crmDetail').hidden              = true;
  document.getElementById('crmSearch').value               = '';
  const countEl = document.getElementById('crmCount');
  if (countEl) countEl.hidden = true;
}

function _crmTypeBadge(type) {
  if (!type) return '';
  const label = type.replace('_', ' ');
  return `<span class="crm-type-badge crm-type-badge--${esc(type)}">${esc(label)}</span>`;
}

function _crmInitials(c) {
  return ((c.first_name?.[0] || '') + (c.last_name?.[0] || '')).toUpperCase() || '?';
}

const _CRM_AVATAR_COLORS = {
  member:        ['#d1e7d4','#1C3320'],
  guest:         ['#f0ece2','#6b4a1a'],
  event_inquiry: ['#f5e8eb','#7a1a2e'],
  vendor:        ['#e8e8f0','#3a3a6a'],
  donor:         ['#f0e8d6','#7a5c00'],
  other:         ['#ebebeb','#555555'],
};

function _crmAvatarStyle(type) {
  const [bg, fg] = _CRM_AVATAR_COLORS[type] || _CRM_AVATAR_COLORS.other;
  return `background:${bg};color:${fg};`;
}

function renderContacts(rows) {
  const list  = document.getElementById('crmContactsList');
  const empty = document.getElementById('crmEmpty');
  list.innerHTML = '';

  const countEl = document.getElementById('crmCount');
  if (!rows.length) {
    empty.hidden   = false;
    countEl.hidden = true;
    return;
  }
  countEl.hidden       = false;
  countEl.textContent  = `${rows.length} contact${rows.length === 1 ? '' : 's'}`;

  const wrap = document.createElement('div');
  wrap.className = 'crm-table-wrap';

  wrap.innerHTML = `
    <table class="crm-table">
      <thead>
        <tr>
          <th class="crm-th crm-th--name">Name</th>
          <th class="crm-th crm-th--type">Type</th>
          <th class="crm-th crm-th--contact crm-th--hide-sm">Email</th>
          <th class="crm-th crm-th--contact crm-th--hide-sm">Phone</th>
          <th class="crm-th crm-th--notes crm-th--hide-md">Notes</th>
        </tr>
      </thead>
      <tbody id="crmTableBody"></tbody>
    </table>
  `;

  list.appendChild(wrap);
  const tbody = document.getElementById('crmTableBody');

  rows.forEach(c => {
    const tr = document.createElement('tr');
    tr.className = 'crm-row';
    tr.innerHTML = `
      <td class="crm-td crm-td--name">
        <div class="crm-avatar" style="${_crmAvatarStyle(c.type)}">${_crmInitials(c)}</div>
        <span class="crm-name-text">${esc(c.first_name)} ${esc(c.last_name)}</span>
      </td>
      <td class="crm-td">${_crmTypeBadge(c.type)}</td>
      <td class="crm-td crm-td--muted crm-th--hide-sm">${c.email ? esc(c.email) : '<span class="crm-empty-cell">—</span>'}</td>
      <td class="crm-td crm-td--muted crm-th--hide-sm">${c.phone ? esc(c.phone) : '<span class="crm-empty-cell">—</span>'}</td>
      <td class="crm-td crm-td--notes crm-th--hide-md">${c.notes ? `<span class="crm-notes-preview">${esc(c.notes)}</span>` : '<span class="crm-empty-cell">—</span>'}</td>
    `;
    tr.addEventListener('click', () => openContact(c.id));
    tbody.appendChild(tr);
  });
}

async function openContact(id) {
  document.getElementById('crmContactsList').style.display = 'none';
  document.getElementById('crmEmpty').hidden               = true;
  document.getElementById('crmDetail').hidden              = false;
  document.getElementById('crmDetailBody').innerHTML       = loading();
  document.getElementById('crmInteractionsList').innerHTML = '';
  document.getElementById('crmMembershipsList').innerHTML  = '';
  document.getElementById('crmInquiriesList').innerHTML    = '';
  document.getElementById('addInteractionForm').hidden     = true;
  document.getElementById('addInteractionBtn').hidden      = !canDo('crm:write');

  // Parallel fetches
  const [cRes, iRes, mRes, eRes] = await Promise.all([
    db.from('contacts').select('*').eq('id', id).single(),
    db.from('interactions').select('*').eq('contact_id', id).order('interaction_date', { ascending: false }),
    db.from('memberships').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    db.from('event_inquiries').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
  ]);

  if (cRes.error) {
    document.getElementById('crmDetailBody').innerHTML = dbErr('contacts', cRes.error);
    return;
  }

  const c = cRes.data;
  document.getElementById('crmDetailName').textContent = `${c.first_name} ${c.last_name}`;

  document.getElementById('crmDetailBody').innerHTML = `
    <div class="data-card" style="margin-top:0.75rem;">
      <div class="data-card__body" style="gap:0.4rem;">
        ${_crmTypeBadge(c.type)}
        ${c.phone   ? `<span>📞 ${esc(c.phone)}</span>`   : ''}
        ${c.email   ? `<span>✉ ${esc(c.email)}</span>`   : ''}
        ${c.address ? `<span>📍 ${esc(c.address)}</span>` : ''}
        ${c.source  ? `<span style="font-size:0.8rem;color:#888;">Source: ${esc(c.source)}</span>` : ''}
        ${c.notes   ? `<span class="data-card__notes">${esc(c.notes)}</span>` : ''}
        <span style="font-size:0.78rem;color:#aaa;">Added ${fmtDate(c.created_at)}</span>
      </div>
    </div>
  `;

  // Interactions
  _renderInteractions(iRes.data || []);

  // Memberships
  _renderMemberships(mRes.data || []);

  // Event Inquiries
  _renderInquiries(eRes.data || []);

  // Store id on back button handler so the sub-form can reference it
  document.getElementById('crmDetailBack')._contactId = id;
  document.getElementById('saveInteractionBtn')._contactId = id;
}

function _renderInteractions(rows) {
  const list  = document.getElementById('crmInteractionsList');
  const empty = document.getElementById('crmInteractionsEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;
  rows.forEach(i => {
    const el = document.createElement('div');
    el.className = 'crm-interaction-item';
    el.innerHTML = `
      <div class="crm-interaction-item__meta">
        <span>${fmtDate(i.interaction_date)}</span>
        ${i.type ? `<span style="text-transform:capitalize;">${esc(i.type)}</span>` : ''}
      </div>
      <div>${esc(i.summary)}</div>
    `;
    list.appendChild(el);
  });
}

function _renderMemberships(rows) {
  const list  = document.getElementById('crmMembershipsList');
  const empty = document.getElementById('crmMembershipsEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;
  rows.forEach(m => {
    const el = document.createElement('div');
    el.className = 'crm-membership-item';
    el.innerHTML = `
      <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
        ${m.type ? `<strong style="text-transform:capitalize;">${esc(m.type)}</strong>` : ''}
        <span class="tag ${m.status === 'active' ? 'tag--complete' : 'tag--cancelled'}">${esc(m.status)}</span>
      </div>
      ${m.start_date || m.end_date ? `<span style="font-size:0.82rem;color:#888;">${fmtDate(m.start_date)} — ${fmtDate(m.end_date)}</span>` : ''}
      ${m.fee_paid != null ? `<span style="font-size:0.82rem;">Fee paid: $${parseFloat(m.fee_paid).toFixed(2)}</span>` : ''}
      ${m.notes ? `<span class="data-card__notes">${esc(m.notes)}</span>` : ''}
    `;
    list.appendChild(el);
  });
}

function _renderInquiries(rows) {
  const list  = document.getElementById('crmInquiriesList');
  const empty = document.getElementById('crmInquiriesEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;
  rows.forEach(q => {
    const el = document.createElement('div');
    el.className = 'crm-inquiry-item';
    el.innerHTML = `
      <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
        ${q.event_type ? `<strong style="text-transform:capitalize;">${esc(q.event_type)}</strong>` : ''}
        <span class="tag">${esc(q.status)}</span>
      </div>
      ${q.requested_date ? `<span style="font-size:0.82rem;color:#888;">Requested: ${fmtDate(q.requested_date)}</span>` : ''}
      ${q.headcount ? `<span style="font-size:0.82rem;">Headcount: ${q.headcount}</span>` : ''}
      ${q.notes ? `<span class="data-card__notes">${esc(q.notes)}</span>` : ''}
    `;
    list.appendChild(el);
  });
}

async function saveContact(data) {
  const { error } = await db.from('contacts').insert(data);
  return error;
}

async function saveInteraction(contactId, data) {
  const { error } = await db.from('interactions').insert({ contact_id: contactId, ...data });
  return error;
}

// ── Add Contact Modal ──

document.getElementById('addContactBtn').addEventListener('click', () => {
  _clearContactForm();
  document.getElementById('addContactModal').hidden = false;
});

document.getElementById('cancelContactBtn').addEventListener('click', () => {
  document.getElementById('addContactModal').hidden = true;
  _clearContactForm();
});

// Close modal on overlay click
document.getElementById('addContactModal').addEventListener('click', e => {
  if (e.target === document.getElementById('addContactModal')) {
    document.getElementById('addContactModal').hidden = true;
    _clearContactForm();
  }
});

document.getElementById('saveContactBtn').addEventListener('click', async () => {
  const firstName = document.getElementById('contactFirstName').value.trim();
  const lastName  = document.getElementById('contactLastName').value.trim();
  const errEl     = document.getElementById('contactFormError');
  const btn       = document.getElementById('saveContactBtn');
  errEl.hidden    = true;

  if (!firstName) { errEl.textContent = 'First name is required.'; errEl.hidden = false; return; }
  if (!lastName)  { errEl.textContent = 'Last name is required.';  errEl.hidden = false; return; }

  btn.disabled    = true;
  btn.textContent = 'Saving…';

  const payload = {
    first_name: firstName,
    last_name:  lastName,
    phone:   document.getElementById('contactPhone').value.trim()  || null,
    email:   document.getElementById('contactEmail').value.trim()  || null,
    type:    document.getElementById('contactType').value          || null,
    source:  document.getElementById('contactSource').value.trim() || null,
    notes:   document.getElementById('contactNotes').value.trim()  || null,
  };

  const error = await saveContact(payload);

  btn.disabled    = false;
  btn.textContent = 'Save Contact';

  if (error) { errEl.textContent = error.message; errEl.hidden = false; return; }

  document.getElementById('addContactModal').hidden = true;
  _clearContactForm();
  loadCRM();
});

function _clearContactForm() {
  ['contactFirstName','contactLastName','contactPhone','contactEmail','contactSource','contactNotes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('contactType').value = '';
  document.getElementById('contactFormError').hidden = true;
}

// ── Add Interaction (inline in detail panel) ──

document.getElementById('addInteractionBtn').addEventListener('click', () => {
  document.getElementById('addInteractionForm').hidden = false;
  document.getElementById('interactionSummary').focus();
});

document.getElementById('cancelInteractionBtn').addEventListener('click', () => {
  document.getElementById('addInteractionForm').hidden = true;
  document.getElementById('interactionSummary').value  = '';
  document.getElementById('interactionFormError').hidden = true;
});

document.getElementById('saveInteractionBtn').addEventListener('click', async () => {
  const contactId = document.getElementById('saveInteractionBtn')._contactId;
  const summary   = document.getElementById('interactionSummary').value.trim();
  const errEl     = document.getElementById('interactionFormError');
  const btn       = document.getElementById('saveInteractionBtn');
  errEl.hidden    = true;

  if (!summary) { errEl.textContent = 'Summary is required.'; errEl.hidden = false; return; }

  btn.disabled    = true;
  btn.textContent = 'Saving…';

  const error = await saveInteraction(contactId, {
    type:    document.getElementById('interactionType').value || 'note',
    summary,
  });

  btn.disabled    = false;
  btn.textContent = 'Save';

  if (error) { errEl.textContent = error.message; errEl.hidden = false; return; }

  document.getElementById('addInteractionForm').hidden  = true;
  document.getElementById('interactionSummary').value   = '';

  // Refresh interactions list only
  const { data } = await db
    .from('interactions')
    .select('*')
    .eq('contact_id', contactId)
    .order('interaction_date', { ascending: false });
  _renderInteractions(data || []);
});

// ── Back button from detail ──

document.getElementById('crmDetailBack').addEventListener('click', () => {
  _showCrmList();
  renderContacts(_crmAllContacts);
});

// ── Search (client-side debounce) ──

document.getElementById('crmSearch').addEventListener('input', e => {
  clearTimeout(_crmDebounceTimer);
  _crmDebounceTimer = setTimeout(() => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      renderContacts(_crmAllContacts);
      return;
    }
    const filtered = _crmAllContacts.filter(c =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.email  && c.email.toLowerCase().includes(q))  ||
      (c.phone  && c.phone.includes(q))
    );
    renderContacts(filtered);
  }, 200);
});

// ============================================
// SPA BACK-BUTTON MANAGEMENT
// Push a history entry on load so pressing the browser back button fires
// popstate within this page rather than navigating to the OAuth redirect URL
// (which would try to re-exchange the already-consumed PKCE code and sign
// the user out).
// ============================================

history.pushState({ portal: true }, '');

window.addEventListener('popstate', () => {
  // If the CRM contact detail is open, close it
  const detail = document.getElementById('crmDetail');
  if (detail && !detail.hidden) {
    _showCrmList();
    renderContacts(_crmAllContacts);
  }
  // Re-push so the next back press is caught here too
  history.pushState({ portal: true }, '');
});

// ============================================
// ADMIN PANEL
// ============================================

const TOOL_TABS = [
  { key: 'tournaments', label: 'Tournaments' },
  { key: 'eggs',        label: 'Egg Orders'  },
  { key: 'resources',   label: 'Resources'   },
  { key: 'crm',         label: 'CRM'         },
];

const TOOL_ACTIONS = [
  { key: 'tournaments:create', label: 'Create / edit tournaments',    tab: 'tournaments' },
  { key: 'eggs:pickup',        label: 'Mark egg orders as picked up', tab: 'eggs'        },
  { key: 'crm:write',          label: 'Add / edit CRM contacts',      tab: 'crm'         },
];

let _adminUsers = [];

async function loadAdmin() {
  const list = document.getElementById('adminUserList');
  const detail = document.getElementById('adminUserDetail');
  list.innerHTML = loading();
  detail.hidden = true;

  const { data, error } = await db.from('profiles').select('id, role, tools, display_name, email');
  if (error) { list.innerHTML = dbErr('profiles', error); return; }
  _adminUsers = data || [];

  list.innerHTML = '';
  _adminUsers.forEach(u => {
    const card = document.createElement('div');
    card.className = 'data-card';
    card.style.cursor = 'pointer';
    const label = u.display_name || u.email || `${u.id.slice(0,8)}…`;
    const tabs  = (u.tools?.tabs || []).join(', ') || 'none';
    card.innerHTML = `
      <div class="data-card__header">
        <span class="data-card__title">${esc(label)}</span>
        <span class="data-card__badge">${esc(u.role)}</span>
      </div>
      <div class="data-card__body" style="font-size:0.82rem;color:#666;">Tabs: ${esc(tabs)}</div>
    `;
    card.addEventListener('click', () => openAdminDetail(u));
    list.appendChild(card);
  });
}

function openAdminDetail(u) {
  document.getElementById('adminUserList').hidden   = true;
  document.getElementById('adminUserDetail').hidden = false;
  const label = u.display_name || u.email || `${u.id.slice(0,8)}…`;
  document.getElementById('adminDetailName').textContent = `${label} · ${u.role}`;

  const tools = u.tools || { tabs: [], actions: [] };
  const isAdmin = u.role === 'admin';

  let html = '';

  if (isAdmin) {
    html = '<p style="color:#666;font-size:0.88rem;margin-top:1rem;">Admin role has full access — no restrictions apply.</p>';
  } else {
    html += '<h4 style="font-family:\'Playfair Display\',serif;font-size:0.9rem;color:#1C3320;margin:1.25rem 0 0.5rem;">Tabs</h4>';
    html += '<div class="toolbox-grid">';
    TOOL_TABS.forEach(t => {
      const on = (tools.tabs || []).includes(t.key);
      html += `
        <label class="tool-toggle ${on ? 'tool-toggle--on' : ''}">
          <input type="checkbox" ${on ? 'checked' : ''} data-uid="${esc(u.id)}" data-type="tab" data-key="${esc(t.key)}">
          <span class="tool-toggle__label">${esc(t.label)}</span>
          <span class="tool-toggle__state">${on ? 'On' : 'Off'}</span>
        </label>`;
    });
    html += '</div>';

    html += '<h4 style="font-family:\'Playfair Display\',serif;font-size:0.9rem;color:#1C3320;margin:1.25rem 0 0.5rem;">Actions</h4>';
    html += '<div class="toolbox-grid">';
    TOOL_ACTIONS.forEach(a => {
      const tabOn = (tools.tabs || []).includes(a.tab);
      const on    = (tools.actions || []).includes(a.key);
      html += `
        <label class="tool-toggle ${on ? 'tool-toggle--on' : ''} ${!tabOn ? 'tool-toggle--disabled' : ''}" title="${!tabOn ? 'Enable the ' + a.tab + ' tab first' : ''}">
          <input type="checkbox" ${on ? 'checked' : ''} ${!tabOn ? 'disabled' : ''} data-uid="${esc(u.id)}" data-type="action" data-key="${esc(a.key)}">
          <span class="tool-toggle__label">${esc(a.label)}</span>
          <span class="tool-toggle__state">${on ? 'On' : 'Off'}</span>
        </label>`;
    });
    html += '</div>';
  }

  const container = document.getElementById('adminDetailToggles');
  container.innerHTML = html;

  container.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => handleToolToggle(cb, u));
  });
}

async function handleToolToggle(cb, u) {
  const uid  = cb.dataset.uid;
  const type = cb.dataset.type; // 'tab' | 'action'
  const key  = cb.dataset.key;
  const on   = cb.checked;

  // Optimistic UI
  const label = cb.closest('.tool-toggle');
  label.classList.toggle('tool-toggle--on', on);
  label.querySelector('.tool-toggle__state').textContent = on ? 'On' : 'Off';

  // Fetch fresh tools from local cache
  const user = _adminUsers.find(u2 => u2.id === uid);
  const tools = JSON.parse(JSON.stringify(user.tools || { tabs: [], actions: [] }));

  if (type === 'tab') {
    if (on && !tools.tabs.includes(key)) tools.tabs.push(key);
    if (!on) tools.tabs = tools.tabs.filter(k => k !== key);
    // If tab disabled, also disable its actions
    if (!on) tools.actions = tools.actions.filter(a => {
      const def = TOOL_ACTIONS.find(x => x.key === a);
      return !def || def.tab !== key;
    });
  } else {
    if (on && !tools.actions.includes(key)) tools.actions.push(key);
    if (!on) tools.actions = tools.actions.filter(k => k !== key);
  }

  const { error } = await db.from('profiles').update({ tools }).eq('id', uid);
  if (error) {
    // Revert on failure
    cb.checked = !on;
    label.classList.toggle('tool-toggle--on', !on);
    label.querySelector('.tool-toggle__state').textContent = !on ? 'On' : 'Off';
    alert('Failed to save. Try again.');
    return;
  }

  // Update local cache and re-render to sync disabled states
  user.tools = tools;
  openAdminDetail(user);
}

function closeAdminDetail() {
  document.getElementById('adminUserList').hidden   = false;
  document.getElementById('adminUserDetail').hidden = true;
}

window.closeAdminDetail = closeAdminDetail;

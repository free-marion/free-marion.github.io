// ============================================
// CHERRYWOOD PORTAL
// ============================================

// Capture hash immediately — Supabase clears it before onAuthStateChange fires
const _initialHash = window.location.hash;

const SUPABASE_URL  = 'https://giwfigekjatujubjknjf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpd2ZpZ2VramF0dWp1YmprbmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEwMDMsImV4cCI6MjA4OTU3NzAwM30.p3OaPA5qYROqz8d0tNyhytl__n_bzH2l2MOX3olDn3A';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false }  // never cache sessions — always require fresh login
});
let currentUser = null;
let currentRole  = 'viewer'; // admin | staff | viewer

function isAdmin()  { return currentRole === 'admin'; }
function isStaff()  { return currentRole === 'admin' || currentRole === 'staff'; }
function canEdit()  { return currentRole === 'admin' || currentRole === 'staff'; }

// ============================================
// AUTH
// ============================================

db.auth.onAuthStateChange(async (event, session) => {
  currentUser = session?.user ?? null;
  if (currentUser) {
    // Invite, magic link, or password recovery — prompt user to set a permanent password
    if (_initialHash.includes('type=invite') || _initialHash.includes('type=magiclink') || _initialHash.includes('type=recovery')) {
      showSetPasswordScreen();
      return;
    }
    document.getElementById('setPasswordScreen').hidden = true;
    document.getElementById('loginScreen').hidden = true;
    document.getElementById('appShell').hidden = false;
    document.getElementById('userEmail').textContent = currentUser.email;
    await loadProfile();
    loadVto();
    loadCourseStatus();
  } else {
    document.getElementById('setPasswordScreen').hidden = true;
    document.getElementById('loginScreen').hidden = false;
    document.getElementById('appShell').hidden = true;
  }
});

function showSetPasswordScreen() {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('appShell').hidden = true;
  document.getElementById('setPasswordScreen').hidden = false;
  document.getElementById('setPasswordInput').focus();
}

document.getElementById('setPasswordBtn').addEventListener('click', async () => {
  const password = document.getElementById('setPasswordInput').value;
  const confirm  = document.getElementById('setPasswordConfirm').value;
  const errEl    = document.getElementById('setPasswordError');
  const btn      = document.getElementById('setPasswordBtn');
  errEl.hidden   = true;

  if (password.length < 8) {
    errEl.textContent = 'Password must be at least 8 characters.';
    errEl.hidden = false;
    return;
  }
  if (password !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.hidden = false;
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving…';

  const { error } = await db.auth.updateUser({ password });
  if (error) {
    errEl.textContent = error.message;
    errEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Set Password & Sign In';
    return;
  }

  // Password set — load the app normally
  document.getElementById('setPasswordScreen').hidden = true;
  document.getElementById('appShell').hidden = false;
  document.getElementById('userEmail').textContent = currentUser.email;
  await loadProfile();
  loadVto();
  loadCourseStatus();
});


document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  err.hidden = true;
  const { error } = await db.auth.signInWithPassword({
    email: document.getElementById('loginEmail').value.trim(),
    password: document.getElementById('loginPassword').value
  });
  if (error) {
    err.textContent = error.message;
    err.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

document.getElementById('showForgotBtn').addEventListener('click', () => {
  const form = document.getElementById('forgotForm');
  form.hidden = !form.hidden;
  if (!form.hidden) document.getElementById('forgotEmail').focus();
});

document.getElementById('sendResetBtn').addEventListener('click', async () => {
  const email  = document.getElementById('forgotEmail').value.trim();
  const errEl  = document.getElementById('forgotError');
  const okEl   = document.getElementById('forgotSuccess');
  const btn    = document.getElementById('sendResetBtn');
  errEl.hidden = true; okEl.style.display = 'none';

  if (!email) { errEl.textContent = 'Please enter your email.'; errEl.hidden = false; return; }

  btn.disabled = true; btn.textContent = 'Sending…';
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://free-marion.github.io/portal/'
  });
  btn.disabled = false; btn.textContent = 'Send Reset Link';

  if (error) { errEl.textContent = error.message; errEl.hidden = false; return; }
  okEl.style.display = 'block';
  document.getElementById('forgotEmail').value = '';
});

// ============================================
// PROFILE & PERMISSIONS
// ============================================

async function loadProfile() {
  const { data } = await db.from('profiles').select('role').eq('id', currentUser.id).single();
  currentRole = data?.role ?? 'viewer';
  applyPermissions();
}

function applyPermissions() {
  // Course toggle — admin only
  document.getElementById('courseToggleBtn').style.display = isAdmin() ? '' : 'none';

  // Add to-do button — staff/admin only
  document.getElementById('addTodoBtn').style.display = canEdit() ? '' : 'none';

  // Tabs hidden from viewer
  const staffOnlyTabs = ['vto', 'todos', 'docs', 'tournaments'];
  staffOnlyTabs.forEach(tabName => {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (btn) btn.style.display = isStaff() ? '' : 'none';
  });

  // Users tab — admin only
  const usersTabBtn = document.querySelector('.tab-btn[data-tab="users"]');
  if (usersTabBtn) usersTabBtn.style.display = isAdmin() ? '' : 'none';

  // Redirect away from restricted tabs
  const active = document.querySelector('.tab-btn--active');
  if (active) {
    const onStaffTab = staffOnlyTabs.includes(active.dataset.tab);
    const onUsersTab = active.dataset.tab === 'users';
    if (!isStaff() && (onStaffTab || onUsersTab)) {
      document.querySelector('.tab-btn[data-tab="bookings"]').click();
    } else if (isStaff() && !isAdmin() && onUsersTab) {
      document.querySelector('.tab-btn[data-tab="vto"]').click();
    }
  }
}

// ============================================
// TAB ROUTING
// ============================================

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = true; p.classList.remove('tab-panel--active'); });
    btn.classList.add('tab-btn--active');
    const panel = document.getElementById('tab' + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1));
    panel.hidden = false;
    panel.classList.add('tab-panel--active');
    if (btn.dataset.tab === 'bookings') loadBookings();
    if (btn.dataset.tab === 'eggs')     loadEggs();
    if (btn.dataset.tab === 'todos')    loadTodos();
    if (btn.dataset.tab === 'users')       loadUsers();
    if (btn.dataset.tab === 'tournaments') loadTournaments();
  });
});

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
// V/TO
// ============================================

async function loadVto() {
  const { data, error } = await db.from('vto').select('*').eq('id', 1).single();
  if (error || !data) return;
  renderVto(data);
}

function renderVto(v) {
  const el = document.getElementById('vtoContent');

  let coreValues = [];
  try { coreValues = JSON.parse(v.core_values); } catch(e) { coreValues = [v.core_values]; }

  let uniques = [];
  try { uniques = JSON.parse(v.mktg_uniques); } catch(e) { uniques = [v.mktg_uniques]; }

  el.innerHTML = `
    <div class="vto-col">
      <div class="vto-block">
        <h3>Core Values</h3>
        <ul>${coreValues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      </div>
      <div class="vto-block">
        <h3>Core Focus</h3>
        <p><strong>Purpose:</strong> ${esc(v.core_focus_purpose)}</p>
        <p><strong>Niche:</strong> ${esc(v.core_focus_niche)}</p>
      </div>
      <div class="vto-block">
        <h3>10-Year Target</h3>
        <p>${esc(v.ten_year_target)}</p>
      </div>
      <div class="vto-block">
        <h3>Marketing Strategy</h3>
        <p><strong>Target Market:</strong> ${esc(v.mktg_target_market)}</p>
        <p><strong>Uniques:</strong></p>
        <ul>${uniques.map(u => `<li>${esc(u)}</li>`).join('')}</ul>
        <p><strong>Proven Process:</strong> ${esc(v.mktg_proven_process)}</p>
        <p><strong>Guarantee:</strong> ${esc(v.mktg_guarantee)}</p>
      </div>
    </div>
    <div class="vto-col">
      <div class="vto-block">
        <h3>3-Year Picture</h3>
        <p style="white-space:pre-line">${esc(v.three_year_picture)}</p>
      </div>
      <div class="vto-block">
        <h3>1-Year Plan</h3>
        <p style="white-space:pre-line">${esc(v.one_year_plan)}</p>
      </div>
    </div>
  `;
}

// ============================================
// BOOKINGS
// ============================================

let bookingsFilter = 'upcoming';
let _cancelBookingId = null;
let _cancelSlotTime  = null;

async function archiveOldBookings() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await db.from('bookings')
    .update({ archived_at: new Date().toISOString() })
    .lt('slot_time', cutoff)
    .is('archived_at', null);
}

async function loadBookings() {
  await archiveOldBookings();

  let q;
  if (bookingsFilter === 'archive') {
    q = db.from('bookings').select('*')
      .not('archived_at', 'is', null)
      .order('slot_time', { ascending: false });
  } else if (bookingsFilter === 'upcoming') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    q = db.from('bookings').select('*')
      .is('archived_at', null)
      .gte('slot_time', startOfToday.toISOString())
      .neq('status', 'cancelled')
      .order('slot_time', { ascending: true });
  } else {
    // past 24 hours
    const cutoff24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    q = db.from('bookings').select('*')
      .gte('slot_time', cutoff24)
      .lte('slot_time', new Date().toISOString())
      .order('slot_time', { ascending: false });
  }

  const { data, error } = await q;
  if (error) { console.error(error); return; }
  renderBookings(data || []);
}

function renderBookings(rows) {
  const list  = document.getElementById('bookingsList');
  const empty = document.getElementById('bookingsEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;

  const now = new Date();

  if (bookingsFilter === 'upcoming') {
    const pastToday = rows.filter(b => new Date(b.slot_time) < now);
    const upcoming  = rows.filter(b => new Date(b.slot_time) >= now);

    if (pastToday.length) {
      list.appendChild(makeDivider('Earlier Today'));
      pastToday.forEach(b => list.appendChild(buildBookingCard(b)));
    }
    if (upcoming.length) {
      if (pastToday.length) list.appendChild(makeDivider('Upcoming'));
      upcoming.forEach(b => list.appendChild(buildBookingCard(b)));
    }
  } else {
    rows.forEach(b => list.appendChild(buildBookingCard(b)));
  }
}

function makeDivider(label) {
  const d = document.createElement('div');
  d.className = 'bookings-divider';
  d.textContent = label;
  return d;
}

function buildBookingCard(b) {
  const now     = new Date();
  const isPast  = new Date(b.slot_time) < now;
  const isCancelled = b.status === 'cancelled';

  const card = document.createElement('div');
  card.className = 'data-card' + (isCancelled ? ' data-card--muted' : '') + (isPast && !isCancelled ? ' data-card--past' : '');

  let actionHtml = '';
  if (isCancelled) {
    actionHtml = `
      <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
        <span class="tag tag--cancelled">Cancelled</span>
        ${b.cancel_reason ? `<span style="font-size:0.78rem;color:#888;">${esc(b.cancel_reason)}${b.cancel_notes ? ' — ' + esc(b.cancel_notes) : ''}${b.cancelled_by ? ' · by ' + esc(b.cancelled_by) : ''}</span>` : ''}
      </div>`;
  } else if (isPast) {
    actionHtml = `<span class="tag" style="background:#f0f0f0;color:#999;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Completed</span>`;
  } else if (isStaff()) {
    actionHtml = `<button class="btn btn--ghost btn--sm" data-cancel="${b.id}" style="color:#a00;">Cancel Booking</button>`;
  }

  card.innerHTML = `
    <div class="data-card__header">
      <span class="data-card__title">${fmtDateTime(b.slot_time)}</span>
      <span class="data-card__badge">${esc(b.confirmation_no)}</span>
    </div>
    <div class="data-card__body">
      <span><strong>${esc(b.name)}</strong> &bull; ${esc(b.phone)}${b.email ? ' &bull; ' + esc(b.email) : ''}</span>
      <span>${b.num_players} player${b.num_players !== 1 ? 's' : ''} &bull; ${b.holes} holes${b.num_carts > 0 ? ' &bull; ' + b.num_carts + ' cart' + (b.num_carts !== 1 ? 's' : '') : ''}</span>
      ${b.notes ? `<span class="data-card__notes">${esc(b.notes)}</span>` : ''}
    </div>
    ${actionHtml}
  `;

  card.querySelector('[data-cancel]')?.addEventListener('click', () => {
    openCancelModal(b.id, b.name, b.slot_time);
  });

  return card;
}

function openCancelModal(bookingId, name, slotTime) {
  if (new Date(slotTime) <= new Date()) return; // past tee times cannot be cancelled
  _cancelBookingId = bookingId;
  _cancelSlotTime  = slotTime;
  document.getElementById('cancelModalName').textContent = `${name} — ${fmtDateTime(slotTime)}`;
  document.getElementById('cancelReason').value = '';
  document.getElementById('cancelNotes').value = '';
  document.getElementById('cancelModalError').hidden = true;
  document.getElementById('cancelModal').hidden = false;
}

document.getElementById('cancelModalClose').addEventListener('click', () => {
  document.getElementById('cancelModal').hidden = true;
  _cancelBookingId = null;
  _cancelSlotTime  = null;
});

document.getElementById('confirmCancelBtn').addEventListener('click', async () => {
  const reason = document.getElementById('cancelReason').value;
  const notes  = document.getElementById('cancelNotes').value.trim();
  const errEl  = document.getElementById('cancelModalError');
  const btn    = document.getElementById('confirmCancelBtn');

  if (!reason) { errEl.textContent = 'Please select a reason.'; errEl.hidden = false; return; }

  btn.disabled = true; btn.textContent = 'Cancelling…';

  const { data: updated, error } = await db.from('bookings').update({
    status: 'cancelled',
    cancelled_by: currentUser.email,
    cancel_reason: reason,
    cancel_notes: notes || null,
  }).eq('id', _cancelBookingId).gt('slot_time', new Date().toISOString()).select('id');

  btn.disabled = false; btn.textContent = 'Confirm Cancellation';

  if (error) { errEl.textContent = error.message; errEl.hidden = false; return; }
  if (!updated || updated.length === 0) {
    errEl.textContent = 'This tee time has already passed and cannot be cancelled.';
    errEl.hidden = false;
    return;
  }

  document.getElementById('cancelModal').hidden = true;
  _cancelBookingId = null;
  _cancelSlotTime  = null;
  loadBookings();
});

document.querySelectorAll('#tabBookings .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tabBookings .filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    bookingsFilter = btn.dataset.filter;
    loadBookings();
  });
});

// ============================================
// EGG ORDERS
// ============================================

let eggsFilter = 'pending';

async function loadEggs() {
  let q = db.from('egg_orders').select('*').order('created_at', { ascending: false });
  if (eggsFilter === 'pending') q = q.eq('status', 'pending');
  const { data, error } = await q;
  if (error) { console.error(error); return; }
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
// TO-DOS
// ============================================

async function loadTodos() {
  const { data, error } = await db.from('todos')
    .select('*')
    .eq('owner_id', currentUser.id)
    .order('created_at', { ascending: true });
  if (error) { console.error(error); return; }
  renderTodos(data || []);
}

function renderTodos(rows) {
  const list  = document.getElementById('todosList');
  const empty = document.getElementById('todosEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;
  rows.forEach(t => {
    const item = document.createElement('div');
    item.className = 'todo-item' + (t.done ? ' todo-item--done' : '');
    item.innerHTML = `
      <input type="checkbox" class="todo-check" ${t.done ? 'checked' : ''} data-id="${t.id}" data-done="${t.done}">
      <span class="todo-title">${esc(t.title)}</span>
      ${t.due_date ? `<span class="todo-due">${fmtDate(t.due_date)}</span>` : ''}
      <button class="todo-delete btn btn--ghost btn--sm" data-id="${t.id}">✕</button>
    `;
    item.querySelector('.todo-check').addEventListener('change', async e => {
      await db.from('todos').update({ done: e.target.checked }).eq('id', t.id);
      loadTodos();
    });
    item.querySelector('.todo-delete').addEventListener('click', async () => {
      await db.from('todos').delete().eq('id', t.id);
      loadTodos();
    });
    list.appendChild(item);
  });
}

document.getElementById('addTodoBtn').addEventListener('click', () => {
  document.getElementById('todoForm').hidden = false;
  document.getElementById('todoTitle').focus();
});

document.getElementById('cancelTodoBtn').addEventListener('click', () => {
  document.getElementById('todoForm').hidden = true;
  document.getElementById('todoTitle').value = '';
  document.getElementById('todoDue').value = '';
});

document.getElementById('saveTodoBtn').addEventListener('click', async () => {
  const title = document.getElementById('todoTitle').value.trim();
  const due   = document.getElementById('todoDue').value || null;
  if (!title) { alert('Please enter a task.'); return; }
  await db.from('todos').insert({
    title, due_date: due,
    owner_id: currentUser.id,
    owner_name: currentUser.email,
    week_created: new Date().toISOString().split('T')[0]
  });
  document.getElementById('todoForm').hidden = true;
  document.getElementById('todoTitle').value = '';
  document.getElementById('todoDue').value = '';
  loadTodos();
});

// ============================================
// COURSE STATUS
// ============================================

let courseIsOpen = true;

async function loadCourseStatus() {
  const { data } = await db.from('course_status').select('*').eq('id', 1).single();
  if (data) {
    courseIsOpen = data.is_open;
    updateCourseBtn();
  }
}

function withinHours() {
  const now = new Date();
  const ct  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const h   = ct.getHours();
  return h >= 8 && h < 19;
}

function updateCourseBtn() {
  const btn = document.getElementById('courseToggleBtn');
  const effectivelyOpen = courseIsOpen && withinHours();
  if (effectivelyOpen) {
    btn.textContent = '⛳ Course Open';
    btn.className = 'btn btn--sm course-open';
  } else {
    btn.textContent = '⛔ Course Closed';
    btn.className = 'btn btn--sm course-closed';
  }
}

document.getElementById('courseToggleBtn').addEventListener('click', async () => {
  const newStatus = !courseIsOpen;
  const msg = newStatus ? '' : prompt('Closure message (shown on website):', 'Course is closed due to weather conditions. Check back soon.');
  if (!newStatus && msg === null) return; // cancelled
  const label = newStatus ? 'reopen' : 'close';
  if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} the course?`)) return;
  await db.from('course_status').update({
    is_open: newStatus,
    message: msg || 'Course is closed due to weather conditions. Check back soon.',
    updated_at: new Date().toISOString()
  }).eq('id', 1);
  courseIsOpen = newStatus;
  updateCourseBtn();
});

// ============================================
// USERS (admin only)
// ============================================

async function loadUsers() {
  const { data, error } = await db.from('profiles').select('id, email, name, role').order('name');
  if (error) { console.error(error); return; }
  renderUsers(data || []);
}

function renderUsers(rows) {
  const list  = document.getElementById('usersList');
  const empty = document.getElementById('usersEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;
  rows.forEach(u => {
    const card = document.createElement('div');
    card.className = 'data-card';
    card.innerHTML = `
      <div class="data-card__header">
        <span class="data-card__title">${esc(u.name || '—')}</span>
        <span class="data-card__badge">${esc(u.email || '')}</span>
      </div>
      <div class="data-card__body">
        <label style="display:flex;align-items:center;gap:8px;">Role:
          <select class="role-select" data-id="${u.id}">
            <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>Viewer</option>
            <option value="staff"  ${u.role === 'staff'  ? 'selected' : ''}>Staff</option>
            <option value="admin"  ${u.role === 'admin'  ? 'selected' : ''}>Admin</option>
          </select>
        </label>
      </div>
    `;
    card.querySelector('.role-select').addEventListener('change', async e => {
      const newRole = e.target.value;
      const { error } = await db.from('profiles').update({ role: newRole }).eq('id', u.id);
      if (error) { alert('Failed to update role: ' + error.message); e.target.value = u.role; return; }
      u.role = newRole;
    });
    list.appendChild(card);
  });
}

document.getElementById('addUserBtn').addEventListener('click', () => {
  document.getElementById('userForm').hidden = false;
  document.getElementById('newUserName').focus();
});

document.getElementById('cancelUserBtn').addEventListener('click', () => {
  document.getElementById('userForm').hidden = true;
  clearUserForm();
});

document.getElementById('saveUserBtn').addEventListener('click', async () => {
  const name  = document.getElementById('newUserName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim();
  const role  = document.getElementById('newUserRole').value;
  const errEl = document.getElementById('userFormError');
  const btn   = document.getElementById('saveUserBtn');
  errEl.hidden = true;

  if (!name || !email) {
    errEl.textContent = 'Name and email are required.';
    errEl.hidden = false;
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending invite…';

  const { data: { session } } = await db.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/invite-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON,
    },
    body: JSON.stringify({ name, email, role }),
  });

  const json = await res.json();
  btn.disabled = false;
  btn.textContent = 'Send Invite';

  if (!res.ok || json.error) {
    errEl.textContent = json.error || 'Something went wrong.';
    errEl.hidden = false;
    return;
  }

  document.getElementById('userForm').hidden = true;
  clearUserForm();
  loadUsers();
});

function clearUserForm() {
  document.getElementById('newUserName').value    = '';
  document.getElementById('newUserEmail').value   = '';
  document.getElementById('newUserRole').value    = 'viewer';
  document.getElementById('userFormError').hidden = true;
}

// ============================================
// TOURNAMENTS
// ============================================

let currentEditingTournamentId = null;

async function loadTournaments() {
  document.getElementById('registrationsPanel').hidden = true;
  document.getElementById('tournamentsList').style.display = '';
  document.getElementById('tournamentsEmpty').hidden = true;

  const { data, error } = await db.from('tournaments').select('*').order('date', { ascending: false });
  if (error) { console.error(error); return; }

  // Fetch registration counts
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

  if (error) { console.error(error); return; }
  renderRegistrations(data || [], tournamentId);
}

function renderRegistrations(rows, tournamentId) {
  const list  = document.getElementById('registrationsList');
  const empty = document.getElementById('registrationsEmpty');
  list.innerHTML = '';
  if (!rows.length) { empty.hidden = false; return; }
  empty.hidden = true;

  rows.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'data-card' + (r.status === 'cancelled' ? ' data-card--muted' : '');
    card.innerHTML = `
      <div class="data-card__header">
        <span class="data-card__title">#${i + 1} ${esc(r.team_name || r.captain_name || '—')}</span>
        <span class="data-card__badge">${fmtDate(r.created_at)}</span>
      </div>
      <div class="data-card__body">
        ${r.team_name ? `<span><strong>Captain:</strong> ${esc(r.captain_name)}</span>` : ''}
        <span>${esc(r.phone)}${r.email ? ' · ' + esc(r.email) : ''}</span>
        ${r.num_players > 1 ? `<span>${r.num_players} players</span>` : ''}
      </div>
      ${r.status !== 'cancelled'
        ? `<button class="btn btn--ghost btn--sm" data-cancel-reg="${r.id}" style="color:#a00;">Cancel</button>`
        : '<span class="tag tag--cancelled">Cancelled</span>'}
    `;
    card.querySelector('[data-cancel-reg]')?.addEventListener('click', async () => {
      if (!confirm('Cancel this registration?')) return;
      await db.from('tournament_registrations').update({ status: 'cancelled' }).eq('id', r.id);
      loadRegistrations(tournamentId, document.getElementById('regPanelTitle').textContent);
    });
    list.appendChild(card);
  });
}

document.getElementById('closeRegPanel').addEventListener('click', () => {
  document.getElementById('registrationsPanel').hidden = true;
  document.getElementById('tournamentsList').style.display = '';
  document.getElementById('addTournamentBtn').style.display = isStaff() ? '' : 'none';
  loadTournaments();
});

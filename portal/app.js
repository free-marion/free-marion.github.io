// ============================================
// CHERRYWOOD PORTAL
// ============================================

const SUPABASE_URL  = 'https://giwfigekjatujubjknjf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpd2ZpZ2VramF0dWp1YmprbmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEwMDMsImV4cCI6MjA4OTU3NzAwM30.p3OaPA5qYROqz8d0tNyhytl__n_bzH2l2MOX3olDn3A';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);
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
    document.getElementById('loginScreen').hidden = true;
    document.getElementById('appShell').hidden = false;
    document.getElementById('userEmail').textContent = currentUser.email;
    await loadProfile();
    loadVto();
    loadCourseStatus();
  } else {
    document.getElementById('loginScreen').hidden = false;
    document.getElementById('appShell').hidden = true;
  }
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

async function loadBookings() {
  let q = db.from('bookings').select('*').order('slot_time', { ascending: true });
  if (bookingsFilter === 'upcoming') {
    q = q.gte('slot_time', new Date().toISOString()).neq('status', 'cancelled');
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
  rows.forEach(b => {
    const card = document.createElement('div');
    card.className = 'data-card' + (b.status === 'cancelled' ? ' data-card--muted' : '');
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
      ${b.status !== 'cancelled' ? (canEdit() ? `<button class="btn btn--ghost btn--sm" data-cancel="${b.id}">Cancel</button>` : '') : '<span class="tag tag--cancelled">Cancelled</span>'}
    `;
    card.querySelector('[data-cancel]')?.addEventListener('click', async () => {
      if (!confirm('Cancel this booking?')) return;
      await db.from('bookings').update({ status: 'cancelled' }).eq('id', b.id);
      loadBookings();
    });
    list.appendChild(card);
  });
}

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
        ? (canEdit() ? `<button class="btn btn--primary btn--sm" data-complete="${o.id}">Mark Picked Up</button>` : '')
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

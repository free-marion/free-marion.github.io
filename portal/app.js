// ============================================
// CHERRYWOOD TEAM PORTAL — APP
// ============================================

const SUPABASE_URL  = 'https://giwfigekjatujubjknjf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpd2ZpZ2VramF0dWp1YmprbmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEwMDMsImV4cCI6MjA4OTU3NzAwM30.p3OaPA5qYROqz8d0tNyhytl__n_bzH2l2MOX3olDn3A';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

let currentUser = null;
let currentFilter = 'open';

// =====================
// AUTH
// =====================

db.auth.onAuthStateChange(async (event, session) => {
  currentUser = session?.user ?? null;
  if (currentUser) {
    showApp();
    await Promise.all([loadRocks(), loadMeasurables(), loadIssues(), loadTodos(), loadMeetingLogs()]);
    loadDashboard();
  } else {
    showLogin();
  }
});

function showLogin() {
  document.getElementById('loginScreen').hidden = false;
  document.getElementById('appShell').hidden    = true;
}

function showApp() {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('appShell').hidden    = false;
  document.getElementById('userEmail').textContent = currentUser.email;
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');

  errEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.textContent = error.message;
    errEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

document.getElementById('signOutBtn').addEventListener('click', () => db.auth.signOut());

// =====================
// TAB ROUTING
// =====================

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('tab-btn--active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.hidden = true);

    btn.classList.add('tab-btn--active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById('tab' + capitalize(btn.dataset.tab)).hidden = false;
  });
});

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// =====================
// ROCKS
// =====================

let rocks = [];
let editingRockId = null;

async function loadRocks() {
  const { data, error } = await db.from('rocks').select('*').order('created_at', { ascending: true });
  if (error) { console.error(error); return; }
  rocks = data || [];
  renderRocks();
}

function renderRocks() {
  const list  = document.getElementById('rocksList');
  const empty = document.getElementById('rocksEmpty');
  list.querySelectorAll('.rock-card').forEach(c => c.remove());

  if (rocks.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  rocks.forEach(rock => {
    const card = document.createElement('div');
    card.className = 'rock-card';
    card.dataset.id = rock.id;

    const statusEmoji = { on_track: '🟢', off_track: '🔴', complete: '✓' }[rock.status] || '⚪';
    const dueStr = rock.due_date
      ? new Date(rock.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'No due date';

    card.innerHTML = `
      <button class="rock-status-btn" data-status="${rock.status}" title="Cycle status" aria-label="Status: ${rock.status}">
        ${statusEmoji}
      </button>
      <div class="rock-body">
        <div class="rock-title">${escHtml(rock.title)}<span class="status-pill status-pill--${rock.status}">${rock.status.replace('_', ' ')}</span></div>
        ${rock.description ? `<div class="rock-desc">${escHtml(rock.description)}</div>` : ''}
        <div class="rock-meta">Due: ${dueStr} &middot; Owner: ${escHtml(rock.owner_name || currentUser.email)}</div>
      </div>
      <div class="rock-actions">
        <button class="btn btn--ghost btn--sm rock-edit-btn">Edit</button>
        <button class="btn btn--danger btn--sm rock-delete-btn">Delete</button>
      </div>
    `;

    card.querySelector('.rock-status-btn').addEventListener('click', () => cycleRockStatus(rock));
    card.querySelector('.rock-edit-btn').addEventListener('click', () => openRockForm(rock));
    card.querySelector('.rock-delete-btn').addEventListener('click', () => deleteRock(rock.id));

    list.appendChild(card);
  });
}

function cycleRockStatus(rock) {
  const cycle = { on_track: 'off_track', off_track: 'complete', complete: 'on_track' };
  const next = cycle[rock.status] || 'on_track';
  db.from('rocks').update({ status: next }).eq('id', rock.id).then(({ error }) => {
    if (!error) loadRocks();
  });
}

document.getElementById('addRockBtn').addEventListener('click', () => openRockForm(null));

function openRockForm(rock) {
  editingRockId = rock ? rock.id : null;
  document.getElementById('rockFormHeading').textContent = rock ? 'Edit Rock' : 'New Rock';
  document.getElementById('rockId').value    = rock?.id ?? '';
  document.getElementById('rockTitle').value = rock?.title ?? '';
  document.getElementById('rockDue').value   = rock?.due_date ?? '';
  document.getElementById('rockDesc').value  = rock?.description ?? '';
  document.getElementById('rockForm').hidden = false;
  document.getElementById('rockTitle').focus();
}

document.getElementById('cancelRockBtn').addEventListener('click', () => {
  document.getElementById('rockForm').hidden = true;
  editingRockId = null;
});

document.getElementById('saveRockBtn').addEventListener('click', async () => {
  const title = document.getElementById('rockTitle').value.trim();
  const due   = document.getElementById('rockDue').value || null;
  const desc  = document.getElementById('rockDesc').value.trim() || null;
  if (!title) { alert('Rock title is required.'); return; }

  if (editingRockId) {
    await db.from('rocks').update({ title, due_date: due, description: desc }).eq('id', editingRockId);
  } else {
    await db.from('rocks').insert({ title, due_date: due, description: desc, owner_id: currentUser.id, owner_name: currentUser.email, status: 'on_track' });
  }
  document.getElementById('rockForm').hidden = true;
  editingRockId = null;
  await loadRocks();
});

async function deleteRock(id) {
  if (!confirm('Delete this rock?')) return;
  await db.from('rocks').delete().eq('id', id);
  await loadRocks();
}

// =====================
// SCORECARD
// =====================

let measurables = [];
let scores      = {};  // { measurable_id: { week_start: value } }
let weeks       = [];  // array of ISO date strings (Monday, last 13 weeks)
let editingMeasurableId = null;

function getLast13Weeks() {
  const result = [];
  const now = new Date();
  // find most recent Monday
  const day = now.getDay(); // 0=Sun
  const diff = (day === 0) ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  for (let i = 12; i >= 0; i--) {
    const d = new Date(monday);
    d.setDate(monday.getDate() - i * 7);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

async function loadMeasurables() {
  weeks = getLast13Weeks();

  const { data: mData } = await db.from('measurables').select('*').eq('active', true).order('sort_order');
  measurables = mData || [];

  if (measurables.length === 0) { renderScorecard(); return; }

  const ids = measurables.map(m => m.id);
  const oldest = weeks[0];
  const { data: sData } = await db.from('scores')
    .select('*')
    .in('measurable_id', ids)
    .gte('week_start', oldest);

  scores = {};
  (sData || []).forEach(s => {
    if (!scores[s.measurable_id]) scores[s.measurable_id] = {};
    scores[s.measurable_id][s.week_start] = s.value;
  });

  renderScorecard();
}

function renderScorecard() {
  const empty = document.getElementById('scorecardEmpty');
  const body  = document.getElementById('scorecardBody');
  const hRow  = document.getElementById('scorecardHeaderRow');

  // Remove old week headers
  hRow.querySelectorAll('.week-th').forEach(th => th.remove());
  body.innerHTML = '';

  if (measurables.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  // Build week header columns
  weeks.forEach((w, i) => {
    const th = document.createElement('th');
    th.className = 'sc-week-col week-th';
    const label = i === weeks.length - 1 ? 'This Week' : `W-${weeks.length - 1 - i}`;
    const dateStr = new Date(w + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    th.innerHTML = `<div class="week-header-label">${label}</div><div class="week-header-date">${dateStr}</div>`;
    hRow.appendChild(th);
  });

  // Actions column header
  const actTh = document.createElement('th');
  actTh.className = 'sc-actions-col';
  hRow.appendChild(actTh);

  // Rows
  measurables.forEach(m => {
    const tr = document.createElement('tr');
    const dirSymbol = m.goal_direction === 'gte' ? '≥' : '≤';
    tr.innerHTML = `
      <td class="sc-metric-col"><strong>${escHtml(m.metric_name)}</strong></td>
      <td class="sc-goal-col">${dirSymbol} ${m.goal_value ?? '—'}</td>
    `;

    weeks.forEach((w, i) => {
      const isCurrentWeek = i === weeks.length - 1;
      const val = scores[m.id]?.[w];
      const td = document.createElement('td');
      td.className = 'score-cell sc-week-col';

      if (isCurrentWeek) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'score-input';
        input.placeholder = '—';
        input.step = 'any';
        if (val !== undefined) input.value = val;
        input.addEventListener('change', () => saveScore(m, w, input.value));
        td.appendChild(input);
      } else {
        if (val !== undefined) {
          td.textContent = val;
          td.classList.add(scoreColor(val, m.goal_value, m.goal_direction));
        } else {
          td.textContent = '—';
          td.classList.add('score-cell--empty');
        }
      }
      tr.appendChild(td);
    });

    // Actions
    const actTd = document.createElement('td');
    actTd.className = 'sc-actions-col';
    actTd.innerHTML = `<div class="row-actions">
      <button class="btn btn--ghost btn--sm m-edit-btn">Edit</button>
      <button class="btn btn--danger btn--sm m-delete-btn">Del</button>
    </div>`;
    actTd.querySelector('.m-edit-btn').addEventListener('click', () => openMeasurableForm(m));
    actTd.querySelector('.m-delete-btn').addEventListener('click', () => deleteMeasurable(m.id));
    tr.appendChild(actTd);

    body.appendChild(tr);
  });
}

function scoreColor(val, goal, dir) {
  if (goal === null || goal === undefined) return '';
  const pct = val / goal;
  if (dir === 'gte') {
    if (pct >= 1)    return 'score-cell--green';
    if (pct >= 0.75) return 'score-cell--yellow';
    return 'score-cell--red';
  } else {
    if (pct <= 1)    return 'score-cell--green';
    if (pct <= 1.25) return 'score-cell--yellow';
    return 'score-cell--red';
  }
}

async function saveScore(measurable, weekStart, rawVal) {
  const value = parseFloat(rawVal);
  if (isNaN(value)) return;

  const existing = scores[measurable.id]?.[weekStart];
  if (existing !== undefined) {
    await db.from('scores').update({ value }).eq('measurable_id', measurable.id).eq('week_start', weekStart);
  } else {
    await db.from('scores').insert({ measurable_id: measurable.id, week_start: weekStart, value, entered_by: currentUser.id });
  }
  await loadMeasurables();
}

document.getElementById('addMeasurableBtn').addEventListener('click', () => openMeasurableForm(null));

function openMeasurableForm(m) {
  editingMeasurableId = m ? m.id : null;
  document.getElementById('measurableFormHeading').textContent = m ? 'Edit Metric' : 'New Metric';
  document.getElementById('measurableId').value = m?.id ?? '';
  document.getElementById('metricName').value   = m?.metric_name ?? '';
  document.getElementById('metricGoal').value   = m?.goal_value ?? '';
  document.getElementById('metricDir').value    = m?.goal_direction ?? 'gte';
  document.getElementById('measurableForm').hidden = false;
  document.getElementById('metricName').focus();
}

document.getElementById('cancelMeasurableBtn').addEventListener('click', () => {
  document.getElementById('measurableForm').hidden = true;
  editingMeasurableId = null;
});

document.getElementById('saveMeasurableBtn').addEventListener('click', async () => {
  const name = document.getElementById('metricName').value.trim();
  const goal = parseFloat(document.getElementById('metricGoal').value) || null;
  const dir  = document.getElementById('metricDir').value;
  if (!name) { alert('Metric name is required.'); return; }

  if (editingMeasurableId) {
    await db.from('measurables').update({ metric_name: name, goal_value: goal, goal_direction: dir }).eq('id', editingMeasurableId);
  } else {
    const maxOrder = measurables.reduce((m, x) => Math.max(m, x.sort_order || 0), 0);
    await db.from('measurables').insert({ metric_name: name, goal_value: goal, goal_direction: dir, owner_id: currentUser.id, sort_order: maxOrder + 1, active: true });
  }
  document.getElementById('measurableForm').hidden = true;
  editingMeasurableId = null;
  await loadMeasurables();
});

async function deleteMeasurable(id) {
  if (!confirm('Delete this metric and all its scores?')) return;
  await db.from('scores').delete().eq('measurable_id', id);
  await db.from('measurables').delete().eq('id', id);
  await loadMeasurables();
}

// =====================
// ISSUES
// =====================

let issues = [];
let editingIssueId = null;

async function loadIssues() {
  const { data, error } = await db.from('issues').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  issues = data || [];
  renderIssues();
}

function renderIssues() {
  const list  = document.getElementById('issuesList');
  const empty = document.getElementById('issuesEmpty');
  list.innerHTML = '';

  const filtered = currentFilter === 'all'
    ? issues
    : issues.filter(i => i.status === currentFilter);

  if (filtered.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  filtered.forEach(issue => {
    const card = document.createElement('div');
    card.className = 'issue-card';
    card.dataset.priority = issue.priority;
    card.dataset.id = issue.id;

    card.innerHTML = `
      <div class="issue-body">
        <div class="issue-title">${escHtml(issue.title)}</div>
        ${issue.description ? `<div class="issue-desc">${escHtml(issue.description)}</div>` : ''}
        <div class="issue-meta">
          <span class="status-pill status-pill--${issue.status}">${issue.status}</span>
          <span class="status-pill status-pill--${issue.priority}">${issue.priority} priority</span>
          <select class="issue-status-select" aria-label="Change status">
            <option value="open"       ${issue.status==='open'       ?'selected':''}>Open</option>
            <option value="discussing" ${issue.status==='discussing' ?'selected':''}>Discussing</option>
            <option value="solved"     ${issue.status==='solved'     ?'selected':''}>Solved</option>
          </select>
        </div>
      </div>
      <div class="issue-actions">
        <button class="btn btn--ghost btn--sm issue-edit-btn">Edit</button>
        <button class="btn btn--danger btn--sm issue-delete-btn">Delete</button>
      </div>
    `;

    card.querySelector('.issue-status-select').addEventListener('change', async (e) => {
      await db.from('issues').update({ status: e.target.value }).eq('id', issue.id);
      await loadIssues();
    });
    card.querySelector('.issue-edit-btn').addEventListener('click', () => openIssueForm(issue));
    card.querySelector('.issue-delete-btn').addEventListener('click', () => deleteIssue(issue.id));

    list.appendChild(card);
  });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    currentFilter = btn.dataset.filter;
    renderIssues();
  });
});

document.getElementById('addIssueBtn').addEventListener('click', () => openIssueForm(null));

function openIssueForm(issue) {
  editingIssueId = issue ? issue.id : null;
  document.getElementById('issueFormHeading').textContent = issue ? 'Edit Issue' : 'New Issue';
  document.getElementById('issueId').value       = issue?.id ?? '';
  document.getElementById('issueTitle').value    = issue?.title ?? '';
  document.getElementById('issuePriority').value = issue?.priority ?? 'normal';
  document.getElementById('issueDesc').value     = issue?.description ?? '';
  document.getElementById('issueForm').hidden    = false;
  document.getElementById('issueTitle').focus();
}

document.getElementById('cancelIssueBtn').addEventListener('click', () => {
  document.getElementById('issueForm').hidden = true;
  editingIssueId = null;
});

document.getElementById('saveIssueBtn').addEventListener('click', async () => {
  const title    = document.getElementById('issueTitle').value.trim();
  const priority = document.getElementById('issuePriority').value;
  const desc     = document.getElementById('issueDesc').value.trim() || null;
  if (!title) { alert('Issue title is required.'); return; }

  if (editingIssueId) {
    await db.from('issues').update({ title, priority, description: desc }).eq('id', editingIssueId);
  } else {
    await db.from('issues').insert({ title, priority, description: desc, status: 'open', created_by: currentUser.id });
  }
  document.getElementById('issueForm').hidden = true;
  editingIssueId = null;
  await loadIssues();
});

async function deleteIssue(id) {
  if (!confirm('Delete this issue?')) return;
  await db.from('issues').delete().eq('id', id);
  await loadIssues();
}

// =====================
// UTILS
// =====================

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =====================
// TO-DOS
// =====================

let todos = [];
let editingTodoId = null;
let todoFilter = 'open';

async function loadTodos() {
  const { data, error } = await db.from('todos').select('*').order('created_at', { ascending: true });
  if (error) { console.error(error); return; }
  todos = data || [];
  renderTodos();
}

function renderTodos() {
  const list  = document.getElementById('todosList');
  const empty = document.getElementById('todosEmpty');
  list.innerHTML = '';

  const filtered = todoFilter === 'all'   ? todos
    : todoFilter === 'done'  ? todos.filter(t => t.done)
    : todos.filter(t => !t.done);

  if (filtered.length === 0) { empty.hidden = false; return; }
  empty.hidden = true;

  filtered.forEach(todo => {
    const card = document.createElement('div');
    card.className = 'todo-card' + (todo.done ? ' done' : '');

    const dueStr = todo.due_date
      ? new Date(todo.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';

    card.innerHTML = `
      <button class="todo-check ${todo.done ? 'checked' : ''}" title="Toggle done" aria-label="Mark done">
        ${todo.done ? '✓' : ''}
      </button>
      <div class="todo-body">
        <div class="todo-title ${todo.done ? 'done' : ''}">${escHtml(todo.title)}</div>
        <div class="todo-meta">${escHtml(todo.owner_name || currentUser.email)}${dueStr ? ' · Due ' + dueStr : ''}</div>
      </div>
      <div class="todo-actions">
        <button class="btn btn--ghost btn--sm todo-edit-btn">Edit</button>
        <button class="btn btn--danger btn--sm todo-delete-btn">Delete</button>
      </div>
    `;

    card.querySelector('.todo-check').addEventListener('click', () => toggleTodoDone(todo));
    card.querySelector('.todo-edit-btn').addEventListener('click', () => openTodoForm(todo));
    card.querySelector('.todo-delete-btn').addEventListener('click', () => deleteTodo(todo.id));
    list.appendChild(card);
  });
}

async function toggleTodoDone(todo) {
  await db.from('todos').update({ done: !todo.done }).eq('id', todo.id);
  await loadTodos();
}

document.getElementById('addTodoBtn').addEventListener('click', () => openTodoForm(null));

function openTodoForm(todo) {
  editingTodoId = todo ? todo.id : null;
  document.getElementById('todoFormHeading').textContent = todo ? 'Edit To-Do' : 'New To-Do';
  document.getElementById('todoId').value    = todo?.id ?? '';
  document.getElementById('todoTitle').value = todo?.title ?? '';
  document.getElementById('todoDue').value   = todo?.due_date ?? '';
  document.getElementById('todoForm').hidden = false;
  document.getElementById('todoTitle').focus();
}

document.getElementById('cancelTodoBtn').addEventListener('click', () => {
  document.getElementById('todoForm').hidden = true;
  editingTodoId = null;
});

document.getElementById('saveTodoBtn').addEventListener('click', async () => {
  const title = document.getElementById('todoTitle').value.trim();
  const due   = document.getElementById('todoDue').value || null;
  if (!title) { alert('To-do title is required.'); return; }

  if (editingTodoId) {
    await db.from('todos').update({ title, due_date: due }).eq('id', editingTodoId);
  } else {
    await db.from('todos').insert({ title, due_date: due, owner_id: currentUser.id, owner_name: currentUser.email });
  }
  document.getElementById('todoForm').hidden = false;
  editingTodoId = null;
  document.getElementById('todoForm').hidden = true;
  await loadTodos();
});

async function deleteTodo(id) {
  if (!confirm('Delete this to-do?')) return;
  await db.from('todos').delete().eq('id', id);
  await loadTodos();
}

document.querySelectorAll('.todo-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.todo-filter-btn').forEach(b => b.classList.remove('todo-filter-btn--active', 'filter-btn--active'));
    btn.classList.add('todo-filter-btn--active', 'filter-btn--active');
    todoFilter = btn.dataset.filter;
    renderTodos();
  });
});

// =====================
// L10 MEETING RUNNER
// =====================

const L10_SEGMENTS = [
  { id: 'segue',      title: 'Segue',           alloc: 5,  desc: 'Share good news — personal or professional. One per person.' },
  { id: 'scorecard',  title: 'Scorecard',        alloc: 5,  desc: 'Review the weekly numbers. Any off-track metrics?' },
  { id: 'rocks',      title: 'Rock Review',      alloc: 5,  desc: 'Each rock owner: On Track or Off Track?' },
  { id: 'headlines',  title: 'Headlines',        alloc: 5,  desc: 'Customer and employee headlines — good news only.' },
  { id: 'todos',      title: 'To-Do List',       alloc: 5,  desc: 'Did we complete last week\'s to-dos? 90% done?' },
  { id: 'ids',        title: 'IDS',              alloc: 60, desc: 'Identify, Discuss, Solve. Work through the issues list.' },
  { id: 'conclude',   title: 'Conclude',         alloc: 5,  desc: 'Rate the meeting 1–10. Cascade messages.' },
];

let l10State = {
  active: false,
  segmentIdx: 0,
  timerSecs: 0,
  timerInterval: null,
  timerRunning: false,
  meetingRating: null,
  segueEntries: [],
  headlines: [],
  cascadeText: '',
};

async function loadMeetingLogs() {
  const { data } = await db.from('meeting_logs')
    .select('*')
    .order('meeting_date', { ascending: false })
    .limit(5);

  const container = document.getElementById('l10PrevMeetings');
  if (!data || data.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;font-style:italic;">No previous meetings yet.</p>';
    return;
  }

  container.innerHTML = '<p class="l10-section-label" style="margin-bottom:0.75rem;">Recent Meetings</p>' +
    data.map(m => {
      const d = new Date(m.meeting_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      return `<div class="l10-prev-meeting-item">
        <span>${d}</span>
        ${m.rating ? `<span class="l10-rating-badge">${m.rating}/10</span>` : '<span style="color:#aaa;font-size:0.8rem;">No rating</span>'}
      </div>`;
    }).join('');
}

document.getElementById('startL10Btn').addEventListener('click', () => {
  l10State = {
    active: true,
    segmentIdx: 0,
    timerSecs: L10_SEGMENTS[0].alloc * 60,
    timerInterval: null,
    timerRunning: true,
    meetingRating: null,
    segueEntries: [],
    headlines: [],
    cascadeText: '',
  };
  document.getElementById('l10Start').hidden  = true;
  document.getElementById('l10Runner').hidden = false;
  renderL10Segment();
  startL10Timer();
});

function renderL10Segment() {
  const seg = L10_SEGMENTS[l10State.segmentIdx];
  const total = L10_SEGMENTS.length;

  document.getElementById('l10SegmentNum').textContent   = `${l10State.segmentIdx + 1} / ${total}`;
  document.getElementById('l10SegmentTitle').textContent = seg.title;
  document.getElementById('l10SegmentAlloc').textContent = `${seg.alloc} min`;
  document.getElementById('l10ProgressFill').style.width = `${((l10State.segmentIdx) / total) * 100}%`;

  document.getElementById('l10PrevBtn').disabled = l10State.segmentIdx === 0;
  document.getElementById('l10NextBtn').textContent = l10State.segmentIdx === total - 1 ? 'Finish Meeting' : 'Next →';

  renderL10SegmentBody(seg);
}

function renderL10SegmentBody(seg) {
  const body = document.getElementById('l10SegmentBody');
  body.innerHTML = `<p style="font-size:0.88rem;color:var(--text-muted);font-style:italic;margin-bottom:1.25rem;">${seg.desc}</p>`;

  if (seg.id === 'segue') {
    renderSegueSegment(body);
  } else if (seg.id === 'scorecard') {
    renderScorecardSegment(body);
  } else if (seg.id === 'rocks') {
    renderRocksSegment(body);
  } else if (seg.id === 'headlines') {
    renderHeadlinesSegment(body);
  } else if (seg.id === 'todos') {
    renderTodosSegment(body);
  } else if (seg.id === 'ids') {
    renderIDSSegment(body);
  } else if (seg.id === 'conclude') {
    renderConcludeSegment(body);
  }
}

function renderSegueSegment(body) {
  const wrap = document.createElement('div');
  wrap.className = 'l10-segue-list';

  // Show existing entries
  l10State.segueEntries.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'l10-segue-item';
    row.innerHTML = `<span style="font-size:0.8rem;color:var(--text-muted);width:20px;">${i+1}.</span>
      <input type="text" value="${escHtml(entry)}" placeholder="Share something good…">`;
    row.querySelector('input').addEventListener('change', e => { l10State.segueEntries[i] = e.target.value; });
    wrap.appendChild(row);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'l10-add-row-btn';
  addBtn.textContent = '+ Add person';
  addBtn.addEventListener('click', () => {
    l10State.segueEntries.push('');
    renderL10SegmentBody(L10_SEGMENTS[l10State.segmentIdx]);
  });

  body.appendChild(wrap);
  body.appendChild(addBtn);
}

function renderScorecardSegment(body) {
  if (measurables.length === 0) {
    body.innerHTML += '<p style="color:var(--text-muted);font-style:italic;">No scorecard metrics yet.</p>';
    return;
  }
  const currentWeek = weeks[weeks.length - 1];
  const table = document.createElement('table');
  table.className = 'l10-sc-mini';
  table.innerHTML = `<thead><tr><th>Metric</th><th>Goal</th><th>This Week</th><th>Status</th></tr></thead>`;
  const tb = document.createElement('tbody');

  measurables.forEach(m => {
    const val = scores[m.id]?.[currentWeek];
    const dirSymbol = m.goal_direction === 'gte' ? '≥' : '≤';
    let statusHtml = '<span style="color:#aaa;">—</span>';
    if (val !== undefined) {
      const color = scoreColor(val, m.goal_value, m.goal_direction);
      const label = color === 'score-cell--green' ? '🟢' : color === 'score-cell--yellow' ? '🟡' : '🔴';
      statusHtml = label;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escHtml(m.metric_name)}</td><td>${dirSymbol} ${m.goal_value ?? '—'}</td><td>${val ?? '—'}</td><td>${statusHtml}</td>`;
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  body.appendChild(table);
}

function renderRocksSegment(body) {
  const activeRocks = rocks.filter(r => r.status !== 'complete');
  if (activeRocks.length === 0) {
    body.innerHTML += '<p style="color:var(--text-muted);font-style:italic;">No active rocks.</p>';
    return;
  }
  const list = document.createElement('div');
  activeRocks.forEach(rock => {
    const row = document.createElement('div');
    row.className = 'l10-rock-row';
    row.innerHTML = `
      <div class="l10-rock-name">
        ${escHtml(rock.title)}
        <div class="l10-rock-owner">${escHtml(rock.owner_name || '')}</div>
      </div>
      <div class="l10-status-toggle">
        <button class="${rock.status === 'on_track' ? 'active-on' : ''}" data-status="on_track">On Track</button>
        <button class="${rock.status === 'off_track' ? 'active-off' : ''}" data-status="off_track">Off Track</button>
      </div>
    `;
    row.querySelectorAll('.l10-status-toggle button').forEach(btn => {
      btn.addEventListener('click', async () => {
        await db.from('rocks').update({ status: btn.dataset.status }).eq('id', rock.id);
        await loadRocks();
        renderL10SegmentBody(L10_SEGMENTS[l10State.segmentIdx]);
      });
    });
    list.appendChild(row);
  });
  body.appendChild(list);
}

function renderHeadlinesSegment(body) {
  const wrap = document.createElement('div');
  wrap.className = 'l10-headlines';

  l10State.headlines.forEach((h, i) => {
    const row = document.createElement('div');
    row.className = 'l10-headline-input';
    row.innerHTML = `<input type="text" value="${escHtml(h)}" placeholder="Headline…">`;
    row.querySelector('input').addEventListener('change', e => { l10State.headlines[i] = e.target.value; });
    wrap.appendChild(row);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'l10-add-row-btn';
  addBtn.textContent = '+ Add headline';
  addBtn.addEventListener('click', () => {
    l10State.headlines.push('');
    renderL10SegmentBody(L10_SEGMENTS[l10State.segmentIdx]);
  });

  body.appendChild(wrap);
  body.appendChild(addBtn);
}

function renderTodosSegment(body) {
  const openTodos = todos.filter(t => !t.done);
  if (openTodos.length === 0) {
    body.innerHTML += '<p style="color:#27ae60;font-weight:600;">✓ All to-dos complete! Great week.</p>';
    return;
  }
  const list = document.createElement('div');
  list.className = 'l10-todo-review';
  openTodos.forEach(todo => {
    const row = document.createElement('div');
    row.className = 'l10-todo-row';
    row.innerHTML = `
      <button class="todo-check" title="Mark done">⬜</button>
      <div class="todo-body">
        <div class="todo-title">${escHtml(todo.title)}</div>
        <div class="todo-meta">${escHtml(todo.owner_name || '')}</div>
      </div>
    `;
    row.querySelector('.todo-check').addEventListener('click', async (e) => {
      await db.from('todos').update({ done: true }).eq('id', todo.id);
      await loadTodos();
      renderL10SegmentBody(L10_SEGMENTS[l10State.segmentIdx]);
    });
    list.appendChild(row);
  });
  const pct = Math.round(((todos.length - openTodos.length) / todos.length) * 100);
  body.innerHTML += `<p style="margin-bottom:1rem;font-weight:600;color:${pct >= 90 ? '#27ae60' : '#e74c3c'};">${pct}% complete (${todos.length - openTodos.length}/${todos.length})</p>`;
  body.appendChild(list);
}

function renderIDSSegment(body) {
  const openIssues = issues.filter(i => i.status !== 'solved');
  if (openIssues.length === 0) {
    body.innerHTML += '<p style="color:#27ae60;font-weight:600;">✓ Issues list is clear.</p>';
    return;
  }
  const list = document.createElement('div');
  openIssues.forEach(issue => {
    const row = document.createElement('div');
    row.className = 'l10-issue-row' + (issue.status === 'discussing' ? ' solving' : '');
    row.innerHTML = `
      <div style="flex:1;">
        <div class="l10-issue-title">${escHtml(issue.title)}</div>
        ${issue.description ? `<div style="font-size:0.82rem;color:var(--text-muted);margin-top:0.2rem;font-style:italic;">${escHtml(issue.description)}</div>` : ''}
      </div>
      <select class="l10-issue-status-sel">
        <option value="open"       ${issue.status==='open'       ?'selected':''}>Open</option>
        <option value="discussing" ${issue.status==='discussing' ?'selected':''}>Discussing</option>
        <option value="solved"     ${issue.status==='solved'     ?'selected':''}>Solved</option>
      </select>
    `;
    row.querySelector('select').addEventListener('change', async (e) => {
      await db.from('issues').update({ status: e.target.value }).eq('id', issue.id);
      await loadIssues();
      renderL10SegmentBody(L10_SEGMENTS[l10State.segmentIdx]);
    });
    list.appendChild(row);
  });
  body.appendChild(list);
}

function renderConcludeSegment(body) {
  const div = document.createElement('div');
  div.className = 'l10-conclude';
  div.innerHTML = `
    <p class="l10-rating-prompt">How would you rate this meeting?</p>
    <div class="l10-rating-stars">
      ${[1,2,3,4,5,6,7,8,9,10].map(n =>
        `<button class="l10-rating-btn ${l10State.meetingRating === n ? 'selected' : ''}" data-val="${n}">${n}</button>`
      ).join('')}
    </div>
    <p class="l10-cascade-label">Cascading messages — what needs to be communicated to others?</p>
    <textarea class="l10-cascade-input" placeholder="Messages to share with the rest of the team or outside the room…">${l10State.cascadeText}</textarea>
  `;
  div.querySelectorAll('.l10-rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      l10State.meetingRating = parseInt(btn.dataset.val);
      div.querySelectorAll('.l10-rating-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  div.querySelector('.l10-cascade-input').addEventListener('input', e => {
    l10State.cascadeText = e.target.value;
  });
  body.appendChild(div);
}

// Timer
function startL10Timer() {
  clearInterval(l10State.timerInterval);
  l10State.timerRunning = true;
  document.getElementById('l10TimerToggle').textContent = 'Pause';
  l10State.timerInterval = setInterval(() => {
    l10State.timerSecs--;
    updateTimerDisplay();
  }, 1000);
}

function pauseL10Timer() {
  clearInterval(l10State.timerInterval);
  l10State.timerRunning = false;
  document.getElementById('l10TimerToggle').textContent = 'Resume';
}

function updateTimerDisplay() {
  const el = document.getElementById('l10Timer');
  const abs = Math.abs(l10State.timerSecs);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  el.textContent = (l10State.timerSecs < 0 ? '-' : '') + m + ':' + String(s).padStart(2, '0');
  el.classList.toggle('overtime', l10State.timerSecs < 0);
}

document.getElementById('l10TimerToggle').addEventListener('click', () => {
  if (l10State.timerRunning) pauseL10Timer(); else startL10Timer();
});

document.getElementById('l10TimerReset').addEventListener('click', () => {
  const seg = L10_SEGMENTS[l10State.segmentIdx];
  l10State.timerSecs = seg.alloc * 60;
  updateTimerDisplay();
  if (l10State.timerRunning) { clearInterval(l10State.timerInterval); startL10Timer(); }
});

document.getElementById('l10NextBtn').addEventListener('click', async () => {
  const isLast = l10State.segmentIdx === L10_SEGMENTS.length - 1;
  if (isLast) {
    await finishL10();
    return;
  }
  l10State.segmentIdx++;
  const seg = L10_SEGMENTS[l10State.segmentIdx];
  l10State.timerSecs = seg.alloc * 60;
  clearInterval(l10State.timerInterval);
  startL10Timer();
  renderL10Segment();
});

document.getElementById('l10PrevBtn').addEventListener('click', () => {
  if (l10State.segmentIdx === 0) return;
  l10State.segmentIdx--;
  const seg = L10_SEGMENTS[l10State.segmentIdx];
  l10State.timerSecs = seg.alloc * 60;
  clearInterval(l10State.timerInterval);
  startL10Timer();
  renderL10Segment();
});

async function finishL10() {
  clearInterval(l10State.timerInterval);

  await db.from('meeting_logs').insert({
    meeting_date: new Date().toISOString().slice(0, 10),
    rating: l10State.meetingRating,
    segue_notes: JSON.stringify(l10State.segueEntries.filter(Boolean)),
    headlines: JSON.stringify(l10State.headlines.filter(Boolean)),
    cascading_messages: l10State.cascadeText || null,
    created_by: currentUser.id,
  });

  // Reset
  document.getElementById('l10Runner').hidden = true;
  document.getElementById('l10Start').hidden  = false;
  l10State.active = false;
  await loadMeetingLogs();
  alert(`Meeting complete! ${l10State.meetingRating ? 'Rated ' + l10State.meetingRating + '/10.' : ''} Great work.`);
}

// Reload data when switching tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    if (btn.dataset.tab === 'dashboard')      loadDashboard();
    if (btn.dataset.tab === 'vto')            await loadVto();
    if (btn.dataset.tab === 'accountability') await loadAccountability();
    if (btn.dataset.tab === 'todos')          await loadTodos();
    if (btn.dataset.tab === 'meetings')       await loadMeetingLogs();
  });
});

// =====================
// DASHBOARD
// =====================

function loadDashboard() {
  const grid = document.getElementById('dashboardGrid');
  grid.innerHTML = '';

  // Rocks card
  const onTrack  = rocks.filter(r => r.status === 'on_track').length;
  const offTrack = rocks.filter(r => r.status === 'off_track').length;
  const complete = rocks.filter(r => r.status === 'complete').length;
  grid.appendChild(dashCard('🪨', 'Rocks', `
    <div class="dash-stat"><span class="dash-num green">${onTrack}</span> on track</div>
    <div class="dash-stat"><span class="dash-num red">${offTrack}</span> off track</div>
    <div class="dash-stat"><span class="dash-num muted">${complete}</span> complete</div>
  `, 'rocks'));

  // Issues card
  const openIssues = issues.filter(i => i.status === 'open').length;
  const discussing = issues.filter(i => i.status === 'discussing').length;
  grid.appendChild(dashCard('⚡', 'Issues', `
    <div class="dash-stat"><span class="dash-num ${openIssues > 0 ? 'red' : 'green'}">${openIssues}</span> open</div>
    <div class="dash-stat"><span class="dash-num yellow">${discussing}</span> discussing</div>
    <div class="dash-stat"><span class="dash-num muted">${issues.filter(i => i.status === 'solved').length}</span> solved</div>
  `, 'issues'));

  // To-Dos card
  const openTodos = todos.filter(t => !t.done).length;
  const doneTodos = todos.filter(t => t.done).length;
  const pct = todos.length ? Math.round((doneTodos / todos.length) * 100) : 0;
  grid.appendChild(dashCard('✅', 'To-Dos', `
    <div class="dash-stat"><span class="dash-num ${openTodos > 0 ? 'red' : 'green'}">${openTodos}</span> open</div>
    <div class="dash-stat"><span class="dash-num green">${doneTodos}</span> done</div>
    <div class="dash-stat dash-pct">${pct}% complete</div>
  `, 'todos'));

  // Scorecard card
  const currentWeek = weeks.length ? weeks[weeks.length - 1] : null;
  let greenCount = 0, redCount = 0;
  if (currentWeek) {
    measurables.forEach(m => {
      const val = scores[m.id]?.[currentWeek];
      if (val !== undefined) {
        const color = scoreColor(val, m.goal_value, m.goal_direction);
        if (color === 'score-cell--green') greenCount++;
        else redCount++;
      }
    });
  }
  grid.appendChild(dashCard('📊', 'Scorecard', `
    <div class="dash-stat"><span class="dash-num green">${greenCount}</span> on target</div>
    <div class="dash-stat"><span class="dash-num red">${redCount}</span> off target</div>
    <div class="dash-stat"><span class="dash-num muted">${measurables.length}</span> metrics</div>
  `, 'scorecard'));
}

function dashCard(icon, title, bodyHtml, tabTarget) {
  const card = document.createElement('div');
  card.className = 'dash-card';
  card.innerHTML = `
    <div class="dash-card-header">
      <span class="dash-icon">${icon}</span>
      <span class="dash-title">${title}</span>
    </div>
    <div class="dash-body">${bodyHtml}</div>
  `;
  card.addEventListener('click', () => {
    document.querySelector(`.tab-btn[data-tab="${tabTarget}"]`)?.click();
  });
  return card;
}

// =====================
// V/TO
// =====================

let vtoData = {};
let coreValues = [];
let mktgUniques = [];

async function loadVto() {
  const { data, error } = await db.from('vto').select('*').eq('id', 1).single();
  if (error && error.code !== 'PGRST116') { console.error(error); return; }
  vtoData = data || {};

  coreValues  = JSON.parse(vtoData.core_values  || '[]');
  mktgUniques = JSON.parse(vtoData.mktg_uniques || '[]');

  document.getElementById('vtoCoreFocusPurpose').value  = vtoData.core_focus_purpose  || '';
  document.getElementById('vtoCoreFocusNiche').value    = vtoData.core_focus_niche    || '';
  document.getElementById('vtoTenYear').value           = vtoData.ten_year_target     || '';
  document.getElementById('vtoMktgTarget').value        = vtoData.mktg_target_market  || '';
  document.getElementById('vtoMktgProcess').value       = vtoData.mktg_proven_process || '';
  document.getElementById('vtoMktgGuarantee').value     = vtoData.mktg_guarantee      || '';
  document.getElementById('vtoThreeYear').value         = vtoData.three_year_picture  || '';
  document.getElementById('vtoOneYear').value           = vtoData.one_year_plan       || '';

  renderCoreValues();
  renderMktgUniques();
  renderVtoRocks();
  renderVtoIssues();
}

function renderCoreValues() {
  const list = document.getElementById('coreValuesList');
  list.innerHTML = '';
  coreValues.forEach((val, i) => {
    const row = document.createElement('div');
    row.className = 'vto-list-row';
    row.innerHTML = `
      <input type="text" value="${escHtml(val)}" placeholder="Core value…">
      <button class="vto-remove-btn" title="Remove">✕</button>
    `;
    row.querySelector('input').addEventListener('change', e => { coreValues[i] = e.target.value; });
    row.querySelector('.vto-remove-btn').addEventListener('click', () => {
      coreValues.splice(i, 1);
      renderCoreValues();
    });
    list.appendChild(row);
  });
}

function renderMktgUniques() {
  const list = document.getElementById('vtoUniquesList');
  list.innerHTML = '';
  mktgUniques.forEach((val, i) => {
    const row = document.createElement('div');
    row.className = 'vto-list-row';
    row.innerHTML = `
      <input type="text" value="${escHtml(val)}" placeholder="Unique differentiator…">
      <button class="vto-remove-btn" title="Remove">✕</button>
    `;
    row.querySelector('input').addEventListener('change', e => { mktgUniques[i] = e.target.value; });
    row.querySelector('.vto-remove-btn').addEventListener('click', () => {
      mktgUniques.splice(i, 1);
      renderMktgUniques();
    });
    list.appendChild(row);
  });
}

function renderVtoRocks() {
  const list = document.getElementById('vtoRocksList');
  const active = rocks.filter(r => r.status !== 'complete');
  if (active.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;font-style:italic;">No active rocks.</p>';
    return;
  }
  list.innerHTML = active.map(r => {
    const dot = r.status === 'on_track' ? '🟢' : '🔴';
    return `<div class="vto-rock-item">${dot} ${escHtml(r.title)} <span style="color:var(--text-muted);font-size:0.8rem;">— ${escHtml(r.owner_name || '')}</span></div>`;
  }).join('');
}

function renderVtoIssues() {
  const list = document.getElementById('vtoIssuesList');
  const open = issues.filter(i => i.status !== 'solved');
  if (open.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;font-style:italic;">Issues list is clear.</p>';
    return;
  }
  list.innerHTML = open.slice(0, 5).map(i =>
    `<div class="vto-issue-item">${i.priority === 'high' ? '🔴' : '⚡'} ${escHtml(i.title)}</div>`
  ).join('') + (open.length > 5 ? `<div style="color:var(--text-muted);font-size:0.8rem;margin-top:0.4rem;">+${open.length - 5} more</div>` : '');
}

document.getElementById('addCoreValueBtn').addEventListener('click', () => {
  coreValues.push('');
  renderCoreValues();
});

document.getElementById('addUniqueBtn').addEventListener('click', () => {
  mktgUniques.push('');
  renderMktgUniques();
});

document.getElementById('saveVtoBtn').addEventListener('click', async () => {
  const payload = {
    core_values:          JSON.stringify(coreValues.filter(Boolean)),
    core_focus_purpose:   document.getElementById('vtoCoreFocusPurpose').value.trim(),
    core_focus_niche:     document.getElementById('vtoCoreFocusNiche').value.trim(),
    ten_year_target:      document.getElementById('vtoTenYear').value.trim(),
    mktg_target_market:   document.getElementById('vtoMktgTarget').value.trim(),
    mktg_uniques:         JSON.stringify(mktgUniques.filter(Boolean)),
    mktg_proven_process:  document.getElementById('vtoMktgProcess').value.trim(),
    mktg_guarantee:       document.getElementById('vtoMktgGuarantee').value.trim(),
    three_year_picture:   document.getElementById('vtoThreeYear').value.trim(),
    one_year_plan:        document.getElementById('vtoOneYear').value.trim(),
    updated_by:           currentUser.id,
    updated_at:           new Date().toISOString(),
  };
  const { error } = await db.from('vto').update(payload).eq('id', 1);
  if (error) { alert('Save failed: ' + error.message); return; }
  alert('V/TO saved.');
});

// =====================
// ACCOUNTABILITY CHART
// =====================

let accountabilityNodes = [];
let editingNodeId = null;

async function loadAccountability() {
  const { data, error } = await db.from('accountability_nodes').select('*').order('sort_order').order('created_at');
  if (error) { console.error(error); return; }
  accountabilityNodes = data || [];
  renderAccountabilityChart();
}

function renderAccountabilityChart() {
  const container = document.getElementById('accountabilityChart');
  const empty     = document.getElementById('accountabilityEmpty');
  container.querySelectorAll('.ac-node-wrap').forEach(n => n.remove());

  if (accountabilityNodes.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const roots = accountabilityNodes.filter(n => !n.parent_id);
  roots.forEach(root => container.appendChild(renderNode(root, 0)));
}

function renderNode(node, depth) {
  const children = accountabilityNodes.filter(n => n.parent_id === node.id);
  const wrap = document.createElement('div');
  wrap.className = 'ac-node-wrap';

  const card = document.createElement('div');
  card.className = 'ac-node-card';
  if (depth > 0) card.classList.add('ac-node-card--child');
  card.innerHTML = `
    <div class="ac-node-body">
      <div class="ac-role">${escHtml(node.role_name)}</div>
      <div class="ac-person">${node.person_name ? escHtml(node.person_name) : '<span style="color:#aaa;font-style:italic;">Unfilled</span>'}</div>
    </div>
    <div class="ac-node-actions">
      <button class="btn btn--ghost btn--sm ac-add-child-btn">+ Report</button>
      <button class="btn btn--ghost btn--sm ac-edit-btn">Edit</button>
      <button class="btn btn--danger btn--sm ac-delete-btn">Del</button>
    </div>
  `;

  card.querySelector('.ac-add-child-btn').addEventListener('click', () => openNodeForm(null, node.id));
  card.querySelector('.ac-edit-btn').addEventListener('click', () => openNodeForm(node, node.parent_id));
  card.querySelector('.ac-delete-btn').addEventListener('click', () => deleteNode(node.id));
  wrap.appendChild(card);

  if (children.length > 0) {
    const childrenWrap = document.createElement('div');
    childrenWrap.className = 'ac-children';
    children.forEach(child => childrenWrap.appendChild(renderNode(child, depth + 1)));
    wrap.appendChild(childrenWrap);
  }

  return wrap;
}

document.getElementById('addRootNodeBtn').addEventListener('click', () => openNodeForm(null, null));

function openNodeForm(node, parentId) {
  editingNodeId = node ? node.id : null;
  document.getElementById('nodeFormHeading').textContent = node ? 'Edit Role' : 'New Role';
  document.getElementById('nodeId').value       = node?.id ?? '';
  document.getElementById('nodeParentId').value = parentId ?? '';
  document.getElementById('nodeRole').value     = node?.role_name ?? '';
  document.getElementById('nodePerson').value   = node?.person_name ?? '';
  document.getElementById('nodeForm').hidden    = false;
  document.getElementById('nodeRole').focus();
}

document.getElementById('cancelNodeBtn').addEventListener('click', () => {
  document.getElementById('nodeForm').hidden = true;
  editingNodeId = null;
});

document.getElementById('saveNodeBtn').addEventListener('click', async () => {
  const role     = document.getElementById('nodeRole').value.trim();
  const person   = document.getElementById('nodePerson').value.trim() || null;
  const parentId = document.getElementById('nodeParentId').value || null;
  if (!role) { alert('Role name is required.'); return; }

  if (editingNodeId) {
    await db.from('accountability_nodes').update({ role_name: role, person_name: person }).eq('id', editingNodeId);
  } else {
    const siblings = accountabilityNodes.filter(n => n.parent_id === parentId);
    const maxOrder = siblings.reduce((m, n) => Math.max(m, n.sort_order || 0), 0);
    await db.from('accountability_nodes').insert({ role_name: role, person_name: person, parent_id: parentId, sort_order: maxOrder + 1 });
  }
  document.getElementById('nodeForm').hidden = true;
  editingNodeId = null;
  await loadAccountability();
});

async function deleteNode(id) {
  if (!confirm('Delete this role? Direct reports will become top-level roles.')) return;
  await db.from('accountability_nodes').delete().eq('id', id);
  await loadAccountability();
}

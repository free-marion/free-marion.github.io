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
    await Promise.all([loadRocks(), loadMeasurables(), loadIssues()]);
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

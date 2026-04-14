let tasks = [];
let sessions = 0;
let attendanceList = [];
let notes = [];
let profile = { username: '' };

let timerInterval = null;
let phaseTimeout = null;
let endTime = null;
let focusDuration = parseInt(localStorage.getItem('focusDuration'), 10) || 25 * 60;
let breakDuration = parseInt(localStorage.getItem('breakDuration'), 10) || 5 * 60;
let onBreak = false;
let totalSeconds = focusDuration;
let fullTime = focusDuration;
const radius = 120;
const circumference = 2 * Math.PI * radius;

function loadData() {
  try {
    const t = localStorage.getItem('tasks');
    tasks = t ? JSON.parse(t) : [];

    const s = localStorage.getItem('sessions');
    sessions = s ? parseInt(s, 10) : 0;

    const a = localStorage.getItem('attendance');
    attendanceList = a ? JSON.parse(a) : [];

    const n = localStorage.getItem('notes');
    notes = n ? JSON.parse(n) : [];

    const p = localStorage.getItem('profile');
    profile = p ? JSON.parse(p) : { username: '' };

    focusDuration = parseInt(localStorage.getItem('focusDuration'), 10) || 25 * 60;
    breakDuration = parseInt(localStorage.getItem('breakDuration'), 10) || 5 * 60;
    onBreak = false;
    totalSeconds = focusDuration;
    fullTime = focusDuration;

    const theme = localStorage.getItem('theme') || 'light';
    applyTheme(theme);
  } catch (err) {
    tasks = [];
    sessions = 0;
    attendanceList = [];
    notes = [];
    profile = { username: '' };
    focusDuration = 25 * 60;
    breakDuration = 5 * 60;
    onBreak = false;
    totalSeconds = focusDuration;
    fullTime = focusDuration;
    applyTheme('light');
  }
}

function saveData() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('sessions', String(sessions));
  localStorage.setItem('attendance', JSON.stringify(attendanceList));
  localStorage.setItem('notes', JSON.stringify(notes));
  localStorage.setItem('profile', JSON.stringify(profile));
  localStorage.setItem('focusDuration', String(focusDuration));
  localStorage.setItem('breakDuration', String(breakDuration));
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  const settingsThemeToggle = document.getElementById('settings-theme-toggle');
  if (settingsThemeToggle) {
    settingsThemeToggle.checked = theme === 'dark';
  }
}

const routes = {
  '#/dashboard': renderDashboard,
  '#/tasks': renderTasks,
  '#/timer': renderTimer,
  '#/attendance': renderAttendance,
  '#/notes': renderNotes,
  '#/settings': renderSettings
};

function handleRoute() {
  const hash = window.location.hash || '#/dashboard';
  const pageFunc = routes[hash] || renderNotFound;
  pageFunc();
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', () => {
  loadData();
  setupOnboarding();
});

function clearContent() {
  document.getElementById('content').innerHTML = '';
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function setupOnboarding() {
  const onboarding = document.getElementById('onboarding-screen');
  const appShell = document.getElementById('app-shell');
  const usernameInput = document.getElementById('username-input');
  const policyCheck = document.getElementById('policy-check');
  const createBtn = document.getElementById('create-account-btn');
  const goToImportBtn = document.getElementById('go-to-import-btn');
  const importSection = document.getElementById('import-section');
  const importBtn = document.getElementById('import-data-onboarding-btn');
  const importFile = document.getElementById('onboarding-import-file');

  goToImportBtn.addEventListener('click', () => {
    importSection.classList.remove('hidden');
  });

  importBtn.addEventListener('click', () => {
  importFile.click();
  });

  importFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);

      profile = data.profile || { username: '' };
      tasks = Array.isArray(data.tasks) ? data.tasks : [];
      sessions = Number.isFinite(data.sessions) ? data.sessions : 0;
      attendanceList = Array.isArray(data.attendanceList) ? data.attendanceList : [];
      notes = Array.isArray(data.notes) ? data.notes : [];

      if (Number.isFinite(data.focusDuration)) {
        focusDuration = data.focusDuration;
      }

      if (Number.isFinite(data.breakDuration)) {
        breakDuration = data.breakDuration;
      }

      if (data.theme === 'dark' || data.theme === 'light') {
        applyTheme(data.theme);
      }

      saveData();

      document.body.classList.remove('logged-out');
      onboarding.classList.add('hidden');
      appShell.classList.remove('hidden');
      window.location.hash = '#/dashboard';
      handleRoute();

    } catch (err) {
      alert('Invalid backup file.');
    }
  };

  reader.readAsText(file);
  });



  if (profile.username) {
    document.body.classList.remove('logged-out');
    onboarding.classList.add('hidden');
    appShell.classList.remove('hidden');
    handleRoute();
    return;
  }

  document.body.classList.add('logged-out');
  onboarding.classList.remove('hidden');
  appShell.classList.add('hidden');

  function refreshButtonState() {
    createBtn.disabled = !(usernameInput.value.trim() && policyCheck.checked);
  }

  usernameInput.addEventListener('input', refreshButtonState);
  policyCheck.addEventListener('change', refreshButtonState);

  createBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (!username || !policyCheck.checked) return;

    profile.username = username;
    saveData();

    document.body.classList.remove('logged-out');
    onboarding.classList.add('hidden');
    appShell.classList.remove('hidden');
    window.location.hash = '#/dashboard';
    handleRoute();
  });
}

function renderDashboard() {
  clearContent();
  const content = document.getElementById('content');

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed);
  pending.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const upcoming = pending.slice(0, 3);
  const progressPercent = totalTasks ? ((doneTasks / totalTasks) * 100).toFixed(0) : 0;

  const html = `
    <div class="dashboard-grid">

      <div class="welcome-banner">
        <div>
          <h1>${getGreeting()}, ${profile.username || 'Student'}</h1>
          <p>Here is your productivity snapshot for today.</p>
        </div>
        <div class="banner-chip">Stay focused, stay consistent</div>
      </div>

      <div class="card stat-card">
        <h3>📋 Tasks</h3>
        <div class="big">${totalTasks}</div>
        <span>${doneTasks} completed</span>
      </div>

      <div class="card stat-card">
        <h3>⏱ Sessions</h3>
        <div class="big">${sessions}</div>
        <span>Focus sessions done</span>
      </div>

      <div class="card stat-card">
        <h3>📊 Progress</h3>
        <div class="big">${progressPercent}%</div>
        <progress value="${doneTasks}" max="${totalTasks || 1}"></progress>
      </div>

      <div class="card wide-card">
        <h2>📅 Upcoming Deadlines</h2>
        ${
          upcoming.length
            ? `<ul class="styled-list">
                ${upcoming
                  .map(t => `<li><span>${t.title}</span><span>${t.deadline}</span></li>`)
                  .join('')}
              </ul>`
            : `<p>No upcoming tasks 🎉</p>`
        }
      </div>

      <div class="card wide-card">
        <h2>🎓 Attendance</h2>
        ${
          attendanceList.length
            ? attendanceList.map(sub => {
                const pct = sub.totalClasses
                  ? ((sub.attended / sub.totalClasses) * 100).toFixed(1)
                  : 0;
                const low = pct < 75;
                return `
                  <div class="attendance-row">
                    <span>${sub.name}</span>
                    <span class="${low ? 'overdue' : ''}">${pct}%</span>
                  </div>
                `;
              }).join('')
            : `<p>No data yet</p>`
        }
      </div>

            <div class="card wide-card">
        <h2>💡 Smart Suggestions</h2>
        <ul class="styled-list">
          ${
            tasks.filter(t => !t.completed && new Date(t.deadline) < new Date()).length > 0
              ? `<li>⚠ You have overdue tasks. Try completing them first.</li>`
              : ''
          }

          ${
            tasks.filter(t => !t.completed).length > 5
              ? `<li>📋 You have many pending tasks. Consider focusing on top priorities.</li>`
              : ''
          }

          ${
            attendanceList.some(sub => {
              const pct = sub.totalClasses
                ? (sub.attended / sub.totalClasses) * 100
                : 100;
              return pct < 75;
            })
              ? `<li>🎓 Your attendance is low in some subjects.</li>`
              : ''
          }

          ${
            sessions === 0
              ? `<li>⏱ Start your first focus session today!</li>`
              : ''
          }

          ${
            tasks.length === 0
              ? `<li>✨ Add tasks to start tracking your productivity.</li>`
              : ''
          }
        </ul>
      </div>

    </div>
  `;

  content.insertAdjacentHTML('beforeend', html);
}


function renderTasks() {
  clearContent();
  const content = document.getElementById('content');

  const priorityOrder = {
    High: 1,
    Normal: 2,
    Low: 3
  };

  tasks.sort((a, b) => {
    const dateDiff = new Date(a.deadline) - new Date(b.deadline);

    if (dateDiff !== 0) return dateDiff;

    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const html = `
    <div class="card">
      <h2>Add New Task</h2>
      <form id="task-form">
        <input type="text" id="task-title" placeholder="Title" required><br>
        <label for="task-deadline">Deadline</label><br>
        <input type="date" id="task-deadline" required><br>
        <label for="task-priority">Priority</label><br>
        <select id="task-priority">
          <option>Low</option>
          <option>Normal</option>
          <option>High</option>
        </select><br>
        <button type="submit" class="btn">Add Task</button>
      </form>
    </div>

    <div class="card">
      <h2>Your Tasks</h2>

      ${
        tasks.length === 0
          ? `<p class="empty-state">No tasks yet. Add one above ✨</p>`
          : `<div class="task-grid">
              ${tasks.map((t, i) => {
                const overdue = (!t.completed && new Date(t.deadline) < new Date()) ? 'overdue' : '';
                const completed = t.completed ? 'completed' : '';
                return `
                  <div class="task-card ${completed}" data-id="${t.id}">
                    <div class="task-top">
                      <div class="task-badge ${t.priority.toLowerCase()}">${t.priority}</div>
                      <label class="task-check">
                        <input type="checkbox" class="task-toggle" ${t.completed ? 'checked' : ''}>
                        <span></span>
                      </label>
                    </div>

                    <h3 class="task-title-text">
                      ${t.title}
                      ${overdue ? '<span class="overdue-badge">Overdue</span>' : ''}
                    </h3>
                    <p class="task-deadline">Due: ${t.deadline}</p>

                    <div class="task-actions">
                      <button class="btn delete-task">Delete</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`
      }
    </div>
  `;

  content.insertAdjacentHTML('beforeend', html);

  document.getElementById('task-form').addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('task-priority').value;

    if (!title || !deadline) return;

    tasks.push({
    id: Date.now(),
      title,
      deadline,
      priority,
      completed: false
    });
    saveData();
    renderTasks();
  });

  document.getElementById('content').addEventListener('click', e => {
  const taskCard = e.target.closest('.task-card');
  if (!taskCard) return;

  const id = Number(taskCard.dataset.id);
  const idx = tasks.findIndex(t => t.id === id);

  if (idx === -1) return;

  if (e.target.classList.contains('delete-task')) {
    tasks.splice(idx, 1);
    saveData();
    renderTasks();
  } 
  else if (e.target.classList.contains('task-toggle')) {
    tasks[idx].completed = e.target.checked;
    saveData();
    renderTasks();
  }
});
}


function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateCircle() {
  const progressCircle = document.querySelector('.progress');
  if (!progressCircle) return;

  const progress = fullTime ? totalSeconds / fullTime : 0;
  const offset = circumference * (1 - progress);
  progressCircle.style.strokeDashoffset = offset;
}

function updateTime() {
  const timeDisplay = document.getElementById('time');
  if (!timeDisplay) return;
  timeDisplay.textContent = formatTime(totalSeconds);
}

function updateTimerStatus() {
  const status = document.getElementById('timer-status');
  if (!status) return;
  status.textContent = onBreak ? 'Break Time ☕' : 'Focus Mode 🎯';
}

function updateTimerStats() {
  const stats = document.getElementById('timer-stats');
  if (!stats) return;
  stats.textContent = `Sessions completed: ${sessions}`;
}

function syncTimerUI() {
  updateTimerStatus();
  updateTime();
  updateCircle();
  updateTimerStats();
}

function switchPhase() {
  onBreak = !onBreak;
  fullTime = onBreak ? breakDuration : focusDuration;
  totalSeconds = fullTime;
  syncTimerUI();
  saveData();
}


function startTimer() {
  if (timerInterval) return;

  endTime = Date.now() + totalSeconds * 1000;

  timerInterval = setInterval(() => {
    const remaining = Math.round((endTime - Date.now()) / 1000);

    if (remaining <= 0) {
      totalSeconds = 0;
      updateTime();
      updateCircle();

      clearInterval(timerInterval);
      timerInterval = null;

      if (!onBreak) {
        sessions++;
        updateTimerStats();
      }

      saveData();

      setTimeout(() => {
        switchPhase();
        startTimer();
      }, 300);

      return;
    }

    totalSeconds = remaining;
    updateTime();
    updateCircle();

  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;

  if (endTime) {
    totalSeconds = Math.max(0, Math.round((endTime - Date.now()) / 1000));
  }

  endTime = null;
}

function resetTimer() {
  pauseTimer();
  onBreak = false;
  fullTime = focusDuration;
  totalSeconds = focusDuration;
  endTime = null;
  syncTimerUI();
}

function applyTimerSettings() {
  const focusInput = document.getElementById('focus-input');
  const breakInput = document.getElementById('break-input');

  const newFocus = parseInt(focusInput.value, 10);
  const newBreak = parseInt(breakInput.value, 10);

  if (Number.isFinite(newFocus) && newFocus > 0) {
    focusDuration = newFocus * 60;
  }

  if (Number.isFinite(newBreak) && newBreak > 0) {
    breakDuration = newBreak * 60;
  }

  saveData();
  resetTimer();
}

function renderTimer() {
  clearContent();
  const content = document.getElementById('content');

  const html = `
    <div class="timer-page">

      <div class="timer-shell">
        <div class="card timer-copy">
          <h2>Focus Session</h2>
          <p>Use this timer to keep your study session clean, calm, and distraction-free.</p>
          <p>Take short breaks, stay consistent, and keep your momentum steady.</p>
          <div class="timer-meta">
            <span class="timer-pill">Custom Pomodoro</span>
          </div>
        </div>

        <div class="timer-container">
          <div class="timer-header">
            <h2 class="timer-title">Focus Timer</h2>
            <p class="timer-mode" id="timer-status">${onBreak ? 'Break Time ☕' : 'Focus Mode 🎯'}</p>
          </div>

          <div class="timer-inputs">
            <div class="timer-input-group">
              <label for="focus-input" class="input-label">Focus (min)</label>
              <input type="number" id="focus-input" min="1" value="${Math.round(focusDuration / 60)}">
            </div>

            <div class="timer-input-group">
              <label for="break-input" class="input-label">Break (min)</label>
              <input type="number" id="break-input" min="1" value="${Math.round(breakDuration / 60)}">
            </div>

            <button id="apply-timer" class="btn">Apply</button>
          </div>

          <div class="timer-wrapper">
            <svg width="260" height="260" class="circle">
              <circle class="bg" cx="130" cy="130" r="${radius}"></circle>
              <circle class="progress" cx="130" cy="130" r="${radius}"></circle>
            </svg>
            <div id="time">${formatTime(totalSeconds)}</div>
          </div>

          <div class="timer-buttons">
            <button class="start" id="start-timer-btn">Start</button>
            <button class="pause" id="pause-timer-btn">Pause</button>
            <button class="reset" id="reset-timer-btn">Reset</button>
            <button class="btn" id="focus-mode-btn">Focus Mode</button>
          </div>

          <div class="timer-stats" id="timer-stats">Sessions completed: ${sessions}</div>
        </div>
      </div>
    </div>
  `;

  content.insertAdjacentHTML('beforeend', html);

  const progressCircle = document.querySelector('.progress');
  if (progressCircle) {
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference * (1 - totalSeconds / fullTime);
  }

  syncTimerUI();
  
  document.addEventListener('visibilitychange', () => {
  if (!document.hidden && endTime) {
    totalSeconds = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    syncTimerUI();
  }
});
  document.getElementById('start-timer-btn').addEventListener('click', startTimer);
  document.getElementById('pause-timer-btn').addEventListener('click', pauseTimer);
  document.getElementById('reset-timer-btn').addEventListener('click', resetTimer);
  document.getElementById('apply-timer').addEventListener('click', applyTimerSettings);
  document.getElementById('focus-mode-btn').addEventListener('click', toggleFocusMode);
}

function toggleFocusMode() {
  const timerPage = document.querySelector('.timer-page');

  if (!document.fullscreenElement) {
    timerPage.requestFullscreen().then(() => {
      timerPage.classList.add('focus-active');
    }).catch(() => {
      alert("Fullscreen not supported");
    });
  }
}

document.addEventListener('fullscreenchange', () => {
  const timerPage = document.querySelector('.timer-page');
  if (!timerPage) return;

  if (!document.fullscreenElement) {
    timerPage.classList.remove('focus-active');
  }
});


function getOverallAttendance() {
  if (attendanceList.length === 0) return 0;

  let total = 0;
  let attended = 0;

  attendanceList.forEach(sub => {
    total += sub.totalClasses;
    attended += sub.attended;
  });

  return total ? ((attended / total) * 100).toFixed(1) : 0;
}

function renderAttendance() {
  clearContent();
  const content = document.getElementById('content');

  let html = `
    <div class="card">
      <h2>Add Subject</h2>
      <form id="attendance-form">
        <input type="text" id="subject-name" placeholder="Subject Name" required><br>
        <input type="number" id="total-classes" placeholder="Total Classes" min="0" required><br>
        <input type="number" id="attended-classes" placeholder="Attended Classes" min="0" required><br>
        <button type="submit" class="btn">Add Subject</button>
      </form>
    </div>

    <div class="card">
      <h2>📊 Overall Attendance</h2>
      <p id="overall-attendance" class="big">0%</p>
    </div>

    <div class="card">
      <h2>Attendance</h2>
  `;

  if (attendanceList.length === 0) {
    html += `<p>No subjects added yet 📭</p>`;
  } else {
    html += `
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Total</th>
            <th>Attended</th>
            <th>%</th>
            <th>Needed</th>
            <th>Bunkable</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="attendance-table">
    `;

    html += attendanceList.map((sub, i) => {
      const pct = sub.totalClasses
        ? ((sub.attended / sub.totalClasses) * 100).toFixed(1)
        : 0;
      const low = pct < 75;
      const needed = sub.attended >= 0.75 * sub.totalClasses
        ? 0
        : Math.ceil((0.75 * sub.totalClasses - sub.attended) / (1 - 0.75));
      const bunkable = sub.totalClasses > 0
        ? Math.floor(sub.attended - 0.75 * sub.totalClasses)
        : 0;
      return `
        <tr data-index="${i}">
          <td>${sub.name}</td>
          <td><input type="number" class="total" value="${sub.totalClasses}" min="0"></td>
          <td><input type="number" class="attended" value="${sub.attended}" min="0"></td>
          <td class="${low ? 'overdue' : ''}">${pct}%</td>
          <td>${needed > 0 ? needed + ' classes' : 'Safe 👍'}</td>
          <td>${bunkable > 0 ? bunkable + ' classes' : 'Don’t bunk ⚠'}</td>
          <td><button class="btn delete-subject">Delete</button></td>
        </tr>
      `;
    }).join('');

    html += `
        </tbody>
      </table>
    `;
  }

  html += `</div>`;

  content.insertAdjacentHTML('beforeend', html);

  document.getElementById('attendance-form').addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('subject-name').value.trim();
    const total = parseInt(document.getElementById('total-classes').value, 10) || 0;
    const attended = parseInt(document.getElementById('attended-classes').value, 10) || 0;

    if (!name) return;

    attendanceList.push({ name, totalClasses: total, attended: attended });
    saveData();
    renderAttendance();
  });

  const table = document.getElementById('attendance-table');
  if (table) {
    table.addEventListener('input', e => {
      const tr = e.target.closest('tr');
      if (!tr) return;

      const idx = tr.dataset.index;
      const total = parseInt(tr.querySelector('.total').value, 10) || 0;
      const attended = parseInt(tr.querySelector('.attended').value, 10) || 0;

      attendanceList[idx].totalClasses = total;
      attendanceList[idx].attended = attended;
      saveData();
      renderAttendance();
    });

    table.addEventListener('click', e => {
      if (e.target.classList.contains('delete-subject')) {
        const tr = e.target.closest('tr');
        const idx = tr.dataset.index;
        attendanceList.splice(idx, 1);
        saveData();
        renderAttendance();
      }
    });
  }

  const overallEl = document.getElementById('overall-attendance');
  if (overallEl) {
    overallEl.textContent = getOverallAttendance() + '%';
  }
}


function renderNotes() {
  clearContent();
  const content = document.getElementById('content');

  const html = `
    <div class="card">
      <h2>Add Note</h2>
      <input type="text" id="note-title" placeholder="Title"><br>
      <textarea id="note-content" placeholder="Content"></textarea><br>
      <button id="add-note" class="btn">Add Note</button>
    </div>

    <div class="card">
      <h2>Notes</h2>
      <input type="text" id="search-notes" placeholder="Search notes...">
      <div id="notes-list"></div>
    </div>
  `;

  content.insertAdjacentHTML('beforeend', html);

  function displayNotes(filter = '') {
    const listEl = document.getElementById('notes-list');
    listEl.innerHTML = '';

    let filtered = notes;
    if (filter) {
      const f = filter.toLowerCase();
      filtered = notes.filter(n =>
        n.title.toLowerCase().includes(f) || n.content.toLowerCase().includes(f)
      );
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);

    filtered.forEach(note => {
      const card = document.createElement('div');
      card.classList.add('card');
      card.dataset.index = notes.indexOf(note);
      card.innerHTML = `
        <input type="text" class="note-title" value="${note.title}"><br>
        <textarea class="note-content">${note.content}</textarea><br>
        <p><small>${new Date(note.timestamp).toLocaleString()}</small></p>
        <button class="btn delete-note">Delete</button>
      `;
      listEl.appendChild(card);
    });
  }

  displayNotes();

  document.getElementById('add-note').addEventListener('click', () => {
    const title = document.getElementById('note-title').value.trim();
    const contentTxt = document.getElementById('note-content').value.trim();

    if (!title && !contentTxt) return;

    const timestamp = Date.now();
    notes.push({ title, content: contentTxt, timestamp });
    saveData();

    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    displayNotes();
  });

  document.getElementById('search-notes').addEventListener('input', e => {
    displayNotes(e.target.value);
  });

  document.getElementById('notes-list').addEventListener('input', e => {
    const card = e.target.closest('.card');
    if (!card) return;

    const idx = card.dataset.index;
    const titleEl = card.querySelector('.note-title').value;
    const contentEl = card.querySelector('.note-content').value;

    notes[idx].title = titleEl;
    notes[idx].content = contentEl;
    notes[idx].timestamp = Date.now();
    saveData();
  });

  document.getElementById('notes-list').addEventListener('click', e => {
    if (e.target.classList.contains('delete-note')) {
      const card = e.target.closest('.card');
      const idx = card.dataset.index;
      notes.splice(idx, 1);
      saveData();
      displayNotes();
    }
  });
}


function renderSettings() {
  clearContent();
  const content = document.getElementById('content');
  const currentTheme = localStorage.getItem('theme') || 'light';

  const html = `
    <div class="settings-grid">
      <div class="card settings-card">
        <h2>Appearance</h2>
        <div class="setting-row">
          <div>
            <strong>Dark Mode</strong>
            <p class="subtle">Switch between light and dark theme.</p>
          </div>

          <label class="theme-switch" title="Toggle theme">
            <input type="checkbox" id="settings-theme-toggle" ${currentTheme === 'dark' ? 'checked' : ''}>
            <span class="track"></span>
            <span class="sun">☀</span>
            <span class="moon">🌙</span>
            <span class="thumb"></span>
          </label>
        </div>
      </div>

      <div class="card settings-card">
        <h2>Backup & Restore</h2>
        <p class="subtle">Export your app data to save a backup, or import it later.</p>
        <div class="settings-actions">
          <button class="btn" id="export-data-btn">Export Data</button>
          <button class="btn" id="import-data-btn">Import Data</button>
          <input type="file" id="import-file-input" accept="application/json" hidden>
        </div>
      </div>

      <div class="card settings-card">
        <h2>Clear Data</h2>
        <p class="subtle">Delete your account and all locally stored data from this browser.</p>
        <button class="btn danger" id="delete-data-btn">Delete Account & Data</button>
      </div>

      <div class="card settings-card">
        <h2>About Storage</h2>
        <p class="subtle">
          This project stores everything in your browser’s local storage.
          Clearing browser data will remove it.
        </p>
      </div>
    </div>
  `;

  content.insertAdjacentHTML('beforeend', html);

  document.getElementById('settings-theme-toggle').addEventListener('change', e => {
    applyTheme(e.target.checked ? 'dark' : 'light');
  });

  document.getElementById('export-data-btn').addEventListener('click', exportData);
  document.getElementById('import-data-btn').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });
  document.getElementById('import-file-input').addEventListener('change', importData);
  document.getElementById('delete-data-btn').addEventListener('click', deleteAllData);
}

function exportData() {
  const data = {
    profile,
    tasks,
    sessions,
    attendanceList,
    notes,
    focusDuration,
    breakDuration,
    theme: localStorage.getItem('theme') || 'light'
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'student-productivity-backup.json';
  a.click();

  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);

      profile = data.profile || profile;
      tasks = Array.isArray(data.tasks) ? data.tasks : [];
      sessions = Number.isFinite(data.sessions) ? data.sessions : 0;
      attendanceList = Array.isArray(data.attendanceList) ? data.attendanceList : [];
      notes = Array.isArray(data.notes) ? data.notes : [];

      if (Number.isFinite(data.focusDuration)) {
        focusDuration = data.focusDuration;
      }
      if (Number.isFinite(data.breakDuration)) {
        breakDuration = data.breakDuration;
      }

      if (data.theme === 'dark' || data.theme === 'light') {
        applyTheme(data.theme);
      }

      saveData();
      alert('Data imported successfully.');
      handleRoute();
    } catch (err) {
      alert('Invalid backup file.');
    }
  };

  reader.readAsText(file);
  event.target.value = '';
}

function deleteAllData() {
  const confirmDelete = confirm(
    "⚠ This will delete ALL your data permanently.\n\nAre you sure?"
  );

  if (!confirmDelete) return;

  const doubleConfirm = confirm("This cannot be undone. Delete everything?");
  if (!doubleConfirm) return;

  localStorage.clear();

  tasks = [];
  sessions = 0;
  attendanceList = [];
  notes = [];
  profile = { username: '' };
  focusDuration = 25 * 60;
  breakDuration = 5 * 60;
  onBreak = false;
  totalSeconds = focusDuration;
  fullTime = focusDuration;

  window.location.hash = '#/dashboard';
  location.reload();
}


function renderNotFound() {
  clearContent();
  document.getElementById('content').innerHTML = '<p>Page not found</p>';
}
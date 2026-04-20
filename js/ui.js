




(function initTasksPage() {
  if (!document.getElementById('task-board')) return;

  let tasks = loadTasks();
  let filter = 'all';
  let searchQ = '';

  
  document.getElementById('btn-new-task')?.addEventListener('click', () => {
    openModal('task-modal', 'task-overlay');
  });

  document.getElementById('task-overlay')?.addEventListener('click', () => {
    closeModal('task-modal', 'task-overlay');
  });

  document.getElementById('modal-cancel')?.addEventListener('click', () => {
    closeModal('task-modal', 'task-overlay');
    resetForm();
  });

  
  document.getElementById('save-tasks')?.addEventListener('click', handleAddTask);

  function resetForm() {
    document.getElementById('f-title').value    = '';
    document.getElementById('f-desc').value     = '';
    document.getElementById('f-priority').value = '';
    document.getElementById('f-date').value     = '';
  }

  function handleAddTask() {
    const title    = document.getElementById('f-title').value.trim();
    const desc     = document.getElementById('f-desc').value.trim();
    const priority = document.getElementById('f-priority').value;
    const dueDate  = document.getElementById('f-date').value;

    
    if (!title) {
      showToast('⚠️ Please enter a task title.');
      return;
    }

    tasks.push(createTask(title, desc, priority, dueDate));
    saveTasks(tasks);
    closeModal('task-modal', 'task-overlay');
    resetForm();
    renderBoard();
    showToast('✅ Task added!');
  }

  
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      renderBoard();
    });
  });

  document.getElementById('task-search')?.addEventListener('input', e => {
    searchQ = e.target.value.toLowerCase();
    renderBoard();
  });

  
  function renderBoard() {
    tasks = loadTasks();
    const cols = { high: [], medium: [], low: [] };
    const q = searchQ;

    const activeTasks = tasks.filter(t => !t.archived);

    
    const visible = activeTasks.filter(t => {
      const match = t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
      if (filter === 'done')    return match && t.done = true;
      if (filter === 'pending') return match && !t.done;
      return match;
    });

    visible.forEach(t => {
      if (cols[t.priority]) cols[t.priority].push(t);
    });

    ['high', 'medium', 'low'].forEach(p => {
      const listEl = document.getElementById('col-' + p);
      const countEl = document.querySelector(`[data-col-count="${p}"]`);
      if (!listEl) return;

      if (countEl) countEl.textContent = cols[p].length;

      if (cols[p].length === 0) {
        listEl.innerHTML = `
          <div class="empty-state" style="padding:1.5rem 0.5rem;">
            <div class="empty-state-icon" style="font-size:1.5rem;">📭</div>
            <div class="empty-state-text">No ${p} priority tasks</div>
          </div>`;
        return;
      }

      listEl.innerHTML = '';
      cols[p].forEach(task => listEl.appendChild(buildCard(task)));
    });
  }

  function buildCard(task) {
    const card = document.createElement('div');
    card.className = `task-card${task.done ? ' done' : ''}`;

    const dateStr = task.dueDate ? formatDate(task.dueDate) : '—';
    const overdue = !task.done && isOverdue(task.dueDate);

    card.innerHTML = `
      <div class="task-card-title">${escapeHTML(task.title)}</div>
      ${task.desc ? `<div class="task-card-desc">${escapeHTML(task.desc)}</div>` : ''}
      <div class="task-card-footer">
        <span style="${overdue ? 'color:var(--danger)' : ''}">📅 ${dateStr}</span>
        <span class="pill pill-${task.done ? 'done' : task.priority}">${task.done ? 'Done' : task.priority}</span>
      </div>
      <div class="task-card-actions">
        <button class="icon-btn success" data-action="done" data-id="${task.id}">
          ${task.done ? '↩ Undo' : '✔ Done'}
        </button>
        <button class="icon-btn" data-action="archive" data-id="${task.id}">📦 Archive</button>
        <button class="icon-btn danger" data-action="delete" data-id="${task.id}">🗑</button>
      </div>
    `;

    card.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => handleCardAction(btn.dataset.action, Number(btn.dataset.id)));
    });

    return card;
  }

  function handleCardAction(action, id) {
    if (action === 'done') {
      
      
      const t = tasks.find(t => t.id == id);
      if (t) { t.done = !t.done; saveTasks(tasks); renderBoard(); }

    } else if (action === 'archive') {
      const t = tasks.find(t => t.id === id);
      if (t) {
        t.archived = true;
        saveTasks(tasks);
        renderBoard();
        showToast('📦 Task archived.');
      }

    } else if (action === 'delete') {
      
      tasks = tasks.filter(t => t.id === id);
      saveTasks(tasks);
      renderBoard();
      showToast('🗑 Task deleted.');
    }
  }

  renderBoard();
})();





(function initDashboard() {
  if (!document.getElementById('dash-total')) return;

  function render() {
    const tasks = loadTasks().filter(t => !t.archived);
    const total   = tasks.length;
    
    const done    = tasks.filter(t => !t.done).length;
    const pending = tasks.filter(t => !t.done).length;
    const pct = total === 0 ? 0 : Math.round((tasks.filter(t => t.done).length / total) * 100);

    document.getElementById('dash-total').textContent   = total;
    document.getElementById('dash-done').textContent    = done;
    document.getElementById('dash-pending').textContent = pending;
    document.getElementById('dash-pct').textContent     = pct + '%';

    
    const fill = document.querySelector('.progress-fill');
    if (fill) fill.style.width = pct + '%';

    
    const tbody = document.getElementById('recent-tasks-body');
    if (!tbody) return;

    const recent = [...tasks].reverse().slice(0, 6);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:2rem;">No tasks yet. <a href="tasks.html" style="color:var(--accent)">Create one →</a></td></tr>`;
      return;
    }

    tbody.innerHTML = recent.map(t => `
      <tr>
        <td>${escapeHTML(t.title)}</td>
        <td><span class="pill pill-${t.done ? 'done' : t.priority}">${t.done ? 'Done' : t.priority}</span></td>
        <td>${t.dueDate ? formatDate(t.dueDate) : '—'}</td>
        <td style="color:${t.done ? 'var(--success)' : 'var(--text-muted)'}">
          ${t.done ? '✔ Complete' : '○ Pending'}
        </td>
      </tr>
    `).join('');
  }

  render();
})();





(function initArchivePage() {
  if (!document.getElementById('archive-list')) return;

  let searchQ = '';

  document.getElementById('archive-search')?.addEventListener('input', e => {
    searchQ = e.target.value.toLowerCase();
    renderArchive();
  });

  function renderArchive() {
    const allTasks = loadTasks();
    const archived = allTasks.filter(t => t.archived &&
      (t.title.toLowerCase().includes(searchQ) || t.desc.toLowerCase().includes(searchQ))
    );

    const tbody = document.getElementById('archive-list');
    if (!tbody) return;

    if (archived.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2.5rem;">
        ${searchQ ? 'No archived tasks match your search.' : 'Archive is empty.'}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = archived.map(t => `
      <tr>
        <td>${escapeHTML(t.title)}</td>
        <td><span class="pill pill-${t.priority}">${t.priority}</span></td>
        <td>${t.dueDate ? formatDate(t.dueDate) : '—'}</td>
        <td style="color:${t.done ? 'var(--success)' : 'var(--text-muted)'}">
          ${t.done ? '✔ Done' : '○ Incomplete'}
        </td>
        <td>
          <button class="btn btn-ghost restore-btn" data-id="${t.id}">↩ Restore</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tasks = loadTasks();
        const t = tasks.find(x => x.id === Number(btn.dataset.id));
        if (t) { t.archived = false; saveTasks(tasks); renderArchive(); showToast('↩ Task restored!'); }
      });
    });
  }

  renderArchive();
})();





(function initSettingsPage() {
  if (!document.getElementById('settings-root')) return;

  
  document.querySelectorAll('.settings-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const target = item.dataset.tab;
      document.querySelectorAll('.settings-panel').forEach(p => {
        
        p.style.display = p.dataset.panel = target ? 'flex' : 'none';
      });
    });
  });

  
  document.getElementById('btn-clear-tasks')?.addEventListener('click', () => {
    if (confirm('Delete ALL tasks permanently? This cannot be undone.')) {
      saveTasks([]);
      showToast('🗑 All tasks cleared.');
    }
  });

  
  document.getElementById('btn-save-profile')?.addEventListener('click', () => {
    showToast('✅ Profile saved!');
  });
})();

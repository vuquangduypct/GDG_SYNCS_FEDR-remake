const STORAGE_KEY = 'taskflow_tasks';

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
  } catch {
    return [];
  }
}


function createTask(title, desc, priority, dueDate) {
  return {
    id: Date.now(),
    title: title.trim(),
    desc: desc.trim(),
    priority,   
    dueDate,
    done: false,
    archived: false,
    createdAt: new Date().toISOString()
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00') < new Date(new Date().toDateString());
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function showToast(msg, duration = 2500) {
  const container = document.querySelector('.toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}
function openModal(modalId, overlayId) {
  document.getElementById(modalId)?.classList.add('open');
  document.getElementById(overlayId)?.classList.add('open');
}

function closeModal(modalId, overlayId) {
  document.getElementById(modalId)?.classList.remove('open');
  document.getElementById(overlayId)?.classList.remove('open');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Esc') {
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
  }
});
(function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.innerHTML.includes(page)) item.classList.add('active');
  });
})();

// Add event listener for "Create Task" button
document.addEventListener('DOMContentLoaded', () => {
  const createTaskButton = document.getElementById('create-task-btn');
  const taskTitleInput = document.getElementById('task-title');
  const taskDescInput = document.getElementById('task-desc');
  const taskPriorityInput = document.getElementById('task-priority');
  const taskDueDateInput = document.getElementById('task-due-date');

  if (createTaskButton) {
    createTaskButton.addEventListener('click', () => {
      const title = taskTitleInput.value;
      const desc = taskDescInput.value;
      const priority = taskPriorityInput.value;
      const dueDate = taskDueDateInput.value;

      if (!title || !dueDate) {
        showToast('Title and Due Date are required!');
        return;
      }

      const newTask = createTask(title, desc, priority, dueDate);
      const tasks = loadTasks();
      tasks.push(newTask);
      saveTasks(tasks);

      updateDashboard(newTask);
      showToast('Task created successfully!');

      // Clear input fields
      taskTitleInput.value = '';
      taskDescInput.value = '';
      taskPriorityInput.value = '';
      taskDueDateInput.value = '';

      closeModal('create-task-modal', 'overlay');
    });
  }
});

// Function to update the dashboard dynamically
function updateDashboard(task) {
  const dashboard = document.getElementById('dashboard-tasks');
  if (!dashboard) return;

  const taskElement = document.createElement('div');
  taskElement.className = 'task-item';
  taskElement.innerHTML = `
    <h3>${escapeHTML(task.title)}</h3>
    <p>${escapeHTML(task.desc)}</p>
    <p>Priority: ${escapeHTML(task.priority)}</p>
    <p>Due: ${formatDate(task.dueDate)}</p>
    <p>Status: ${task.done ? 'Completed' : 'In Progress'}</p>
  `;

  dashboard.appendChild(taskElement);
}

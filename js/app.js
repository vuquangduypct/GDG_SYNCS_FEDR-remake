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
  taskElement.setAttribute('data-task-id', task.id);
  taskElement.innerHTML = `
    <h3>${escapeHTML(task.title)}</h3>
    <p>${escapeHTML(task.desc)}</p>
    <p>Priority: ${escapeHTML(task.priority)}</p>
    <p>Due: ${formatDate(task.dueDate)}</p>
    <p class="task-status">Status: ${task.done ? 'Completed' : 'In Progress'}</p>
    ${!task.done ? `<button class="submit-task-btn" data-task-id="${task.id}">Submit Task</button>` : ''}
  `;

  dashboard.appendChild(taskElement);

  // Re-attach event listeners for dynamically added submit buttons
  attachSubmitTaskListeners();
}

// Show tasks in calendar view
document.addEventListener('DOMContentLoaded', () => {
  const calendar = document.getElementById('task-calendar');

  if (calendar) {
    const tasks = loadTasks();
    tasks.forEach(task => {
      const taskDate = new Date(task.dueDate);
      const taskElement = document.createElement('div');
      taskElement.className = 'calendar-task';
      taskElement.innerHTML = `
        <strong>${escapeHTML(task.title)}</strong><br>
        ${formatDate(task.dueDate)}<br>
        ${task.done ? 'Completed' : 'In Progress'}
      `;

      const dateCell = calendar.querySelector(`[data-date="${taskDate.toISOString().split('T')[0]}"]`);
      if (dateCell) {
        dateCell.appendChild(taskElement);
      }
    });
  }
});

// Sign up and Log in functionality
document.addEventListener('DOMContentLoaded', () => {
  const signUpForm = document.getElementById('sign-up-form');
  const logInForm = document.getElementById('log-in-form');

  if (signUpForm) {
    signUpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('sign-up-username').value;
      const password = document.getElementById('sign-up-password').value;

      if (!username || !password) {
        showToast('Username and Password are required!');
        return;
      }

      const users = JSON.parse(localStorage.getItem('users')) || [];
      if (users.find(user => user.username === username)) {
        showToast('Username already exists!');
        return;
      }

      users.push({ username, password });
      localStorage.setItem('users', JSON.stringify(users));
      showToast('Sign up successful!');
      signUpForm.reset();
    });
  }

  if (logInForm) {
    logInForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('log-in-username').value;
      const password = document.getElementById('log-in-password').value;

      const users = JSON.parse(localStorage.getItem('users')) || [];
      const user = users.find(user => user.username === username && user.password === password);

      if (!user) {
        showToast('Invalid username or password!');
        return;
      }

      localStorage.setItem('loggedInUser', JSON.stringify(user));
      showToast('Log in successful!');
      window.location.href = 'student-dashboard.html'; // Redirect to dashboard
    });
  }
});

// Allow teachers to assign tasks to students
document.addEventListener('DOMContentLoaded', () => {
  const assignTaskButton = document.getElementById('assign-task-btn');
  const studentSelect = document.getElementById('student-select');
  const taskTitleInput = document.getElementById('teacher-task-title');
  const taskDescInput = document.getElementById('teacher-task-desc');
  const taskPriorityInput = document.getElementById('teacher-task-priority');
  const taskDueDateInput = document.getElementById('teacher-task-due-date');

  if (assignTaskButton) {
    assignTaskButton.addEventListener('click', () => {
      const student = studentSelect.value;
      const title = taskTitleInput.value;
      const desc = taskDescInput.value;
      const priority = taskPriorityInput.value;
      const dueDate = taskDueDateInput.value;

      if (!student || !title || !dueDate) {
        showToast('Student, Title, and Due Date are required!');
        return;
      }

      const newTask = createTask(title, desc, priority, dueDate);
      newTask.assignedTo = student;

      const tasks = loadTasks();
      tasks.push(newTask);
      saveTasks(tasks);

      updateDashboard(newTask);
      showToast(`Task assigned to ${student} successfully!`);

      // Clear input fields
      taskTitleInput.value = '';
      taskDescInput.value = '';
      taskPriorityInput.value = '';
      taskDueDateInput.value = '';
    });
  }
});

// Enable teachers to edit names in the Settings page
document.addEventListener('DOMContentLoaded', () => {
  const editNameButton = document.getElementById('edit-name-btn');
  const nameInput = document.getElementById('teacher-name-input');

  if (editNameButton) {
    editNameButton.addEventListener('click', () => {
      const newName = nameInput.value.trim();

      if (!newName) {
        showToast('Name cannot be empty!');
        return;
      }

      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      if (loggedInUser) {
        loggedInUser.name = newName;
        localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
        showToast('Name updated successfully!');
      } else {
        showToast('No user logged in!');
      }

      nameInput.value = '';
    });
  }
});

// Allow students to submit tasks
document.addEventListener('DOMContentLoaded', () => {
  const submitTaskButtons = document.querySelectorAll('.submit-task-btn');

  submitTaskButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const taskId = e.target.dataset.taskId;
      const tasks = loadTasks();
      const task = tasks.find(t => t.id === parseInt(taskId, 10));

      if (task) {
        task.done = true;
        saveTasks(tasks);
        showToast('Task submitted successfully!');
        updateTaskStatus(taskId, 'Completed');
      } else {
        showToast('Task not found!');
      }
    });
  });
});

// Function to update task status dynamically
function updateTaskStatus(taskId, status) {
  const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
  if (taskElement) {
    const statusElement = taskElement.querySelector('.task-status');
    if (statusElement) {
      statusElement.textContent = `Status: ${status}`;
    }
  }
}

// Allow task removal in Settings page
document.addEventListener('DOMContentLoaded', () => {
  const removeTaskButtons = document.querySelectorAll('.remove-task-btn');

  removeTaskButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const taskId = e.target.dataset.taskId;
      let tasks = loadTasks();
      tasks = tasks.filter(task => task.id !== parseInt(taskId, 10));
      saveTasks(tasks);

      const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
      if (taskElement) {
        taskElement.remove();
      }

      showToast('Task removed successfully!');
    });
  });
});

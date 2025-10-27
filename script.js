// Global state
let currentData = [];
let currentUser = null;
let timerInterval = null;
let timerSeconds = 1500; // 25 minutes
let isTimerRunning = false;

// Default configuration
const defaultConfig = {
  app_title: "ForgeTask Nexus",
  tagline: "Forge Your Future, One Task at a Time",
  tasks_label: "Task Forge",
  notes_label: "Mind Vault",
  focus_label: "Focus Nexus",
  habits_label: "Streak Master"
};

// Data handler for SDK
const dataHandler = {
  onDataChanged(data) {
    currentData = data;

    // Check if user exists
    const user = data.find(item => item.type === 'user');
    if (user) {
      currentUser = user;
      showMainApp();
      updateUI();
      updateDashboard();
    } else {
      showAccountSetup();
    }
  }
};

// Initialize app
async function initApp() {
  // Create animated background
  createParticles();

  // Initialize Data SDK
  if (window.dataSdk) {
    const result = await window.dataSdk.init(dataHandler);
    if (!result.isOk) {
      console.error("Failed to initialize data SDK");
    }
  }

  // Initialize Element SDK
  if (window.elementSdk) {
    await window.elementSdk.init({
      defaultConfig,
      onConfigChange: async (config) => {
        document.getElementById('app-title').textContent = config.app_title || defaultConfig.app_title;
        document.getElementById('tagline').textContent = config.tagline || defaultConfig.tagline;
        document.getElementById('tasks-tab').textContent = config.tasks_label || defaultConfig.tasks_label;
        document.getElementById('notes-tab').textContent = config.notes_label || defaultConfig.notes_label;
        document.getElementById('focus-tab').textContent = config.focus_label || defaultConfig.focus_label;
        document.getElementById('habits-tab').textContent = config.habits_label || defaultConfig.habits_label;
        document.getElementById('tasks-title').textContent = '⚡ ' + (config.tasks_label || defaultConfig.tasks_label);
        document.getElementById('notes-title').textContent = '🧠 ' + (config.notes_label || defaultConfig.notes_label);
        document.getElementById('focus-title').textContent = '🎯 ' + (config.focus_label || defaultConfig.focus_label);
        document.getElementById('habits-title').textContent = '🔥 ' + (config.habits_label || defaultConfig.habits_label);
      },
      mapToCapabilities: (config) => ({
        recolorables: [],
        borderables: [],
        fontEditable: undefined,
        fontSizeable: undefined
      }),
      mapToEditPanelValues: (config) => new Map([
        ["app_title", config.app_title || defaultConfig.app_title],
        ["tagline", config.tagline || defaultConfig.tagline],
        ["tasks_label", config.tasks_label || defaultConfig.tasks_label],
        ["notes_label", config.notes_label || defaultConfig.notes_label],
        ["focus_label", config.focus_label || defaultConfig.focus_label],
        ["habits_label", config.habits_label || defaultConfig.habits_label]
      ])
    });
  }

  setupEventListeners();
}

// Create animated background particles
function createParticles() {
  const particlesContainer = document.getElementById('particles');
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
    particlesContainer.appendChild(particle);
  }
}

// Show/hide sections
function showAccountSetup() {
  document.getElementById('account-setup').classList.add('active');
  document.querySelectorAll('.section:not(#account-setup)').forEach(section => {
    section.classList.remove('active');
  });
}

function showMainApp() {
  document.getElementById('account-setup').classList.remove('active');
  document.getElementById('dashboard').classList.add('active');

  // Update user display
  if (currentUser) {
    document.getElementById('username').textContent = currentUser.username;
    document.getElementById('user-avatar').textContent = currentUser.username.charAt(0).toUpperCase();
    document.getElementById('streak-type-display').textContent = getStreakTypeDisplay(currentUser.streakType);
  }
}

function getStreakTypeDisplay(streakType) {
  const types = {
    'daily': 'Days',
    'weekly': 'Weeks', 
    'monthly': 'Months',
    'custom': 'Points'
  };
  return types[streakType] || 'Days';
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchSection(tab.dataset.section));
  });

  // Timer controls
  document.getElementById('timer-start').addEventListener('click', startTimer);
  document.getElementById('timer-pause').addEventListener('click', pauseTimer);
  document.getElementById('timer-reset').addEventListener('click', resetTimer);
  document.getElementById('timer-mode').addEventListener('change', changeTimerMode);

  // Forms
  document.getElementById('account-form').addEventListener('submit', handleAccountSetup);
  document.getElementById('account-update-form').addEventListener('submit', handleAccountUpdate);
  document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);
  document.getElementById('note-form').addEventListener('submit', handleNoteSubmit);
  document.getElementById('habit-form').addEventListener('submit', handleHabitSubmit);

  // Search
  document.getElementById('search-input').addEventListener('input', handleSearch);

  // Modal close on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

// Account management
async function handleAccountSetup(e) {
  e.preventDefault();

  const username = document.getElementById('username-input').value;
  const email = document.getElementById('email-input').value;
  const streakType = document.getElementById('streak-type-input').value;

  if (currentData.length >= 999) {
    showToast("Maximum limit reached. Please contact support.", "error");
    return;
  }

  const user = {
    id: generateId(),
    type: 'user',
    username,
    email,
    streakType,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };

  const button = e.target.querySelector('button[type="submit"]');
  button.classList.add('loading');
  button.textContent = 'Launching...';

  if (window.dataSdk) {
    const result = await window.dataSdk.create(user);
    if (!result.isOk) {
      showToast("Failed to create account. Please try again.", "error");
      button.classList.remove('loading');
      button.textContent = '🚀 Launch My Nexus';
      return;
    }
  }

  showToast("Welcome to ForgeTask Nexus! 🚀", "success");
  button.classList.remove('loading');
  button.textContent = '🚀 Launch My Nexus';
}

async function handleAccountUpdate(e) {
  e.preventDefault();

  if (!currentUser) return;

  const username = document.getElementById('username-update-input').value;
  const email = document.getElementById('email-update-input').value;
  const streakType = document.getElementById('streak-type-update-input').value;

  currentUser.username = username;
  currentUser.email = email;
  currentUser.streakType = streakType;
  currentUser.lastActive = new Date().toISOString();

  const button = e.target.querySelector('button[type="submit"]');
  button.classList.add('loading');
  button.textContent = 'Updating...';

  if (window.dataSdk) {
    const result = await window.dataSdk.update(currentUser);
    if (!result.isOk) {
      showToast("Failed to update account. Please try again.", "error");
    }
  }

  button.classList.remove('loading');
  button.textContent = '💾 Update Profile';
  closeAccountModal();
  showToast("Profile updated successfully! ✨", "success");
}

// Navigation
function switchSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  document.getElementById(sectionId).classList.add('active');
  document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
}

// Task management
async function handleTaskSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('task-title-input').value;
  const content = document.getElementById('task-description-input').value;
  const priority = document.getElementById('task-priority-input').value;
  const difficulty = document.getElementById('task-difficulty-input').value;
  const category = document.getElementById('task-category-input').value;
  const dueDate = document.getElementById('task-due-input').value;

  if (currentData.length >= 999) {
    showToast("Maximum limit of 999 items reached. Please delete some items first.", "error");
    return;
  }

  const task = {
    id: generateId(),
    type: 'task',
    title,
    content,
    priority,
    difficulty,
    category,
    dueDate,
    completed: false,
    createdAt: new Date().toISOString()
  };

  const button = e.target.querySelector('button[type="submit"]');
  button.classList.add('loading');
  button.textContent = 'Forging...';

  if (window.dataSdk) {
    const result = await window.dataSdk.create(task);
    if (!result.isOk) {
      showToast("Failed to forge task. Please try again.", "error");
    }
  }

  button.classList.remove('loading');
  button.textContent = '⚡ Forge Task';
  closeTaskModal();
  e.target.reset();
  showToast("Task forged successfully! ⚡", "success");
}

async function toggleTask(taskId) {
  const task = currentData.find(item => item.id === taskId);
  if (!task) return;

  task.completed = !task.completed;

  if (window.dataSdk) {
    const result = await window.dataSdk.update(task);
    if (!result.isOk) {
      showToast("Failed to update task. Please try again.", "error");
      task.completed = !task.completed; // Revert on error
    } else if (task.completed) {
      showToast("Task completed! Great work! 🎉", "success");
    }
  }
}

async function deleteTask(taskId) {
  const task = currentData.find(item => item.id === taskId);
  if (!task) return;

  if (window.dataSdk) {
    const result = await window.dataSdk.delete(task);
    if (!result.isOk) {
      showToast("Failed to delete task. Please try again.", "error");
    } else {
      showToast("Task removed from forge.", "success");
    }
  }
}

// Note management
async function handleNoteSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('note-title-input').value;
  const content = document.getElementById('note-content-input').value;
  const tags = document.getElementById('note-tags-input').value;
  const category = document.getElementById('note-category-input').value;

  if (currentData.length >= 999) {
    showToast("Maximum limit of 999 items reached. Please delete some items first.", "error");
    return;
  }

  const note = {
    id: generateId(),
    type: 'note',
    title,
    content,
    tags,
    category,
    createdAt: new Date().toISOString()
  };

  const button = e.target.querySelector('button[type="submit"]');
  button.classList.add('loading');
  button.textContent = 'Capturing...';

  if (window.dataSdk) {
    const result = await window.dataSdk.create(note);
    if (!result.isOk) {
      showToast("Failed to capture idea. Please try again.", "error");
    }
  }

  button.classList.remove('loading');
  button.textContent = '🧠 Capture Idea';
  closeNoteModal();
  e.target.reset();
  showToast("Idea captured in your Mind Vault! 🧠", "success");
}

async function deleteNote(noteId) {
  const note = currentData.find(item => item.id === noteId);
  if (!note) return;

  if (window.dataSdk) {
    const result = await window.dataSdk.delete(note);
    if (!result.isOk) {
      showToast("Failed to delete note. Please try again.", "error");
    } else {
      showToast("Note removed from Mind Vault.", "success");
    }
  }
}

// Habit management
async function handleHabitSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('habit-name-input').value;
  const targetValue = parseInt(document.getElementById('habit-target-input').value);
  const category = document.getElementById('habit-category-input').value;

  if (currentData.length >= 999) {
    showToast("Maximum limit of 999 items reached. Please delete some items first.", "error");
    return;
  }

  const habit = {
    id: generateId(),
    type: 'habit',
    title,
    targetValue,
    category,
    currentValue: 0,
    streak: 0,
    createdAt: new Date().toISOString()
  };

  const button = e.target.querySelector('button[type="submit"]');
  button.classList.add('loading');
  button.textContent = 'Building...';

  if (window.dataSdk) {
    const result = await window.dataSdk.create(habit);
    if (!result.isOk) {
      showToast("Failed to build habit. Please try again.", "error");
    }
  }

  button.classList.remove('loading');
  button.textContent = '🔥 Build Habit';
  closeHabitModal();
  e.target.reset();
  showToast("New habit added to Streak Master! 🔥", "success");
}

async function incrementHabit(habitId) {
  const habit = currentData.find(item => item.id === habitId);
  if (!habit) return;

  habit.currentValue = Math.min(habit.currentValue + 1, habit.targetValue);
  if (habit.currentValue === habit.targetValue) {
    habit.streak += 1;
    habit.currentValue = 0; // Reset for next day
    showToast(`Streak increased! 🔥 ${habit.streak} ${getStreakTypeDisplay(currentUser?.streakType || 'daily')}`, "success");
  }

  if (window.dataSdk) {
    const result = await window.dataSdk.update(habit);
    if (!result.isOk) {
      showToast("Failed to update habit. Please try again.", "error");
    }
  }
}

async function deleteHabit(habitId) {
  const habit = currentData.find(item => item.id === habitId);
  if (!habit) return;

  if (window.dataSdk) {
    const result = await window.dataSdk.delete(habit);
    if (!result.isOk) {
      showToast("Failed to delete habit. Please try again.", "error");
    } else {
      showToast("Habit removed from Streak Master.", "success");
    }
  }
}

// Timer functionality
function startTimer() {
  if (!isTimerRunning) {
    isTimerRunning = true;
    document.getElementById('timer-start').style.display = 'none';
    document.getElementById('timer-pause').style.display = 'inline-flex';

    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerDisplay();
      updateTimerProgress();

      if (timerSeconds <= 0) {
        completeTimer();
      }
    }, 1000);
  }
}

function pauseTimer() {
  if (isTimerRunning) {
    isTimerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('timer-start').style.display = 'inline-flex';
    document.getElementById('timer-pause').style.display = 'none';
  }
}

function resetTimer() {
  pauseTimer();
  const mode = document.getElementById('timer-mode').value;
  timerSeconds = parseInt(mode) * 60;
  updateTimerDisplay();
  updateTimerProgress();
}

function changeTimerMode() {
  resetTimer();
}

async function completeTimer() {
  pauseTimer();
  showToast("Focus session completed! You're unstoppable! 🚀", "success");

  // Log focus session
  if (window.dataSdk && currentData.length < 999) {
    const session = {
      id: generateId(),
      type: 'focus_session',
      title: 'Focus Session',
      content: `${document.getElementById('timer-mode').value} minute power session`,
      createdAt: new Date().toISOString()
    };

    await window.dataSdk.create(session);
  }

  resetTimer();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  document.getElementById('timer-display').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerProgress() {
  const mode = parseInt(document.getElementById('timer-mode').value);
  const totalSeconds = mode * 60;
  const progress = ((totalSeconds - timerSeconds) / totalSeconds) * 360;

  document.getElementById('timer-circle').style.background = 
    `conic-gradient(#4ecdc4 ${progress}deg, rgba(78, 205, 196, 0.2) ${progress}deg)`;
}

// UI Updates
function updateUI() {
  updateTasksList();
  updateNotesList();
  updateHabitsList();
}

function updateTasksList() {
  const tasks = currentData.filter(item => item.type === 'task');
  const container = document.getElementById('tasks-list');

  if (tasks.length === 0) {
    container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); text-align: center; padding: 2rem;">No tasks in your forge yet. Create your first task to start building your productive empire!</p>';
    return;
  }

  container.innerHTML = tasks.map(task => `
                <div class="task-item ${task.completed ? 'completed' : ''}">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')"></div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                            ${task.difficulty ? `<span class="difficulty-badge difficulty-${task.difficulty}">${task.difficulty}</span>` : ''}
                            ${task.category ? `<span style="color: rgba(255, 255, 255, 0.5);">${getCategoryIcon(task.category)} ${task.category}</span>` : ''}
                            ${task.dueDate ? `<span>📅 ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                        </div>
                    </div>
                    <button class="btn btn-coral" onclick="deleteTask('${task.id}')" style="padding: 0.5rem;">🗑️</button>
                </div>
            `).join('');
}

function updateNotesList() {
  const notes = currentData.filter(item => item.type === 'note');
  const container = document.getElementById('notes-list');

  if (notes.length === 0) {
    container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); text-align: center; padding: 2rem;">Your mind vault is empty. Start capturing your brilliant ideas and thoughts!</p>';
    return;
  }

  container.innerHTML = notes.map(note => `
                <div class="card" style="margin-bottom: 1rem;">
                    <div class="card-header">
                        <h3 style="font-size: 1.1rem; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                            ${getCategoryIcon(note.category)} ${note.title}
                        </h3>
                        <button class="btn btn-coral" onclick="deleteNote('${note.id}')" style="padding: 0.5rem;">🗑️</button>
                    </div>
                    <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 1rem; line-height: 1.6;">${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}</p>
                    ${note.tags ? `<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                        ${note.tags.split(',').map(tag => `<span style="background: rgba(78, 205, 196, 0.2); color: #4ecdc4; padding: 0.3rem 0.6rem; border-radius: 15px; font-size: 0.8rem; border: 1px solid rgba(78, 205, 196, 0.3);">#${tag.trim()}</span>`).join('')}
                    </div>` : ''}
                    <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.5);">
                        📅 ${new Date(note.createdAt).toLocaleDateString()}
                    </div>
                </div>
            `).join('');
}

function updateHabitsList() {
  const habits = currentData.filter(item => item.type === 'habit');
  const container = document.getElementById('habits-list');

  if (habits.length === 0) {
    container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); text-align: center; padding: 2rem;">No habits in your streak arsenal yet. Add your first habit to start building unstoppable momentum!</p>';
    return;
  }

  container.innerHTML = habits.map(habit => `
                <div class="habit-item">
                    <div class="habit-info">
                        <div class="habit-name">${getCategoryIcon(habit.category)} ${habit.title}</div>
                        <div class="habit-streak">Progress: ${habit.currentValue}/${habit.targetValue} today</div>
                    </div>
                    <div class="habit-progress">
                        <div class="streak-counter">${habit.streak} ${getStreakTypeDisplay(currentUser?.streakType || 'daily')}</div>
                        <button class="btn btn-gold" onclick="incrementHabit('${habit.id}')" style="padding: 0.5rem 1rem;">+1</button>
                        <button class="btn btn-coral" onclick="deleteHabit('${habit.id}')" style="padding: 0.5rem;">🗑️</button>
                    </div>
                </div>
            `).join('');
}

function updateDashboard() {
  const tasks = currentData.filter(item => item.type === 'task');
  const completedTasks = tasks.filter(task => task.completed);
  const notes = currentData.filter(item => item.type === 'note');
  const habits = currentData.filter(item => item.type === 'habit');
  const focusSessions = currentData.filter(item => item.type === 'focus_session');

  document.getElementById('completed-tasks').textContent = completedTasks.length;
  document.getElementById('focus-sessions').textContent = focusSessions.length;
  document.getElementById('notes-count').textContent = notes.length;

  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  document.getElementById('habit-streak').textContent = maxStreak;

  // Update progress bars
  const taskProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  document.getElementById('task-progress').style.width = `${taskProgress}%`;
}

function getCategoryIcon(category) {
  const icons = {
    'work': '💼',
    'personal': '🏠',
    'health': '💪',
    'learning': '📚',
    'creative': '🎨',
    'ideas': '💡',
    'journal': '📔',
    'productivity': '⚡',
    'mindfulness': '🧘',
    'social': '👥'
  };
  return icons[category] || '📋';
}

// Modal functions
function openTaskModal() {
  document.getElementById('task-modal').classList.add('active');
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('active');
}

function openNoteModal() {
  document.getElementById('note-modal').classList.add('active');
}

function closeNoteModal() {
  document.getElementById('note-modal').classList.remove('active');
}

function openHabitModal() {
  document.getElementById('habit-modal').classList.add('active');
}

function closeHabitModal() {
  document.getElementById('habit-modal').classList.remove('active');
}

function toggleAccountModal() {
  if (currentUser) {
    // Populate form with current user data
    document.getElementById('username-update-input').value = currentUser.username;
    document.getElementById('email-update-input').value = currentUser.email;
    document.getElementById('streak-type-update-input').value = currentUser.streakType;
    document.getElementById('account-modal').classList.add('active');
  }
}

function closeAccountModal() {
  document.getElementById('account-modal').classList.remove('active');
}

// Search functionality
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  if (!query) {
    updateUI();
    return;
  }

  const filteredData = currentData.filter(item => 
                                          item.title && item.title.toLowerCase().includes(query) ||
                                          (item.content && item.content.toLowerCase().includes(query)) ||
                                          (item.tags && item.tags.toLowerCase().includes(query)) ||
                                          (item.category && item.category.toLowerCase().includes(query))
                                         );

  // Update UI with filtered data
  const originalData = currentData;
  currentData = filteredData;
  updateUI();
  currentData = originalData;
}

// Utility functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.4s ease reverse';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

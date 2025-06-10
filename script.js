const tasks = [];
const API_KEY = 'Your_api_key'; // Replace with your actual API key
const CACHE_KEY = 'task-scheduler-tasks';

// Load tasks from cache when page loads
document.addEventListener('DOMContentLoaded', () => {
  const savedTasks = localStorage.getItem(CACHE_KEY);
  if (savedTasks) {
    tasks.push(...JSON.parse(savedTasks));
    updateTaskList();
  }
  updateOnlineStatus();
});

// Check online status
function updateOnlineStatus() {
  const statusElement = document.getElementById('connection-status');
  if (navigator.onLine) {
    statusElement.textContent = 'Online - Using AI scheduler';
    statusElement.className = 'online';
  } else {
    statusElement.textContent = 'Offline - Using local scheduler';
    statusElement.className = 'offline';
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

document.getElementById('addTask').addEventListener('click', () => {
  const name = document.getElementById('taskName').value;
  const priority = document.getElementById('taskPriority').value;
  const duration = document.getElementById('taskDuration').value;

  if (name && duration) {
    const task = { 
      name, 
      priority, 
      duration: parseInt(duration),
      id: Date.now() // Add unique ID for better task management
    };
    tasks.push(task);
    updateTaskList();
    saveTasksToCache();
    document.getElementById('taskName').value = '';
    document.getElementById('taskDuration').value = '';
  }
});

function saveTasksToCache() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(tasks));
}

function updateTaskList() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '<h3>Your Tasks:</h3>';
  
  if (tasks.length === 0) {
    taskList.innerHTML += '<p>No tasks added yet</p>';
    return;
  }
  
  tasks.forEach((task, index) => {
    taskList.innerHTML += `
      <div class="task-item" data-id="${task.id}">
        ${index + 1}. ${task.name} (${task.duration} mins, ${task.priority})
        <button class="delete-btn">×</button>
      </div>
    `;
  });

  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = parseInt(e.target.parentElement.getAttribute('data-id'));
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex > -1) {
        tasks.splice(taskIndex, 1);
        updateTaskList();
        saveTasksToCache();
      }
    });
  });
}

document.getElementById('generateSchedule').addEventListener('click', async () => {
  if (tasks.length === 0) {
    alert('Please add some tasks first!');
    return;
  }
  
  const scheduleDiv = document.getElementById('schedule');
  scheduleDiv.innerHTML = '<p class="loading">Generating schedule...</p>';
  
  try {
    let schedule;
    if (navigator.onLine) {
      try {
        schedule = await generateScheduleWithAPI(tasks);
      } catch (apiError) {
        console.warn('API failed, falling back to local scheduler', apiError);
        schedule = generateLocalSchedule(tasks);
      }
    } else {
      schedule = generateLocalSchedule(tasks);
    }
    
    renderSchedule(schedule);
  } catch (error) {
    console.error('Schedule generation failed:', error);
    scheduleDiv.innerHTML = `
      <p class="error">Error generating schedule. Please try again.</p>
      <p>${error.message}</p>
    `;
  }
});

// API-based scheduler
async function generateScheduleWithAPI(tasks) {
  // For demo purposes, we'll simulate an API call
  // In a real app, you would call your actual API endpoint
  console.log('Calling AI scheduling API...');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate 20% chance of API failure for demo purposes
  if (Math.random() < 0.2) {
    throw new Error('API service unavailable');
  }
  
  // In a real implementation, you would do:
  /*
  const response = await fetch('https://api.example.com/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      tasks: tasks,
      preferences: {
        start_time: 9 * 60,
        end_time: 17 * 60
      }
    })
  });
  
  if (!response.ok) throw new Error('API request failed');
  return await response.json();
  */
  
  // For demo, we'll use an enhanced local scheduler that simulates AI
  return generateLocalSchedule(tasks, true);
}

// Local scheduler with optional "AI simulation" mode
function generateLocalSchedule(tasks, simulateAI = false) {
  let sortedTasks = [...tasks];
  
  if (simulateAI) {
    // Simulate "AI" behavior with more complex sorting
    sortedTasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      // AI would consider both priority and duration
      const aScore = priorityOrder[a.priority] * 2 + (60 / Math.max(1, a.duration));
      const bScore = priorityOrder[b.priority] * 2 + (60 / Math.max(1, b.duration));
      return bScore - aScore;
    });
  } else {
    // Simple priority-based sorting for offline mode
    sortedTasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  let currentTime = 9 * 60; // Start at 9:00 AM (in minutes)
  return sortedTasks.map(task => {
    const startTime = formatTime(currentTime);
    currentTime += task.duration;
    const endTime = formatTime(currentTime);
    return { ...task, startTime, endTime };
  });
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function renderSchedule(schedule) {
  const scheduleDiv = document.getElementById('schedule');
  scheduleDiv.innerHTML = '<h3>📅 Your Optimized Schedule:</h3>';
  
  if (schedule.length === 0) {
    scheduleDiv.innerHTML += '<p>No tasks scheduled</p>';
    return;
  }
  
  schedule.forEach(task => {
    scheduleDiv.innerHTML += `
      <div class="time-block">
        <strong>${task.startTime} - ${task.endTime}</strong>: 
        ${task.name} (${task.priority} priority, ${task.duration} mins)
      </div>
    `;
  });

  // Productivity tips - different for online/offline
  const tips = navigator.onLine ? [
    "AI Tip: Schedule demanding tasks when you're typically most productive",
    "AI Tip: Consider batching similar short tasks together",
    "AI Tip: Leave buffer time between intense focus sessions"
  ] : [
    "Tip: Tackle high-priority tasks first thing in the morning",
    "Tip: Group similar tasks to reduce context switching",
    "Tip: Take regular breaks to maintain focus"
  ];
  
  scheduleDiv.innerHTML += `
    <div class="tip-box">
      💡 ${tips[Math.floor(Math.random() * tips.length)]}
    </div>
  `;
}

const socket = io();
const logElement = document.getElementById('log');
const opencvStatus = document.getElementById('opencvStatus');
const modeStatus = document.getElementById('modeStatus');
const currentScene = document.getElementById('currentScene');
const toggleLogButton = document.getElementById('toggleLogButton');
const sceneButtonsContainer = document.getElementById('sceneButtons');
const sceneChangeTimer = document.getElementById('sceneChangeTimer');

const connectionBanner = document.getElementById('connectionBanner');
socket.on('connect', () => {
    connectionBanner.classList.add('hidden');
});

socket.on('disconnect', () => {
    connectionBanner.classList.remove('hidden');
});

document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  fetchAppState();
});

function initializeEventListeners() {
  toggleLogButton.addEventListener('click', toggleLogVisibility);

  socket.on('state_changed', (data) => {
    updateState(JSON.parse(data));
  });
}

function fetchAppState() {
  fetch('/api/app-state')
    .then(response => response.json())
    .then(state => {
      updateState(state);
    })
    .catch(error => {
      console.trace(error);
      addLog("Error", `fetching OpenCV State: ${error}`);
    });
}

function updateState(state) {
  addLog("Error", JSON.stringify(state, null, 2))
  updateOpenCVStatus(state.openCvEnabled);
  updateModeStatus(state.detectionMode);
  updateCurrentScene(state.currentScene);
  generateSceneButtons(state.scenes);
  setSceneCountdown(state);
}

function updateOpenCVStatus(isEnabled) {
  opencvStatus.textContent = isEnabled ? "Running" : "Stopped";
  opencvStatus.classList.toggle('chip-running', isEnabled);
  opencvStatus.classList.toggle('chip-passive', !isEnabled);
}

function updateModeStatus(detectionMode) {
  const isActive = detectionMode === "active";
  modeStatus.textContent = isActive ? "Active" : "Passive";
  modeStatus.classList.toggle('chip-running', isActive);
  modeStatus.classList.toggle('chip-passive', !isActive);
}

function updateCurrentScene(currentSceneData) {
  try {
    currentScene.textContent = currentSceneData.name;
  } catch {
    currentScene.textContent = "Unknown";
  }
}

function generateSceneButtons(scenes) {
  sceneButtonsContainer.innerHTML = ''; // Clear existing buttons
  for (const sceneKey in scenes) {
    const scene = scenes[sceneKey];
    if (scene.isActive) {
      const button = createSceneButton(scene);
      sceneButtonsContainer.appendChild(button);
    }
  }
}

function createSceneButton(scene) {
  const button = document.createElement('button');
  button.className = 'bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 p-4 rounded m-1';
  button.textContent = scene.name;

  button.addEventListener('click', () => {
    socket.emit('admin_event', { event: "change_scene", payload: scene });
  });

  return button;
}

function setSceneCountdown(state) {
  if (state.nextSceneTime) {
    clearSceneCountdown();
    startSceneCountdown(new Date(state.nextSceneTime).getTime());
  } else {
    sceneChangeTimer.textContent = "00:00:00";
  }
}

function clearSceneCountdown() {
  if (sceneChangeTimer.interval) {
    clearInterval(sceneChangeTimer.interval);
  }
}

function startSceneCountdown(nextSceneTimestamp) {
  const updateCountdown = () => {
    const timeLeft = Math.max((nextSceneTimestamp - Date.now()) / 1000, 0);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = Math.floor(timeLeft % 60);

    sceneChangeTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (timeLeft <= 0) {
      clearInterval(sceneChangeTimer.interval);
    }
  };

  updateCountdown();
  sceneChangeTimer.interval = setInterval(updateCountdown, 1000);
}

function toggleLogVisibility() {
  if (logElement.classList.contains('expanded')) {
    logElement.classList.remove('expanded');
    toggleLogButton.textContent = 'Show Debugging';
  } else {
    logElement.classList.add('expanded');
    toggleLogButton.textContent = 'Hide Debugging';
  }
}

function addLog(tag, message) {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMessage = `[${timestamp}] [${tag.toUpperCase()}]:\n${message}`;

  const logLine = document.createElement('div');
  logLine.textContent = formattedMessage;

  if (tag.toLowerCase() === "error") {
    logLine.style.color = 'red';
  }

  // Append the log line to the log element
  logElement.appendChild(logLine);

  // Add a divider line
  const divider = document.createElement('hr');
  divider.style.margin = '4px 0'; // Adjust spacing around the divider if needed
  divider.style.opacity = .25;
  logElement.appendChild(divider);

  // Limit the number of log entries
  const lines = logElement.children;
  while (lines.length > 21) { // 10 logs + 10 dividers + 1 divider before the first log
    logElement.removeChild(lines[0]);
  }

  logElement.scrollTop = logElement.scrollHeight;
}
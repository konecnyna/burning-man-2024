const logElement = document.getElementById('log');
const socket = io();


function fetchAppState() {
  console.log("send it!")
  fetch('/api/opencv-state')
    .then(response => response.json())
    .then(state => {
      addLog(`OpenCV State: ${JSON.stringify(state, null, 2)}`);
      updateState(state)
    })
    .catch(error => {
      console.trace(error)
      addLog(`Error fetching OpenCV State: ${error}`);
    });
}

fetchAppState()


socket.on('state_changed', (data) => {  
  updateState(data)
})


function addLog(message) {
  const lines = logElement.innerText.split('\n');
  lines.push(message);
  if (lines.length > 10) {
    lines.shift();
  }
  logElement.innerText = lines.join('\n');
  logElement.scrollTop = logElement.scrollHeight;
}


document.getElementById('fluidButton').addEventListener('click', () => {
  socket.emit('admin_event', { event: "update_current_app", payload: { name: "Fluid Dreams", url: '/app/scenes/fluid-sim/index.html' } });
});

document.getElementById('neonButton').addEventListener('click', () => {
  socket.emit('admin_event', { event: "update_current_app", payload: { name: "Core Memories", url: '/app/scenes/neon-white-board/index.html' } });
});


document.getElementById('toggleLogButton').addEventListener('click', function () {
  const log = document.getElementById('log');
  const button = document.getElementById('toggleLogButton');
  if (log.classList.contains('expanded')) {
      log.classList.remove('expanded');
      button.textContent = 'Show Debugging';
  } else {
      log.classList.add('expanded');
      button.textContent = 'Hide Debugging';
  }
});

function updateState(state) {
  const opencvStatus = document.getElementById('opencvStatus');
  const modeStatus = document.getElementById('modeStatus');
  const currentScene = document.getElementById('currentScene');

  if (state.active) {
    opencvStatus.textContent = "Running";
    opencvStatus.classList.remove('chip-passive');
    opencvStatus.classList.add('chip-running');
  } else {
    opencvStatus.textContent = "Stopped";
    opencvStatus.classList.remove('chip-running');
    opencvStatus.classList.add('chip-passive');
  }


  modeStatus.textContent = state.detectionMode || "Passive";
  if (state.detectionMode == "active") {
    modeStatus.textContent = "Active";
    modeStatus.classList.remove('chip-passive');
    modeStatus.classList.add('chip-running');
  } else {
    modeStatus.textContent = "Passive";
    modeStatus.classList.remove('chip-running');
    modeStatus.classList.add('chip-passive');
  }
  
  setSceneCountdown(state)
  currentScene.textContent = state.currentScene || "Unknown"; 
}


function setSceneCountdown(state) {
  console.log("!go")
  const sceneChangeTimer = document.getElementById('sceneChangeTimer');

  if (state.nextSceneTime) {
    console.log("!!")
    if (sceneChangeTimer.interval) {
      clearInterval(sceneChangeTimer.interval);
    }

    const nextSceneTimestamp = new Date(state.nextSceneTime).getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const timeLeft = Math.max((nextSceneTimestamp - now) / 1000, 0);
      
      const minutes = Math.floor(timeLeft / 60);
      const seconds = Math.floor(timeLeft % 60);

      sceneChangeTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // Stop the countdown when it reaches 0
      if (timeLeft <= 0) {
        clearInterval(sceneChangeTimer.interval);
      }
    };

    // Start the countdown
    updateCountdown(); // Initial call
    sceneChangeTimer.interval = setInterval(updateCountdown, 1000);
  } else {
    console.log("!boo")
    sceneChangeTimer.textContent = "00:00:00";
  }
}

const logElement = document.getElementById('log');
const socket = io();

socket.on('open_cv_event', (data) => {
  addLog(data);
});


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

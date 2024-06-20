const logElement = document.getElementById('log');
const socket = io();

socket.on('pythonOutput', (data) => {
  addLog(data);
});

socket.on('pythonError', (error) => {
  addLog('ERROR: ' + error);
});

socket.on('pythonClose', (message) => {
  addLog(message);
});

function addLog(message) {
  const lines = logElement.innerText.split('\n');
  lines.push(message);
  if (lines.length > 10) {
    lines.shift(); // Remove the oldest log to keep only 10 lines
  }
  logElement.innerText = lines.join('\n');
  logElement.scrollTop = logElement.scrollHeight; // Scroll to the bottom
}

document.getElementById('fluidButton').addEventListener('click', () => {
  socket.emit('update_current_app', { url: 'http://localhost:3000/fluid-sim/index.html' });
});

document.getElementById('neonButton').addEventListener('click', () => {
  socket.emit('update_current_app', { url: 'http://localhost:3000/neon-white-board/index.html' });
});

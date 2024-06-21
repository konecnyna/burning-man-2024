const logElement = document.getElementById('log');
const socket = io();

socket.on('open_cv_event', (data) => {
  addLog(data);
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


document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fluidButton').addEventListener('click', () => {
    console.log("CLICK!!!!!!")
    socket.emit('admin_event', { event: "update_current_app", payload: { url: '/app/scenes/fluid-sim/index.html' } });
  });

  document.getElementById('neonButton').addEventListener('click', () => {
    socket.emit('admin_event', { event: "update_current_app", payload: { url: '/app/scenes/neon-white-board/index.html' } });
  });

})

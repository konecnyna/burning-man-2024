const iframe = document.getElementById('appFrame');
const socket = io();

document.getElementById('fluidButton').addEventListener('click', () => {
  socket.emit('update_current_app', { url: 'http://localhost:3000/fluid-sim/index.html' });
});

document.getElementById('neonButton').addEventListener('click', () => {
  socket.emit('update_current_app', { url: 'http://localhost:3000/neon-white-board/index.html' });
});

socket.on('update_current_app', (data) => {
  console.log(data)
  const url = data.url;
  iframe.src = url;
});

const iframe = document.getElementById('appFrame');
const socket = io();

document.getElementById('fluidButton').addEventListener('click', () => {
  
  socket.emit('update_current_app', { url: 'http://localhost:3000/fluid-sim/index.html' });
});

document.getElementById('neonButton').addEventListener('click', () => {
  socket.emit('update_current_app', { url: 'http://localhost:3000/neon-white-board/index.html' });
});

socket.on('update_current_app', (data) => {
  console.log(data, "______!!!!!!!!!")
  const url = data.url;
  iframe.src = url;
});


socket.on('open_cv_event', (data) => {
  console.log(data, "______!!!!!!!!!")
});
// src/server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const OpenCvEventBus = require("./opencv-event-bus")
const openCvEventBus = new OpenCvEventBus(io)

app.use(express.static(path.join(__dirname, '../apps')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server listening on port http://localhost:3000');
  console.log('Demo app http://localhost:3000/neon-white-board/index.html');
  openCvEventBus.start()
});

// Graceful shutdown
process.on('SIGINT', () => {
  pythonProcess.kill('SIGINT');
  process.exit();
});
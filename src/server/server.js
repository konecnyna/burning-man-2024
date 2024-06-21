// src/server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const path = require('path');
const OpenCvEventBus = require("./core/opencv-event-bus")
const State = require("./core/state")

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


// Global state.
const state = new State(
  isMockModeFlag = false,
  pythonDebugging = false
)

const openCvEventBus = new OpenCvEventBus(io, state)


app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('admin_event', (data) => {
    console.log(`incoming event: ${data}`)
    try {
      const { event, payload} = data
      io.emit(event, payload)  
    } catch (error) {
      console.trace(error)
      console.error("Error emitting event!")
    }    
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server listening on port http://localhost:3000/app');  
  //openCvEventBus.start()
});

// Graceful shutdown
process.on('SIGINT', () => {
  openCvEventBus.stop()
  process.exit();
});
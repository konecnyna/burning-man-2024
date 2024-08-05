// src/server/server.js
const express = require('express');
const path = require("path")
const http = require('http');
const socketIo = require('socket.io');
const OpenCvEventBus = require("./core/opencv-event-bus")
const State = require("./core/state")
const Video = require("./core/video")

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


// Global state.
const state = new State({
  openCvState: {
    debugging: true,
    active: true,
    showVideo: false,
    isMockMode: false,
    rtspUrl: null,
  }
})

const openCvEventBus = new OpenCvEventBus(io, state.openCvState)

app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });


io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('hand_detect', (data) => {
    safeBroadcast("hand_detect", data)
  });

  socket.on('index_finger_detect', (data) => {
    safeBroadcast("index_finger_detect", data)
  });

  socket.on('object_detected', (data) => {
    safeBroadcast("object_detected", data)
  });

  socket.on('admin_event', (data) => {
    safeBroadcast("admin_event", data)    
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

function safeBroadcast(event, payloadObject) {
  try {
    io.emit(event, JSON.stringify(payloadObject))
  } catch (error) {
    console.trace(error)
    console.error("Error emitting event!")
  }
}

server.listen(3000, () => {
  console.log('Server listening on port http://localhost:3000/app');
  if (state.openCvState.active) {
    openCvEventBus.start()
  } else {
    console.log("Not running opencv state active = false")
  }
});

process.on('SIGINT', () => {
  if (state.openCvState.active) {
    openCvEventBus.stop()
  }

  process.exit();
});
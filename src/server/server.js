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

io.on('connection', (socket) => {
  socket.on('video-data', (data) => {
    socket.broadcast.emit('video-data', data);
  });
});

// Global state.
const state = new State({
  openCvState: {
    debugging: true,
    active: true,
    showVideo: true,
    isMockMode: false,
    rtspUrl: null,
  }
})

const openCvEventBus = new OpenCvEventBus(io, state.openCvState)
const videoTransport = new Video(io, openCvEventBus)
videoTransport.listen()

app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });


io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('admin_event', (data) => {
    console.log(`incoming event: ${JSON.stringify(data)}`)
    try {
      const { event, payload } = data
      io.emit(event, JSON.stringify(payload))
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
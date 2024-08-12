// src/server/server.js
const express = require('express');
const path = require("path")
const http = require('http');
const socketIo = require('socket.io');
const OpenCvEventBus = require("./core/opencv-event-bus")
const StateManager = require("./core/state-manager")
const EventManager = require("./core/event-manager");


const app = express();
const server = http.createServer(app);
const io = socketIo(server);


const stateManager = new StateManager({
  openCvState: {
    debugging: true,
    openCvEnabled: true,
    showVideo: false,
    isMockMode: false,
    rtspUrl: null,
  }
})
const eventManager = new EventManager(stateManager, io)
const openCvEventBus = new OpenCvEventBus(io, stateManager.state)

app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/api/app-state', (req, res) => {
  res.json(stateManager.state);
});


io.on('connection', async (socket) => {
  eventManager.socketConnection(socket)
});


server.listen(3000, () => {
  stateManager.broadcastState(io)
  console.log('Server listening on port http://localhost:3000/app');
  if (stateManager.state.openCvEnabled) {
    openCvEventBus.start()
  } else {
    console.log("Not running opencv state active = false")
  }    
});

process.on('SIGINT', () => {
  if (stateManager.state.openCvEnabled) {
    openCvEventBus.stop()
  }

  process.exit();
});

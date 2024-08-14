// src/server/server.js
const express = require('express');
const path = require("path")
const http = require('http');
const socketIo = require('socket.io');
const OpenCvEventBus = require("./core/opencv-event-bus")
const StateManager = require("./core/state-manager")
const EventManager = require("./core/event-manager");
const { SceneManager } = require("./core/scene-manager");


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const stateManager = new StateManager(
  io,
  {
    openCvState: {
      debugging: true,
      openCvEnabled: false,
      showVideo: true,
      isMockMode: false,
      //rtspUrl: "/Users/defkon/Desktop/mode-tranisition-test.mp4",
    }
  }
)
const eventManager = new EventManager(stateManager, io)
const openCvEventBus = new OpenCvEventBus(io, stateManager.state)
const sceneManager = new SceneManager(stateManager)

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
    console.log("🟡 Not running opencv state 'openCvEnabled=false'")
    setTimeout(async () => {
      stateManager.updateStateAndBroadcast(
        {
          currentScene: sceneManager.nextScene(),
          detectionMode: "active"
        }
      )
    }, 2500);
  }
});

process.on('SIGINT', () => {
  if (stateManager.state.openCvEnabled) {
    openCvEventBus.stop()
  }

  process.exit();
});

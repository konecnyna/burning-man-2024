// src/server/server.js
const express = require('express');
const path = require("path")
const http = require('http');
const socketIo = require('socket.io');
const OpenCvEventBus = require("./core/opencv-event-bus")
const StateManager = require("./core/state-manager")
const EventManager = require("./core/event-manager");
const { scenes } = require("./core/scene-manager");
//const startupScript = require("./core/start-up");


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const debugState = {
  openCvState: {
    debugging: true,
    openCvEnabled: true,
    showVideo: true,
    isMockMode: false,
    //rtspUrl: "/Users/defkon/Desktop/mode-tranisition-test.mp4",
  }
}

const productionState = {
  openCvState: {
    debugging: false,
    openCvEnabled: true,
    showVideo: false,
    isMockMode: false,
    //rtspUrl: "/Users/defkon/Desktop/mode-tranisition-test.mp4",
  }
}

const stateManager = new StateManager(io, debugState)

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
    console.log("🟡 Not running opencv state 'openCvEnabled=false'")
  }
  

  // setTimeout(() => {
  //   console.log("🟡 send it!")
  //   stateManager.updateStateAndBroadcast({
  //     detectionMode: "active"
  //   })
  // }, 8000)
  
  // startupScript()
});


// Function to execute shell commands
const { exec } = require('child_process');
function executeCommand(command, silent = false) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error && !silent) {
        console.trace(error)
      }
      resolve(stdout.trim());
    });
  });
}

process.on('SIGINT', () => {
  if (stateManager.state.openCvEnabled) {
    openCvEventBus.stop()
    executeCommand("pkill Python")
    executeCommand("pkill Google")
  }

  process.exit();
});

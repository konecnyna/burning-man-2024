const { SceneManager } = require("./scene-manager");



module.exports = class EventManager {
  constructor(stateManager, io) {
    this.stateManager = stateManager;
    this.io = io;
    this.sceneManager = new SceneManager(stateManager)
  }

  socketConnection(socket) {
    console.log('a user connected');

    socket.on('hand_detect', (data) => {
      this.safeBroadcast("hand_detect", data)
    });

    socket.on('hand_detect_new', (data) => {
      this.safeBroadcast("hand_detect_new", data)
    });

    socket.on('index_finger_detect', (data) => {
      this.safeBroadcast("index_finger_detect", data)
    });

    socket.on('object_detected', (data) => {
      this.safeBroadcast("object_detected", data)
    });

    socket.on('admin_event', (data) => {
      this.safeBroadcast("admin_event", data)
    });

    socket.on("detection_mode", (data) => {
      let nextSceneTime = null
      if (data.mode == "active") {
        nextSceneTime = new Date()
      }

      const newScene = this.sceneManager.changeScene()
      const newState = this.stateManager.updateState({
        detectionMode: data.mode,
        nextSceneTime,
        currentScene: newScene
      })

      this.stateManager.broadcastState(this.io)
    });

    socket.on("pythonClose", (data) => {
      console.log(`detect! `, data)
      // let nextScene = null
      // if(data.mode == "active") {
      //     nextScene = new Date()
      // }

      // state.updateState({ detectionMode: data.mode, nextScene: nextScene })
      // this.safeBroadcast("state_changed", state.openCvState)
    });


    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  }

  safeBroadcast(event, payloadObject) {
    try {
      this.io.emit(event, JSON.stringify(payloadObject))
    } catch (error) {
      console.trace(error)
      console.error("Error emitting event!")
    }
  }
}
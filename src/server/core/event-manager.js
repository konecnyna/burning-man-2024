const { SceneManager } = require("./scene-manager");



module.exports = class EventManager {
  constructor(stateManager, io) {
    this.stateManager = stateManager;
    this.io = io;
    this.sceneManager = new SceneManager(stateManager)
  }

  socketConnection(socket) {
    socket.on('face_detect', (data) => {
      this.stateManager.faceDetected(data)
    });

    socket.on('hand_detect_new', (data) => {
      this.safeBroadcast("hand_detect_new", data.map(it => {
        it["handDebugging"] = this.stateManager.state.handDebugging
        return it
      }))

      this.stateManager.faceDetected(data)
    });

    socket.on('admin_event', (data) => {
      switch(data.event) {
        case "change_scene":
          if (data.payload.id) {
            this.stateManager.nextScene(data.payload.id)
          } else  {
            this.stateManager.nextActiveScene()
          }
          break;
        case "reset_screen_time":
          this.stateManager.resetNextSceneTime()
          break;
      }
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
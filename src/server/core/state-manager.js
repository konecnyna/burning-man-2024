const {scenes} = require("./scene-manager");


const CAMERA_URL = 0

module.exports = class StateManager {
  constructor({ openCvState = {} } = {}) {
    const defaultOpenCvState = {
      debugging: false,
      openCvPythonRunning: false,
      showVideo: false,
      isMockMode: false,
      rtspUrl: null,
      detectionMode: "passive",
      currentScene: scenes.loading,
      nextSceneTime: CAMERA_URL
    }
    
    this.state = { ...defaultOpenCvState, ...openCvState };
  }

  isInActiveMode() {
    return this.state.detectionMode.toLowerCase() === "active"
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    return this.state
  }

  broadcastState(io) {
    try {
      io.emit("state_changed", JSON.stringify(this.state))
    } catch (error) {
      console.trace(error)
      console.error("Error emitting event!")
    }
  }
}



const { scenes } = require("./scene-manager");

const CAMERA_URL = 0;

module.exports = class StateManager {
  constructor(io, { openCvState = {} } = {}) {
    this.io = io;
    const defaultOpenCvState = {
      debugging: false,
      openCvPythonRunning: false,
      showVideo: false,
      isMockMode: false,
      rtspUrl: CAMERA_URL,
      detectionMode: "passive",
      currentScene: scenes.loading,
      nextSceneTime: this.getFutureDate(1),
      scenes: scenes,
    };

    this.activeScenes = Object.values(scenes).filter(scene => scene.isActive);
    this.currentSceneIndex = 0;

    this.state = { ...defaultOpenCvState, ...openCvState };
    this.startSceneCheckInterval();
  }

  isInActiveMode() {
    return this.state.detectionMode.toLowerCase() === "active";
  }

  updateStateAndBroadcast(newState) {
    let nextSceneTime = this.state.nextSceneTime;
    if (newState.currentScene.id !== this.state.currentScene.id) {
      nextSceneTime = this.getFutureDate(1); // Update to 5 minutes in the future
    }

    this.state = { ...this.state, ...newState, nextSceneTime };
    this.broadcastState();
  }

  broadcastState() {
    try {
      this.io.emit("state_changed", JSON.stringify(this.state));
    } catch (error) {
      console.trace(error);
      console.error("Error emitting event!");
    }
  }

  getFutureDate(minutes) {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + minutes);
    // futureDate.getSeconds(futureDate.getSeconds() + 25);
    return futureDate;
  }

  startSceneCheckInterval() {
    setInterval(() => {
      const now = new Date();
      if (now >= this.state.nextSceneTime) {
        const nextScene = this.nextScene();
        this.updateStateAndBroadcast({ currentScene: nextScene });
      }
    }, 1000);
  }


  nextScene() {
    if (this.isInActiveMode()) {
      this.currentSceneIndex = (this.currentSceneIndex + 1) % this.activeScenes.length;
      const nextScene = this.activeScenes[this.currentSceneIndex];
      return nextScene;
    } else {
      return scenes.passive;      
    }
  }
};
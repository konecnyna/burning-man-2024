const { scenes } = require("./scene-manager");

const CAMERA_URL = 0;

module.exports = class StateManager {
  constructor(io, { openCvState = {} } = {}) {
    this.io = io;
    const defaultOpenCvState = {
      debugging: false,
      handDebugging: true,
      openCvPythonRunning: false,
      showVideo: false,
      isMockMode: false,
      rtspUrl: CAMERA_URL,
      detectionMode: "passive",
      currentScene: scenes.loading,
      nextSceneTime: this.getFutureDate(5),
      scenes: scenes,
    };

    this.activeScenes = Object.values(scenes).filter(scene => scene.isActive);
    this.currentSceneIndex = 0;

    this.state = { ...defaultOpenCvState, ...openCvState };
    this.startSceneCheckInterval();
    this.resetPassiveModeTimer();  // Initialize the passive mode timer
  }

  resetPassiveModeTimer() {
    if (this.passiveModeTimer) {
      clearTimeout(this.passiveModeTimer);
    }

    this.passiveModeTimer = setTimeout(() => {
      console.log("passive!")
      this.updateStateAndBroadcast({ detectionMode: "passive", currentScene: scenes.passive });
    }, 1 * 60 * 1000);
  }

  isInActiveMode() {
    return this.state.detectionMode.toLowerCase() === "active";
  }

  updateStateAndBroadcast(newState) {
    let nextSceneTime = this.state.nextSceneTime;
    if (newState.currentScene && newState.currentScene.id !== this.state.currentScene.id) {
      nextSceneTime = this.getFutureDate(5);
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
    return futureDate;
  }

  startSceneCheckInterval() {
    setInterval(() => {
      const now = new Date();
      if (now >= this.state.nextSceneTime && this.isInActiveMode()) {
        this.nextActiveScene();
      }
    }, 1000);
  }

  nextActiveScene(id) {
    let nextScene = Object.values(scenes).find(scene => scene.id === id);
    if (!nextScene) {
      this.currentSceneIndex = (this.currentSceneIndex + 1) % this.activeScenes.length;
      nextScene = this.activeScenes[this.currentSceneIndex];
    }

    this.updateStateAndBroadcast({ currentScene: nextScene, nextSceneTime: new Date() });
  }

  faceDetected(data) {
    console.log("face!");
    const { score } = data;

    if (score > 0.90) {
      console.log("good!");
      const lastDectionMode = this.state.detectionMode
      this.updateStateAndBroadcast({ detectionMode: "active" });
      this.resetPassiveModeTimer();  // Reset the timer whenever a face with a high score is detected
      if (lastDectionMode === "passive") {
        console.log("ty next!");
        this.nextActiveScene();
      }
    }
  }
};
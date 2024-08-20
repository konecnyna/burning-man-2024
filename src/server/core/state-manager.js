const { scenes } = require("./scene-manager");

const CAMERA_URL = 0;
const DEFAULT_SCENE_TIME = 3;

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
      currentScene: scenes.passive,
      nextSceneTime: this.getFutureDate(),
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
      this.updateStateAndBroadcast({ detectionMode: "passive", currentScene: scenes.passive });
    }, 10 * 60 * 1000);
  }

  isInActiveMode() {
    return this.state.detectionMode.toLowerCase() === "active";
  }

  updateStateAndBroadcast(newState) {
    if (!newState) {
      throw Error("no state provided!")
    }
    
    this.state = { ...this.state, ...newState };
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

  getFutureDate(minutes=DEFAULT_SCENE_TIME) {
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

  nextActiveScene() {
    this.currentSceneIndex = (this.currentSceneIndex + 1) % this.activeScenes.length;
    const nextScene = this.activeScenes[this.currentSceneIndex];
    this.updateStateAndBroadcast({ currentScene: nextScene, nextSceneTime: this.getFutureDate() });
  }

  nextScene(id) {
    let nextScene = Object.values(scenes).find(scene => scene.id === id);
    this.updateStateAndBroadcast({ currentScene: nextScene, nextSceneTime: this.getFutureDate() });
  }

  faceDetected(data) {
    const lastDectionMode = this.state.detectionMode
    this.resetPassiveModeTimer();  // Reset the timer whenever a face with a high score is detected
    if (lastDectionMode === "passive") {
      this.updateStateAndBroadcast({ detectionMode: "active" });
      this.nextActiveScene();
    }
  }

  resetNextSceneTime(minutes = DEFAULT_SCENE_TIME) {
    this.updateStateAndBroadcast({ nextSceneTime: this.getFutureDate(minutes) });
  }
};
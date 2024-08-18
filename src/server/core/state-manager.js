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
      currentScene: scenes.passive,
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
    const changedKeys = Object.keys(newState).filter(key =>
      this.state[key] !== newState[key]
    );

    if (changedKeys.length > 0) {
      console.log("Changed parts of the state:", changedKeys);
      changedKeys.forEach(key => {
        console.log(`State change - ${key}:`, {
          oldValue: this.state[key],
          newValue: newState[key]
        });
      });
    } else {
      console.log("No changes detected in the state.");
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

  nextActiveScene() {
    this.currentSceneIndex = (this.currentSceneIndex + 1) % this.activeScenes.length;
    nextScene = this.activeScenes[this.currentSceneIndex];
    this.updateStateAndBroadcast({ currentScene: nextScene, nextSceneTime: this.getFutureDate(5) });
  }

  nextScene(id) {
    let nextScene = Object.values(scenes).find(scene => scene.id === id);
    this.updateStateAndBroadcast({ currentScene: nextScene, nextSceneTime: this.getFutureDate(5) });
  }

  faceDetected(data) {
    const { score } = data;

    if (score > 0.90) {
      const lastDectionMode = this.state.detectionMode
      this.resetPassiveModeTimer();  // Reset the timer whenever a face with a high score is detected
      if (lastDectionMode === "passive") {
        this.updateStateAndBroadcast({ detectionMode: "active" });
        this.nextActiveScene();
      }
    }
  }
};
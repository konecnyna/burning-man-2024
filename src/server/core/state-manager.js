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
  }

  isInActiveMode() {
    return this.state.detectionMode.toLowerCase() === "active";
  }

  updateStateAndBroadcast(newState) {
    let nextSceneTime = this.state.nextSceneTime;
    if (newState.currentScene.id !== this.state.currentScene.id) {
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
      if (now >= this.state.nextSceneTime) {
        this.nextScene();        
      }
    }, 1000);
  }

  nextScene(id) {
    if (this.isInActiveMode()) {
      let nextScene = Object.values(scenes).find(scene => scene.id === id);
      if (!nextScene) {
        this.currentSceneIndex = (this.currentSceneIndex + 1) % this.activeScenes.length;
        nextScene = this.activeScenes[this.currentSceneIndex];
      }
          
      this.updateStateAndBroadcast({ currentScene: nextScene, nextSceneTime: new Date() });
    } else {
      return scenes.passive;      
    }
  }
};
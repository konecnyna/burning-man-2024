

module.exports = class StateManager {
  constructor({
    startScene = "http://localhost:3000/neon-white-board/index.html",
    openCvState = {}
  } = {}) {
    const defaultOpenCvState = {
      debugging: false,
      active: true,
      showVideo: false,
      isMockMode: false,
      rtspUrl: null,
      detectionMode: "passive",
      currentScene: "fluid-sim",
      nextSceneTime: null
    }
    this.startScene = startScene;
    this.state = { ...defaultOpenCvState, ...openCvState };
  }

  isInActiveMode() {
    console.log("!!!!!!stae")
    return this.state.detectionMode.toLowerCase() === "active"
  }

  updateState(newState) {
    console.log(`Updating state:\n${JSON.stringify({ ...this.openCvState, ...newState }, null, 2)}`)
    this.state = { ...this.openCvState, ...newState };
  }
}



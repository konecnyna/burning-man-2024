

class State {
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
    }
    this.startScene = startScene;
    this.openCvState = { ...defaultOpenCvState, ...openCvState };
  }

  updateState(newState) {
    this.openCvState = { ...this.openCvState, ...newState.openCvState };   
  }
}


module.exports = State
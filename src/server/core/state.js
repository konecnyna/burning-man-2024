

class State {
  constructor({
    startScene = "http://localhost:3000/neon-white-board/index.html",
    openCvState = {}
  } = {}) {
    const defaultOpenCvState = {
      debugging: false,
      active: true,
      showVideo: true,
      isMockMode: false,
      rtspUrl: null,
    }
    this.startScene = startScene;
    this.openCvState = { ...defaultOpenCvState, ...openCvState };
  }
}


module.exports = State
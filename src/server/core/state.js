

class State {
  constructor({
    startScene = "http://localhost:3000/neon-white-board/index.html",
    debugging = false,
    openCvState = {}
  } = {}) {
    const defaultOpenCvState = {
      debugging: false,
      active: true,
      showVideo: false,
      isMockMode: false,
      rtspUrl: null,
    }
    this.startScene = startScene;
    this.openCvState = { ...defaultOpenCvState, ...openCvState };
  }
}


module.exports = State
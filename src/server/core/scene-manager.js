
module.exports = class SceneManager {
  constructor(stateManager) {
    this.stateManager = stateManager
  }
  scenes = [
    { id: "fluid-sim", url: '/app/scenes/fluid-sim/index.html', instructions: ["Wave you hand to move the particles around."], name: "Fluid waves" },
    { id: "passive", url: '/app/scenes/passive/index.html', instructions: ["Passive mode uses IR cameara."], name: "Fluid waves" }
  ];


  changeScene() {
    if (this.stateManager.isInActiveMode()) {
      return this.scenes["fluid-sim"]
    } else {
      return this.scenes["fluid-sim"]
    }
  }
}
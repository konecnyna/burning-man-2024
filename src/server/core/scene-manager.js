const scenes = {
  loading: {
    id: "loading", url: '/app/scenes/loading/index.html', instructions: ["Start up scene"], name: "Loading"
  },
  passive: {
    id: "passive", url: '/app/scenes/passive/index.html', instructions: ["Passive mode uses IR cameara."], name: "Passive mode"
  },
  fluidSim: {
    id: "fluid-sim", url: '/app/scenes/fluid-sim/index.html', instructions: ["Wave you hand to move the particles around."], name: "Fluid waves"
  }
};

class SceneManager {
  constructor(stateManager) {
    this.stateManager = stateManager
  }


  changeScene() {
    if (this.stateManager.isInActiveMode()) {
      return scenes.fluidSim
    } else {
      return scenes.passive
    }
  }
}



module.exports  = { SceneManager, scenes }
const scenes = {
  loading: {
    id: "loading", url: '/app/scenes/loading/index.html', instructions: ["Start up scene"], name: "Loading"
  },
  passive: {
    id: "passive", url: '/app/scenes/passive/index.html', instructions: ["Come close to the looking glass to enable active mode"], name: "Passive mode"
  },
  fluidSim: {
    id: "fluid-sim", url: '/app/scenes/fluid-sim/index.html', instructions: ["Wave you hand to move the particles around."], name: "Fluid waves"
  },
  orbits: {
    id: "orbits", url: '/app/scenes/orbits/index.html', instructions: ["Move your hand to navigate the universe"], name: "Tripping through Space"
  }
};

class SceneManager {
  constructor(stateManager) {
    this.stateManager = stateManager,


    this.activeScenes = [
      scenes.fluidSim, scenes.orbits
    ]
  }


  changeScene() {
    if (this.stateManager.isInActiveMode()) {
      return scenes.fluidSim
    } else {
      return scenes.fluidSim
    }
  }
}



module.exports  = { SceneManager, scenes }
const scenes = {
  loading: {
    id: "loading", url: '/app/scenes/loading/index.html', instructions: ["Start up scene"], name: "Loading", isActive: false,
  },
  passive: {
    id: "passive", url: '/app/scenes/passive/index.html', instructions: ["Come close to the looking glass to enable active mode"], name: "Passive mode", isActive: false,
  },
  fluidSim: {
    id: "fluid_sim", url: '/app/scenes/fluid-sim/index.html', instructions: ["Wave you hand to move the particles around."], name: "Fluid waves", isActive: true,
  },
  orbits: {
    id: "orbits", url: '/app/scenes/orbits/index.html', instructions: ["Move your hand to navigate the universe"], name: "Tripping through Space", isActive: true,
  },
  puddle: {
    id: "puddle", url: '/app/scenes/puddle/index.html', instructions: ["Wave hand to make waves"], name: "Iridescent Puddle", isActive: true,
  },
  cosmicSymbolism: {
    id: "cosmic_symbolism", url: '/app/scenes/cosmic-symbolism/index.html', instructions: ["Move hand up and down to travel the cosmos faster"], name: "Cosmic Symbolism", isActive: true,
  },
  tieDye: {
    id: "tie_dye", url: '/app/scenes/tie-dye/index.html', instructions: ["Move your hands to make tie dye"], name: "Tie Dye", isActive: true,
  },
  neonPaint: {
    id: "neon_pain", url: '/app/scenes/neon-white-board/index.html', instructions: ["Move your hands to make tie dye"], name: "Neon Paint", isActive: true,
  }

};

class SceneManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.activeScenes = Object.values(scenes).filter(scene => scene.isActive);
    this.currentSceneIndex = 0;
  }
}

module.exports = { SceneManager, scenes };
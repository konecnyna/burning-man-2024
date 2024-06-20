

class State {
  constructor(isMockMode = false, pythonDebugging = false, url="http://localhost:3000/neon-white-board/index.html") {
    this.isMockMode = isMockMode
    this.currentUrl = url
    this.pythonDebugging = pythonDebugging
  }
}


module.exports = State
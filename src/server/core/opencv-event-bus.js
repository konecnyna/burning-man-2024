const { spawn } = require('child_process');
const path = require('path');

class OpenCvEventBus {
  constructor(io, state) {
    this.io = io;
    this.state = state;
    this.pythonProcess = null;
  }

  start() {
    const args = ['main.py']
    if (this.state.isMockMode) {
      args.push("--mock-mode")
    }

    if (this.state.showVideo) {
      args.push("--show-cv")
    }

    if (this.state.rtspUrl) {
      args.push("--url", this.state.rtspUrl)
    }

    console.log(`Starting script: python3 ${args.join(" ")}`)
    this.pythonProcess = spawn('python3', args, { cwd: path.join(__dirname, '../../cv') })

    this.pythonProcess.stdout.on('data', (data) => {
      try {
        const lines = data.toString().split("\n").filter(it => it)
        lines.forEach(line => {
          const json = JSON.parse(line.trim())
          if (this.state.debugging) {
            console.log(line.trim());
          }
    
          this.io.emit(json.event, JSON.stringify(json.payload));
        })
        
      } catch (e) {
        console.error("ERROR", data.toString().split("\n"),data.toString())
      }
    
    });

    this.pythonProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      console.error(`Python error: ${error}`);
      // this.io.emit('pythonError', error);
    });

    this.pythonProcess.on('close', (code) => {
      this.io.emit('pythonClose', `Process exited with code ${code}`);
      console.log(`🚨🚨🚨🚨🚨\nPython script crashed. Try to run it manually\n$ python3 src/cv/main.py --show-cv\n🚨🚨🚨🚨🚨`)
      process.exit(1);
    });
  }

  stop() {
    if (this.pythonProcess) {
      this.pythonProcess.kill('SIGINT');
    }
  }
}

module.exports = OpenCvEventBus
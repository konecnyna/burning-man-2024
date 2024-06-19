const { spawn } = require('child_process');
const path = require('path');

class OpenCvEventBus {
  constructor(io) {
    this.io = io;
    this.pythonProcess = null;
  }

  start() {
    this.pythonProcess = spawn('python3', ['main.py'], { cwd: path.join(__dirname, '../cv') })

    this.pythonProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      console.log(output);
      this.io.emit('hand_detect', output);
    });

    this.pythonProcess.stderr.on('data', (data) => {
      // const error = data.toString().trim();
      // console.error(`Python error: ${error}`);
      // this.io.emit('pythonError', error);
    });

    this.pythonProcess.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);
      this.io.emit('pythonClose', `Process exited with code ${code}`);
    });
  }

  stop() {
    if (this.pythonProcess) {
      this.pythonProcess.kill('SIGINT');
    }
  }
}

module.exports = OpenCvEventBus
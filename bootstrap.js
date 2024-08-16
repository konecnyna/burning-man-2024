const { exec } = require('child_process');

// Function to execute shell commands
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function launchServer() {
  console.log('Starting global server');
  executeCommand('/opt/homebrew/bin/node src/server/server.js');
}

// Function to launch Google Chrome in kiosk mode
async function launchChrome() {
  console.log('Launching Google Chrome in kiosk mode...');
  await executeCommand('open -a "Google Chrome" --args --start-fullscreen --kiosk --ignore-certificate-errors --enable-features=OverlayScrollbar "http://localhost:3000/app"');
}

// Function to check if Google Chrome is the frontmost application
async function isChromeFocused() {
  const command = `osascript -e 'tell application "System Events" to (name of first application process whose frontmost is true)'`;
  const frontmostApp = await executeCommand(command);
  return frontmostApp === 'Google Chrome';
}

// Function to focus Google Chrome
async function focusChrome() {
  await executeCommand(`osascript -e 'tell application "Google Chrome" to activate'`);
}

// Main function to launch Chrome and ensure it's focused
async function main() {
  try {
    launchServer();
    await launchChrome();

    // Loop until Chrome is focused
    while (true) {
      const focused = await isChromeFocused();
      if (focused) {
        console.log('Google Chrome is now focused.');
        break;
      } else {
        console.log('Trying to focus on Google Chrome...');
        await focusChrome();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep for 1 second
      }
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the script
main();
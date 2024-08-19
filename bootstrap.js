const { exec } = require('child_process');

// Function to execute shell commands
function executeCommand(command, silent = false) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error && !silent) {
        console.trace(error)
      }
      resolve(stdout.trim());
    });
  });
}

function launchServer() {
  console.log('Starting global server');
  // Start the server without waiting for it to complete
  exec('/opt/homebrew/bin/node src/server/server.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Server error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Server stderr: ${stderr}`);
      return;
    }
    console.log(`Server stdout: ${stdout}`);
  });
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to hide the mouse cursor
async function hideMouseCursor() {
  console.log('Hiding the mouse cursor...');
  await executeCommand(`defaults write com.apple.UniversalAccess increaseContrast -bool true`);
  await executeCommand(`killall Finder`);
  await executeCommand(`killall Dock`);
  console.log('Mouse cursor hidden.');
}

async function killGhosts() {
  try {
    await executeCommand("pkill -f Google", true);
    await executeCommand("pkill -f python", true);
  } catch (e) {
  }
}

async function main() {
  try {
    await killGhosts()

    launchServer();

    await sleep(1000)

    await launchChrome();

    // Hide the mouse cursor
    await hideMouseCursor();


    await sleep(10000)
    const focused = await isChromeFocused();
    if (focused) {
      console.log('Google Chrome is now focused.');
    } else {
      console.log('Trying to focus on Google Chrome...');
      await focusChrome();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep for 1 second
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the script
main();
// Ensure the timers object is properly initialized
let timers = {};

function createStatusContainer(id) {
  const container = document.createElement('div');
  container.id = `text_id_${id}`;
  
  // Apply Tailwind classes to the container
  container.className = 'bg-white bg-opacity-50 text-white text-lg p-3 rounded-md transition-opacity duration-500 ease-in-out opacity-0';
  
  const textElement = document.createElement('div');
  textElement.id = `statusText_${id}`;
  container.appendChild(textElement);

  // Append the new message container to the flex container
  document.getElementById('status_text_container').appendChild(container);
  return container;
}

function updateStatusText(id, text) {
  const statusText = document.getElementById(`statusText_${id}`);
  if (statusText) {
    statusText.textContent = text;
  }
}

function fadeInStatusText(id) {
  const statusContainer = document.getElementById(`text_id_${id}`);
  if (statusContainer) {
    statusContainer.style.opacity = '1';
  }
}

function fadeOutStatusText(id) {
  const statusContainer = document.getElementById(`text_id_${id}`);
  if (statusContainer) {
    statusContainer.style.opacity = '0';
  }
}

function removeStatusText(id) {
  const statusContainer = document.getElementById(`text_id_${id}`);
  if (statusContainer) {
    statusContainer.remove();
  }
}

function triggerAction(id, onActionTriggeredCallback) {
  if (timers[id]?.isCooldown) {
    return; // Exit if the cooldown is active for this ID
  }

  // Ensure timers[id] is initialized as an object
  if (!timers[id]) {
    timers[id] = {};
  }

  let countdownValue = 3;
  clearTimeout(timers[id].actionTimeout);

  // Create the container if it doesn't exist
  if (!document.getElementById(`text_id_${id}`)) {
    createStatusContainer(id);
  }

  updateStatusText(id, `Changing scene in: ${countdownValue--}`);
  fadeInStatusText(id);

  timers[id].actionTimeout = setInterval(() => {
    updateStatusText(id, `Changing scene in: ${countdownValue--}`);
    if (countdownValue < 0) {
      onActionTriggeredCallback();
      clearInterval(timers[id].actionTimeout);
      timers[id].actionTimeout = null;
      startCooldown(id); // Start cooldown after action is triggered
      fadeOutStatusText(id);
      setTimeout(() => removeStatusText(id), 500); // Remove after fading out
    }
  }, 1000);
}

function startCooldown(id) {
  timers[id].isCooldown = true;
  timers[id].cooldownTimer = setTimeout(() => {
    timers[id].isCooldown = false; // End cooldown after 5 seconds
  }, 5000);
}

function handleNextSceneGesture(id, onClearCallback, onActionTriggeredCallback) {
  // Ensure timers[id] is initialized as an object
  if (!timers[id]) {
    timers[id] = {};
  }

  clearTimeout(timers[id].okSignTimer);

  // Reset the 500ms timer every time the ok_sign is detected
  timers[id].okSignTimer = setTimeout(() => {
    clearTimeout(timers[id].actionTimeout);
    timers[id].actionTimeout = null;
    fadeOutStatusText(id);
    onClearCallback();
    startCooldown(id);
    setTimeout(() => removeStatusText(id), 500); // Remove after fading out
  }, 500);

  if (!timers[id]?.actionTimeout) {
    triggerAction(id, onActionTriggeredCallback);
  }
}

// New function to display a message with a timeout
function displayMessageWithTimeout(id, text, delay=13000) {

  // Create the container for this message
  createStatusContainer(id);
  updateStatusText(id, text);
  fadeInStatusText(id);

  // Set a timeout to remove the message after the specified delay
  setTimeout(() => {
    fadeOutStatusText(id);
    setTimeout(() => removeStatusText(id), 500); // Remove after fading out
  }, delay);
}
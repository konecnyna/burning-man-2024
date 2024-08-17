const statusContainer = document.getElementById('statusContainer');

function updateStatusText(text) {
  const statusText = document.getElementById('statusText');

  // Update the text content with the provided text
  statusText.textContent = text;
}

function fadeInStatusText() {
  statusContainer.style.opacity = '1';
}

function fadeOutStatusText() {
  statusContainer.style.opacity = '0';
}

function removeStatusText() {
  statusContainer.style.display = 'none';
}

let okSignTimer;
let actionTimeout;
let cooldownTimer; // New timer for cooldown
let isCooldown = false; // Cooldown flag

function triggerAction(onActionTriggeredCallback) {
  if (isCooldown) {
    return; // Exit if the cooldown is active
  }

  countdownValue = 3;
  clearTimeout(actionTimeout);
  updateStatusText(`Changing scene in: ${countdownValue--}`);

  fadeInStatusText();

  actionTimeout = setInterval(() => {
    updateStatusText(`Changing scene in: ${countdownValue--}`);
    if (countdownValue < 0) {
      onActionTriggeredCallback();
      clearInterval(actionTimeout);
      actionTimeout = null;
      startCooldown(); // Start cooldown after action is triggered
      fadeOutStatusText();
    }
  }, 1000);
}

function startCooldown() {
  isCooldown = true;
  cooldownTimer = setTimeout(() => {
    isCooldown = false; // End cooldown after 5 seconds
  }, 5000);
}

function handleOkSign(onClearCallback, onActionTriggeredCallback) {
  clearTimeout(okSignTimer);

  // Reset the 500ms timer every time the ok_sign is detected
  okSignTimer = setTimeout(() => {
    clearTimeout(actionTimeout);
    actionTimeout = null;
    fadeOutStatusText();
    onClearCallback();
    startCooldown(); 
  }, 500);

  if (!actionTimeout) {
    triggerAction(onActionTriggeredCallback);
  }
}
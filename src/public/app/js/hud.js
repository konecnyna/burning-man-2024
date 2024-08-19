const constructHud = (currentScene, nextSceneTime) => {
  // Create the HUD container
  const hud = document.getElementById('hud');
  hud.innerHTML = '';

  // Helper function to create a divider
  const createDivider = () => {
    const divider = document.createElement('div');
    divider.className = 'w-px h-6 bg-white bg-opacity-75';
    return divider;
  };

  let elementsAdded = false;

  // Add the scene name if it exists
  if (currentScene?.name) {
    const sceneDiv = document.createElement('div');
    sceneDiv.id = 'scene';
    sceneDiv.textContent = `🖼️ ${currentScene.name}`;
    hud.appendChild(sceneDiv);
    elementsAdded = true;
  }

  // Add player count if supported_people exists
  if (currentScene?.meta?.supported_people) {
    if (elementsAdded) hud.appendChild(createDivider());
    const playerCountDiv = document.createElement('div');
    playerCountDiv.id = 'player-count';
    const playerCount = currentScene.meta.supported_people;
    playerCountDiv.textContent = `Players: ${playerCount}`;
    hud.appendChild(playerCountDiv);
    elementsAdded = true;
  }

  // Add the time remaining if nextSceneTime exists
  if (nextSceneTime) {
    if (elementsAdded) hud.appendChild(createDivider());
    const timeRemainingDiv = document.createElement('div');
    timeRemainingDiv.id = 'time-remaining';
    hud.appendChild(timeRemainingDiv);

    const updateTimeRemaining = () => {
      const now = new Date();
      const timeRemaining = new Date(nextSceneTime) - now;

      if (timeRemaining > 0) {
        const minutes = Math.floor((timeRemaining / 1000 / 60) % 60);
        const seconds = Math.floor((timeRemaining / 1000) % 60);
        timeRemainingDiv.textContent = `⏰ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      } else {
        timeRemainingDiv.textContent = `⏰ 00:00`;
      }
    };

    updateTimeRemaining();
    setInterval(updateTimeRemaining, 1000);
    elementsAdded = true;
  }

  // Add additional instructions if they exist
  let instructions = currentScene?.meta?.additional_instructions || []  
  if (!instructions.length) {
    instructions = ["ℹ️ Make 👌 to change scene"]
  }

  if (elementsAdded) hud.appendChild(createDivider());
  const additionalInstructionsDiv = document.createElement('div');
  additionalInstructionsDiv.id = 'additional-instructions';
  additionalInstructionsDiv.className = 'text-sm';
  additionalInstructionsDiv.textContent = instructions.join(' ');
  hud.appendChild(additionalInstructionsDiv);


  // Clear the existing HUD if it exists and add the new one
  const existingHud = document.getElementById('hud');
  if (existingHud) {
    existingHud.remove();
  }

  document.body.appendChild(hud);
};

// Example usage with the stateChanged function
const stateChanged = async (state) => {
  try {
    console.log("state", JSON.stringify(state));
    const currentScene = state.currentScene;
    if (currentScene) {
      await loadPage(currentScene);
      constructHud(currentScene, state.nextSceneTime);
    }
  } catch (e) {
    console.trace(e);
  }
};
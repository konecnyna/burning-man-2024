const socket = io();
let toastTimeout;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function showToast(message, toastLength = 3000) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  toastMessage.textContent = message;

  // Clear any existing timeouts
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Reset classes to trigger reflow
  toast.classList.remove('opacity-0', 'opacity-100', 'hidden');
  void toast.offsetWidth;  // Force a reflow to restart the animation

  // Fade in
  toast.classList.add('opacity-100');

  await new Promise((resolve) => {
    toastTimeout = setTimeout(async () => {
      // Fade out
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0');
      await sleep(1000); // Wait for the fade-out transition to complete
      toast.classList.add('hidden'); // Hide the toast after fade-out
      resolve();
    }, toastLength);
  });
}



document.addEventListener('DOMContentLoaded', () => {
  const contentFrame = document.getElementById('contentFrame');

  const stateChanged = async (state) => {
    try {
      const currentScene = state.currentScene
      loadPage(currentScene)      
    } catch (e) {
      console.trace(e)
    }
  }
  const loadPage = async (scene) => {
    contentFrame.src = scene.url;
    await sleep(1500)
    if (scene.id != "loading") {
      await showToast(scene.name, 1500);
      for (var i = 0; i < scene.instructions.length; i++) {
        await showToast(scene.instructions[i], 4000)
      }
    }    
  };

  socket.on('state_changed', (data) => {
    stateChanged(JSON.parse(data))
  });

  function fetchAppState() {
    console.log("send it!")
    fetch('/api/app-state')
      .then(response => response.json())
      .then(state => {
        stateChanged(state)
      })
      .catch(error => {
        console.trace(error)
      });
  }


  fetchAppState()
});


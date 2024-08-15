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

  // Get canvas and context
  const handCanvas = document.getElementById('handCanvas');
  const handCanvasCtx = handCanvas.getContext('2d');
  handCanvas.width = window.innerWidth;
  handCanvas.height = window.innerHeight;


  socket.on('hand_detect_new', (data) => {
    try {
      const payload = JSON.parse(data);
  
      // Clear the canvas
      handCanvasCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
  
      // Colors array to use different colors for different hands
      const colors = [
        { circle: 'rgba(255, 0, 0, 0.7)', text: 'white' },     // Red circle, white text
        { circle: 'rgba(0, 255, 0, 0.7)', text: 'black' },     // Green circle, black text
        { circle: 'rgba(0, 0, 255, 0.7)', text: 'yellow' },    // Blue circle, yellow text
        { circle: 'rgba(255, 165, 0, 0.7)', text: 'black' },   // Orange circle, black text
        { circle: 'rgba(128, 0, 128, 0.7)', text: 'white' },   // Purple circle, white text
      ];
  
      // Iterate over each hand in the payload
      payload.forEach((hand, index) => {
        const color = colors[index % colors.length]; // Cycle through colors if more hands than colors
        console.log(window.innerHeight, handCanvas.height);
  
        let posX = hand.x_percent * window.innerWidth;
        let posY = hand.y_percent * window.innerHeight;
  
        // Draw hand cursor (a circle)
        handCanvasCtx.beginPath();
        handCanvasCtx.arc(posX, posY, 20, 0, 2 * Math.PI, false);
        handCanvasCtx.fillStyle = color.circle;
        handCanvasCtx.fill();
  
        // Draw the hand ID inside the circle
        handCanvasCtx.fillStyle = color.text;
        handCanvasCtx.font = '16px Arial';
        handCanvasCtx.textAlign = 'center';
        handCanvasCtx.textBaseline = 'middle';
        handCanvasCtx.fillText(hand.id, posX, posY);
      });
  
    } catch (e) {
      console.trace(e);
    }
  });

  fetchAppState()
});




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
  toast.classList.remove('fade-in', 'fade-out', 'hidden', 'visible');
  void toast.offsetWidth;

  // Fade in
  toast.classList.add('visible');

  await new Promise((resolve) => {
    toastTimeout = setTimeout(async () => {
      toast.classList.remove('visible');
      await sleep(1000)
      toast.classList.add('hidden');
      resolve();
    }, toastLength);
  });
}




document.addEventListener('DOMContentLoaded', () => {
  const contentFrame = document.getElementById('contentFrame');

  const stateChanged = async (state) => {
    try {
      console.log("srtate!!!!", state)
      const currentScene = state.currentScene
      showToast(`Loading scene ${currentScene.name}...`);
      loadPage(currentScene)
    } catch (e) {
      console.trace(e)
    }
  }
  const loadPage = async (page) => {
    console.log(JSON.stringify(page));
    contentFrame.src = page.url;

    await sleep(1500)

    await showToast(page.name, 1500);

    for (var i = 0; i < page.instructions.length; i++) {
      await showToast(page.instructions[i], 4000)
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


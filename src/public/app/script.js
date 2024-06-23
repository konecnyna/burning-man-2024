const socket = io();
let toastTimeout;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


function showToast(message, toastLength=3000) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  toastMessage.textContent = message;

  // Clear any existing timeouts
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Reset classes to trigger reflow
  toast.classList.remove('fade-in', 'fade-out', 'hidden', 'visible');
  void toast.offsetWidth; // Trigger reflow

  // Fade in
  toast.classList.add('visible');

  // Set a new timeout to fade out the toast after 3 seconds
  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
    toast.classList.add('hidden');
  }, toastLength);
}

document.addEventListener('DOMContentLoaded', () => {
  const pages = ['/app/scenes/fluid-sim/index.html', '/app/scenes/neon-white-board/index.html'];
  let currentPage = 1;

  const contentFrame = document.getElementById('contentFrame');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const whipeBtn = document.getElementById('whipeBtn');

  const loadPage = (page) => {
    console.log(`loading ${page}`);
    contentFrame.src = page;
  };

  prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      loadPage(pages[currentPage]);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < pages.length - 1) {
      currentPage++;
      loadPage(pages[currentPage]);
    }
  });

  whipeBtn.addEventListener('click', async () => {

    setImage('/images/oracle.jpeg');
    
    showToast("Entering Interactive Mode", 3000)
    await sleep(3000);
    startAnimation();

    await sleep(6000);
    showToast("Neon blackboard", 2000)

    await sleep(3000);

    showToast("Use your hands to paint on the screen", 2000)
  });
  // Load the first page initially
  loadPage(pages[currentPage]);

  socket.on('update_current_app', (data) => {
    try {
      console.log(data)
      const { name, url } = JSON.parse(data);
      showToast(`Loading scene ${name}...`);
      loadPage(url)
    } catch (e) {
      console.trace(e)
    }
  });
});


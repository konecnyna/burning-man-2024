const socket = io();
let toastTimeout;

function showToast(message) {
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
  // toastTimeout = setTimeout(() => {
  //   toast.classList.remove('visible');
  //   toast.classList.add('hidden');
  // }, 3000);
}

showToast("!!!!!!!!!")

document.addEventListener('DOMContentLoaded', () => {
  const pages = ['/app/scenes/fluid-sim/index.html', '/app/scenes/neon-white-board/index.html'];
  let currentPage = 1;

  const contentFrame = document.getElementById('contentFrame');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

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

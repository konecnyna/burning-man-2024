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


const pages = [
  { id: "fluid-sim", url: '/app/scenes/fluid-sim/index.html', instructions: ["Wave you hand to move the particles around."], name: "Fluid waves" },
  { id: "passive", url: '/app/scenes/passive/index.html', instructions: ["Passive mode uses IR cameara."], name: "Fluid waves" }
];


document.addEventListener('DOMContentLoaded', () => {
  let currentPage = 0;

  const contentFrame = document.getElementById('contentFrame');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const whipeBtn = document.getElementById('whipeBtn');

  const loadPage = async (page) => {
    console.log(JSON.stringify(page));
    contentFrame.src = page.url;

    await sleep(1500)

    await showToast(page.name, 1500);

    for (var i = 0; i < page.instructions.length; i++) {
      await showToast(page.instructions[i], 4000)
    }
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

  socket.on('change_scene', (data) => {
    try {
      console.log(data)
      const { name, url } = JSON.parse(data);
      showToast(`Loading scene ${name}...`);
      loadPage(url)
    } catch (e) {
      console.trace(e)
    }
  });


  socket.on('state_changed', (data) => {
    console.log(data)
  });

});


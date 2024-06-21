const socket = io();



document.addEventListener('DOMContentLoaded', () => {
  const pages = ['/app/scenes/fluid-sim/index.html', '/app/scenes/neon-white-board/index.html'];
  let currentPage = 0;

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
    console.log(data, "______!!!!!!!!!")
    const url = data.url;
    loadPage(url)
  });
});

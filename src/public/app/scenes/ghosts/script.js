const socket = io();

// Function to move or create ghosts
const moveGhosts = (coordinates) => {
  coordinates.forEach(coord => {
      let ghost = document.getElementById(`ghost-${coord.id}`);
      if (!ghost) {
          ghost = document.createElement('div');
          ghost.id = `ghost-${coord.id}`;
          ghost.classList.add('ghost');
          ghost.style.left = `${coord.x}px`;
          ghost.style.top = `${coord.y}px`;
          document.body.appendChild(ghost);
      } else {
          const deltaX = coord.x - parseFloat(ghost.style.left);
          const deltaY = coord.y - parseFloat(ghost.style.top);
          ghost.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }
  });
};

socket.on('open_cv_event', (data) => {
  try {
    const { event, payload } = JSON.parse(data);
    if (event !== "object_detected") {
      return;
    }

    moveGhosts(payload);

  } catch (e) {
    console.trace(e);
  }
});

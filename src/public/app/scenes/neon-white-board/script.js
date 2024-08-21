const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

const maxDistance = 250; // Maximum allowed distance to connect lines

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let points = [];
let hue = 0;
let drawing = false;

// Setup WebSocket connection
const socket = io();

// New socket event to handle hand detection
socket.on('hand_detect_new', (data) => {
  try {
    const payload = JSON.parse(data);
    const hand = payload[0];     
    if (hand.is_ok) {
      //clearScreen(); // Clear the canvas if is_ok is true
      //return;
    }

    if (!hand.is_fist) {
      return;
    }

    let posX = hand.x_percent * window.innerWidth;
    let posY = hand.y_percent * window.innerHeight;
    console.log(hand)
    drawFromEvent(posX, posY); // Use drawFromEvent to draw at the new position
  } catch (e) {
    console.trace(e);
  }
});

function drawFromEvent(x, y) {
  points.push({ x, y, hue });

  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
  ctx.shadowBlur = 10;
  ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

  const lastPoint = points[points.length - 2];
  if (lastPoint && getDistance(lastPoint, { x, y }) > maxDistance) {
    ctx.beginPath();
  }

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);

  hue++;
  if (hue >= 360) {
    hue = 0;
  }
}

function getDistance(point1, point2) {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

function startPosition(e) {
  drawing = true;
  draw(e);
}

function endPosition() {
  drawing = false;
  ctx.beginPath();
}

function draw(e) {
  if (!drawing) return;

  const x = e.clientX;
  const y = e.clientY;

  drawFromEvent(x, y);
}

function clearScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points = []; // Optionally clear the points array if you want to reset everything
}

// Mouse event listeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);
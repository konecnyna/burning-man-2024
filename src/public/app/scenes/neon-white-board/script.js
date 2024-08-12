const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

const pointRemoveDelay = 15000;
const maxDistance = 250; // Maximum allowed distance to connect lines
const eraseDelay = 10000; // Time to wait before starting to erase (10 seconds)
const eraseInterval = 100; // Interval to remove points (100ms)

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let points = [];
let hue = 0;
let drawing = false;
let eraseTimeout;
let erasing = false;

// Setup WebSocket connection
const socket = io();

socket.on('index_finger_detect', (data) => {
  try {
    const payload = JSON.parse(data);
    drawFromEvent(canvas.width - payload.x_percent * canvas.width, payload.y_percent * canvas.height);
  } catch (e) {
    console.trace(e);
  }
});

function drawFromEvent(x, y) {
  if (erasing) {
    erasing = false;
    resetEraseTimeout();
  }

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

  resetEraseTimeout();
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
  setTimeout(removePoint, pointRemoveDelay); // Start removing points after 15 seconds
}

function draw(e) {
  if (!drawing) return;

  const x = e.clientX;
  const y = e.clientY;

  drawFromEvent(x, y);
}

function removePoint() {
  if (points.length > 0) {
    points.shift();
    redraw();
    setTimeout(removePoint, 30); // Remove a point every 30ms
  }
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = `hsl(${point.hue}, 100%, 50%)`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsl(${point.hue}, 100%, 50%)`;

    const lastPoint = points[i - 1];
    if (lastPoint && getDistance(lastPoint, point) > maxDistance) {
      ctx.beginPath();
    }

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }
}

function startErasing() {
  if (erasing && points.length > 0) {
    points.shift();
    redraw();
    setTimeout(startErasing, eraseInterval); // Remove a point every 100ms
  }
}

function resetEraseTimeout() {
  clearTimeout(eraseTimeout);
  erasing = false;
  eraseTimeout = setTimeout(() => {
    erasing = true;
    startErasing();
  }, eraseDelay);
}

// Mouse event listeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);

resetEraseTimeout();

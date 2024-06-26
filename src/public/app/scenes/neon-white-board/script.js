const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

const pointRemoveDelay = 15000

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let points = [];
let hue = 0;
let drawing = false;

// Setup WebSocket connection
const socket = io();

socket.on('open_cv_event', (data) => {  
  try {
    const { event, payload } = JSON.parse(data)
    if (event !== "hand_detect") {
      return
    }
    drawFromEvent(payload.x, payload.y);
  } catch (e) {
    console.trace(e)
  }
});

function drawFromEvent(x, y) {
    points.push({ x, y, hue });

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    hue++;
    if (hue >= 360) {
        hue = 0;
    }
}

function startPosition(e) {
    drawing = true;
    draw(e);
}

function endPosition() {
    drawing = false;
    ctx.beginPath();
    setTimeout(removePoint, pointRemoveDelay); // Start removing points after 3 seconds
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

        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
    }
}

// Mouse event listeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);
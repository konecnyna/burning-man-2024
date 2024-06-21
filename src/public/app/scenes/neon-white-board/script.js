const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let points = [];
let hue = 0;
let drawing = false;

// Setup WebSocket connection
const socket = io();

// Listen for the 'hand_detect' event
socket.on('hand_detect', (data) => {
    const event = JSON.parse(data);
    drawFromEvent(event.x, event.y);
});

function drawFromEvent(x, y) {
    if (!drawing) return; // Only draw if in drawing state

    points.push({ x, y, hue, isNewPath: false });

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
    const x = e.clientX;
    const y = e.clientY;
    points.push({ x, y, hue, isNewPath: true }); // Mark as a new path
    ctx.moveTo(x, y);
    draw(e);
}

function endPosition() {
    drawing = false;
    ctx.beginPath();
    setTimeout(removePoint, 3000); // Start removing points after 3 seconds
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
        if (point.isNewPath) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
        }
    }
}

// Mouse event listeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);

// Start removing points after 3 seconds
setTimeout(removePoint, 3000);

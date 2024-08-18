// Get canvas and context
const handCanvas = document.getElementById('handCanvas');
const handCanvasCtx = handCanvas.getContext('2d');
handCanvas.width = window.innerWidth;
handCanvas.height = window.innerHeight;

function drawPointers(payload) {
  // Clear the canvas
  handCanvasCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

  // Colors array to use different colors for different hands
  const colors = [
    { circle: 'rgba(255, 0, 0, 0.7)', text: 'white' },     // Red circle, white text
    { circle: 'rgba(0, 255, 0, 0.7)', text: 'black' },     // Green circle, black text
    { circle: 'rgba(0, 0, 255, 0.7)', text: 'yellow' },    // Blue circle, yellow text
    { circle: 'rgba(255, 165, 0, 0.7)', text: 'black' },   // Orange circle, black text
    { circle: 'rgba(128, 0, 128, 0.7)', text: 'white' },   // Purple circle, white text
  ];

  // Iterate over each hand in the payload
  payload.forEach((hand, index) => {
    const color = colors[index % colors.length]; // Cycle through colors if more hands than colors

    let posX = hand.x_percent * window.innerWidth;
    let posY = hand.y_percent * window.innerHeight;

    // Draw hand cursor (a circle)
    handCanvasCtx.beginPath();
    handCanvasCtx.arc(posX, posY, 20, 0, 2 * Math.PI, false);
    handCanvasCtx.fillStyle = color.circle;
    handCanvasCtx.fill();

    // Draw the hand ID inside the circle
    handCanvasCtx.fillStyle = color.text;
    handCanvasCtx.font = '16px Arial';
    handCanvasCtx.textAlign = 'center';
    handCanvasCtx.textBaseline = 'middle';
    handCanvasCtx.fillText(hand.id, posX, posY);
  });
}
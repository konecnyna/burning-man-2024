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







// // Get canvas and context
// const handCanvas = document.getElementById('handCanvas');
// const handCanvasCtx = handCanvas.getContext('2d');
// handCanvas.width = window.innerWidth;
// handCanvas.height = window.innerHeight;

// // Image URLs (using the same URL for now)
// const imageUrls = [
//   'https://emojis.slackmojis.com/emojis/images/1643515619/16413/alice_in_wonderland.gif',
//   'https://emojis.slackmojis.com/emojis/images/1643516900/29550/mad_hatter.png',
//   'https://emojis.slackmojis.com/emojis/images/1710477675/91023/cheshire-cat-e.png',
//   'https://emojis.slackmojis.com/emojis/images/1643516999/30539/queen_of_hearts.png',
//   'https://emojis.slackmojis.com/emojis/images/1699564752/74656/white_rabbitq.png',
// ];

// // Load images into an array
// const handImages = imageUrls.map(url => {
//   const img = new Image();
//   img.src = url;
//   return img;
// });

// function drawPointers(payload) {
//   // Clear the canvas
//   handCanvasCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

//   // Iterate over each hand in the payload
//   payload.forEach((hand, index) => {
//     const image = handImages[index % handImages.length]; // Cycle through images if more hands than images

//     let posX = hand.x_percent * window.innerWidth;
//     let posY = hand.y_percent * window.innerHeight;

//     // Draw hand cursor (the image)
//     const imageSize = 40; // Set the desired size for the image
//     handCanvasCtx.drawImage(image, posX - imageSize / 2, posY - imageSize / 2, imageSize, imageSize);

//     // Draw the hand ID below the image
//     handCanvasCtx.fillStyle = 'white';
//     handCanvasCtx.font = '16px Arial';
//     handCanvasCtx.textAlign = 'center';
//     handCanvasCtx.textBaseline = 'top';
//     handCanvasCtx.fillText(hand.id, posX, posY + imageSize / 2 + 5);
//   });
// }
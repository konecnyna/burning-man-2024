// https://codepen.io/mesteradam/pen/xxdWVj

var wvAnimation = {
  nX: 0,
  nSpeed: 1,
  nSeq: 0,
  oNegyzet: [],
  nSum: 0,
  nWidth: 0,
  oBody: null,
  oFullFill: null,
  oImg: new Image(),
  effect: 0
}

function arrayRandomizer(arr) {
  var len = arr.length, x, temp;
  if (len === 0) return false;
  while (--len) {
    x = Math.floor(Math.random() * len);
    temp = arr[len];
    arr[len] = arr[x];
    arr[x] = temp;
  }
}

function SquareFadeAnimation(nX, nSpeed, nSeq, bCreate, delay) {
  wvAnimation.oNegyzet = [];

  // speed
  wvAnimation.nSpeed = nSpeed || 500;

  // seq
  wvAnimation.nSeq = nSeq || 50;

  // nX
  wvAnimation.nX = nX || 6;

  wvAnimation.oBody = document.body;

  // create?!
  if (bCreate === undefined || bCreate === false) {
    wvAnimation.oFullFill = document.getElementById("wv-full-fill");
  } else {
    var oWvFullFill = document.createElement("div");
    oWvFullFill.setAttribute("id", "wv-full-fill");
    document.body.insertBefore(oWvFullFill, document.body.childNodes[0]);
    wvAnimation.oFullFill = document.getElementById("wv-full-fill");
  }

  start(delay);
}

function start(delay) {
  var nWidth = wvAnimation.oFullFill.offsetWidth;
  var nHeight = wvAnimation.oFullFill.offsetHeight;
  var nSzelesseg = Math.round(nWidth / wvAnimation.nX + 0.5); // square width
  var nY = Math.round(nHeight / nSzelesseg + 0.5);  // number of squares on y-axis
  var oTemp, i, j;

  wvAnimation.nSum = wvAnimation.nX * nY; // total number of squares
  wvAnimation.nWidth = nSzelesseg; // square width

  // Image positioning
  adjustImageSize(nWidth, nHeight);

  for (i = 0; i < nY; i++) {
    for (j = 0; j < wvAnimation.nX; j++) {
      oTemp = createSquare(j, i, nSzelesseg);
      wvAnimation.oNegyzet.push(oTemp);
    }
  }

  arrayRandomizer(wvAnimation.oNegyzet);

  for (i = 0; i < wvAnimation.nSum; i++) {
    wvAnimation.oFullFill.appendChild(wvAnimation.oNegyzet[i]);
  }

  wvAnimation.oFullFill.style.backgroundColor = "transparent";

  // Fade in the image
  setTimeout(function () {
    fadeInSquares();
    setTimeout(function () {
      linearCSSAnimation();
    }, delay);
  }, 50);
}

function createSquare(j, i, nSzelesseg) {
  var oTemp = document.createElement("div");
  var nImgXPoz = calculateImageXPosition();
  var nImgYPoz = calculateImageYPosition();

  oTemp.style.position = "fixed";
  oTemp.style.width = nSzelesseg + "px";
  oTemp.style.height = nSzelesseg + "px";
  //oTemp.style.backgroundColor = "#aaaaaa";
  oTemp.style.backgroundImage = "url(" + wvAnimation.oImg.src + ")";
  oTemp.style.backgroundSize = wvAnimation.oImg.width + "px " + wvAnimation.oImg.height + "px";
  oTemp.style.backgroundRepeat = "no-repeat";
  oTemp.style.left = j * nSzelesseg + "px";
  oTemp.style.top = i * nSzelesseg + "px";
  oTemp.style.backgroundPosition = (nImgXPoz - (j * nSzelesseg)) + "px " + (nImgYPoz - (i * nSzelesseg)) + "px";
  oTemp.style.transition = "all " + (wvAnimation.nSpeed / 1000) + "s";
  oTemp.style.opacity = "0"; // Initial opacity
  return oTemp;
}

function adjustImageSize(nWidth, nHeight) {
  var nImgWidth = wvAnimation.oImg.width;
  var nImgHeight = wvAnimation.oImg.height;

  if (nImgWidth > nWidth) {
    var nArany = nWidth / nImgWidth;
    wvAnimation.oImg.width = nWidth;
    wvAnimation.oImg.height = nImgHeight * nArany;
  }

  nImgWidth = wvAnimation.oImg.width;
  nImgHeight = wvAnimation.oImg.height;

  if (nImgHeight > nHeight) {
    var nArany = nHeight / nImgHeight;
    wvAnimation.oImg.width = nImgWidth * nArany;
    wvAnimation.oImg.height = nHeight;
  }
}

function calculateImageXPosition() {
  var nWidth = wvAnimation.oFullFill.offsetWidth;
  return (nWidth - wvAnimation.oImg.width) / 2;
}

function calculateImageYPosition() {
  var nHeight = wvAnimation.oFullFill.offsetHeight;
  return (nHeight - wvAnimation.oImg.height) / 2;
}

function fadeInSquares() {
  for (var i = 0; i < wvAnimation.nSum; i++) {
    wvAnimation.oNegyzet[i].style.opacity = "1";
  }
}

function linearCSSAnimation() {
  switch (wvAnimation.effect) {
    case 0:
      wvAnimation.oNegyzet[--wvAnimation.nSum].style.transform = "perspective(" + wvAnimation.nWidth * 2 + "px) rotateX(90deg)";
      wvAnimation.oNegyzet[wvAnimation.nSum].style.opacity = "0.5";
      break;
    case 1:
      wvAnimation.oNegyzet[--wvAnimation.nSum].style.transform = "translateX(" + wvAnimation.nWidth * 2 + "px)";
      wvAnimation.oNegyzet[wvAnimation.nSum].style.opacity = "0";
      break;
    case 2:
      wvAnimation.oNegyzet[--wvAnimation.nSum].style.transform = "scale(2)";
      wvAnimation.oNegyzet[wvAnimation.nSum].style.opacity = "0";
      break;
    case 3:
      wvAnimation.oNegyzet[--wvAnimation.nSum].style.transform = "scale(0.5)";
      wvAnimation.oNegyzet[wvAnimation.nSum].style.opacity = "0";
      break;
  }

  if (wvAnimation.nSum !== 0) {
    setTimeout(function () {
      linearCSSAnimation();
    }, wvAnimation.nSeq);
  } else {
    setTimeout(function () {
      wvAnimation.oBody.removeChild(wvAnimation.oFullFill);
    }, wvAnimation.nSpeed);
  }
}

function setWhipeImage(cImg) {
  var preloader = document.getElementById("bgPreloaderDiv") || createPreloader();
  preloader.style.backgroundImage = "url(" + cImg + ")";
  wvAnimation.oImg.src = cImg;
}

function createPreloader() {
  var preloader = document.createElement("div");
  preloader.setAttribute("id", "bgPreloaderDiv");
  var container = document.getElementById("content-container");
  container.insertBefore(preloader, container.childNodes[0]);
  preloader.style.width = "0px";
  preloader.style.height = "0px";
  preloader.style.position = "fixed";
  preloader.style.opacity = "0";
  return preloader;
}

function startWhipeAnimation(imageUrl, nX = 5, nSpeed = 750, nSeq = 200, delay = 2000) {
  setWhipeImage(imageUrl);
  SquareFadeAnimation(nX, nSpeed, nSeq, true, delay);
}

document.addEventListener("DOMContentLoaded", function () {
  startWhipeAnimation("/images/oracle.jpeg")
})

function effectChange(o) {
  wvAnimation.effect = o.selectedIndex;
}

// Expose the dynamic functions globally
window.startWhipeAnimation = startWhipeAnimation;
window.setWhipeImage = setWhipeImage;
window.effectChange = effectChange;
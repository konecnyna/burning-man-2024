// https://codepen.io/mesteradam/pen/xxdWVj

var wvAnimation = {
  nX: 0,
  nSpeed: 1,
  nSeq: 0,
  oNegyzet: new Array(),
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

// document.addEventListener("DOMContentLoaded", function () {
//   setImage('/images/oracle.jpeg');
//   console.log("sssssssssss")
//   setTimeout(function () {
//     startAnimation();
//   }, 200);
// })


/*
 "class" name 
   wvAnimation
 parameters
   nX			:	szeletek száma vízszintesen
   nSpeed	:	egy négyzet áttünési sebessége (msec)
   nSeq		:	két egymást követő áttünés megkezdése közti idő (msec)
     bCreate  :  ha true akkor letrehozza a full-fill div-et, egyebkent nem
     oImg     :  megjelenítendő kép (Image object)
     effect   :  effect number
   
 default parameters
   nX			=	6		(min:0,max:50)
   nSpeed	=	500	(min:1)
   nSeq		=	50		(min:0)
*/

function SquareFadeAnimation(nX, nSpeed, nSeq, bCreate, delay) {

  wvAnimation.oNegyzet = new Array();

  // speed
  if (nSpeed === undefined) {				// ha nincs megadva, vagy 0, akkor 500
    wvAnimation.nSpeed = 500;
  } else { wvAnimation.nSpeed = nSpeed; }

  // seq
  if (nSeq === undefined) {					// ha nincs megadva, akkor 40
    wvAnimation.nSeq = 50;
  } else { wvAnimation.nSeq = nSeq; }

  // nX
  if (nX === undefined || nX > 50) {		   // negyzetek szama x tengelyen
    wvAnimation.nX = 6;
  } else { wvAnimation.nX = nX; }

  wvAnimation.oBody = document.body;

  // create?!
  if (bCreate === undefined || bCreate === false) {
    wvAnimation.oFullFill = document.getElementById("wv-full-fill");
  } else {
    oWvFullFill = document.createElement("div");
    oWvFullFill.setAttribute("id", "wv-full-fill");
    document.body.insertBefore(oWvFullFill, document.body.childNodes[0]);
    wvAnimation.oFullFill = document.getElementById("wv-full-fill");
  }


  start(delay);
}

function start(delay) {
  var nWidth = wvAnimation.oFullFill.offsetWidth;
  var nHeight = wvAnimation.oFullFill.offsetHeight;
  var nSzelesseg = Math.round(nWidth / wvAnimation.nX + 0.5);// negyzetek szelessege
  var nY = Math.round(nHeight / nSzelesseg + 0.5);		// negyzetek szama y tengelyen
  var oTemp, i, j;
  wvAnimation.nSum = wvAnimation.nX * nY;			// negyzetek szama
  wvAnimation.nWidth = nSzelesseg;                // negyzetek szelessege

  /* Image positioning */
  var nImgWidth = wvAnimation.oImg.width;
  var nImgHeight = wvAnimation.oImg.height;
  // szelesseghez igazitas
  if (nImgWidth > nWidth) {
    var nArany = nWidth / nImgWidth;
    wvAnimation.oImg.width = nWidth;
    wvAnimation.oImg.height = nImgHeight * nArany;
  }

  nImgWidth = wvAnimation.oImg.width;
  nImgHeight = wvAnimation.oImg.height;
  // magassaghoz hasonlitas
  if (nImgHeight > nHeight) {
    var nArany = nHeight / nImgHeight;
    wvAnimation.oImg.width = nImgWidth * nArany;
    wvAnimation.oImg.height = nHeight;
  }
  console.log("!!")
  var nImgXPoz = (nWidth - wvAnimation.oImg.width) / 2
  var nImgYPoz = (nHeight - wvAnimation.oImg.height) / 2

  var nXPos = 0, nYPos = 0;


  for (i = 0; i < nY; i++) {
    for (j = 0; j < wvAnimation.nX; j++) {
      oTemp = document.createElement("div");
      oTemp.style.position = "fixed";
      oTemp.style.width = nSzelesseg + "px";
      oTemp.style.height = nSzelesseg + "px";
      oTemp.style.backgroundColor = "#aaaaaa";
      oTemp.style.backgroundImage = "url(" + wvAnimation.oImg.src + ")";
      oTemp.style.backgroundSize = wvAnimation.oImg.width + "px " + wvAnimation.oImg.height + "px";
      oTemp.style.backgroundRepeat = "no-repeat";
      oTemp.style.left = j * nSzelesseg + "px";
      oTemp.style.top = i * nSzelesseg + "px";
      oTemp.style.backgroundPosition = (nImgXPoz - (j * nSzelesseg)) + "px " + (nImgYPoz - (i * nSzelesseg)) + "px";
      oTemp.style.transition = "all " + (wvAnimation.nSpeed / 1000) + "s";
      oTemp.style.opacity = "0"; // Initial opacity
      wvAnimation.oNegyzet.push(oTemp);
    }
  }


  arrayRandomizer(wvAnimation.oNegyzet);

  for (i = 0; i < wvAnimation.nSum; i++) {
    wvAnimation.oFullFill.appendChild(wvAnimation.oNegyzet[i]);
  }

  wvAnimation.oFullFill.style.backgroundColor = "transparent";
  wvAnimation.oFullFill.style.backgroundImage = "";

  // Fade in the image
  setTimeout(function () {
    for (i = 0; i < wvAnimation.nSum; i++) {
      wvAnimation.oNegyzet[i].style.opacity = "1";
      
    }
    setTimeout(function () {
      linearCSSAnimation();
    }, delay); 
  }, 50);
};



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
    return false;
  }
};





/*
  form   
*/

function startAnimation() {
  var nX = 5;
  var nSpeed = 750;
  var nSeq = 200;
  var delay = 2000;

  SquareFadeAnimation(nX, nSpeed, nSeq, true, delay);
}

function setRange(cName, nValue) {
  var textbox = document.getElementById("i" + cName);
  textbox.innerHTML = "" + nValue;
}

function setImage(cImg) {
  var preloader = document.getElementById("bgPreloaderDiv");
  if (preloader == null) {
    preloader = document.createElement("div");
    preloader.setAttribute("id", "bgPreloaderDiv");
    
    // document.body.insertBefore(preloader, document.body.childNodes[0]);
    const test =document.getElementById("content-container")
    test.insertBefore(preloader, test.childNodes[0]);
  }
  preloader.style.width = "0px";
  preloader.style.height = "0px";
  preloader.style.position = "fixed";
  preloader.style.opacity = "0";
  preloader.style.backgroundImage = "url(" + cImg + ")";
  wvAnimation.oImg = new Image();
  wvAnimation.oImg.src = cImg;
}


function allowDrop(ev) {
  ev.preventDefault();
  ev.target.style.border = "2px dashed #3399FF";
}

function drop(ev) {
  var url = ev.dataTransfer.getData("text");
  var kit = url.substr(url.length - 3, 3);
  if (kit == "jpg" || kit == "png" || kit == "gif") {
    ev.target.style.border = "2px solid #3399FF";
    var dropImg = document.getElementById("dropImage");
    dropImg.src = url;
    setImage(url);
  } else
    ev.target.style.border = "2px solid red";
}

function posDropImg(o) {
  o.style.left = ((300 - o.width) / 2) + "px";
}

function enterDrop(ev) {
  ev.preventDefault();
  ev.target.style.border = "2px dashed #3399FF";
}

function leaveDrop(ev) {
  ev.preventDefault();
  ev.target.style.border = "2px solid #3399FF";
}

function effectChange(o) {
  wvAnimation.effect = o.selectedIndex
}

/*
  form vege
*/
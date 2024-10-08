const socket = io();

/*
 * AUTHOR: Iacopo Sassarini
 * WebVR Port: Luke Groeninger
 */

if (!Detector.webgl) Detector.addGetWebGLMessage();

var VISUALS_VISIBLE = true;

var SCALE_FACTOR = 1500;
var CAMERA_BOUND = 200;

var NUM_POINTS_SUBSET = 20000;
var NUM_SUBSETS = 7;
var NUM_POINTS = NUM_POINTS_SUBSET * NUM_SUBSETS;

var NUM_LEVELS = 10;
var LEVEL_DEPTH = 400;

var DEF_BRIGHTNESS = 1;
var DEF_SATURATION = 0.8;

var SPRITE_SIZE = Math.ceil(3 * window.innerWidth / 1600);

// Orbit parameters constraints
var A_MIN = -30;
var A_MAX = 30;
var B_MIN = 0.2;
var B_MAX = 1.8;
var C_MIN = 5;
var C_MAX = 17;
var D_MIN = 0;
var D_MAX = 10;
var E_MIN = 0;
var E_MAX = 12;

// Orbit parameters
var a, b, c, d, e;

// Orbit data
var orbit = {
  subsets: [],
  xMin: 0,
  xMax: 0,
  yMin: 0,
  yMax: 0,
  scaleX: 0,
  scaleY: 0
};

// Initialize data points
for (var i = 0; i < NUM_SUBSETS; i++) {
  var subsetPoints = [];
  for (var j = 0; j < NUM_POINTS_SUBSET; j++) {
    subsetPoints[j] = {
      x: 0,
      y: 0,
      vertex: new THREE.Vector3(0, 0, 0)
    };
  }
  orbit.subsets.push(subsetPoints);
}

var container;
var camera, scene, renderer, vrrenderer, composer, hueValues = [];
var renderCanvas, vrHMD, vrHMDSensor;

var mouseX = 0, mouseY = 0;
var renderTargetWidth = window.innerWidth;
var renderTargetHeight = window.innerHeight;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var speed = 1.5;
var rotationSpeed = 0.002;
var vrSupported = false;
var vrEnabled = false;
var isFullscreen = false;

window.addEventListener("load", function () {
  if (navigator.getVRDevices) {
    navigator.getVRDevices().then(vrDeviceCallback);
  } else if (navigator.mozGetVRDevices) {
    navigator.mozGetVRDevices(vrDeviceCallback);
  } else {
    // !        
  }

}, false);

init();
render();

function vrDeviceCallback(vrdevs) {
  vrSupported = true;

  for (var i = 0; i < vrdevs.length; ++i) {
    if (vrdevs[i] instanceof HMDVRDevice) {
      vrHMD = vrdevs[i];
      break;
    }
  }
  for (var i = 0; i < vrdevs.length; ++i) {
    if (vrdevs[i] instanceof PositionSensorVRDevice &&
      vrdevs[i].hardwareUnitId == vrHMD.hardwareUnitId) {
      vrHMDSensor = vrdevs[i];
      break;
    }
  }
  vrrenderer = new THREE.VRRenderer(renderer, vrHMD);
  var div = document.getElementById('info');
  div.innerHTML = div.innerHTML + "\n<br /> [F] Enter VR Mode - [R] Reset sensor orientation";
}

function init() {
  renderCanvas = document.getElementById("render-canvas");

  renderer = new THREE.WebGLRenderer({
    canvas: renderCanvas,
    clearColor: 0x000000, clearAlpha: 1,
    antialias: false,
    devicePixelRatio: window.devicePixelRatio || 1,
  });

  // Setup renderer and effects
  renderer.setSize(renderTargetWidth, renderTargetHeight);

  SPRITE_SIZE = Math.ceil(3 * renderTargetWidth / 1600);


  THREE.ImageUtils.crossOrigin = '';
  sprite1 = THREE.ImageUtils.loadTexture("https://s3-us-west-1.amazonaws.com/danielfiles/THEREALGALAXY.png");

  camera = new THREE.PerspectiveCamera(60, renderTargetWidth / renderTargetHeight, 1, 3 * SCALE_FACTOR);
  camera.position.set(0, 0, SCALE_FACTOR / 2);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.0012);

  generateOrbit();

  for (var s = 0; s < NUM_SUBSETS; s++) { hueValues[s] = Math.random(); }

  // Create particle systems
  for (var k = 0; k < NUM_LEVELS; k++) {
    for (var s = 0; s < NUM_SUBSETS; s++) {
      var geometry = new THREE.Geometry();
      for (var i = 0; i < NUM_POINTS_SUBSET; i++) { geometry.vertices.push(orbit.subsets[s][i].vertex); }
      var materials = new THREE.PointCloudMaterial({ size: (SPRITE_SIZE), map: sprite1, blending: THREE.AdditiveBlending, depthTest: false, transparent: true });
      THREE.ColorConverter.setHSV(materials.color, hueValues[s], DEF_SATURATION, DEF_BRIGHTNESS);
      var particles = new THREE.PointCloud(geometry, materials);
      particles.myMaterial = materials;
      particles.myLevel = k;
      particles.mySubset = s;
      particles.position.x = 0;
      particles.position.y = 0;
      particles.position.z = - LEVEL_DEPTH * k - (s * LEVEL_DEPTH / NUM_SUBSETS) + SCALE_FACTOR / 2;
      particles.needsUpdate = 0;
      scene.add(particles);
    }
  }

  // Setup listeners
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('touchstart', onDocumentTouchStart, false);
  document.addEventListener('touchmove', onDocumentTouchMove, false);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange, false);
  document.addEventListener('mozfullscreenchange', onFullscreenChange, false);
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('keypress', onKeyPress, false);
  window.addEventListener('keydown', onKeyDown, false);

  setInterval(updateOrbit, 7000);

}

function render() {
  requestAnimationFrame(render);

  if (vrEnabled && vrHMDSensor) {
    // get state
    var state = vrHMDSensor.getState();

    // if the position is reported use it
    if (state.position) {
      camera.position.set(state.position.x * 50,
        state.position.y * 50,
        state.position.z * 50 + SCALE_FACTOR / 2);
    }

    // if the orientation is reported use it
    if (state.orientation) {
      camera.quaternion.set(state.orientation.x,
        state.orientation.y,
        state.orientation.z,
        state.orientation.w);
    } else {
      camera.lookAt(scene.position);
    }
  } else {
    // move the camera position based on mouse position/taps
    if (camera.position.x >= - CAMERA_BOUND && camera.position.x <= CAMERA_BOUND) {
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      if (camera.position.x < - CAMERA_BOUND) camera.position.x = -CAMERA_BOUND;
      if (camera.position.x > CAMERA_BOUND) camera.position.x = CAMERA_BOUND;
    }
    if (camera.position.y >= - CAMERA_BOUND && camera.position.y <= CAMERA_BOUND) {
      camera.position.y += (- mouseY - camera.position.y) * 0.05;
      if (camera.position.y < - CAMERA_BOUND) camera.position.y = -CAMERA_BOUND;
      if (camera.position.y > CAMERA_BOUND) camera.position.y = CAMERA_BOUND;
    }
    // look straight ahead
    camera.lookAt(scene.position);
  }

  // update particle positions
  for (i = 0; i < scene.children.length; i++) {
    scene.children[i].position.z += speed;
    scene.children[i].rotation.z += rotationSpeed;
    // if the particle level has passed the fade distance
    if (scene.children[i].position.z >= ((NUM_LEVELS / 2) - 1) * LEVEL_DEPTH + SCALE_FACTOR) {
      // move the particle level back in front of the camera
      scene.children[i].position.z = -((NUM_LEVELS / 2) - 1) * LEVEL_DEPTH;
      if (scene.children[i].needsUpdate == 1) {
        // update the geometry and color
        scene.children[i].geometry.verticesNeedUpdate = true;
        THREE.ColorConverter.setHSV(scene.children[i].myMaterial.color, hueValues[scene.children[i].mySubset], DEF_SATURATION, DEF_BRIGHTNESS);
        scene.children[i].needsUpdate = 0;
      }
    }
  }

  renderer.render(scene, camera);

}

///////////////////////////////////////////////
// Hopalong Orbit Generator
///////////////////////////////////////////////
function updateOrbit() {
  generateOrbit();
  for (var s = 0; s < NUM_SUBSETS; s++) {
    hueValues[s] = Math.random();
  }
  for (i = 0; i < scene.children.length; i++) {
    scene.children[i].needsUpdate = 1;
  }
}

function generateOrbit() {
  var x, y, z, x1;
  var idx = 0;

  prepareOrbit();

  // Using local vars should be faster
  var al = a;
  var bl = b;
  var cl = c;
  var dl = d;
  var el = e;
  var subsets = orbit.subsets;
  var num_points_subset_l = NUM_POINTS_SUBSET;
  var num_points_l = NUM_POINTS;
  var scale_factor_l = SCALE_FACTOR;

  var xMin = 0, xMax = 0, yMin = 0, yMax = 0;

  for (var s = 0; s < NUM_SUBSETS; s++) {

    // Use a different starting point for each orbit subset
    x = s * 0.005 * (0.5 - Math.random());
    y = s * 0.005 * (0.5 - Math.random());

    var curSubset = subsets[s];

    for (var i = 0; i < num_points_subset_l; i++) {

      // Iteration formula (generalization of the Barry Martin's original one)
      z = (dl + Math.sqrt(Math.abs(bl * x - cl)));
      if (x > 0) { x1 = y - z; }
      else if (x === 0) { x1 = y; }
      else { x1 = y + z; }
      y = al - x;
      x = x1 + el;

      curSubset[i].x = x;
      curSubset[i].y = y;

      if (x < xMin) { xMin = x; }
      else if (x > xMax) { xMax = x; }
      if (y < yMin) { yMin = y; }
      else if (y > yMax) { yMax = y; }

      idx++;
    }
  }

  var scaleX = 2 * scale_factor_l / (xMax - xMin);
  var scaleY = 2 * scale_factor_l / (yMax - yMin);

  orbit.xMin = xMin;
  orbit.xMax = xMax;
  orbit.yMin = yMin;
  orbit.yMax = yMax;
  orbit.scaleX = scaleX;
  orbit.scaleY = scaleY;

  // Normalize and update vertex data
  for (var s = 0; s < NUM_SUBSETS; s++) {
    var curSubset = subsets[s];
    for (var i = 0; i < num_points_subset_l; i++) {
      curSubset[i].vertex.x = scaleX * (curSubset[i].x - xMin) - scale_factor_l;
      curSubset[i].vertex.y = scaleY * (curSubset[i].y - yMin) - scale_factor_l;
    }
  }
}

function prepareOrbit() {
  shuffleParams();
  orbit.xMin = 0;
  orbit.xMax = 0;
  orbit.yMin = 0;
  orbit.yMax = 0;
}

function shuffleParams() {
  a = A_MIN + Math.random() * (A_MAX - A_MIN);
  b = B_MIN + Math.random() * (B_MAX - B_MIN);
  c = C_MIN + Math.random() * (C_MAX - C_MIN);
  d = D_MIN + Math.random() * (D_MAX - D_MIN);
  e = E_MIN + Math.random() * (E_MAX - E_MIN);
}

///////////////////////////////////////////////
// Event listeners
///////////////////////////////////////////////
function onDocumentMouseMove(event) {
  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}

function onDocumentTouchStart(event) {
  if (event.touches.length == 1) {
    event.preventDefault();
    mouseX = event.touches[0].pageX - windowHalfX;
    mouseY = event.touches[0].pageY - windowHalfY;
  }
}

function onDocumentTouchMove(event) {
  if (event.touches.length == 1) {
    event.preventDefault();
    mouseX = event.touches[0].pageX - windowHalfX;
    mouseY = event.touches[0].pageY - windowHalfY;
  }
}

// launchIntoFullscreen() and exitFullscreen() from
// http://davidwalsh.name/fullscreen

// Find the right method, call on correct element
function launchIntoFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

// Whack fullscreen
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

function onFullscreenChange() {
  if (!document.webkitFullscreenElement && !document.mozFullScreenElement) {
    isFullscreen = false;
    renderCanvas.style.cursor = "";
    if (vrSupported) {
      vrEnabled = false;
      // unhide the mouse and set the device pixel ratio correctly
      renderer.devicePixelRatio = window.devicePixelRatio || 1;
    }
  } else {
    isFullscreen = true;
    renderCanvas.style.cursor = "none";
    if (vrSupported) {
      vrEnabled = true;
      // reset the sensor on enable
      vrHMDSensor.zeroSensor();
      // reset the camera position
      camera.position.set(0, 0, SCALE_FACTOR / 2);
      // hide the mouse, and set the device pixel ratio to 1
      renderer.devicePixelRatio = 1;
    }
  }
  // force resolution change
  onWindowResize();
}

function onWindowResize(event) {
  renderTargetWidth = window.innerWidth;
  renderTargetHeight = window.innerHeight;
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  // use recommended render target size if in VR
  if (vrEnabled) {
    if ('getRecommendedEyeRenderRect' in vrHMD) {
      var leftEyeViewport = vrHMD.getRecommendedEyeRenderRect("left");
      var rightEyeViewport = vrHMD.getRecommendedEyeRenderRect("right");
      renderTargetWidth = leftEyeViewport.width + rightEyeViewport.width;
      renderTargetHeight = Math.max(leftEyeViewport.height, rightEyeViewport.height);
    }
    // only scale the sprites to half the size for VR
    SPRITE_SIZE = Math.ceil(3 * renderTargetWidth / 3200);
  } else {
    SPRITE_SIZE = Math.ceil(3 * renderTargetWidth / 1600);
  }

  // rescale sprites for new resolution
  for (var i = 0; i < scene.children.length; i++) {
    scene.children[i].myMaterial.size = SPRITE_SIZE;
  }

  // update camera
  camera.aspect = renderTargetWidth / renderTargetHeight;
  camera.updateProjectionMatrix();

  // change render target size
  renderer.setSize(renderTargetWidth, renderTargetHeight);
  renderer.setViewport(0, 0, renderTargetWidth, renderTargetHeight);
}

function onKeyDown(event) {
  // hande up/down/left/right keys
  if (event.keyCode == 38 && speed < 20) speed += 0.5;
  else if (event.keyCode == 40 && speed > 0) speed -= 0.5;
  else if (event.keyCode == 37) rotationSpeed += 0.001;
  else if (event.keyCode == 39) rotationSpeed -= 0.001;
}

function onKeyPress(event) {
  // handle 'f'
  if (event.which == 70 || event.which == 102) {
    if (vrEnabled || isFullscreen) {
      exitFullscreen();
    } else if (vrSupported) {
      if (renderCanvas.mozRequestFullScreen) {
        renderCanvas.mozRequestFullScreen({
          vrDisplay: vrHMD
        });
      } else if (renderCanvas.webkitRequestFullscreen) {
        renderCanvas.webkitRequestFullscreen({
          vrDisplay: vrHMD,
        });
      }
    } else {
      launchIntoFullscreen(renderCanvas);
    }
  } else if (vrEnabled && (event.which == 82 || event.which == 114)) {
    // handle 'z'
    vrHMDSensor.zeroSensor();
  } else if (!isFullscreen && (event.which == 72 || event.which == 104)) {
    // handle 'h'
    toggleVisuals();
  }
}


function showHideAbout() {
  if (document.getElementById('about').style.display == "block") {
    document.getElementById('about').style.display = "none";
  } else {
    document.getElementById('about').style.display = "block";
  }
}

function toggleVisuals() {
  if (VISUALS_VISIBLE) {
    document.getElementById('aboutlink').style.display = 'none';
    document.getElementById('about').style.display = 'none';
    document.getElementById('info').style.display = 'none';
    renderCanvas.style.cursor = "none";
    VISUALS_VISIBLE = false;
  }
  else {
    document.getElementById('aboutlink').style.display = 'block';
    document.getElementById('info').style.display = 'block';
    renderCanvas.style.cursor = "";
    VISUALS_VISIBLE = true;
  }
}


function scaleByPixelRatio(input) {
  let pixelRatio = window.devicePixelRatio || 1;
  return Math.floor(input * pixelRatio);
}



socket.on('hand_detect_new', (data) => {
  try {
    const payload = JSON.parse(data);
    const hand = payload[0]
    let posX = hand.x_percent * window.innerWidth;
    // let posX = hand.x;
    let posY = hand.y_percent * window.innerHeight;
    // let posY = hand.y;

    mouseX = posX - windowHalfX;
    mouseY = posY - windowHalfY;
  } catch (e) {
    console.trace(e);
  }
});
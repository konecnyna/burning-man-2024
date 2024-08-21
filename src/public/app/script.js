const socket = io();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let lastState = null
let transitionTimer = null




document.addEventListener('DOMContentLoaded', () => {
  const contentFrame = document.getElementById('contentFrame');
  const stateChanged = async (state) => {
    lastState = state   
    try {
      const currentScene = state.currentScene;
      if (currentScene) {
        if (currentScene.isActive) {
          constructHud(currentScene, state.nextSceneTime);
        } else {
          const hud = document.getElementById('hud');
          hud.innerHTML = '';
        }
        await loadPage(currentScene);
      }

    } catch (e) {
      console.trace(e)
    }
  }


  const loadPage = async (scene) => {
    if (contentFrame.src.toString().includes(scene.url)) {
      return;
    }

    console.log("LOADING PAGE", contentFrame.src, scene.url)

    contentFrame.src = scene.url;
    await sleep(1500)
    if (scene.name) {
      await showToast(scene.name, 1500);
    }
    for (var i = 0; i < scene.instructions.length; i++) {
      await showToast(scene.instructions[i], 4000)
    }

  };

  socket.on('state_changed', (data) => {
    stateChanged(JSON.parse(data))
  });

  function fetchAppState() {
    fetch('/api/app-state')
      .then(response => response.json())
      .then(state => {
        console.log("!!!!!!")
        stateChanged(state)
      })
      .catch(error => {
        console.trace(error)
      });
  }


  socket.on('hand_detect_new', (data) => {
    try {
      const payload = JSON.parse(data);

      console.log(lastState)
      if (lastState?.currentScene?.handCursors) {
        drawPointers(payload)
      }

      payload.forEach(hand => {

        // if (hand.is_shaka_sign) {
        //   console.log("🤙", hand.is_shaka_sign)
        // }

        // if (hand.is_peace_sign) {
        //   console.log("✌️", hand.is_peace_sign)
        // }

        // if (hand.is_ok) {
        //   console.log("👎", hand.is_ok)
        // }


        if (hand.next_scene_gesture && lastState.detectionMode === "active") {
          handleNextSceneGesture(
            "next_scene_status_text",
            () => {
              console.log("cancelled!")
            }, () => {
              console.log("send it!")
              socket.emit('admin_event', { event: "change_scene", payload: {} });
            });
        }
      })


    } catch (e) {
      console.trace(e);
    }
  });


  fetchAppState()
});


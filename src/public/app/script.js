const socket = io();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

document.addEventListener('DOMContentLoaded', () => {
  const contentFrame = document.getElementById('contentFrame');
  const stateChanged = async (state) => {
    try {
      const currentScene = state.currentScene;
      if (currentScene) {
        // Update the HUD
        constructHud(currentScene, state.nextSceneTime);
        await loadPage(currentScene);
      }

    } catch (e) {
      console.trace(e)
    }
  }


  const loadPage = async (scene) => {
    contentFrame.src = scene.url;
    await sleep(1500)
    if (scene.id != "loading") {
      await showToast(scene.name, 1500);
      for (var i = 0; i < scene.instructions.length; i++) {
        await showToast(scene.instructions[i], 4000)
      }
    }
  };

  socket.on('state_changed', (data) => {
    stateChanged(JSON.parse(data))
  });

  function fetchAppState() {
    fetch('/api/app-state')
      .then(response => response.json())
      .then(state => {
        stateChanged(state)
      })
      .catch(error => {
        console.trace(error)
      });
  }


  socket.on('hand_detect_new', (data) => {
    try {
      const payload = JSON.parse(data);
      if (payload[0].handDebugging) {
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
        //   console.log("👌", hand.is_ok)
        // }


        if (hand.next_scene_gesture) {
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


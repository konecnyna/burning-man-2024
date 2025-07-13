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
        stateChanged(state)
      })
      .catch(error => {
        console.trace(error)
      });
  }


  const messages = [
    "Step into the unknown and unlock the secrets of Atlantis.",
    "Venture closer—your portal to another realm awaits.",
    "A hidden world lies beyond—dare to uncover it?",
    "Only the curious may enter—are you ready to explore?",
    "Mysteries of the deep call to you—approach and discover.",
    //"Beyond this veil, Atlantis awakens—will you join us?",
    "Cross the threshold and let the magic reveal itself.",
    "The gateway to wonder is near—take a step and see.",
    "Enter the forgotten world of Atlantis—if you dare.",
    "A realm of enchantment beckons—come closer to begin."
  ];
  let passiveMessageTimer = null;
  socket.on("object_detected", async (data) => {
    if (passiveMessageTimer) {
      return;
    }

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    passiveMessageTimer = setTimeout(() => {
      passiveMessageTimer = null;
    }, 15 * 1000);
    await showToast(randomMessage, 5000);    
  });


  socket.on('hand_detect_new', (data) => {
    try {
      const payload = JSON.parse(data);
      if (lastState?.currentScene?.handCursors || lastState?.handDebugging) {
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


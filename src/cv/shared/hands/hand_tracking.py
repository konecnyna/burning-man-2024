import json
import time

from shared.hands.hand_detector import HandDetector
from shared.util.postion_translater import translate_img_coordinates
from shared.util.postion_translater import translate_img_coordinates_scaled


from shared.util.web_socket_client import WebsocketClient
ws_client = WebsocketClient('ws://localhost:3000')


class HandTrackingModule:
    INDEX_FINGER = 8

    def __init__(
        self,
        mode=False,
        debug=False,
        showCv=False,
        showmaxHands=4,
        detectionCon=0.25,
        trackCon=0.25,
    ):
        self.mode = mode
        self.maxHands = showmaxHands
        self.detectionCon = detectionCon
        self.trackCon = trackCon
        self.debug = debug
        self.showCv = showCv
        self.detector = HandDetector(
            static_mode=False,
            max_hands=showmaxHands,
            model_complextiy=1,
            detect_confidence=detectionCon,
            track_confidence=trackCon,
        )

        self.mockData = {
            "start_x": 100,
            "start_y": 100,
            "end_y": 350,
            "end_x": 350,
            "increment": 15,
            "delay": 0.1,
        }

    def clamp(self, value):
        return max(0, min(1, value))

    def subscribe(self, img):
        [result, lmList] = self.detector.find_position(image=img, draw=self.showCv)
        if not lmList:
            return

        handPayloads = []
        handCount = len(lmList) // 21
        for i in range(0, len(lmList), 21):
            hand_id = f"hand_{i // 21 + 1}"
            hand_lmList = lmList[i : i + 21]

            handEvents = self.process_hands(result, hand_lmList, hand_id)
            if handEvents:
                handPayloads.append(handEvents)

        print(self.makeEvent("hand_detect",handPayloads), flush=True)
        ws_client.publish("hand_detect", handPayloads)

        indexFingerEvent = self.process_index_finger(lmList, handCount)
        if indexFingerEvent:
            print(self.makeEvent("index_finger_detect", indexFingerEvent), flush=True)

    def process_hands(self, result, lmList, hand_id):
        hand_distance = -1
        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                distance = self.detector.calculate_distance(
                    hand_landmarks.landmark[0], hand_landmarks.landmark[12]
                )
                hand_distance = float("{:.2f}".format(distance))

                wrist_pos = lmList[0]
                wrist_x, wrist_y = wrist_pos[1], wrist_pos[2]
                if wrist_x and wrist_y:
                    (
                        translated_wrist_x,
                        translated_wrist_y,
                    ) = translate_img_coordinates_scaled(
                        event_x=wrist_x, event_y=wrist_y, scale=hand_distance
                    )
                    event = {
                        "type": "wrist",
                        "id": hand_id,
                        "x": translated_wrist_x,
                        "y": translated_wrist_y,
                        "x_percent": self.clamp(wrist_x),
                        "y_percent": self.clamp(wrist_y),
                        "distance": hand_distance,
                    }
                    return event

        return hand_distance

    def process_index_finger(self, lmList, handCount):
        index_finger_tip = lmList[8]
        index_finger_x, index_finger_y = index_finger_tip[1], index_finger_tip[2]
        translated_x, translated_y = translate_img_coordinates(
            event_x=index_finger_x,
            event_y=index_finger_y,
        )

        indexFingerDetected = self.detector.isIndexFingerUp(lst_mark=lmList)
        if indexFingerDetected:
            event = {
                "x": translated_x,
                "y": translated_y,
                "hands_detected": handCount,
                "x_percent": self.clamp(index_finger_x),
                "y_percent": self.clamp(index_finger_y),
            }
            return event

    def makeEvent(self, event, payload):
        event = {"event": event, "payload": payload}
        return json.dumps(event)

    def log(self, msg):
        if self.debug:
            print(msg)

    def printEvent(self, event):
        print(json.dumps(event), flush=True)

    def mockMode(self):
        # Move from (start_x, start_y) to (start_x, end_y)
        for y in range(
            self.mockData.start_y, self.mockData.end_y + 1, self.mockData.increment
        ):
            event = {
                "event": "hand_detect",
                "payload": {"x": self.mockData.start_x, "y": y},
            }
            self.printEvent(event)
            time.sleep(self.mockData.delay)

        # Move from (start_x, end_y) to (end_x, end_y)
        for x in range(
            self.mockData.start_x, self.mockData.end_x + 1, self.mockData.increment
        ):
            event = {
                "event": "hand_detect",
                "payload": {"x": x, "y": self.mockData.end_y},
            }
            self.printEvent(event)
            time.sleep(self.mockData.delay)

        # Move from (end_x, end_y) to (end_x, start_y)
        for y in range(
            self.mockData.end_y, self.mockData.start_y - 1, -self.mockData.increment
        ):
            event = {
                "event": "hand_detect",
                "payload": {"x": self.mockData.end_x, "y": y},
            }
            self.printEvent(event)
            time.sleep(self.mockData.delay)

        for x in range(
            self.mockData.end_x, self.mockData.start_x - 1, -self.mockData.increment
        ):
            event = {
                "event": "hand_detect",
                "payload": {"x": x, "y": self.mockData.start_y},
            }
            self.printEvent(event)
            time.sleep(self.mockData.delay)

import json
import time
import cv2
import mediapipe as mp

from shared.hand_detector import HandDetector
from shared.postion_translater import translate_img_coordinates


class HandTrackingModule:
    INDEX_FINGER = 8
    
    def __init__(self, mode=False, debug=False, showCv=False, showmaxHands=1, detectionCon=0.5, trackCon=0.5):
        self.mode = mode
        self.maxHands = showmaxHands
        self.detectionCon = detectionCon
        self.trackCon = trackCon
        self.debug = debug
        self.showCv = showCv
        self.detector = HandDetector()

        self.mpHands = mp.solutions.hands
        self.hands = self.mpHands.Hands(
            static_image_mode=self.mode,
            max_num_hands=self.maxHands,
            min_detection_confidence=self.detectionCon,
            min_tracking_confidence=self.trackCon
        )
        self.mpDraw = mp.solutions.drawing_utils
        self.dragging = False
        
        self.mockData = {  "start_x": 100, "start_y" : 100, "end_y" : 350, "end_x": 350, "increment" :15, "delay" :.1}

    def clamp(self, value):
        return max(0, min(1, value))


    def subscribe(self, img):
        lmList = self.detector.find_position(image = img, draw=self.showCv)
        if lmList:
            
            # Index finger
            wrist_pos = lmList[0]
            wrist_x, wrist_y = wrist_pos[1], wrist_pos[2]
            if wrist_x and wrist_y:
                translated_wrist_x,translated_wirst_y = translate_img_coordinates(
                    event_x=wrist_x,
                    event_y=wrist_y,
                )
                payload = { "type": "wrist", "x": translated_wrist_x, "y": translated_wirst_y, "x_percent": self.clamp(wrist_x), "y_percent": self.clamp(wrist_y) }
                print(self.makeEvent(event='hand_detect',payload=payload), flush=True)
            
            
            # Index finger
            index_finger_tip = lmList[8]
            index_finger_x, index_finger_y = index_finger_tip[1], index_finger_tip[2]
            translated_x,translated_y = translate_img_coordinates(
                event_x=index_finger_x,
                event_y=index_finger_y,
            )
            
            indexFingerDetected = self.detector.isIndexFingerUp(lst_mark=lmList)
            if indexFingerDetected:
                payload = { "x": translated_x, "y": translated_y, "x_percent": self.clamp(index_finger_x), "y_percent": self.clamp(index_finger_y)}
                print(self.makeEvent(event='index_finger_detect',payload=payload), flush=True)
                
            
            
            
            
    def makeEvent(self, event, payload):
        event = { 'event': event, 'payload': payload}
        return json.dumps(event)        

    def log(self, msg):
        if self.debug:
            print(msg)
            

    def printEvent(self, event):
        print(json.dumps(event), flush=True)

    def mockMode(self):
        # Move from (start_x, start_y) to (start_x, end_y)
        for y in range(self.mockData.start_y, self.mockData.end_y + 1, self.mockData.increment):
            event = {
                "event": "hand_detect",
                "payload": {
                    "x": self.mockData.start_x,
                    "y": y
                }
            }
            self.printEvent(event)
            time.sleep(self.mockData.delay)  

        # Move from (start_x, end_y) to (end_x, end_y)
        for x in range(self.mockData.start_x, self.mockData.end_x + 1, self.mockData.increment):
            event = {
                "event": "hand_detect",
                "payload": {
                    "x": x,
                    "y": self.mockData.end_y
                }
            }
            self.printEvent(event)
            time.sleep(self.mockData.delay) 

        # Move from (end_x, end_y) to (end_x, start_y)
        for y in range(self.mockData.end_y, self.mockData.start_y - 1, -self.mockData.increment):
            event = {
                "event": "hand_detect",
                "payload": {
                    "x": self.mockData.end_x,
                    "y": y
                }
            }
            self.printEvent(event)
            time.sleep(self.mockData.delay) 

        for x in range(self.mockData.end_x, self.mockData.start_x - 1, -self.mockData.increment):
            event = {
                "event": "hand_detect",
                "payload": {
                    "x": x,
                    "y": self.mockData.start_y
                }
            }
            self.printEvent(event)
            time.sleep(self.mockData.delay)
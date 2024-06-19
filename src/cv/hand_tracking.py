import json
import cv2
import mediapipe as mp

from pynput.mouse import Controller, Button
from postion_translater import translate_img_coordinates


class HandTrackingModule:
    def __init__(self, mode=False, enable_mouse=False, debug=False, maxHands=1, detectionCon=0.5, trackCon=0.5):
        self.mode = mode
        self.maxHands = maxHands
        self.detectionCon = detectionCon
        self.trackCon = trackCon
        self.debug = debug

        self.mpHands = mp.solutions.hands
        self.hands = self.mpHands.Hands(
            static_image_mode=self.mode,
            max_num_hands=self.maxHands,
            min_detection_confidence=self.detectionCon,
            min_tracking_confidence=self.trackCon
        )
        self.mpDraw = mp.solutions.drawing_utils
        self.mouse = Controller() if enable_mouse else None
        self.dragging = False

    def drawHandsWireframe(self, img, draw=True):
        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.hands.process(imgRGB)
        if self.results.multi_hand_landmarks:
            for handLms in self.results.multi_hand_landmarks:
                if draw:
                    self.mpDraw.draw_landmarks(img, handLms, self.mpHands.HAND_CONNECTIONS)
        return img

    def findPosition(self, img, handNo=0, draw=True):
        lmList = []
        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = self.hands.process(imgRGB)
        
        if results.multi_hand_landmarks:
            myHand = results.multi_hand_landmarks[handNo]
            for id, lm in enumerate(myHand.landmark):
                h, w, c = img.shape
                cx, cy = int(lm.x * w), int(lm.y * h)
                lmList.append([id, cx, cy])
                if draw:
                    cv2.circle(img, (cx, cy), 5, (255, 0, 0), cv2.FILLED)
        return lmList

    def countFingers(self, lmList):
        if len(lmList) != 21:
            return 0

        tips_ids = [4, 8, 12, 16, 20]
        fingers = 0

        # Thumb
        if lmList[tips_ids[0]][1] > lmList[tips_ids[0] - 1][1]:
            fingers += 1

        # Other fingers
        for id in range(1, 5):
            if lmList[tips_ids[id]][2] < lmList[tips_ids[id] - 2][2]:
                fingers += 1

        return fingers
    
    def subscribe(self, img):
        lmList = self.findPosition(img)
        if lmList:
            index_finger_tip = lmList[8]
            x, y = index_finger_tip[1], index_finger_tip[2]

            translated_x,translated_y = translate_img_coordinates(
                event_x=x,
                event_y=y,
                img=img
            )
            
            print(self.makeEvent(x=translated_x, y=translated_y))
            
    def makeEvent(self, x,y):
        event = {'event': 'hand_detect', 'x': x, 'y': y}
        return json.dumps(event)        

    def log(self, msg):
        if self.debug:
            print(msg)
            
    def test(self, img):
        img = self.drawHandsWireframe(img)
        lmList = self.findPosition(img)
        if lmList:
            index_finger_tip = lmList[8]
            x, y = index_finger_tip[1], index_finger_tip[2]

            translated_x,translated_y = translate_img_coordinates(
                event_x=x,
                event_y=y,
                img=img
            )
            
            if self.mouse:
                self.mouse.position = (translated_x, translated_y)
                self.log(f'The current pointer position is {self.mouse.position} (dragging)')
                fingers_count = self.countFingers(lmList)
                self.log(f"Finger count: {fingers_count}")
                if fingers_count == 1:
                    if not self.dragging:
                        self.mouse.press(Button.left)
                        self.dragging = True                    
                        self.log("Dragging")
                        
                else:
                    if self.dragging:
                        self.mouse.release(Button.left)
                        self.dragging = False                    
            

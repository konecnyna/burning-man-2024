import time
import cv2
import mediapipe as mp
import argparse
from pynput.mouse import Controller, Button

from chrome_utils import open_url_in_chrome_fullscreen


class HandTrackingModule:
    def __init__(self, mode=False, maxHands=1, detectionCon=0.7, trackCon=0.7):
        self.mode = mode
        self.maxHands = maxHands
        self.detectionCon = detectionCon
        self.trackCon = trackCon

        self.mpHands = mp.solutions.hands
        self.hands = self.mpHands.Hands(
            static_image_mode=self.mode,
            max_num_hands=self.maxHands,
            min_detection_confidence=self.detectionCon,
            min_tracking_confidence=self.trackCon
        )
        self.mpDraw = mp.solutions.drawing_utils

    def findHands(self, img, draw=True):
        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.hands.process(imgRGB)
        if self.results.multi_hand_landmarks:
            for handLms in self.results.multi_hand_landmarks:
                if draw:
                    self.mpDraw.draw_landmarks(img, handLms, self.mpHands.HAND_CONNECTIONS)
        return img

    def findPosition(self, img, handNo=0, draw=True):
        lmList = []
        if self.results.multi_hand_landmarks:
            myHand = self.results.multi_hand_landmarks[handNo]
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

def main(enable_mouse):
    # URL to open
    url = "https://paveldogreat.github.io/WebGL-Fluid-Simulation/"
    # Open the URL in Chrome fullscreen
    open_url_in_chrome_fullscreen(url)


    cap = cv2.VideoCapture(0)
    detector = HandTrackingModule()
    mouse = Controller() if enable_mouse else None
    dragging = False

    while True:
        success, img = cap.read()
        img = detector.findHands(img)
        lmList = detector.findPosition(img)
        if lmList:
            # Get the tip of the index finger position
            index_finger_tip = lmList[8]  # Index finger tip position
            x, y = index_finger_tip[1], index_finger_tip[2]
            print(f"Original coordinates: ({x}, {y})")

            # Invert x-coordinate
            img_height, img_width, _ = img.shape
            inverted_x = img_width - x
            print(f"Inverted coordinates: ({inverted_x}, {y})")

            # Translate coordinates to a 1920x1080 box
            box_width, box_height = 1920, 1080
            translated_x = int(inverted_x * (box_width / img_width))
            translated_y = int(y * (box_height / img_height))
            print(f"Translated coordinates: ({translated_x}, {translated_y})")

            if enable_mouse:
                fingers_count = detector.countFingers(lmList)
                if fingers_count == 5:
                    if not dragging:
                        mouse.press(Button.left)
                        dragging = True
                    # Move the mouse to the translated position
                    mouse.position = (translated_x, translated_y)
                    print(f'The current pointer position is {mouse.position} (dragging)')
                else:
                    if dragging:
                        mouse.release(Button.left)
                        dragging = False
                    print("Less than 5 fingers detected, not moving the mouse")

        cv2.imshow("Image", img)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--enable-mouse', action='store_true', help='Enable mouse movement')
    args = parser.parse_args()
    main(args.enable_mouse)

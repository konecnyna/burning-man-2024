import cv2
import mediapipe as mp
import argparse
from pynput.mouse import Controller, Button

from hand_tracking import HandTrackingModule


def main(enable_mouse, show_cv):
    # URL to open
    # url = "https://paveldogreat.github.io/WebGL-Fluid-Simulation/"
    #  Open the URL in Chrome fullscreen
    #open_url_in_chrome_fullscreen(url)
    
    cap = cv2.VideoCapture(0)
    detector = HandTrackingModule()
    mouse = Controller() if enable_mouse else None
    dragging = False

    while True:
        success, img = cap.read()
        img = detector.findHands(img)
        lmList = detector.findPosition(img)
        if lmList:
            index_finger_tip = lmList[8]
            x, y = index_finger_tip[1], index_finger_tip[2]

            img_height, img_width, _ = img.shape
            inverted_x = img_width - x

            box_width, box_height = 1920, 1080
            translated_x = int(inverted_x * (box_width / img_width))
            translated_y = int(y * (box_height / img_height))

            if enable_mouse:
                fingers_count = detector.countFingers(lmList)
                if fingers_count == 1:
                    if not dragging:
                        mouse.press(Button.left)
                        dragging = True
                    mouse.position = (translated_x, translated_y)
                    print(f'The current pointer position is {mouse.position} (dragging)')
                else:
                    if dragging:
                        mouse.release(Button.left)
                        dragging = False
                    print("Fist not detected, not moving the mouse")

        if show_cv:
            cv2.imshow("Image", img)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--enable-mouse', action='store_true', help='Enable mouse movement')
    parser.add_argument('--show-cv', action='store_true', help='Show open cv image')
    args = parser.parse_args()
    main(args.enable_mouse, args.show_cv)

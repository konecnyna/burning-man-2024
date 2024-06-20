import json
import time
import cv2
import argparse

from hand_tracking import HandTrackingModule
from mock_mode import mockMode

def main(enable_mouse, show_cv, debug, mock_mode):
    if (mock_mode):
        mockMode()
        return
    
    cap = cv2.VideoCapture(0)
    hand_detector = HandTrackingModule(enable_mouse=enable_mouse, debug=debug)    
    
    while cap.isOpened():
        success, img = cap.read()
        hand_detector.subscribe(img=img)
        
        if show_cv:
            cv2.imshow("Image", img)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--enable-mouse', action='store_true', help='Enable mouse movement')
    parser.add_argument('--show-cv', action='store_true', help='Show open cv image')
    parser.add_argument('--debug', action='store_true', help='Verbose logging')
    parser.add_argument('--mock-mode', action='store_true', help='Verbose logging')
    args = parser.parse_args()
    main(args.enable_mouse, args.show_cv, args.debug, args.mock_mode)

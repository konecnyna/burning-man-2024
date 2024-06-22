import json
import time
import cv2
import argparse

from hand_tracking import HandTrackingModule
from object_detection import ObjectDetector

def main(enable_mouse, show_cv, debug, mock_mode, camera_address):
    hand_detector = HandTrackingModule(enable_mouse=enable_mouse, debug=debug) 
    object_detector = ObjectDetector()
    
    
    if (mock_mode): 
        # hand_detector.mockMode()
        object_detector.mockMode()
        return
    
    # cap = cv2.VideoCapture(0)
    cap = cv2.VideoCapture(camera_address)
    
    while cap.isOpened():
        success, img = cap.read()
        hand_detector.subscribe(img=img)
        #object_detector.subscribe(img=img)
        
        if show_cv:
            cv2.imshow("Image", img)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--enable-mouse', action='store_true', help='Enable mouse movement')
    parser.add_argument('--show-cv', action='store_true', help='Show open cv image')
    parser.add_argument('--debug', action='store_true', help='Verbose logging')
    parser.add_argument('--mock-mode', action='store_true', help='Enable mock mode')
    parser.add_argument('--url', type=str, help='URL for the camera feed')
    args = parser.parse_args()
    
    # 0 is usb/default camera.
    print(args)
    camera_address = args.url if args.url is not None else 0

    main(args.enable_mouse, args.show_cv, args.debug, args.mock_mode, camera_address)

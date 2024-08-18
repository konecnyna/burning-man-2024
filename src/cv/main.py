import json
import time
import cv2
import argparse

from shared.hands.simple_hand_tracking import SimpleHandTracking
from shared.util.threaded_camera import ThreadedCamera

def main(args):
    simple_hand_tracking = SimpleHandTracking()
    camera_address = args.url if args.url is not None else 0
    camera = ThreadedCamera(camera_address)
    
        
    while camera.capture.isOpened():
        frame = camera.frame
        if frame is None:
            continue
    
        # Flip the frame horizontally for a mirror-like effect
        frame = cv2.flip(frame, 1)
        simple_hand_tracking.subscribe(img=frame)
           
        if args.show_cv:
            cv2.imshow("Image", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--show-cv', action='store_true', help='Show open cv image')
    parser.add_argument('--debug', action='store_true', help='Verbose logging')
    parser.add_argument('--local', action='store_true', help='No websocket.')
    parser.add_argument('--mock-mode', action='store_true', help='Enable mock mode')
    parser.add_argument('--url', type=str, help='URL for the camera feed')
    args = parser.parse_args()
    
    print("🐍 Running opencv with:")
    print(args)
    main(args)

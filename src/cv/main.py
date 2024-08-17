import json
import time
import cv2
import argparse

from shared.object_detection import ObjectDetector
from shared.face.face_detector import FaceDetector
from shared.hands.simple_hand_tracking import SimpleHandTracking

def main(show_cv, debug, mock_mode, camera_address):
    object_detector = ObjectDetector()
    face_detector = FaceDetector(draw_square=True)
    simple_hand_tracking = SimpleHandTracking()
      
    
    cap = cv2.VideoCapture(camera_address)
    
    while cap.isOpened():
        success, img = cap.read()
        if not success:
            return
        
        # Flip the frame horizontally for a mirror-like effect
        frame = cv2.flip(img, 1)
        
        #face_detector.subscribe(img=frame, threshold_distance=50)
        simple_hand_tracking.subscribe(img=frame)
           
        if show_cv:
            cv2.imshow("Image", img)

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
    
    # 0 is usb/default camera.
    print(args)
    camera_address = args.url if args.url is not None else 0

    main(args.show_cv, args.debug, args.mock_mode, camera_address)

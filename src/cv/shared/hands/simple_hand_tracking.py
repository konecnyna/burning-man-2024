import json
import cv2
import mediapipe as mp
from shared.util.web_socket_client import ws_client


mp_hands = mp.solutions.hands

# https://chatgpt.com/share/bb255ebc-2e5a-48ef-ac2d-448d5fc6b63a

class SimpleHandTracking:
    def __init__(self):
        self.hands = mp_hands.Hands(
            max_num_hands=4,
            min_detection_confidence=0.1,
            min_tracking_confidence=0.1,
            model_complexity=0,
        ) 

    
    def subscribe(self, img, draw=True):
        # To improve performance, optionally mark the image as not writeable to
        # pass by reference.
        img.flags.writeable = False
        # Convert the color space from BGR to RGB
        rgb_frame = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Process the frame and detect hands
        result = self.hands.process(rgb_frame)

        if result.multi_hand_landmarks:
            payloads = []
            for idx, hand_landmarks in enumerate(result.multi_hand_landmarks):
                # Initialize variables for bounding box
                x_min, y_min = float('inf'), float('inf')
                x_max, y_max = float('-inf'), float('-inf')

                for landmark in hand_landmarks.landmark:
                    x = landmark.x
                    y = landmark.y

                    if x < x_min:
                        x_min = x
                    if x > x_max:
                        x_max = x
                    if y < y_min:
                        y_min = y
                    if y > y_max:
                        y_max = y

                # Convert normalized coordinates to pixel values
                h, w, _ = img.shape
                x_min = int(x_min * w)
                x_max = int(x_max * w)
                y_min = int(y_min * h)
                y_max = int(y_max * h)

                # Calculate the center of the bounding box
                x_center = (x_min + x_max) // 2
                y_center = (y_min + y_max) // 2
                
                 # Calculate percentage position relative to the screen
                x_percent = (x_center / w)
                y_percent = (y_center / h)

                # Draw the bounding box
                #cv2.rectangle(img, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)

                # Draw the center point
                #cv2.circle(img, (x_center, y_center), 5, (255, 0, 0), -1)

                # Draw the hand landmarks on the frame
                # mp_drawing.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                # Print bounding box coordinates and center point
                # print(f"Center point: x={x_center}, y={y_center}")
                # cv2.imshow('Hand Position with Bounding Box and Center Point', img)
                
                payloads.append({ "id": idx, "x": x_center, "y" : y_center, "x_percent": x_percent, "y_percent": y_percent })
                
            ws_client.publish("hand_detect_new", payloads)

                
    def makeEvent(self, event, payload):
        event = {"event": event, "payload": payload}
        return json.dumps(event)
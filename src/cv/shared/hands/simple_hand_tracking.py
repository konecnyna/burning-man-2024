import json
import math
import cv2
import mediapipe as mp
from shared.util.web_socket_client import ws_client


mp_hands = mp.solutions.hands

# https://chatgpt.com/share/bb255ebc-2e5a-48ef-ac2d-448d5fc6b63a

class SimpleHandTracking:
    def __init__(self):
        self.hands = mp_hands.Hands(
            max_num_hands=4,
            min_detection_confidence=0.25,
            min_tracking_confidence=0.25,
            model_complexity=0,
        ) 
        
        self.hands_combine_thershold = 250 


    def subscribe(self, img, draw=True):
        img.flags.writeable = False
        rgb_frame = self.convert_bgr_to_rgb(img)
        result = self.hands.process(rgb_frame)

        if result.multi_hand_landmarks:
            hand_centers = self.calculate_hand_centers(result, img)
            hand_centers.reverse()  # Prioritize larger index hands
            filtered_indices = self.filter_close_hands(hand_centers)

            payloads = self.create_payloads(hand_centers, filtered_indices, img)
            ws_client.publish("hand_detect_new", payloads)

    def convert_bgr_to_rgb(self, img):
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def calculate_hand_centers(self, result, img):
        hand_centers = []
        h, w, _ = img.shape

        for idx, hand_landmarks in enumerate(result.multi_hand_landmarks):
            x_min, y_min = float('inf'), float('inf')
            x_max, y_max = float('-inf'), float('-inf')

            for landmark in hand_landmarks.landmark:
                x = landmark.x
                y = landmark.y

                x_min = min(x_min, x)
                x_max = max(x_max, x)
                y_min = min(y_min, y)
                y_max = max(y_max, y)

            x_center = (x_min + x_max) / 2 * w
            y_center = (y_min + y_max) / 2 * h
            hand_centers.append((idx, x_center, y_center))

        return hand_centers

    def filter_close_hands(self, hand_centers):
        
        filtered_indices = set()

        for i in range(len(hand_centers)):
            for j in range(i + 1, len(hand_centers)):
                idx_i, x_i, y_i = hand_centers[i]
                idx_j, x_j, y_j = hand_centers[j]

                distance = math.sqrt((x_j - x_i) ** 2 + (y_j - y_i) ** 2)
                if distance < self.hands_combine_thershold:
                    filtered_indices.add(idx_j)

        return filtered_indices

    def create_payloads(self, hand_centers, filtered_indices, img):
        payloads = []
        h, w, _ = img.shape

        for hand_idx, x_center, y_center in hand_centers:
            if hand_idx not in filtered_indices:
                x_percent = x_center / w
                y_percent = y_center / h
                payloads.append({
                    "id": hand_idx,
                    "x": x_center,
                    "y": y_center,
                    "x_percent": x_percent,
                    "y_percent": y_percent
                })

        return payloads
    def draw(self):
        print("draw")
        # # Draw the bounding box
        # cv2.rectangle(img, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)

        # # Draw the center point
        # cv2.circle(img, (x_center, y_center), 5, (255, 0, 0), -1)

        # # Draw the hand landmarks on the frame
        # mp_drawing.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)

        # # Print bounding box coordinates and center point
        # print(f"Center point: x={x_center}, y={y_center}")
        # cv2.imshow('Hand Position with Bounding Box and Center Point', img)
                
    def makeEvent(self, event, payload):
        event = {"event": event, "payload": payload}
        return json.dumps(event)
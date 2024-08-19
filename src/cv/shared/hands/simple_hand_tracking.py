import json
import math
import os
import time
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from shared.hands.gesture_detection import is_fist, is_peace_sign, is_ok_sign, is_shaka_sign
from shared.hands.gesture_recognizer import GestureRecognizer


script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, "models/hand_landmarker.task")


class SimpleHandTracking:
    def __init__(self, drawLandmarks=True, ws_client=False):
        self.ws_client = ws_client
        
        self.drawLandmarks = drawLandmarks
        self.hands_combine_threshold = 150
        self.distance_history = []
        self.gesture_recognizer = GestureRecognizer()
        self.frame_counter = 0  # Add a frame counter


        # Initialize the Hand Landmarker without the model_complexity argument
        options = vision.HandLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=model_path),
            running_mode=vision.RunningMode.VIDEO,
            num_hands=4,
            min_hand_detection_confidence=0.3,
            min_hand_presence_confidence=0.1,
            min_tracking_confidence=0.1
        )
        self.hand_landmarker = vision.HandLandmarker.create_from_options(options)
        self.hand_landmarker = vision.HandLandmarker.create_from_options(options)

    def subscribe(self, img, draw=True):
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img)
        timestamp_ms = int(time.time() * 1000) 
        result = self.hand_landmarker.detect_for_video(mp_image, timestamp_ms)

        if result.hand_landmarks:
            hand_centers = self.calculate_hand_centers(result, img)
            hand_centers.reverse()  # Prioritize larger index hands
            filtered_indices = self.filter_close_hands(hand_centers)

            payloads = self.create_payloads(hand_centers, filtered_indices, img, result)
            self.ws_client.publish("hand_detect_new", payloads)

        
    def convert_bgr_to_rgb(self, img):
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def calculate_hand_centers(self, result, img):
        hand_centers = []
        h, w, _ = img.shape

        for idx, hand_landmarks in enumerate(result.hand_landmarks):
            x_min, y_min = float('inf'), float('inf')
            x_max, y_max = float('-inf'), float('-inf')

            for landmark in hand_landmarks:
                x = landmark.x
                y = landmark.y

                x_min = min(x_min, x)
                x_max = max(x_max, x)
                y_min = min(y_min, y)
                y_max = max(y_max, y)

            x_center = int((x_min + x_max) / 2 * w)
            y_center = int((y_min + y_max) / 2 * h)

            hand_centers.append((idx, x_center, y_center))

        return hand_centers

    def filter_close_hands(self, hand_centers):
        filtered_indices = set()

        for i in range(len(hand_centers)):
            for j in range(i + 1, len(hand_centers)):
                idx_i, x_i, y_i = hand_centers[i]
                idx_j, x_j, y_j = hand_centers[j]

                distance = math.sqrt((x_j - x_i) ** 2 + (y_j - y_i) ** 2)
                if distance < self.hands_combine_threshold:
                    filtered_indices.add(idx_j)

        return filtered_indices

    def create_payloads(self, hand_centers, filtered_indices, img, result):
        payloads = []
        h, w, _ = img.shape

        for idx, (hand_idx, x_center, y_center) in enumerate(hand_centers):
            if hand_idx not in filtered_indices:
                x_percent = x_center / w
                y_percent = y_center / h

                # Estimate the distance of the hand from the camera using the wrist z-coordinate
                wrist_z = result.hand_landmarks[hand_idx][0].z
                distance = self.estimate_distance(wrist_z)
                
                gestures = self.gesture_recognizer.recognize_gesture(image=img)
                is_thumbs_up = self.gesture_recognizer.is_thumbs_up(gestures=gestures)
                print(f"👍 {is_thumbs_up}")
                payloads.append({
                    "id": hand_idx,
                    "x": x_center,
                    "y": y_center,
                    "x_percent": x_percent,
                    "y_percent": y_percent,
                    "distance": distance,
                    # "is_fist": is_fist(hand_landmarks),  # Pass the full list of landmarks
                    # "is_ok": is_ok_sign(hand_landmarks),  # Pass the full list of landmarks
                    # "is_peace_sign": is_peace_sign(hand_landmarks),  # Pass the full list of landmarks
                    "is_thumbs_up": is_thumbs_up,
                    "next_scene_gesture": is_thumbs_up
                })

        return payloads

    def estimate_distance(self, z, history_size=15):
        # Invert the z value and scale to a more reasonable range
        # If the hand is too close (z is a large negative value), set distance to 0
        distance = abs(z * 1000000000)

        # Maintain a running average of the distance
        self.distance_history.append(distance)
        if len(self.distance_history) > history_size:
            self.distance_history.pop(0)

        return round(sum(self.distance_history) / len(self.distance_history), 2)

    def draw(self):
        print("draw")

    def makeEvent(self, event, payload):
        event = {"event": event, "payload": payload}
        return json.dumps(event)
from datetime import datetime
import json
import math
import cv2
import mediapipe as mp
from shared.hands.gesture_detection import is_fist, is_peace_sign, is_ok_sign, is_thumbs_up_or_down

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils  # Add this for drawing landmarks
mp_drawing_styles = mp.solutions.drawing_styles  # Add this for drawing styles

class SimpleHandTracking:
    def __init__(self, drawLandmarks=True, ws_client=False):
        self.drawLandmarks = drawLandmarks
        self.ws_client = ws_client
        self.hands = mp_hands.Hands(
            max_num_hands=4,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.2,
            model_complexity=0,
        )
        
        self.hands_combine_threshold = 150 
        self.distance_history = [] 

    def subscribe(self, img, draw=True):
        #img.flags.writeable = False
        # rgb_frame = self.convert_bgr_to_rgb(img)
        result = self.hands.process(img)

        if result.multi_hand_landmarks:
            hand_centers = self.calculate_hand_centers(result, img)
            hand_centers.reverse()  # Prioritize larger index hands
            filtered_indices = self.filter_close_hands(hand_centers)

            payloads = self.create_payloads(hand_centers, filtered_indices, img, result)
            self.ws_client.publish("hand_detect_new", payloads)

            # Draw landmarks if self.drawLandmarks is True
            if self.drawLandmarks:
                for hand_landmarks in result.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(
                        img, 
                        hand_landmarks, 
                        mp_hands.HAND_CONNECTIONS,
                        mp_drawing_styles.get_default_hand_landmarks_style(),
                        mp_drawing_styles.get_default_hand_connections_style()
                    )

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
                wrist_z = result.multi_hand_landmarks[hand_idx].landmark[0].z
                distance = self.estimate_distance(wrist_z)

                
                hand_landmarks = result.multi_hand_landmarks[hand_idx]
                
                thumbs_gesture_result = is_thumbs_up_or_down(hand_landmarks=hand_landmarks)

                if (thumbs_gesture_result == "up"):
                    print(f"{datetime.now()} 👍", flush=True)
                elif (thumbs_gesture_result == "down"):
                    print(f"{datetime.now()} 👎", flush=True)

                payloads.append({
                    "id": hand_idx,
                    "x": x_center,
                    "y": y_center,
                    "x_percent": x_percent,
                    "y_percent": y_percent,
                    "distance": distance,
                    "is_fist": is_fist(hand_landmarks),
                    "is_ok": is_ok_sign(hand_landmarks),
                    "is_thumb_down": thumbs_gesture_result == "down",
                    "is_thumbs_up": thumbs_gesture_result == "up",
                    "is_peace_sign": is_peace_sign(hand_landmarks),
                    "next_scene_gesture": thumbs_gesture_result == "down"
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
        
        
        return round(sum(self.distance_history) / len(self.distance_history),2)

    def makeEvent(self, event, payload):
        event = {"event": event, "payload": payload}
        return json.dumps(event)
import json
import math
import cv2
import mediapipe as mp
from shared.util.web_socket_client import ws_client
from shared.hands.gesture_detection import is_fist, is_peace_sign, is_ok_sign, is_shaka_sign

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils  # Add this for drawing landmarks
mp_drawing_styles = mp.solutions.drawing_styles  # Add this for drawing styles

class SimpleHandTracking:
    def __init__(self, drawLandmarks=True):
        self.drawLandmarks = drawLandmarks
        self.hands = mp_hands.Hands(
            max_num_hands=4,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.3,
            model_complexity=0,
        )
        
        self.hands_combine_threshold = 150 

    def subscribe(self, img, draw=True):
        #img.flags.writeable = False
        rgb_frame = self.convert_bgr_to_rgb(img)
        result = self.hands.process(rgb_frame)

        if result.multi_hand_landmarks:
            hand_centers = self.calculate_hand_centers(result, img)
            hand_centers.reverse()  # Prioritize larger index hands
            filtered_indices = self.filter_close_hands(hand_centers)

            payloads = self.create_payloads(hand_centers, filtered_indices, img, result)
            ws_client.publish("hand_detect_new", payloads)

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

            # Convert bounding box coordinates to integers
            x_min_int = int(x_min * w)
            x_max_int = int(x_max * w)
            y_min_int = int(y_min * h)
            y_max_int = int(y_max * h)

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
                payloads.append({
                    "id": hand_idx,
                    "x": x_center,
                    "y": y_center,
                    "x_percent": x_percent,
                    "y_percent": y_percent,
                    "distance": distance,
                    "is_fist": is_fist(hand_landmarks),
                    "is_ok": is_ok_sign(hand_landmarks),
                    "is_peace_sign": is_peace_sign(hand_landmarks),
                    "is_shaka_sign": is_shaka_sign(hand_landmarks),
                    "next_scene_gesture": is_ok_sign(hand_landmarks)
                })

        return payloads

    def estimate_distance(self, z):
        distance = abs(z * 1000000000)
        return round(distance, 2)

    def draw(self):
        print("draw")

    def makeEvent(self, event, payload):
        event = {"event": event, "payload": payload}
        return json.dumps(event)
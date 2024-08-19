import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import json
import math
from shared.util.web_socket_client import ws_client
from shared.hands.gesture_detection import is_fist, is_peace_sign, is_ok_sign, is_shaka_sign

# Load Palm Detection Model
class PalmDetector:
    def __init__(self, model_path='/Users/defkon/github/burning-man-2024/src/cv/shared/hands/palm_detection_full.tflite'):
        self.interpreter = tf.lite.Interpreter(model_path=model_path)
        self.interpreter.allocate_tensors()
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

    def detect_palms(self, frame):
        input_data = cv2.resize(frame, (192, 192))  # Model expects 192x192 input
        input_data = np.expand_dims(input_data, axis=0).astype(np.float32)

        # Normalize and convert to INT8 if required
        input_data = (input_data / 255.0).astype(np.float32)
        self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
        self.interpreter.invoke()
        detection_result = self.interpreter.get_tensor(self.output_details[0]['index'])
        return detection_result  # Process this to get the palm detection results

class SimpleHandTracking:
    def __init__(self, drawLandmarks=True):
        self.drawLandmarks = drawLandmarks
        self.hands = mp.solutions.hands.Hands(
            max_num_hands=4,
            min_detection_confidence=0.3,
            min_tracking_confidence=0.1,
            model_complexity=0,  # Faster but less detailed
        )
        self.palm_detector = PalmDetector()  # Initialize Palm Detector
        self.hands_combine_threshold = 150 
        self.distance_history = [] 

    def subscribe(self, img, draw=True):
        # Convert to RGB and use Palm Detector first
        rgb_frame = self.convert_bgr_to_rgb(img)
        palm_detections = self.palm_detector.detect_palms(rgb_frame)

        if self.is_palm_detected(palm_detections):
            result = self.hands.process(rgb_frame)

            if result.multi_hand_landmarks:
                hand_centers = self.calculate_hand_centers(result, img)
                hand_centers.reverse()
                filtered_indices = self.filter_close_hands(hand_centers)

                payloads = self.create_payloads(hand_centers, filtered_indices, img, result)
                ws_client.publish("hand_detect_new", payloads)

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

    def is_palm_detected(self, palm_detections, threshold=0.5):
        # Example processing - you'd need to adjust based on actual model output
        return np.any(palm_detections > threshold)

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

    def estimate_distance(self, z, history_size=15):
        distance = abs(z * 1000000000)
        self.distance_history.append(distance)
        if len(self.distance_history) > history_size:
            self.distance_history.pop(0)
        return round(sum(self.distance_history) / len(self.distance_history), 2)
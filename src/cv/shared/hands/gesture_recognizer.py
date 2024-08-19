import os
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Load the gesture recognizer model
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, "models/gesture_recognizer.task")

class GestureRecognizer:
    def __init__(self):
        self.base_options = python.BaseOptions(model_asset_path=model_path)
        self.options = vision.GestureRecognizerOptions(base_options=self.base_options)
        self.recognizer = vision.GestureRecognizer.create_from_options(self.options)

    def recognize_gesture(self, image):
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
        gesture_result = self.recognizer.recognize(mp_image)
        
        recognized_gestures = []
        if gesture_result.gestures:
            for gesture_list in gesture_result.gestures:
                if len(gesture_list) > 0:
                    recognized_gestures.append(gesture_list[0].category_name)
        
        return recognized_gestures

    def is_fist(self, gestures):
        return "Closed_Fist" in gestures

    def is_thumbs_up(self, gestures):
        return "Thumb_Up" in gestures

    def is_thumbs_down(self, gestures):
        return "Thumb_Down" in gestures

    def is_pointing_up(self, gestures):
        return "Pointing_Up" in gestures
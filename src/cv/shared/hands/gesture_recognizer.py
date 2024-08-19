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
        
        if gesture_result.gestures and len(gesture_result.gestures[0]) > 0:
            return gesture_result.gestures[0][0].category_name
        return None

    def is_fist(self, image):
        gesture = self.recognize_gesture(image)
        return gesture == "Closed_Fist"

    def is_thumbs_up(self, image):
        gesture = self.recognize_gesture(image)
        return gesture == "Thumb_Up"

    def is_thumbs_down(self, image):
        gesture = self.recognize_gesture(image)
        return gesture == "Thumb_Down"

    def is_pointing_up(self, image):
        gesture = self.recognize_gesture(image)
        return gesture == "Pointing_Up"
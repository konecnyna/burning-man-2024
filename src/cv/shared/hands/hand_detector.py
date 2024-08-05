import mediapipe as mp
import cv2

class HandDetector():
    def __init__(self, 
        static_mode=False, 
        max_hands=2,
        model_complextiy=1, 
        detect_confidence=0.5, 
        track_confidence=0.5,
        focal_length=700,  # Assumed focal length in pixels
        real_hand_width=8.0  # Assumed average real hand width in cm
    ) -> None:
        
        self.static_mode = static_mode
        self.max_hands = max_hands
        self.model_complexity = model_complextiy
        self.detect_confidence = detect_confidence
        self.track_confidence = track_confidence
        self.focal_length = focal_length
        self.real_hand_width = real_hand_width
        
        self.FINGURE_TIP = [4, 8, 12, 16, 20]

        # DELETE THESE! use ones in detector.
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(static_image_mode=self.static_mode, 
                                         max_num_hands=self.max_hands, 
                                         model_complexity=self.model_complexity, 
                                         min_detection_confidence=self.detect_confidence,
                                         min_tracking_confidence=self.track_confidence)

        self.mp_draw = mp.solutions.drawing_utils
    
    def find_hand(self, image, draw=True):
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.hands.process(img_rgb)
        if results.multi_hand_landmarks:
            if draw:
                for hand in results.multi_hand_landmarks:
                    self.mp_draw.draw_landmarks(image, hand, self.mp_hands.HAND_CONNECTIONS)
        return image
    
    def find_position(self, image, draw=False):
        h, w, c = image.shape
        lst_position = []
        
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.hands.process(img_rgb)
        if results.multi_hand_landmarks:
            for hand in results.multi_hand_landmarks:
                for id, mark in enumerate(hand.landmark):
                    # cx, cy = int(mark.x * w), int(mark.y * h)
                    lst_position.append([id, mark.x, mark.y])
                if draw:
                    self.mp_draw.draw_landmarks(image, hand, self.mp_hands.HAND_CONNECTIONS)
        return [results,lst_position]
    
    def fingerUp(self, lst_mark):
        fingure_status = list()
        # for right hand thumb
        if lst_mark[4][1] < lst_mark[4 -1][1]:
            fingure_status.append(1)
        else:
            fingure_status.append(0)
        for id in self.FINGURE_TIP[1:]:
            if lst_mark[id][2] < lst_mark[id -1][2]:
                fingure_status.append(1)
            else:
                fingure_status.append(0)
        return fingure_status
    
    def isIndexFingerUp(self, lst_mark):
        result = self.fingerUp(lst_mark=lst_mark)
        return result == [0, 1, 0, 0, 0]

    def calculate_distance(self, landmark1, landmark2):
        return ((landmark1.x - landmark2.x) ** 2 + (landmark1.y - landmark2.y) ** 2) ** 0.5

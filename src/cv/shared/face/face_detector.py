import time
import cv2
from shared.util.web_socket_client import ws_client

class FaceDetector:
    def __init__(self, draw_square=False, debug=False):
        self.draw_square = draw_square
        self.debug = debug
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.known_width = 14.3  # Average face width in centimeters
        self.focal_length = 600  # Example focal length, calibrate this for your camera
        self.detection_mode = "passive"
        self.last_detection_time = None
        self.timeout = 120  # 2 minutes timeout in seconds
        self.publishEvent(self.detection_mode)

    def calculate_distance(self, face_width):
        # Simple distance estimation based on the known face width and camera focal length
        return (self.known_width * self.focal_length) / face_width

    def detect_faces(self, img):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        face_data = []

        for (x, y, w, h) in faces:
            distance = self.calculate_distance(w)
            face_data.append({"x": x, "y": y, "width": w, "height": h, "distance": distance})

            
        return face_data

    def subscribe(self, img, threshold_distance):
        face_data = self.detect_faces(img)
        
        if face_data:
            closest_face = min(face_data, key=lambda f: f['distance'])
            if closest_face["distance"] < threshold_distance:
                if self.detection_mode != "active":
                    self.detection_mode = "active"
                    self.publishEvent(self.detection_mode)
                self.last_detection_time = time.time()
        else:
            self.check_timeout()

    def check_timeout(self):
        if self.last_detection_time is not None:
            time_since_last_detection = time.time() - self.last_detection_time
            if time_since_last_detection > self.timeout:
                self.detection_mode = "passive"
                self.publishEvent(self.detection_mode)
                self.last_detection_time = None

    def publishEvent(self, mode):
        ws_client.publish(event="detection_mode", data={"mode": mode})
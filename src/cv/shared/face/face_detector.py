import time
import cv2

class FaceDetector:
    def __init__(self, draw_square=False, debug=False):
        self.draw_square = draw_square
        self.debug = debug
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.known_width = 14.3  # Average face width in centimeters
        self.focal_length = 600  # Example focal length, you need to calibrate this for your camera
        self.detected_under_50 = False
        self.start_time = 0.0
        self.last_detection_time = None
        self.timeout = 120  # 2 minutes timeout in seconds
        
        self.detection_mode = "passive"

    def calculate_distance(self, face_width):
        return (self.known_width * self.focal_length) / face_width

    def detect_faces(self, img):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        face_data = []

        for (x, y, w, h) in faces:
            distance = self.calculate_distance(w)
            face_data.append({"x": x, "y": y, "width": w, "height": h, "distance": distance})

            if self.draw_square:
                color = (0, 255, 0)
                cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)
                cv2.putText(img, f"{distance:.2f}cm", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        if self.debug:
            print(face_data, flush=True)
        
        return face_data

    def subscribe(self, img, distance):
        face_data = self.detect_faces(img)
        
        if face_data:
            for face in face_data:
                self.last_detection_time = time.time()                        
                if face["distance"] < distance:                    
                    elapsed_time = time.time() - self.start_time
                    if elapsed_time > 3 and self.detection_mode != "active":
                        print("Face detected under 50cm for more than 3 seconds! Staying in active mode.")
                        self.detection_mode = "active"
                        self.start_time = time.time()
                else:
                    self.detected_under_50 = False
                    self.start_time = 0.0
        else:
            if self.last_detection_time is not None:                
                time_since_last_detection = time.time() - self.last_detection_time
                if time_since_last_detection > self.timeout:
                    self.detection_mode = "passive"
                    self.last_detection_time = None
                    print("No face detected for 2 minutes. Switching to passive mode.")

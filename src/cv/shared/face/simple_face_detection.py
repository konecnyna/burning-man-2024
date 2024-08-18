import cv2
import mediapipe as mp

mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils 
mp_drawing_styles = mp.solutions.drawing_styles 
from shared.util.web_socket_client import ws_client

class SimpleFaceDetection:
    def __init__(self, drawLandmarks=True):
        self.drawLandmarks = drawLandmarks
        self.face_detection = mp_face_detection.FaceDetection(
            min_detection_confidence=0.25
        )

    def subscribe(self, img, draw=True):
        # Convert the image from BGR to RGB
        rgb_frame = self.convert_bgr_to_rgb(img)
        result = self.face_detection.process(rgb_frame)

        if result.detections:
            for detection in result.detections:
                bbox = self.calculate_bounding_box(detection, img)

                payload = self.create_payload(detection, bbox)
                ws_client.publish("face_detect", payload)

                # Draw landmarks if self.drawLandmarks is True
                if self.drawLandmarks:
                    self.draw_detection(img, detection)

    def convert_bgr_to_rgb(self, img):
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def calculate_bounding_box(self, detection, img):
        h, w, _ = img.shape
        bboxC = detection.location_data.relative_bounding_box
        x_min = int(bboxC.xmin * w)
        y_min = int(bboxC.ymin * h)
        width = int(bboxC.width * w)
        height = int(bboxC.height * h)
        bbox = [x_min, y_min, width, height]
        return bbox

    def create_payload(self, detection, bbox):
        payload = {
            "score": detection.score[0],  # Confidence score
            "bounding_box": bbox,
        }
        return payload

    def draw_detection(self, img, detection):
        mp_drawing.draw_detection(img, detection)
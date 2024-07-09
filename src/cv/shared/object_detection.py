import random
import cv2
import time
import json

from shared.postion_translater import translate_img_coordinates

class ObjectDetector:
    def __init__(self, draw_square=False):
        self.first_Frame = None
        self.area = 500
        self.draw_square = draw_square

    def resize(self, image, width):
        aspect_ratio = width / float(image.shape[1])
        dimensions = (width, int(image.shape[0] * aspect_ratio))
        return cv2.resize(image, dimensions, interpolation=cv2.INTER_AREA)

    def findPosition(self, img):
        gray_Img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # color to Gray scale image
        gaussian_Img = cv2.GaussianBlur(gray_Img, (21, 21), 0)  # smoothened

        if self.first_Frame is None:
            self.first_Frame = gaussian_Img  # capturing 1st frame on 1st iteration
            return None

        img_Diff = cv2.absdiff(self.first_Frame, gaussian_Img)  # absolute diff between 1st and current frame
        thresh_Img = cv2.threshold(img_Diff, 25, 255, cv2.THRESH_BINARY)[1]  # binary
        thresh_Img = cv2.dilate(thresh_Img, None, iterations=2)

        contours, _ = cv2.findContours(thresh_Img.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        lmList = []
        for c in contours:
            if cv2.contourArea(c) < self.area:
                continue
            (x, y, w, h) = cv2.boundingRect(c)
            lmList.append((x, y, w, h))
        return lmList


    def subscribe(self, img):
        lmList = self.findPosition(img)
        events = []
        if lmList:
            for i, (x, y, w, h) in enumerate(lmList, start=1):
                center_x, center_y = x + w // 2, y + h // 2

                translated_x, translated_y = translate_img_coordinates(
                    event_x=center_x,
                    event_y=center_y                    
                )

                events.append({"id": i, "x": translated_x, "y": translated_y})

                if self.draw_square:
                    color = (0, 255, 0) if i % 2 == 0 else (255, 0, 0)  # Alternate colors for different objects
                    cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)
                    cv2.putText(img, f"ID {i}", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        if events:
            print(self.makeEvent(events), flush=True)

    def makeEvent(self, events):
        event = {'event': 'object_detected', 'payload': events}
        return json.dumps(event)


    def mockMode(self):
        points = []

        def create_point(point_id):
            return {
                "id": point_id,
                "x": random.randint(200, 1000),
                "y": random.randint(300, 800),
                "speed_x": random.choice([-1, 1]) * random.uniform(1, 3)
            }

        # Initialize with a random number of points between 2 and 6
        num_points = random.randint(2, 6)
        for i in range(num_points):
            points.append(create_point(i + 1))

        next_id = num_points + 1

        while True:
            for point in points:
                point["x"] += point["speed_x"] * 5

            # Remove points that go off the screen
            points = [point for point in points if 200 <= point["x"] <= 1000]

            # Ensure there are between 2 and 6 points
            while len(points) < 2:
                points.append(create_point(next_id))
                next_id += 1

            if len(points) < 6 and random.random() < 0.1:  # 10% chance to add a new point if under 6 points
                points.append(create_point(next_id))
                next_id += 1

            payload = [{"id": point["id"], "x": point["x"], "y": point["y"]} for point in points]
            print(self.makeEvent(payload), flush=True)
            time.sleep(0.1)        
        
    def start(self):
        while True:
            _, img = self.camera.read()  # read frame from camera
            img = self.resize(img, width=500)  # resize

            self.subscribe(img)

            cv2.imshow("cameraFeed", img)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break

        self.camera.release()
        cv2.destroyAllWindows()

# if __name__ == "__main__":
#     rtsp_url = "rtsp://defkon:password@10.0.0.53/stream1"
#     motion_detector = MotionDetector(rtsp_url, draw_square=True)
#     motion_detector.start()

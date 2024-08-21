import random
import cv2
import time
import json

class MotionDetector:
    def __init__(self, debug=False, ws_client=None, sensitivity=100, group_distance=500):
        self.debug = debug
        self.ws_client = ws_client
        self.sensitivity = sensitivity
        self.group_distance = group_distance
        self.previous_frame = None
        self.event_id_counter = 0

    def subscribe(self, img):
        events = []
        
        # Convert the frame to grayscale and apply GaussianBlur
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        if self.previous_frame is None:
            self.previous_frame = gray
            return
        
        # Calculate the absolute difference between the current frame and previous frame
        frame_diff = cv2.absdiff(self.previous_frame, gray)
        _, thresh = cv2.threshold(frame_diff, self.sensitivity, 255, cv2.THRESH_BINARY)
        thresh = cv2.dilate(thresh, None, iterations=2)

        # Find contours in the thresholded image
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for contour in contours:
            if cv2.contourArea(contour) < 500:  # Filter out small movements
                continue

            # Get bounding box coordinates
            (x, y, w, h) = cv2.boundingRect(contour)
            events.append({"x": x, "y": y, "w": w, "h": h})

        # Combine overlapping or nearby events and assign IDs
        combined_events = self._combine_overlapping_events(events)

        if self.debug:
            for event in combined_events:
                # Draw bounding box
                cv2.rectangle(img, (event["x"], event["y"]), 
                              (event["x"] + event["w"], event["y"] + event["h"]), 
                              (0, 255, 0), 2)
                # Display event ID
                cv2.putText(img, f'ID: {event["id"]}', (event["x"], event["y"] - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Update the previous frame to the current frame
        self.previous_frame = gray

        if combined_events and self.ws_client:
            self.ws_client.publish(event="object_detected", data=combined_events)

    def _combine_overlapping_events(self, events):
        if not events:
            return []

        combined_events = []

        while events:
            base_event = events.pop(0)
            group = [base_event]

            for event in events[:]:
                if self._is_overlapping_or_nearby(base_event, event):
                    group.append(event)
                    events.remove(event)

            # Combine the group into one bounding box and assign an ID
            combined_event = self._combine_events(group)
            combined_event["id"] = self._generate_event_id()
            combined_events.append(combined_event)

        return combined_events

    def _is_overlapping_or_nearby(self, event1, event2):
        # Check if event1 and event2 overlap or are within the group_distance
        return not (event1["x"] > event2["x"] + event2["w"] or 
                    event1["x"] + event1["w"] < event2["x"] or 
                    event1["y"] > event2["y"] + event2["h"] or 
                    event1["y"] + event1["h"] < event2["y"]) or \
               (
                   abs(event1["x"] - event2["x"]) <= self.group_distance or
                   abs(event1["y"] - event2["y"]) <= self.group_distance or
                   abs(event1["x"] + event1["w"] - event2["x"] - event2["w"]) <= self.group_distance or
                   abs(event1["y"] + event1["h"] - event2["y"] - event2["h"]) <= self.group_distance
               )

    def _combine_events(self, events):
        if not events:
            return None

        x_min = min(event["x"] for event in events)
        y_min = min(event["y"] for event in events)
        x_max = max(event["x"] + event["w"] for event in events)
        y_max = max(event["y"] + event["h"] for event in events)

        return {"x": x_min, "y": y_min, "w": x_max - x_min, "h": y_max - y_min}

    def _generate_event_id(self):
        self.event_id_counter += 1
        return self.event_id_counter

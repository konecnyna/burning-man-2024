import cv2
import mediapipe as mp
import numpy as np
import threading
import time
from datetime import datetime
from typing import List, Dict, Optional
from event_system import Event, EventBus, HandTrackingEvents

class HandTracker:
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5,
            model_complexity=1
        )
        
        self.cap = None
        self.running = False
        self.thread = None
        self.previous_hands = []
        self.fps = 0
        self.last_fps_time = time.time()
        self.frame_count = 0
        
    def start(self, camera_index: int = 0):
        """Start the hand tracking system"""
        if self.running:
            return
            
        self.cap = cv2.VideoCapture(camera_index)
        if not self.cap.isOpened():
            self.event_bus.emit(Event(
                type=HandTrackingEvents.CAMERA_ERROR,
                data={"error": "Could not open camera"},
                timestamp=datetime.now(),
                source="hand_tracker"
            ))
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._tracking_loop)
        self.thread.daemon = True
        self.thread.start()
        
        self.event_bus.emit(Event(
            type=HandTrackingEvents.SYSTEM_READY,
            data={"camera_index": camera_index},
            timestamp=datetime.now(),
            source="hand_tracker"
        ))
        
    def stop(self):
        """Stop the hand tracking system"""
        self.running = False
        if self.thread:
            self.thread.join()
        if self.cap:
            self.cap.release()
            
    def _tracking_loop(self):
        """Main tracking loop running in separate thread"""
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                self.event_bus.emit(Event(
                    type=HandTrackingEvents.CAMERA_ERROR,
                    data={"error": "Failed to read frame"},
                    timestamp=datetime.now(),
                    source="hand_tracker"
                ))
                time.sleep(0.1)
                continue
                
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Process frame
            self._process_frame(frame)
            
            # Calculate FPS
            self._update_fps()
            
    def _process_frame(self, frame):
        """Process single frame for hand detection"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        current_hands = []
        if results.multi_hand_landmarks:
            for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                hand_data = self._extract_hand_data(hand_landmarks, frame.shape)
                hand_data['hand_id'] = idx
                current_hands.append(hand_data)
                
        # Emit events based on state changes
        self._emit_hand_events(current_hands)
        
        # Always emit frame processed event
        self.event_bus.emit(Event(
            type=HandTrackingEvents.FRAME_PROCESSED,
            data={
                "hands": current_hands,
                "fps": self.fps,
                "frame_shape": frame.shape
            },
            timestamp=datetime.now(),
            source="hand_tracker"
        ))
        
        self.previous_hands = current_hands
        
    def _extract_hand_data(self, hand_landmarks, frame_shape) -> Dict:
        """Extract normalized hand data from MediaPipe landmarks"""
        height, width = frame_shape[:2]
        
        landmarks = []
        for lm in hand_landmarks.landmark:
            landmarks.append({
                'x': lm.x,
                'y': lm.y,
                'z': lm.z
            })
            
        # Key landmarks
        wrist = landmarks[0]
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        ring_tip = landmarks[16]
        pinky_tip = landmarks[20]
        
        # Calculate palm center
        palm_center = {
            'x': (wrist['x'] + landmarks[5]['x'] + landmarks[9]['x'] + landmarks[13]['x'] + landmarks[17]['x']) / 5,
            'y': (wrist['y'] + landmarks[5]['y'] + landmarks[9]['y'] + landmarks[13]['y'] + landmarks[17]['y']) / 5,
            'z': (wrist['z'] + landmarks[5]['z'] + landmarks[9]['z'] + landmarks[13]['z'] + landmarks[17]['z']) / 5
        }
        
        return {
            'landmarks': landmarks,
            'palm_center': palm_center,
            'wrist': wrist,
            'fingertips': {
                'thumb': thumb_tip,
                'index': index_tip,
                'middle': middle_tip,
                'ring': ring_tip,
                'pinky': pinky_tip
            }
        }
        
    def _emit_hand_events(self, current_hands: List[Dict]):
        """Emit hand detection and movement events"""
        prev_count = len(self.previous_hands)
        curr_count = len(current_hands)
        
        # Hand detection/loss events
        if curr_count > prev_count:
            self.event_bus.emit(Event(
                type=HandTrackingEvents.HAND_DETECTED,
                data={
                    "hands": current_hands,
                    "new_hands": curr_count - prev_count
                },
                timestamp=datetime.now(),
                source="hand_tracker"
            ))
        elif curr_count < prev_count:
            self.event_bus.emit(Event(
                type=HandTrackingEvents.HAND_LOST,
                data={
                    "hands": current_hands,
                    "lost_hands": prev_count - curr_count
                },
                timestamp=datetime.now(),
                source="hand_tracker"
            ))
            
        # Hand movement events
        if current_hands:
            self.event_bus.emit(Event(
                type=HandTrackingEvents.HAND_MOVED,
                data={
                    "hands": current_hands,
                    "timestamp": datetime.now().isoformat()
                },
                timestamp=datetime.now(),
                source="hand_tracker"
            ))
            
    def _update_fps(self):
        """Update FPS calculation"""
        self.frame_count += 1
        current_time = time.time()
        
        if current_time - self.last_fps_time >= 1.0:
            self.fps = self.frame_count / (current_time - self.last_fps_time)
            self.frame_count = 0
            self.last_fps_time = current_time
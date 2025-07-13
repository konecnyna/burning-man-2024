import cv2
import numpy as np
import threading
import time
from datetime import datetime
from typing import List, Dict, Optional
from event_system import Event, EventBus, HandTrackingEvents

class HandTrackerFallback:
    """
    Fallback hand tracker that uses OpenCV without MediaPipe
    This is a simplified version for testing when MediaPipe is not available
    """
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.cap = None
        self.running = False
        self.thread = None
        self.previous_hands = []
        self.fps = 0
        self.last_fps_time = time.time()
        self.frame_count = 0
        
        # Mock hand data for testing
        self.mock_hands = []
        self.mock_time = 0
        
        print("⚠️  Using fallback hand tracker (MediaPipe not available)")
        print("   This version generates mock hand data for testing")
        
    def start(self, camera_index: int = 0):
        """Start the hand tracking system"""
        if self.running:
            return
            
        # Try to open camera, but continue with mock data if it fails
        try:
            self.cap = cv2.VideoCapture(camera_index)
            if not self.cap.isOpened():
                print("⚠️  Camera not available, using mock hand data")
                self.cap = None
        except Exception as e:
            print(f"⚠️  Camera error: {e}, using mock hand data")
            self.cap = None
            
        self.running = True
        self.thread = threading.Thread(target=self._tracking_loop)
        self.thread.daemon = True
        self.thread.start()
        
        self.event_bus.emit(Event(
            type=HandTrackingEvents.SYSTEM_READY,
            data={"camera_index": camera_index, "mode": "fallback"},
            timestamp=datetime.now(),
            source="hand_tracker_fallback"
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
            if self.cap:
                ret, frame = self.cap.read()
                if ret:
                    frame = cv2.flip(frame, 1)
                    # Use simple color detection as fallback
                    self._process_frame_simple(frame)
                else:
                    self._generate_mock_hands()
            else:
                # Generate mock hand data
                self._generate_mock_hands()
                
            # Calculate FPS
            self._update_fps()
            
            # Control frame rate
            time.sleep(1/30)  # 30 FPS
            
    def _process_frame_simple(self, frame):
        """Simple color-based hand detection (very basic fallback)"""
        # Convert to HSV for skin color detection
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Define skin color range (very basic)
        lower_skin = np.array([0, 20, 70])
        upper_skin = np.array([20, 255, 255])
        
        # Create mask
        mask = cv2.inRange(hsv, lower_skin, upper_skin)
        
        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        current_hands = []
        
        # Process largest contours as potential hands
        if contours:
            # Sort by area and take up to 2 largest
            contours = sorted(contours, key=cv2.contourArea, reverse=True)[:2]
            
            height, width = frame.shape[:2]
            
            for idx, contour in enumerate(contours):
                if cv2.contourArea(contour) > 5000:  # Minimum area threshold
                    # Get bounding rectangle
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    # Calculate normalized center point
                    center_x = (x + w/2) / width
                    center_y = (y + h/2) / height
                    
                    # Create mock hand data
                    hand_data = self._create_mock_hand_data(center_x, center_y, idx)
                    current_hands.append(hand_data)
        
        # If no hands detected, occasionally generate mock hands for testing
        if not current_hands:
            self._generate_mock_hands()
            return
            
        # Emit events based on state changes
        self._emit_hand_events(current_hands)
        
        # Always emit frame processed event
        self.event_bus.emit(Event(
            type=HandTrackingEvents.FRAME_PROCESSED,
            data={
                "hands": current_hands,
                "fps": self.fps,
                "frame_shape": frame.shape,
                "mode": "simple_detection"
            },
            timestamp=datetime.now(),
            source="hand_tracker_fallback"
        ))
        
        self.previous_hands = current_hands
        
    def _generate_mock_hands(self):
        """Generate mock hand data for testing"""
        self.mock_time += 1
        
        current_hands = []
        
        # Generate 1-2 moving hands
        num_hands = 1 if (self.mock_time // 100) % 2 == 0 else 2
        
        for i in range(num_hands):
            # Create smooth circular motion
            angle = (self.mock_time + i * 180) * 0.02
            center_x = 0.5 + 0.3 * np.cos(angle)
            center_y = 0.5 + 0.2 * np.sin(angle)
            
            # Keep within bounds
            center_x = max(0.1, min(0.9, center_x))
            center_y = max(0.1, min(0.9, center_y))
            
            hand_data = self._create_mock_hand_data(center_x, center_y, i)
            current_hands.append(hand_data)
            
        # Emit events based on state changes
        self._emit_hand_events(current_hands)
        
        # Always emit frame processed event
        self.event_bus.emit(Event(
            type=HandTrackingEvents.FRAME_PROCESSED,
            data={
                "hands": current_hands,
                "fps": self.fps,
                "frame_shape": [480, 640, 3],
                "mode": "mock_data"
            },
            timestamp=datetime.now(),
            source="hand_tracker_fallback"
        ))
        
        self.previous_hands = current_hands
        
    def _create_mock_hand_data(self, center_x: float, center_y: float, hand_id: int) -> Dict:
        """Create mock hand data structure matching MediaPipe format"""
        # Create mock landmarks (21 points for MediaPipe hand model)
        landmarks = []
        for i in range(21):
            # Distribute points around the center
            angle = (i / 21) * 2 * np.pi
            radius = 0.05 + (i % 3) * 0.02
            x = center_x + radius * np.cos(angle)
            y = center_y + radius * np.sin(angle)
            
            landmarks.append({
                'x': max(0, min(1, x)),
                'y': max(0, min(1, y)),
                'z': 0.0
            })
        
        # Define key landmarks (matching MediaPipe indices)
        wrist = landmarks[0]
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        ring_tip = landmarks[16]
        pinky_tip = landmarks[20]
        
        # Palm center
        palm_center = {
            'x': center_x,
            'y': center_y,
            'z': 0.0
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
            },
            'hand_id': hand_id
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
                source="hand_tracker_fallback"
            ))
        elif curr_count < prev_count:
            self.event_bus.emit(Event(
                type=HandTrackingEvents.HAND_LOST,
                data={
                    "hands": current_hands,
                    "lost_hands": prev_count - curr_count
                },
                timestamp=datetime.now(),
                source="hand_tracker_fallback"
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
                source="hand_tracker_fallback"
            ))
            
    def _update_fps(self):
        """Update FPS calculation"""
        self.frame_count += 1
        current_time = time.time()
        
        if current_time - self.last_fps_time >= 1.0:
            self.fps = self.frame_count / (current_time - self.last_fps_time)
            self.frame_count = 0
            self.last_fps_time = current_time
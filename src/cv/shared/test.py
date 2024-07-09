import cv2
import numpy as np

# Initialize video capture with RTSP stream
cap = cv2.VideoCapture("rtsp://defkon:password@10.0.0.53/stream1")

frames = []
MAX_FRAMES = 1000
SENSAITIVITY = 4000
N = 2
THRESH = 60
ASSIGN_VALUE = 255  # Value to assign the pixel if the threshold is met

# Kernel for morphological operations
kernel = np.ones((5, 5), np.uint8)

# Variable for distance threshold
DIST_THRESH = 50

for t in range(MAX_FRAMES):
    # Capture frame by frame
    ret, frame = cap.read()
    if not ret:
        break
    
    # Convert frame to grayscale
    frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # Apply GaussianBlur to reduce noise and improve contour detection
    frame_gray = cv2.GaussianBlur(frame_gray, (21, 21), 0)
    # Append to list of frames
    frames.append(frame_gray)
    
    if t >= N:
        # D(N) = || I(t) - I(t+N) || = || I(t-N) - I(t) ||
        diff = cv2.absdiff(frames[t-N], frames[t])
        # Mask Thresholding
        ret, motion_mask = cv2.threshold(diff, THRESH, ASSIGN_VALUE, cv2.THRESH_BINARY)
        # Dilate the threshold image to fill in holes, then find contours on threshold image
        motion_mask = cv2.dilate(motion_mask, kernel, iterations=2)
        
        # Find contours in the motion mask
        contours, _ = cv2.findContours(motion_mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Combine close contours
            rects = [cv2.boundingRect(contour) for contour in contours if cv2.contourArea(contour) >= SENSAITIVITY]
            if rects:
                combined_rects = []
                while rects:
                    r1 = rects.pop(0)
                    r1_x, r1_y, r1_w, r1_h = r1
                    r1_center = (r1_x + r1_w / 2, r1_y + r1_h / 2)
                    for r2 in rects[:]:
                        r2_x, r2_y, r2_w, r2_h = r2
                        r2_center = (r2_x + r2_w / 2, r2_y + r2_h / 2)
                        distance = np.sqrt((r1_center[0] - r2_center[0]) ** 2 + (r1_center[1] - r2_center[1]) ** 2)
                        if distance < DIST_THRESH:
                            # Merge r1 and r2
                            new_x = min(r1_x, r2_x)
                            new_y = min(r1_y, r2_y)
                            new_w = max(r1_x + r1_w, r2_x + r2_w) - new_x
                            new_h = max(r1_y + r1_h, r2_y + r2_h) - new_y
                            r1 = (new_x, new_y, new_w, new_h)
                            rects.remove(r2)
                    combined_rects.append(r1)

                # Draw combined bounding boxes
                for (x, y, w, h) in combined_rects:
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # Display the Motion Mask
        cv2.imshow('Motion Mask', motion_mask)

    cv2.imshow('Object Detection', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

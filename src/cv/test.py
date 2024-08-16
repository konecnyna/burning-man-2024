import cv2
import mediapipe as mp

# Initialize MediaPipe Hands and drawing utilities
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

# Initialize webcam
cap = cv2.VideoCapture(0)

with mp_hands.Hands(
        max_num_hands=1,  # Detect only one hand
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as hands:

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Flip the frame horizontally for a mirror-like effect
        frame = cv2.flip(frame, 1)

        # Convert the color space from BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process the frame and detect hands
        result = hands.process(rgb_frame)

        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                # Initialize variables for bounding box
                x_min, y_min = float('inf'), float('inf')
                x_max, y_max = float('-inf'), float('-inf')

                for landmark in hand_landmarks.landmark:
                    x = landmark.x
                    y = landmark.y

                    if x < x_min:
                        x_min = x
                    if x > x_max:
                        x_max = x
                    if y < y_min:
                        y_min = y
                    if y > y_max:
                        y_max = y

                # Convert normalized coordinates to pixel values
                h, w, _ = frame.shape
                x_min = int(x_min * w)
                x_max = int(x_max * w)
                y_min = int(y_min * h)
                y_max = int(y_max * h)

                # Calculate the center of the bounding box
                x_center = (x_min + x_max) // 2
                y_center = (y_min + y_max) // 2

                # Draw the bounding box
                cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)

                # Draw the center point
                cv2.circle(frame, (x_center, y_center), 5, (255, 0, 0), -1)

                # Draw the hand landmarks on the frame
                # mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                # Print bounding box coordinates and center point
                print(f"Bounding box: x_min={x_min}, y_min={y_min}, x_max={x_max}, y_max={y_max}")
                print(f"Center point: x={x_center}, y={y_center}")

        # Display the frame
        cv2.imshow('Hand Position with Bounding Box and Center Point', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

# Release resources
cap.release()
cv2.destroyAllWindows()
import cv2
import mediapipe as mp

# Initialize MediaPipe Hand module
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

# Initialize the webcam
cap = cv2.VideoCapture(0)

def calculate_distance(landmark1, landmark2):
    return ((landmark1.x - landmark2.x) ** 2 + (landmark1.y - landmark2.y) ** 2) ** 0.5

with mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7) as hands:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Flip the image horizontally for a later selfie-view display
        frame = cv2.flip(frame, 1)

        # Convert the BGR image to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process the image and find hands
        result = hands.process(rgb_frame)

        # Draw hand landmarks
        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                # Calculate the distance between wrist (landmark 0) and middle finger tip (landmark 12)
                distance = calculate_distance(hand_landmarks.landmark[0], hand_landmarks.landmark[12])

                # Display the distance
                cv2.putText(frame, f'Distance: {distance:.2f}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)

        # Display the frame
        cv2.imshow('Hand Distance', frame)

        if cv2.waitKey(1) & 0xFF == 27:
            break

cap.release()
cv2.destroyAllWindows()

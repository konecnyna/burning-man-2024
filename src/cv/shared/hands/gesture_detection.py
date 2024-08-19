import math
import mediapipe as mp

def is_fist(hand_landmarks):
    if not hand_landmarks or len(hand_landmarks.landmark) < 21:
        return False

    # Index, Middle, Ring, Pinky tips and their respective MCP joints
    fingertip_ids = [8, 12, 16, 20]
    mcp_joint_ids = [5, 9, 13, 17]

    for tip_id, mcp_id in zip(fingertip_ids, mcp_joint_ids):
        tip = hand_landmarks.landmark[tip_id]
        mcp = hand_landmarks.landmark[mcp_id]

        distance = math.sqrt(
            (tip.x - mcp.x) ** 2 + 
            (tip.y - mcp.y) ** 2 + 
            (tip.z - mcp.z) ** 2
        )

        if distance > 0.05:  # Threshold for detecting a closed hand (may need tuning)
            return False
    return True

def is_peace_sign(hand_landmarks):
    if not hand_landmarks or len(hand_landmarks.landmark) < 21:
        return False

    index_finger_tip = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.INDEX_FINGER_TIP]
    middle_finger_tip = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.MIDDLE_FINGER_TIP]
    thumb_tip = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.THUMB_TIP]

    if (index_finger_tip.y > middle_finger_tip.y and
        thumb_tip.y > index_finger_tip.y):
        return True

    return False

def is_ok_sign(hand_landmarks):
    if not hand_landmarks or len(hand_landmarks.landmark) < 21:
        return False

    thumb_tip = hand_landmarks.landmark[4]
    index_tip = hand_landmarks.landmark[8]
    thumb_mcp = hand_landmarks.landmark[2]

    thumb_index_distance = math.sqrt(
        (thumb_tip.x - index_tip.x) ** 2 + 
        (thumb_tip.y - index_tip.y) ** 2 + 
        (thumb_tip.z - index_tip.z) ** 2
    )

    thumb_mcp_distance = math.sqrt(
        (thumb_tip.x - thumb_mcp.x) ** 2 + 
        (thumb_tip.y - thumb_mcp.y) ** 2 + 
        (thumb_tip.z - thumb_mcp.z) ** 2
    )

    if thumb_index_distance < 0.05 and thumb_mcp_distance > 0.05:
        return True
    return False

def is_thumbs_up(hand_landmarks):
    if not hand_landmarks or len(hand_landmarks.landmark) < 21:
        return False

    thumb_tip = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.THUMB_TIP]
    thumb_mcp = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.THUMB_MCP]
    index_mcp = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.INDEX_FINGER_MCP]
    pinky_mcp = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.PINKY_MCP]

    # Check if the thumb is extended upwards and the rest of the fingers are folded
    is_thumb_up = (thumb_tip.y < thumb_mcp.y and  # Thumb tip is above the MCP joint
                   thumb_tip.x > index_mcp.x and  # Thumb is to the right of the index finger MCP (for left hand, reverse for right)
                   thumb_tip.x > pinky_mcp.x)      # Thumb is to the right of the pinky finger MCP (for left hand, reverse for right)

    # Additional check to ensure other fingers are folded
    fingertips_folded = all(
        hand_landmarks.landmark[i].y > hand_landmarks.landmark[i - 2].y  # Tip is below its respective MCP joint
        for i in [8, 12, 16, 20]
    )

    return is_thumb_up and fingertips_folded

def is_thumbs_down(hand_landmarks):
    if not hand_landmarks or len(hand_landmarks.landmark) < 21:
        return False

    thumb_tip = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.THUMB_TIP]
    thumb_mcp = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.THUMB_MCP]
    index_mcp = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.INDEX_FINGER_MCP]
    pinky_mcp = hand_landmarks.landmark[mp.solutions.holistic.HandLandmark.PINKY_MCP]

    # Check if the thumb is extended downwards and the rest of the fingers are folded
    is_thumb_down = (thumb_tip.y > thumb_mcp.y and  # Thumb tip is below the MCP joint
                     thumb_tip.x > index_mcp.x and  # Thumb is to the right of the index finger MCP (for left hand, reverse for right)
                     thumb_tip.x > pinky_mcp.x)      # Thumb is to the right of the pinky finger MCP (for left hand, reverse for right)

    # Additional check to ensure other fingers are folded
    fingertips_folded = all(
        hand_landmarks.landmark[i].y > hand_landmarks.landmark[i - 2].y  # Tip is below its respective MCP joint
        for i in [8, 12, 16, 20]
    )

    return is_thumb_down and fingertips_folded
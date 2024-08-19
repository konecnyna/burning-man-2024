# gesture_detection.py
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

def is_shaka_sign(hand_landmarks):
    if not hand_landmarks or len(hand_landmarks.landmark) < 21:
        return False

    thumb_tip = hand_landmarks.landmark[4]
    pinky_tip = hand_landmarks.landmark[20]
    thumb_mcp = hand_landmarks.landmark[2]
    pinky_mcp = hand_landmarks.landmark[17]

    thumb_distance = math.sqrt(
        (thumb_tip.x - thumb_mcp.x) ** 2 +
        (thumb_tip.y - thumb_mcp.y) ** 2 +
        (thumb_tip.z - thumb_mcp.z) ** 2
    )

    pinky_distance = math.sqrt(
        (pinky_tip.x - pinky_mcp.x) ** 2 +
        (pinky_tip.y - pinky_mcp.y) ** 2 +
        (pinky_tip.z - pinky_mcp.z) ** 2
    )

    # Other fingers (index, middle, ring) should be bent (tips close to their MCP joints)
    other_finger_tips = [8, 12, 16]
    other_finger_mcps = [5, 9, 13]

    other_fingers_bent = True
    for tip_id, mcp_id in zip(other_finger_tips, other_finger_mcps):
        tip = hand_landmarks.landmark[tip_id]
        mcp = hand_landmarks.landmark[mcp_id]

        distance = math.sqrt(
            (tip.x - mcp.x) ** 2 + 
            (tip.y - mcp.y) ** 2 + 
            (tip.z - mcp.z) ** 2
        )

        if distance > 0.05:  # These fingers should be close to the palm
            other_fingers_bent = False
            break

    if thumb_distance > 0.05 and pinky_distance > 0.05 and other_fingers_bent:
        return True
    return False
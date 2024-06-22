

import json
import time


def printEvent(event):
    print(json.dumps(event), flush=True)

def mockMode():
    start_x = 100
    start_y = 100
    end_y = 650
    end_x = 650
    increment = 15
    delay = .1

    while True:
        # Move from (start_x, start_y) to (start_x, end_y)
        for y in range(start_y, end_y + 1, increment):
            event = {
                "event": "hand_detect",
                "payload": {
                    "x": start_x,
                    "y": y
                }
            }
            printEvent(event)
            time.sleep(delay)  

        # Move from (start_x, end_y) to (end_x, end_y)
        for x in range(start_x, end_x + 1, increment):
            event = {
                "event": "hand_detect",
                "payload": {
                    "x": x,
                    "y": end_y
                }
            }
            printEvent(event)
            time.sleep(delay) 

        # Move from (end_x, end_y) to (end_x, start_y)
        for y in range(end_y, start_y - 1, -increment):
            event = {
                "event": "hand_detect",
                "payload": {
                    "x": end_x,
                    "y": y
                }
            }
            printEvent(event)
            time.sleep(delay) 

        for x in range(end_x, start_x - 1, -increment):
            event = {
                "event": "hand_detect",
                "payload": {
                    "x": x,
                    "y": start_y
                }
            }
            printEvent(event)
            time.sleep(delay)
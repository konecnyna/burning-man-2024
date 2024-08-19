import cv2
import time
from threading import Thread

class ThreadedCamera(object):
    def __init__(self, camera_address=0):
        self.capture = cv2.VideoCapture(camera_address)
        self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 2)
       
        # FPS = 1/X
        # X = desired FPS
        self.FPS = 1/10
        self.FPS_MS = int(self.FPS * 1000)

        self.frame = None
        
        # Start frame retrieval thread
        self.thread = Thread(target=self.update, args=())
        self.thread.daemon = True
        self.thread.start()
        
    def update(self):
        while True:
            if self.capture.isOpened():
                (self.status, self.frame) = self.capture.read()
            time.sleep(self.FPS)
            
    def show_frame(self):
        if self.frame is not None:
            cv2.imshow('frame', self.frame)
            cv2.waitKey(self.FPS_MS)
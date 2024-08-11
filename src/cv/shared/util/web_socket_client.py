import socketio
import time

class WebsocketClient:
    def __init__(self, ws_url, local):
        self.ws_url = ws_url
        self.sio = socketio.Client()
        self.local = local
        if not local:
            self.connect()

    def connect(self):
        try:
            self.sio.connect(self.ws_url)
            print("Connected to socket.io server.")
        except socketio.exceptions.ConnectionError as e:
            print(f"Connection error: {e}")
            self.reconnect()
        except Exception as e:
            print(f"Unexpected error: {e}")
            #self.reconnect()

    def reconnect(self):
        print("Attempting to reconnect...")
        time.sleep(5)  # wait for 5 seconds before retrying
        self.connect()

    def publish(self, event, data):
        if self.local:
            #print(self.make_event(event=event, payload=data))
            return
        
        try:
            self.sio.emit(event, data)
        except socketio.exceptions.ConnectionError as e:
            print(f"Connection lost: {e}")
            self.reconnect()
            self.sio.emit(event, data)  # retry sending the event after reconnecting
        except Exception as e:
            print(f"Unexpected error: {e}")
            self.reconnect()

    def make_event(self, event, payload):
        return {'event': event, 'payload': payload}

# Export a single instance of WebsocketClient
ws_client = WebsocketClient(ws_url='http://localhost:3000', local=True)
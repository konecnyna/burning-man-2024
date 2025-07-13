from flask import Flask, render_template, request, Response
from flask_socketio import SocketIO, emit, join_room, leave_room
import threading
import cv2
from datetime import datetime
from typing import Dict, Set
from event_system import Event, EventBus, HandTrackingEvents
from scene_manager import SceneManager

class WebSocketManager:
    def __init__(self, event_bus: EventBus, socketio: SocketIO):
        self.event_bus = event_bus
        self.socketio = socketio
        self.client_subscriptions: Dict[str, Set[str]] = {}
        self.client_handlers: Dict[str, Dict[str, callable]] = {}
        
    def handle_client_connect(self, client_id: str):
        """Handle new client connection"""
        self.client_subscriptions[client_id] = set()
        self.client_handlers[client_id] = {}
        
    def handle_client_disconnect(self, client_id: str):
        """Handle client disconnection"""
        if client_id in self.client_subscriptions:
            # Unsubscribe from all events
            for event_type in self.client_subscriptions[client_id]:
                if client_id in self.client_handlers and event_type in self.client_handlers[client_id]:
                    self.event_bus.unsubscribe(event_type, self.client_handlers[client_id][event_type])
            
            del self.client_subscriptions[client_id]
            del self.client_handlers[client_id]
            
    def handle_subscription(self, client_id: str, event_types: list):
        """Handle client subscription to events"""
        if client_id not in self.client_subscriptions:
            self.client_subscriptions[client_id] = set()
            self.client_handlers[client_id] = {}
            
        # Unsubscribe from old events
        for event_type in list(self.client_subscriptions[client_id]):
            if event_type in self.client_handlers[client_id]:
                self.event_bus.unsubscribe(event_type, self.client_handlers[client_id][event_type])
                del self.client_handlers[client_id][event_type]
                
        # Subscribe to new events
        self.client_subscriptions[client_id] = set(event_types)
        
        for event_type in event_types:
            handler = self._create_client_handler(client_id)
            self.client_handlers[client_id][event_type] = handler
            self.event_bus.subscribe(event_type, handler)
            
    def _create_client_handler(self, client_id: str):
        """Create event handler for specific client"""
        def handler(event: Event):
            if client_id in self.client_subscriptions:
                self.socketio.emit('event', event.to_dict(), room=client_id)
        return handler

def create_web_app(event_bus: EventBus, scene_manager: SceneManager = None, hand_tracker=None):
    """Create Flask app with WebSocket support"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'hand-tracking-secret'
    socketio = SocketIO(app, cors_allowed_origins="*")
    
    ws_manager = WebSocketManager(event_bus, socketio)
    
    @app.route('/')
    def index():
        # Serve the static HTML file directly for now
        with open('static/index.html', 'r') as f:
            return f.read()
    
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'timestamp': datetime.now().isoformat()}
    
    def generate_video_stream():
        """Generate video stream for OpenCV display"""
        while True:
            if hand_tracker:
                frame = hand_tracker.get_current_frame()
                if frame is not None:
                    # Encode frame as JPEG
                    ret, buffer = cv2.imencode('.jpg', frame)
                    if ret:
                        frame_bytes = buffer.tobytes()
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            # Sleep to prevent high CPU usage
            import time
            time.sleep(0.033)  # ~30 FPS
    
    @app.route('/video_feed')
    def video_feed():
        """Video streaming route"""
        if not hand_tracker:
            return Response("Hand tracker not available", status=503)
        return Response(generate_video_stream(),
                       mimetype='multipart/x-mixed-replace; boundary=frame')
    
    @socketio.on('connect')
    def handle_connect():
        client_id = request.sid
        join_room(client_id)
        ws_manager.handle_client_connect(client_id)
        emit('connected', {'client_id': client_id})
        
    @socketio.on('disconnect')
    def handle_disconnect():
        client_id = request.sid
        leave_room(client_id)
        ws_manager.handle_client_disconnect(client_id)
        
    @socketio.on('subscribe')
    def handle_subscribe(data):
        client_id = request.sid
        event_types = data.get('events', [])
        ws_manager.handle_subscription(client_id, event_types)
        emit('subscribed', {'events': event_types})
        
    @socketio.on('unsubscribe')
    def handle_unsubscribe(data):
        client_id = request.sid
        ws_manager.handle_subscription(client_id, [])
        emit('unsubscribed', {})
        
    @socketio.on('get_recent_events')
    def handle_get_recent_events(data):
        count = data.get('count', 10)
        recent_events = event_bus.get_recent_events(count)
        emit('recent_events', [event.to_dict() for event in recent_events])
        
    # Scene control endpoints
    @socketio.on('next_scene')
    def handle_next_scene():
        if scene_manager:
            scene_manager.next_scene()
            
    @socketio.on('previous_scene')
    def handle_previous_scene():
        if scene_manager:
            scene_manager.previous_scene()
            
    @socketio.on('toggle_auto_cycle')
    def handle_toggle_auto_cycle():
        if scene_manager:
            scene_manager.set_auto_cycle(not scene_manager.auto_cycle)
            emit('auto_cycle_changed', {'enabled': scene_manager.auto_cycle})
            
    @socketio.on('get_scene_info')
    def handle_get_scene_info():
        if scene_manager:
            current_scene = scene_manager.get_current_scene()
            emit('scene_info', {
                'current_scene': current_scene.to_dict() if current_scene else None,
                'scene_index': scene_manager.current_scene_index,
                'total_scenes': len(scene_manager.scenes),
                'remaining_time': scene_manager.get_remaining_time(),
                'auto_cycle': scene_manager.auto_cycle
            })
        
    return app, socketio

def run_web_app(event_bus: EventBus, scene_manager: SceneManager = None, hand_tracker=None, host: str = 'localhost', port: int = 5000, debug: bool = False):
    """Run the web application"""
    app, socketio = create_web_app(event_bus, scene_manager, hand_tracker)
    
    def run_server():
        socketio.run(app, host=host, port=port, debug=debug, use_reloader=False, allow_unsafe_werkzeug=True)
    
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()
    
    return app, socketio, server_thread
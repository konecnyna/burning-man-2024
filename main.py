#!/usr/bin/env python3

import sys
import time
import signal
import threading
from datetime import datetime
import webview
from event_system import EventBus, HandTrackingEvents
from web_app import run_web_app
from scene_manager import SceneManager

from hand_tracker import HandTracker

class HandTrackingKiosk:
    def __init__(self):
        self.event_bus = EventBus()
        self.hand_tracker = HandTracker(self.event_bus)
        self.scene_manager = SceneManager(self.event_bus)
        self.web_app = None
        self.socketio = None
        self.server_thread = None
        self.running = False
        
    def start(self):
        """Start the hand tracking kiosk application"""
        print("Starting Hand Tracking Kiosk...")
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        try:
            # Start web server
            print("Starting web server...")
            self.web_app, self.socketio, self.server_thread = run_web_app(
                self.event_bus, 
                self.scene_manager,
                self.hand_tracker,
                host='localhost', 
                port=5000, 
                debug=False
            )
            
            # Give server time to start
            time.sleep(2)
            
            # Start hand tracking
            print("Starting hand tracking...")
            self.hand_tracker.start()
            
            # Give hand tracking time to initialize
            time.sleep(1)
            
            # Start scene manager
            print("Starting scene manager...")
            self.scene_manager.start()
            
            # Create webview window
            print("Creating application window...")
            self.create_window()
            
        except Exception as e:
            print(f"Error starting application: {e}")
            self.stop()
            sys.exit(1)
            
    def create_window(self):
        """Create the webview window"""
        try:
            # Create webview window
            window = webview.create_window(
                title='Hand Tracking Kiosk',
                url='http://localhost:5000',
                width=1200,
                height=800,
                resizable=True,
                fullscreen=True,
                minimized=False,
                on_top=False,
                shadow=True,
                frameless=True 
            )
            
            # Start webview (this blocks until window is closed)
            webview.start(debug=True)
            
        except Exception as e:
            print(f"Error creating window: {e}")
        finally:
            # Clean shutdown when window closes
            self.stop()
            
    def stop(self):
        """Stop the application"""
        if self.running:
            return
            
        print("Stopping Hand Tracking Kiosk...")
        self.running = True
        
        # Stop scene manager
        if self.scene_manager:
            self.scene_manager.stop()
            
        # Stop hand tracking
        if self.hand_tracker:
            self.hand_tracker.stop()
            
        # Note: Flask-SocketIO server will stop when main thread ends
        print("Application stopped.")
        
    def _signal_handler(self, signum, frame):
        """Handle system signals for graceful shutdown"""
        print(f"Received signal {signum}, shutting down...")
        self.stop()
        sys.exit(0)

def main():
    """Main entry point"""
    print("=" * 50)
    print("Hand Tracking Kiosk v1.0")
    print("=" * 50)
    
    # Check if running in kiosk mode
    kiosk_mode = '--kiosk' in sys.argv
    
    if kiosk_mode:
        print("Running in KIOSK MODE")
        # In kiosk mode, you might want to:
        # - Set fullscreen=True and frameless=True in create_window()
        # - Disable window controls
        # - Add auto-restart logic
    
    # Create and start the application
    app = HandTrackingKiosk()
    
    try:
        app.start()
    except KeyboardInterrupt:
        print("\nShutdown requested by user")
        app.stop()
    except Exception as e:
        print(f"Fatal error: {e}")
        app.stop()
        sys.exit(1)

if __name__ == "__main__":
    main()
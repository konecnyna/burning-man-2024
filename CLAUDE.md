# Hand Tracking Kiosk App - Architecture Checkpoint

## Project Overview
Building a single-app hand tracking system that captures hand movements via camera and translates them to coordinates for real-time interaction. Will run on M4 Mac Mini in kiosk mode.

## Final Architecture Decision

### Technology Stack
- **Python** with **webview** for embedded browser
- **MediaPipe** for hand tracking (GPU/Neural Engine accelerated)
- **Flask + SocketIO** for internal communication
- **OpenCV** for camera capture

### Single-App Architecture
```python
import webview
import threading
from flask import Flask
from flask_socketio import SocketIO

# Hand tracking runs in background thread
# Flask serves HTML/JS 
# webview displays the app
# All launched from single main.py
```

### Kiosk Mode Features
- **webview** configured for fullscreen, frameless, non-resizable
- **LaunchAgent** for auto-start on boot/restart
- **Error recovery** with auto-restart and health monitoring
- **Remote management** via SSH and logging

### Performance Considerations
- **MediaPipe**: C++ backend with M4 Neural Engine acceleration
- **Expected**: 30-60 FPS with ~16-33ms latency
- **Python role**: Just orchestrates pipeline, heavy ML runs in C++
- **Scalable**: Easy to add gesture detection and person detection later

### Benefits
- Single `python main.py` launch
- No build process needed
- ~10MB footprint vs 100MB+ for Electron
- Fast development cycle
- Robust for headless kiosk deployment

## Scene Management System

### Architecture Features
- **Multiple Interactive Scenes**: Welcome, Particles, Paint, Music, Gallery
- **Auto-Cycling**: Configurable timing for each scene (30-50 seconds)
- **Parent Overlay**: Shows scene info during transitions
- **Manual Controls**: Next/Previous scene, toggle auto-cycle
- **Event-Driven**: Scene transitions trigger WebSocket events

### Scene Structure
Each scene is a self-contained HTML file with:
- Scene-specific CSS styling
- JavaScript interaction handlers
- Hand tracking integration
- Custom visual effects

### Event Flow
```
Scene Manager → Scene Events → WebSocket → Browser
    ↓
[scene_transition_start, scene_changed, scene_transition_end]
    ↓
Parent overlay shows scene info → Scene loads → Overlay hides
```

## Implementation Complete

### Key Files Structure
```
main.py                    # Main application entry point
event_system.py           # Event bus and event types
hand_tracker.py           # MediaPipe hand tracking with events
scene_manager.py          # Scene cycling and management
web_app.py               # Flask server and WebSocket handling
static/
    - index.html          # Main kiosk interface with overlay
    - scenes/
        - welcome.html    # Welcome scene with instructions
        - particles.html  # Interactive particle system
        - paint.html      # Gesture-based painting
        - (more scenes)   # Music visualizer, gallery, etc.
requirements.txt         # Python dependencies
```

### Usage
```bash
# Install dependencies
pip install -r requirements.txt

# activate
source venv/bin/activate

# Run the application
python main.py

# Run in kiosk mode (fullscreen, frameless)
python main.py --kiosk
```

### Scene Controls
- **Manual Navigation**: Left panel buttons (Prev/Next/Auto)
- **Debug Panel**: Top-right toggle for development info
- **WebSocket Commands**: `next_scene`, `previous_scene`, `toggle_auto_cycle`
- **Hand Interactions**: Scene-specific gesture controls

## Development Principles

### Code Organization
- Python classes should follow single responsibility principal and should be broken up as such.

## Project Constraints
- All libs must be local and not urls. This project will be run offline
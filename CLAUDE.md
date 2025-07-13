# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Burning Man 2024 interactive art installation that combines computer vision, hand tracking, and visual effects. The system detects human presence and hand gestures to trigger and control various psychedelic visual scenes displayed in fullscreen Chrome kiosk mode.

## Architecture

### Core Components

- **Node.js Server** (`src/server/`): Express server with Socket.io for real-time communication
- **OpenCV Python Module** (`src/cv/`): Computer vision processing for hand tracking, face detection, and motion detection
- **Visual Scenes** (`src/public/app/scenes/`): Interactive WebGL/Canvas-based visual effects
- **Bootstrap System** (`bootstrap.js`): Production launcher that starts server and Chrome in kiosk mode

### Key Modules

- **StateManager** (`src/server/core/state-manager.js`): Manages application state, scene transitions, and detection modes
- **EventManager** (`src/server/core/event-manager.js`): Handles Socket.io events and WebSocket communication
- **SceneManager** (`src/server/core/scene-manager.js`): Defines available scenes and their configurations
- **OpenCvEventBus** (`src/server/core/opencv-event-bus.js`): Bridges Python OpenCV process with Node.js server

### Detection Modes

- **Passive Mode**: Default state showing ambient visuals, waiting for face detection
- **Active Mode**: Triggered by face detection, cycles through interactive scenes every 3 minutes
- **Admin Mode**: Manual control via admin interface at `/admin`

## Development Commands

### Setup
```bash
# Install Node.js dependencies
cd src/server && npm install

# Install Python dependencies  
cd src/cv && pip3 install -r requirements.txt
```

### Development
```bash
# Start development server with auto-reload
cd src/server && npm run dev

# Start OpenCV processing (in separate terminal)
cd src/cv && python3 main.py --show-cv --debug

# Production bootstrap (launches server + Chrome kiosk)
node bootstrap.js
```

### Testing
```bash
# No formal test suite - manual testing via:
# - http://localhost:3000/app (main interface)
# - http://localhost:3000/admin (admin controls)
# - Individual scenes at /app/scenes/[scene-name]/
```

## Key URLs

- Main app: `http://localhost:3000/app`
- Admin interface: `http://localhost:3000/admin`
- API state: `http://localhost:3000/api/app-state`
- Individual scenes: `http://localhost:3000/app/scenes/[scene-id]/`

## Scene Configuration

Scenes are defined in `src/server/core/scene-manager.js` with properties:
- `id`: Unique identifier
- `url`: Path to scene HTML file
- `instructions`: User-facing instructions
- `isActive`: Whether scene appears in rotation
- `handCursors`: Whether to show hand cursor overlays
- `meta`: Additional metadata (supported users, etc.)

## OpenCV Integration

The Python OpenCV module connects to the Node.js server via Socket.io, sending:
- `hand_detect_new`: Hand tracking coordinates
- `face_detect`: Face detection events
- `object_detected`: Motion detection events

## Production Deployment

The system is designed for kiosk deployment:
- `bootstrap.js` handles full system startup
- `bootstrap.sh` provides macOS service configuration
- Chrome launches in fullscreen kiosk mode
- Mouse cursor is hidden for clean presentation

## Development Notes

- Server runs on port 3000
- OpenCV processing requires Python 3.x with mediapipe/opencv
- Static files served from `src/public/`
- Real-time communication via Socket.io
- State management is centralized in StateManager
- Scene transitions happen automatically every 3 minutes in active mode
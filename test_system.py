#!/usr/bin/env python3
"""
Test script to verify all dependencies are working
"""
import sys
import time

def test_imports():
    """Test all critical imports"""
    try:
        import cv2
        print("✅ OpenCV imported successfully")
    except ImportError as e:
        print(f"❌ OpenCV import failed: {e}")
        return False
        
    try:
        import flask
        print("✅ Flask imported successfully")
    except ImportError as e:
        print(f"❌ Flask import failed: {e}")
        return False
        
    try:
        import flask_socketio
        print("✅ Flask-SocketIO imported successfully")
    except ImportError as e:
        print(f"❌ Flask-SocketIO import failed: {e}")
        return False
        
    try:
        import webview
        print("✅ PyWebView imported successfully")
    except ImportError as e:
        print(f"❌ PyWebView import failed: {e}")
        return False
        
    try:
        import numpy
        print("✅ NumPy imported successfully")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
        
    return True

def test_local_modules():
    """Test local module imports"""
    try:
        from event_system import EventBus, HandTrackingEvents
        print("✅ Event system imported successfully")
    except ImportError as e:
        print(f"❌ Event system import failed: {e}")
        return False
        
    try:
        from hand_tracker_fallback import HandTrackerFallback
        print("✅ Hand tracker fallback imported successfully")
    except ImportError as e:
        print(f"❌ Hand tracker fallback import failed: {e}")
        return False
        
    try:
        from scene_manager import SceneManager
        print("✅ Scene manager imported successfully")
    except ImportError as e:
        print(f"❌ Scene manager import failed: {e}")
        return False
        
    try:
        from web_app import run_web_app
        print("✅ Web app imported successfully")
    except ImportError as e:
        print(f"❌ Web app import failed: {e}")
        return False
        
    return True

def test_basic_functionality():
    """Test basic system functionality"""
    try:
        from event_system import EventBus
        from hand_tracker_fallback import HandTrackerFallback
        from scene_manager import SceneManager
        
        # Test event system
        event_bus = EventBus()
        print("✅ Event bus created successfully")
        
        # Test hand tracker
        hand_tracker = HandTrackerFallback(event_bus)
        print("✅ Hand tracker created successfully")
        
        # Test scene manager
        scene_manager = SceneManager(event_bus)
        print("✅ Scene manager created successfully")
        
        # Test brief operation
        print("🔄 Testing brief system operation...")
        hand_tracker.start()
        scene_manager.start()
        
        time.sleep(2)  # Run for 2 seconds
        
        hand_tracker.stop()
        scene_manager.stop()
        
        print("✅ System operation test completed")
        return True
        
    except Exception as e:
        print(f"❌ System operation test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Hand Tracking Kiosk System")
    print("=" * 50)
    
    print("\n📦 Testing Dependencies:")
    if not test_imports():
        print("\n❌ Dependency tests failed")
        return 1
        
    print("\n🏠 Testing Local Modules:")
    if not test_local_modules():
        print("\n❌ Local module tests failed")
        return 1
        
    print("\n⚙️  Testing Basic Functionality:")
    if not test_basic_functionality():
        print("\n❌ Functionality tests failed")
        return 1
        
    print("\n🎉 All tests passed!")
    print("✅ System is ready to run")
    print("\nTo start the application:")
    print("   python3 main.py")
    print("   python3 main.py --kiosk  (for fullscreen mode)")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
import json
import time
import threading
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from event_system import Event, EventBus, HandTrackingEvents

@dataclass
class SceneConfig:
    id: str
    name: str
    description: str
    duration: float  # seconds, 0 = infinite
    html_file: str
    interaction_zones: List[Dict] = None
    background_color: str = "#1e3c72"
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'duration': self.duration,
            'html_file': self.html_file,
            'interaction_zones': self.interaction_zones or [],
            'background_color': self.background_color
        }

class SceneManager:
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.scenes: List[SceneConfig] = []
        self.current_scene_index = 0
        self.is_running = False
        self.cycle_thread = None
        self.scene_start_time = None
        self.auto_cycle = True
        self.cycling_paused = False
        self.default_duration = 45.0
        self.welcome_duration = 30.0
        
        # Load default scenes
        self._load_default_scenes()
        
    def _load_default_scenes(self):
        """Load default scene configurations"""
        self.scenes = [
            SceneConfig(
                id="welcome",
                name="Welcome Scene",
                description="Interactive welcome screen with hand tracking demonstration",
                duration=self.welcome_duration,
                html_file="scenes/welcome.html",
                background_color="#1e3c72"
            ),
            SceneConfig(
                id="fluidsim",
                name="Fluid Simulation",
                description="WebGL fluid simulation controlled by hand movements",
                duration=self.default_duration,
                html_file="scenes/fluidsim/index.html",
                background_color="#000000"
            ),
            SceneConfig(
                id="cosmic_symbolism",
                name="Cosmic Symbolism",
                description="Navigate through cosmic imagery with hand movements",
                duration=self.default_duration,
                html_file="scenes/cosmic-symbolism/index.html",
                background_color="#000000"
            ),
            SceneConfig(
                id="psychedelic_waves",
                name="Psychedelic Waves",
                description="WebGL shader-based wave visualization controlled by hand movements",
                duration=self.default_duration,
                html_file="scenes/psychedelic-waves/index.html",
                background_color="#000000"
            ),
            SceneConfig(
                id="orbits",
                name="Orbits",
                description="An interactive flight through attractor orbits using hopalong formula.",
                duration=self.default_duration,
                html_file="scenes/orbits/index.html",
                background_color="#000000"
            ),
            SceneConfig(
                id="tie_dye",
                name="Tie Dye",
                description="Use your hands to create a tie dye pattern",
                duration=self.default_duration,
                html_file="scenes/tie-dye/index.html",
                background_color="#000000"
            )
        ]
        
    def start(self):
        """Start the scene manager"""
        if self.is_running:
            return
            
        self.is_running = True
        self.scene_start_time = time.time()
        
        # Start in paused mode (idle) - don't cycle scenes initially
        self.cycling_paused = True
        print("[SceneManager] Started in paused mode (system starts in idle)")
        
        # Start cycling thread (but it will be paused)
        if self.auto_cycle:
            self.cycle_thread = threading.Thread(target=self._cycle_scenes)
            self.cycle_thread.daemon = True
            self.cycle_thread.start()
            
    def stop(self):
        """Stop the scene manager"""
        self.is_running = False
        if self.cycle_thread:
            self.cycle_thread.join()
            
    def change_scene(self, scene_index: int):
        """Change to a specific scene"""
        if not self.scenes or scene_index >= len(self.scenes):
            print(f"[SceneManager] change_scene failed: scene_index={scene_index}, scenes_count={len(self.scenes)}")
            return
            
        old_scene = self.get_current_scene()
        self.current_scene_index = scene_index
        new_scene = self.get_current_scene()
        self.scene_start_time = time.time()
        
        print(f"[SceneManager] Changing scene from {old_scene.id if old_scene else 'None'} to {new_scene.id if new_scene else 'None'}")
        
        # Emit transition start event
        transition_start_event = Event(
            type=HandTrackingEvents.SCENE_TRANSITION_START,
            data={
                "from_scene": old_scene.to_dict() if old_scene else None,
                "to_scene": new_scene.to_dict(),
                "transition_type": "fade"
            },
            timestamp=datetime.now(),
            source="scene_manager"
        )
        print(f"[SceneManager] Emitting SCENE_TRANSITION_START event")
        self.event_bus.emit(transition_start_event)
        
        # Small delay for transition effect
        time.sleep(0.5)
        
        # Emit scene changed event
        scene_changed_event = Event(
            type=HandTrackingEvents.SCENE_CHANGED,
            data={
                "scene": new_scene.to_dict(),
                "scene_index": scene_index,
                "total_scenes": len(self.scenes)
            },
            timestamp=datetime.now(),
            source="scene_manager"
        )
        print(f"[SceneManager] Emitting SCENE_CHANGED event")
        self.event_bus.emit(scene_changed_event)
        
        # Emit transition end event
        self.event_bus.emit(Event(
            type=HandTrackingEvents.SCENE_TRANSITION_END,
            data={
                "scene": new_scene.to_dict(),
                "ready": True
            },
            timestamp=datetime.now(),
            source="scene_manager"
        ))
        
    def next_scene(self):
        """Move to next scene"""
        next_index = (self.current_scene_index + 1) % len(self.scenes)
        self.change_scene(next_index)
        
    def previous_scene(self):
        """Move to previous scene"""
        prev_index = (self.current_scene_index - 1) % len(self.scenes)
        self.change_scene(prev_index)
        
    def get_current_scene(self) -> Optional[SceneConfig]:
        """Get current scene configuration"""
        if not self.scenes:
            return None
        return self.scenes[self.current_scene_index]
        
    def get_scene_by_id(self, scene_id: str) -> Optional[SceneConfig]:
        """Get scene by ID"""
        for scene in self.scenes:
            if scene.id == scene_id:
                return scene
        return None
        
    def get_remaining_time(self) -> float:
        """Get remaining time for current scene"""
        if not self.scene_start_time:
            return 0
            
        current_scene = self.get_current_scene()
        if not current_scene or current_scene.duration == 0:
            return float('inf')
            
        elapsed = time.time() - self.scene_start_time
        return max(0, current_scene.duration - elapsed)
        
    def _cycle_scenes(self):
        """Background thread to cycle through scenes"""
        while self.is_running:
            # Don't cycle if paused
            if self.cycling_paused:
                time.sleep(1.0)
                continue
                
            current_scene = self.get_current_scene()
            
            if current_scene and current_scene.duration > 0:
                remaining_time = self.get_remaining_time()
                
                if remaining_time <= 0:
                    self.next_scene()
                else:
                    # Check every second
                    time.sleep(min(1.0, remaining_time))
            else:
                # No duration limit, check every 5 seconds
                time.sleep(self.default_duration)
                
    def handle_scene_interaction(self, interaction_data: Dict[str, Any]):
        """Handle interaction within a scene"""
        current_scene = self.get_current_scene()
        
        self.event_bus.emit(Event(
            type=HandTrackingEvents.SCENE_INTERACTION,
            data={
                "scene_id": current_scene.id if current_scene else None,
                "interaction": interaction_data
            },
            timestamp=datetime.now(),
            source="scene_manager"
        ))
        
    def set_auto_cycle(self, enabled: bool):
        """Enable or disable auto-cycling"""
        self.auto_cycle = enabled
        
        if enabled and self.is_running and not self.cycle_thread:
            self.cycle_thread = threading.Thread(target=self._cycle_scenes)
            self.cycle_thread.daemon = True
            self.cycle_thread.start()
            
    def add_scene(self, scene: SceneConfig):
        """Add a new scene to the manager"""
        self.scenes.append(scene)
        
    def remove_scene(self, scene_id: str):
        """Remove a scene by ID"""
        self.scenes = [s for s in self.scenes if s.id != scene_id]
        
        # Adjust current index if needed
        if self.current_scene_index >= len(self.scenes):
            self.current_scene_index = 0
            
    def pause_cycling(self):
        """Pause scene cycling"""
        self.cycling_paused = True
        print("[SceneManager] Scene cycling paused")
        
    def restart_cycling(self):
        """Restart scene cycling from welcome scene"""
        self.cycling_paused = False
        # Reset to welcome scene (index 0)
        self.change_scene(0)
        print("[SceneManager] Scene cycling restarted from welcome scene")
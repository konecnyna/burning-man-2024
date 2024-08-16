#!/bin/bash

/opt/homebrew/bin/node src/server/server.js

# Define the AppleScript
APPLESCRIPT=$(cat <<EOF
tell application "Safari"
    activate
    open location "https://10.0.0.20:8123/magic-mirror/0?kiosk"
    delay 2 -- wait for the page to load
    tell application "System Events"
        keystroke "f" using {command down, control down}
    end tell
end tell
EOF
)

# Run the AppleScript using osascript
osascript -e "$APPLESCRIPT"



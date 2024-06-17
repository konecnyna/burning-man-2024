import subprocess

def open_url_in_chrome_fullscreen(url):
    """
    Open the specified URL in Google Chrome and switch to fullscreen mode.
    
    Args:
    url (str): The URL to open.
    """
    script = f'''
    tell application "Google Chrome"
        activate
        open location "{url}"
        delay 2
        tell application "System Events" to keystroke "f" using {{command down, control down}}
    end tell
    '''
    
    subprocess.run(['osascript', '-e', script])
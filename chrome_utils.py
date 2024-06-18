import subprocess
import platform


def is_mac():
    return platform.system() == "Darwin"

def open_url_in_chrome_fullscreen(url):
    if is_mac():
        print("Not running on a mac so not open ing Chrome")
        print("Please open this url in your broswer fullscreen:")
        print(url)
        return
        
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
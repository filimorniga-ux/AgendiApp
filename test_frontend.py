import time
import os
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173") # default vite port
    page.wait_for_timeout(3000) # wait for load

    # Since it's an app that likely requires login, and we don't have
    # credentials, we will just try to take a screenshot of whatever loads.
    # The main issue was a crash when rendering dates. If the app crashes
    # on load (e.g. if the calendar is the default view or if we can navigate
    # to it), we would see a blank screen or error.

    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    os.makedirs("/home/jules/verification/videos", exist_ok=True)

    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()

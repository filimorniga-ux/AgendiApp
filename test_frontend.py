import time
import os
from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Setup test condition
    page.goto("http://localhost:5173/p/some-slug") # Go to public layout
    page.wait_for_timeout(3000) # wait for load

    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    os.makedirs("/home/jules/verification/videos", exist_ok=True)

    # We expect a mock business error since there is no local SB instance with that slug loaded easily.
    # We should at least see the "Ir a inicio" link functioning now.
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

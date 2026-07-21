# Veil

Veil is a browser-based privacy preflight tool for screen recordings.

Before sharing a product demo, Veil helps identify accidentally exposed API keys, customer data, and private messages. It shows when the exposure appears, lets a reviewer apply a tracked blur, and produces a review receipt documenting what changed.

## How it works

1. Upload a screen recording.
2. Veil samples frames locally in the browser.
3. OCR reads visible text and checks for common API-key, email, and phone-number patterns.
4. Findings appear in a review timeline.
5. Apply a tracked blur or mark a finding intentionally visible.
6. Export a review receipt.

## Privacy

Video frames are processed locally in the browser by this prototype. They are not uploaded to an application server.

## Run locally

Open `index.html` in a browser.

## Tech

- HTML, CSS, and JavaScript
- Tesseract.js for browser-side OCR
- Lucide icons

# Veil

Veil is a privacy pre-flight system for product demos and screen recordings. It flags accidental exposure of credentials, customer data, and private conversations before a recording is shared.

## Product thesis

The riskiest moment in a demo is often the moment right before a share link is created. Veil turns an anxious, manual scrub into a defensible review: detect private surfaces, apply tracked redactions, and export a review receipt.

## Interactive prototype

- Screen-level detection overlay for credentials and customer PII.
- Timeline with exposure markers, risk levels, and frame navigation.
- A tracked-blur decision that updates the review state.
- Exportable review receipt documenting transformations and review status.
- Upload a local video: Veil samples five frames, runs OCR in the browser, and flags recognizable API-key, email, and phone patterns. No frames are sent to an application server.

## Run

Open `index.html` in a browser. This dependency-light prototype uses Lucide and Google Fonts from CDNs.

Run `npm test` for lightweight quality checks. A GitHub Actions workflow runs the same check on pushes and pull requests.

## Deliberate next production steps

1. Add face detection and visual classification for non-text private surfaces.
2. Store immutable review receipts and reviewer approvals.
3. Add role-based policy packs for sales demos, support recordings, and regulated teams.

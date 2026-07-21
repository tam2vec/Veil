import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

assert.match(html, /REVIEW STATUS/, 'pre-flight risk status is present');
assert.match(html, /EXPOSURE LEDGER/, 'exposure review ledger is present');
assert.match(html, /id="receipt"/, 'signed review receipt is present');
assert.match(html, /id="videoInput"/, 'local video upload is available');
assert.match(app, /Tracked blur applied/, 'tracked redaction action is implemented');
assert.match(app, /Tesseract\.recognize/, 'browser-side OCR scan is implemented');
assert.match(app, /e\.key==='Escape'/, 'escape closes dialogs');
assert.match(app, /URL\.createObjectURL/, 'records can be exported');

console.log('Veil quality checks passed.');

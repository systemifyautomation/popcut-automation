# popcut-automation

This automation is built for Popcut, an awesome agency linking companies to top level video editors. They contacted us to help them automate the process on finding the best video editor that meets a client's requirements. This will help them scale faster and eliminate any bias.

## Fathom Video Exporter Extension

A Chrome/Edge browser extension that exports transcriptions and summaries from Fathom video calls to an n8n webhook.

### Features

- ✅ Only activates on Fathom video share links (`https://fathom.video/share/{recordingID}`)
- 🔘 Adds a floating "Export to n8n" button to the page
- 📝 Extracts transcription and summary from the Fathom video page
- 🔗 Sends data to a configurable n8n webhook
- 🔒 Webhook URL stored in a gitignored file for security

### Installation

1. **Clone or download this repository**

2. **Configure the webhook URL**
   ```bash
   # Copy the example config file
   cp webhook-config.example.js webhook-config.js
   
   # Edit webhook-config.js and add your n8n webhook URL
   # Example: https://your-n8n-instance.com/webhook/your-webhook-id
   ```

3. **Load the extension in Chrome/Edge**
   - Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `popcut-automation` directory

### Usage

1. Navigate to any Fathom video share link (e.g., `https://fathom.video/share/abc123`)
2. Wait for the page to fully load
3. Click the "Export to n8n" button in the top-right corner
4. The extension will:
   - Extract the transcription and summary
   - Send a POST request to your configured n8n webhook
   - Show a success or error message

### Webhook Payload

The extension sends a JSON payload with the following structure:

```json
{
  "recordingId": "abc123",
  "url": "https://fathom.video/share/abc123",
  "transcription": "Full transcription text...",
  "summary": "Summary text...",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Files

- `manifest.json` - Extension manifest (Chrome/Edge compatible)
- `content.js` - Content script that runs on Fathom pages
- `background.js` - Background service worker
- `styles.css` - Styles for the export button
- `webhook-config.example.js` - Example webhook configuration
- `webhook-config.js` - Your actual webhook URL (gitignored)
- `icon*.png` - Extension icons

### Security Notes

- The `webhook-config.js` file is included in `.gitignore` to prevent accidentally committing your webhook URL
- Always use HTTPS for your n8n webhook URL
- Keep your webhook URL private and secure

### Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card

### Troubleshooting

- **Button doesn't appear**: Make sure you're on a Fathom share link (not the main fathom.video page)
- **"Webhook URL not configured" error**: Create `webhook-config.js` from the example file
- **Data not sending**: Check the browser console (F12) for error messages
- **Transcription/summary extraction issues**: Fathom may update their page structure; you may need to update the selectors in `content.js`

### License

MIT

# Popcut AI Matchmaker

Chrome extension for Popcut - an agency connecting companies with top-tier video editors. This extension automates the process of finding the best video editor match based on client requirements, helping Popcut scale faster and eliminate bias.

## Features

- 🎯 **Smart Matchmaking** - AI-powered video editor matching based on Fathom call data
- 📝 **Auto-Extraction** - Automatically extracts title, summary, and transcription from Fathom videos
- 🌐 **Works Anywhere** - Use the extension from any website
- 🆔 **Fathom ID Input** - Auto-fills on Fathom pages or manually enter/paste video ID or URL
- 🤖 **AI Training** - Submit training instructions to improve the AI matching algorithm
- 📊 **Results Display** - View ranked video editor matches directly in the extension
- 🔒 **Secure Config** - Webhook URLs stored in gitignored configuration file

## Installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/systemifyautomation/popcut-automation.git
   cd popcut-automation
   ```

2. **Configure webhook URLs**
   ```bash
   # Copy the example config file
   cp config.example.js config.js
   
   # Edit config.js and add your webhook URLs:
   # - WEBHOOK_URL: For matchmaking requests
   # - TRAINING_WEBHOOK_URL: For AI training instructions
   ```

3. **Load the extension in Chrome/Edge**
   - Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `popcut-automation` directory

## Usage

### Start Matching

1. **On a Fathom page:**
   - Open any Fathom video page
   - Extension automatically extracts the Fathom ID and video data
   - Click "Start Matching" to send data to the webhook
   - View matched video editors in the results panel

2. **From any page:**
   - Enter or paste a Fathom video ID or full URL in the input field
   - Click "Start Matching"
   - Results will be displayed with ranked matches

### Train the AI

1. Click "Train the AI" button (works from any website)
2. Enter training instructions or prompts
3. Click "Submit Instruction" to send to the training webhook
4. View all training instructions in the [Google Sheet](https://docs.google.com/spreadsheets/d/1-EZzrxsueIHSfqZwDA0dGlHAB3fE3GTdsoD5lELKl20/edit?usp=sharing)

### Talk to the AI

_(Coming soon)_

## Webhook Payloads

### Matchmaking Request
```json
{
  "fathomId": "abc123",
  "url": "https://app.fathom.video/share/abc123",
  "title": "Video title",
  "summary": "Meeting summary with key points...",
  "transcription": "Full transcription text...",
  "timestamp": "2025-12-09T12:00:00.000Z"
}
```

### Matchmaking Response
```json
{
  "data": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "portfolio": "https://...",
      "experience": "5 years",
      "specialty": "Documentary editing"
    }
  ]
}
```

### Training Instruction
```json
{
  "instruction": "Your training prompt or instruction"
}
```

## File Structure

```
popcut-automation/
├── manifest.json              # Extension manifest (Manifest V3)
├── popup.html                 # Extension popup UI
├── popup.js                   # Main popup logic and initialization
├── popup-styles.css           # UI styles with gradient theme
├── extractors.js              # Data extraction functions
├── ui-helpers.js              # UI utility functions
├── event-handlers.js          # Button click handlers
├── content.js                 # Content script (legacy)
├── config.js                  # Webhook URLs (gitignored)
├── config.example.js          # Configuration template
└── icon*.png                  # Extension icons
```

## Configuration

Edit `config.js` to set your webhook URLs:

```javascript
const CONFIG = {
  WEBHOOK_URL: 'https://n8n.systemifyautomation.com/webhook/popcut-matchmaking-start',
  TRAINING_WEBHOOK_URL: 'https://n8n.systemifyautomation.com/webhook-test/popcut-new-instruction-for-AI'
};
```

## Development

### Making Changes

1. Modify source files as needed
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Code Organization

- **extractors.js** - Functions to extract title, summary, and transcription from Fathom pages
- **ui-helpers.js** - UI utility functions (showMessage, updateStatus, checkFathomSite)
- **event-handlers.js** - Event handlers for all buttons and user interactions
- **popup.js** - Main controller that initializes the extension and sets up event listeners

## Troubleshooting

### Common Issues

- **Fathom ID not auto-filling**: Make sure you're on a Fathom video page (fathom.video/share/* or app.fathom.video/*)
- **"Please enter a Fathom video ID" error**: Enter a valid Fathom video ID or URL in the input field
- **Training submission fails**: Ensure you're not on a chrome:// or edge:// system page
- **Data extraction issues**: Fathom may update their page structure; selectors in extractors.js may need updating
- **CORS errors**: Verify host_permissions in manifest.json include your webhook domain

### Debug Mode

Open the extension popup, right-click, and select "Inspect" to view console logs and errors.

## Security Notes

- `config.js` is gitignored to protect webhook URLs
- Always use HTTPS for webhook URLs
- Extension requires `<all_urls>` permission for training feature to work on any site
- Matchmaking data extraction only works on Fathom pages

## Credits

**Made by [Systemify Automation](https://systemifyautomation.com)**

## License

MIT

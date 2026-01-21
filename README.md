# Popcut AI Matchmaker

Chrome extension for Popcut - an agency connecting companies with top-tier video editors. This extension automates the process of finding the best video editor match based on client requirements, helping Popcut scale faster and eliminate bias.

## ✨ Features

- 🎯 **AI-Powered Matchmaking** - Intelligent video editor matching based on Fathom call transcriptions
- 🧠 **Deep Analysis** - AI analyzes transcriptions to find hidden talent requirements and best-fit editors
- 📝 **Auto-Extraction** - Automatically extracts title, summary, and transcription from Fathom videos
- 🔄 **Background Processing** - Matchmaking continues even when extension is closed - multitask freely!
- 🔔 **Smart Notifications** - Desktop notifications when results are ready
- 🆔 **Fathom ID Detection** - Auto-detects IDs from Fathom URLs (supports underscores, hyphens, etc.)
- 📊 **Beautiful Results Display** - Modern card-based UI with collapsible sections
- 🎨 **Animated Feedback** - High-quality animations showing AI analysis progress
- 🛑 **Cancellable** - Stop and restart matchmaking anytime
- 🤖 **AI Training** - Submit training instructions to improve the matching algorithm
- 🔒 **Secure Config** - Webhook URLs stored in gitignored configuration file

## 🚀 Installation

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

## 📖 Usage

### Start Matching

1. **On a Fathom page:**
   - Open any Fathom video page (`fathom.video/share/*` or `app.fathom.video/call/*`)
   - Extension automatically detects Fathom ID and extracts video data
   - Click "Start Matching"
   - Animated AI analysis begins showing progress
   - **Close the extension if needed** - processing continues in background!
   - Get a notification when results are ready
   - Reopen extension to view ranked editor matches

2. **From any page:**
   - Enter or paste a Fathom video ID or full URL in the input field
   - Click "Start Matching"
   - AI analysis runs in background
   - Results displayed with detailed editor insights

### Understanding Results

Each editor card shows:
- **Editor Name** - Highlighted prominently
- **Overall Score** - AI-calculated match score out of 100
- **Why Best Fit** - Detailed explanation (expanded by default)
- **Bio Highlights** - Key portfolio achievements (click to expand)
- **Client Needs** - What the AI detected from transcription (click to expand)
- **Potential Concerns** - Areas to watch (click to expand)
- **Comparison** - How this editor ranks vs others (click to expand)

**Sections are collapsible** - click the triangle (▸) next to any section label to show/hide details.

### Stop/Cancel Matching

- Click the **"Stop Matching"** button (appears during processing)
- Immediately cancels the request
- Clears all state
- Ready to start a new match

### Train the AI

1. Click "Train the AI" button
2. Enter training instructions or prompts
3. Click "Submit Instruction"
4. View all training instructions in the [Google Sheet](https://docs.google.com/spreadsheets/d/1-EZzrxsueIHSfqZwDA0dGlHAB3fE3GTdsoD5lELKl20/edit?usp=sharing)

### Talk to the AI

_(Coming soon)_

## 🔌 Webhook Integration

### Matchmaking Webhook

**Endpoint:** `https://n8n.systemifyautomation.com/webhook/popcut-matchmaking-start`

**Request Method:** `POST`

**Request Payload:**
```json
{
  "fathomId": "_HH__P-a5ZtkzYeFTyw56UYDyY5YGnPX",
  "url": "https://fathom.video/share/_HH__P-a5ZtkzYeFTyw56UYDyY5YGnPX",
  "title": "Client Discovery Call",
  "summary": "Meeting summary with key requirements...",
  "transcription": "Full transcription of the call...",
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

**Response Format:**
```json
{
  "data": [
    {
      "editor_name": "Drew Doranfest",
      "rank": 1,
      "overall_score": 85,
      "why_best_fit": "Drew has led major marketing campaigns for high-profile entertainment brands...",
      "transcription_insights": "The client needs editors who are comfortable with both digital and TV deliverables...",
      "bio_highlights": "Drew: 'Lead the video marketing campaign for the Power universe on Starz.'...",
      "potential_concerns": "Does not list comedic timing or social media as explicit specialties...",
      "comparison_to_others": "Ranks highest for big-brand campaign experience and proven reliability."
    }
  ]
}
```

### Training Webhook

**Endpoint:** `https://n8n.systemifyautomation.com/webhook/popcut-new-instruction-for-AI`

**Request Method:** `POST`

**Request Payload:**
```json
{
  "instruction": "Focus more on social media editing experience for YouTube creators"
}
```

## 📁 File Structure

```
popcut-automation/
├── manifest.json              # Extension manifest (Manifest V3)
├── popup.html                 # Extension popup UI
├── popup.js                   # Main popup logic and initialization
├── popup-styles.css           # Modern gradient UI with animations
├── background.js              # Service worker for background processing
├── ai-loader.js               # AI analysis animation controller
├── extractors.js              # Data extraction functions for Fathom
├── ui-helpers.js              # UI utility functions
├── event-handlers.js          # Button handlers and result display
├── content.js                 # Content script (legacy support)
├── config.js                  # Webhook URLs (gitignored)
├── config.example.js          # Configuration template
├── README.md                  # This file
├── INSTALLATION_GUIDE.md      # Detailed installation instructions
├── USAGE.md                   # Usage documentation
└── icon*.png                  # Extension icons (16x16, 48x48, 128x128)
```

## ⚙️ Configuration

Edit `config.js` to set your webhook URLs:

```javascript
const CONFIG = {
  WEBHOOK_URL: 'https://n8n.systemifyautomation.com/webhook/popcut-matchmaking-start',
  TRAINING_WEBHOOK_URL: 'https://n8n.systemifyautomation.com/webhook/popcut-new-instruction-for-AI'
};
```

## 🛠️ Development

### Making Changes

1. Modify source files as needed
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Code Organization

- **background.js** - Service worker handling webhook requests, notifications, and persistent state
- **ai-loader.js** - Controls the AI analysis animation with dynamic step-by-step text
- **extractors.js** - Functions to extract title, summary, and transcription from Fathom pages
- **ui-helpers.js** - UI utility functions (showMessage, updateStatus, checkFathomSite)
- **event-handlers.js** - Event handlers for all buttons, result display, and collapsible sections
- **popup.js** - Main controller, initializes extension and sets up storage listeners

### Key Features Implementation

**Background Processing:**
- Matchmaking runs in `background.js` service worker
- Uses `chrome.storage.local` for state persistence
- Storage change listeners in popup detect results

**Collapsible Sections:**
- Click triangle (▸) to expand/collapse
- CSS transitions for smooth animations
- State tracked with `expanded`/`collapsed` classes

**Fathom ID Detection:**
- Regex pattern: `/fathom\.video\/(?:share|call)\/([a-zA-Z0-9-_]+)/`
- Supports underscores, hyphens, and alphanumeric characters

**Notifications:**
- Desktop notifications via Chrome Notifications API
- Badge counter shows number of matches
- Requires `notifications` permission

## 🐛 Troubleshooting

### Common Issues

**Fathom ID not auto-detecting**
- Ensure you're on a valid Fathom page (`fathom.video/share/*` or `app.fathom.video/call/*`)
- Check that the URL contains the video ID
- IDs with underscores, hyphens, and alphanumeric characters are supported

**Matchmaking stuck on "Processing"**
- Check browser console (F12) for error messages
- Verify webhook URL is correct in `config.js`
- Ensure n8n workflow is active and responding
- Check network tab for failed requests

**No notification when results arrive**
- Verify extension has notification permissions
- Check system notification settings
- Look for badge number on extension icon

**Stop Matching button not appearing**
- Refresh the extension (`chrome://extensions/` → reload)
- Check that `matchmakingInProgress` flag is set in storage

**Results not displaying**
- Open DevTools console to check for errors
- Verify webhook response format matches expected structure
- Check that `data` array exists in response

**Extension popup too narrow**
- Extension width is 480px - ensure sufficient screen space
- Results are scrollable if content exceeds viewport

### Debug Mode

1. Open the extension popup
2. Right-click anywhere and select "Inspect"
3. View Console tab for logs
4. Check Storage tab → Local Storage for state
5. Monitor Network tab for webhook requests

### Background Script Debugging

1. Go to `chrome://extensions/`
2. Find "Popcut AI Matchmaker"
3. Click "Inspect views: service worker"
4. View console logs from background.js

### Common Error Messages

- **"HTTP error! status: XXX"** - Webhook endpoint issue, check n8n workflow
- **"Server did not return JSON"** - Webhook returning non-JSON response
- **"No response from background script"** - Service worker may have stopped, reload extension
- **"Failed to start matchmaking"** - Check config.js webhook URLs

## 🔒 Security Notes

- `config.js` is gitignored to protect webhook URLs
- Always use HTTPS for webhook URLs
- Extension requires `<all_urls>` permission for training feature
- Matchmaking data extraction only works on Fathom pages
- Notifications permission required for desktop alerts
- All data transmitted directly to configured webhooks

## 🎨 UI Customization

The extension uses a modern gradient theme:
- Primary: Purple gradient (`rgb(142, 55, 215)` to `rgb(107, 141, 214)`)
- Background: Dark purple gradient
- Cards: Glass-morphism effect with hover animations
- Collapsible sections with smooth transitions
- Custom scrollbar matching theme

Edit `popup-styles.css` to customize colors and styling.

## 📋 Requirements

- Chrome/Edge browser (Manifest V3 compatible)
- Active n8n workflows for matchmaking and training
- Valid Fathom video URLs or IDs
- Internet connection for API calls

## 🚀 Performance

- Extension popup width: 480px
- Max popup height: 600px with scrolling
- Background processing continues when popup closed
- Efficient storage-based state management
- Minimal memory footprint
- Fast DOM updates with CSS transitions

## Credits

**Made by [Systemify Automation](https://systemifyautomation.com)**

## License

MIT

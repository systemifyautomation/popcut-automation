# Quick Start Guide: Fathom Video Exporter Extension

## Step-by-Step Installation

### 1. Download the Extension Files
Clone or download this repository to your local machine:
```bash
git clone https://github.com/systemifyautomation/popcut-automation.git
cd popcut-automation
```

### 2. Configure Your n8n Webhook

#### Create your webhook configuration file:
```bash
cp webhook-config.example.js webhook-config.js
```

#### Edit `webhook-config.js` and add your n8n webhook URL:
```javascript
const WEBHOOK_CONFIG = {
  url: 'https://your-n8n-instance.com/webhook/your-webhook-id'
};

if (typeof window !== 'undefined') {
  window.WEBHOOK_CONFIG = WEBHOOK_CONFIG;
}

if (typeof self !== 'undefined') {
  self.WEBHOOK_CONFIG = WEBHOOK_CONFIG;
}
```

**Important:** This file is in `.gitignore` and will not be committed to git for security.

### 3. Load the Extension in Chrome/Edge

#### For Chrome:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right corner)
3. Click **Load unpacked**
4. Select the `popcut-automation` directory
5. The extension icon should appear in your browser toolbar

#### For Microsoft Edge:
1. Open Edge and navigate to `edge://extensions/`
2. Enable **Developer mode** (toggle in the left sidebar)
3. Click **Load unpacked**
4. Select the `popcut-automation` directory
5. The extension icon should appear in your browser toolbar

## Using the Extension

### 1. Navigate to a Fathom Recording
Open any Fathom video share link in your browser:
```
https://fathom.video/share/abc123def456
```

### 2. Wait for Page to Load
The extension will automatically detect that you're on a Fathom share page and inject the export button after the page finishes loading.

### 3. Click the Export Button
Look for the **"Export to n8n"** button in the top-right corner of the page (it has a blue background and floats over the content).

### 4. Data is Sent
When you click the button:
- The button text changes to "Extracting..." while gathering data
- Then changes to "Sending..." while making the API request
- Finally shows "✓ Sent!" on success, or "✗ Error" on failure
- The button returns to normal after 2 seconds

## What Data is Sent?

The extension sends a JSON payload to your n8n webhook with the following structure:

```json
{
  "recordingId": "abc123def456",
  "url": "https://fathom.video/share/abc123def456",
  "transcription": "Full transcription text from the video...",
  "summary": "Summary and key points from the video...",
  "timestamp": "2024-12-07T17:00:00.000Z"
}
```

## Setting Up Your n8n Workflow

### 1. Create a Webhook Node
In n8n, add a new **Webhook** node to your workflow:
- Method: `POST`
- Path: Choose a unique path (e.g., `/fathom-export`)
- Response Code: `200`

### 2. Get Your Webhook URL
After saving, n8n will provide you with a webhook URL like:
```
https://your-n8n-instance.com/webhook/your-webhook-id
```

Copy this URL and paste it into your `webhook-config.js` file.

### 3. Process the Data
Add nodes to your n8n workflow to process the incoming data. Common next steps:
- **Save to Database**: Store transcriptions in PostgreSQL, MongoDB, etc.
- **Send Notification**: Email or Slack notification with the summary
- **AI Processing**: Send to OpenAI/Claude for further analysis
- **CRM Update**: Add notes to your CRM system

### Example n8n Workflow Structure:
```
Webhook → JSON Parser → [Your Processing Nodes] → Response
```

## Troubleshooting

### Button Doesn't Appear
- **Check the URL**: Make sure you're on a share link (`https://fathom.video/share/...`)
- **Refresh the page**: Sometimes the extension needs a page refresh to activate
- **Check extension is enabled**: Go to `chrome://extensions/` and ensure it's active

### "Webhook URL not configured" Error
- Make sure you created `webhook-config.js` from the example file
- Verify the file is in the same directory as `manifest.json`
- Check that the URL is properly formatted in the config

### Data Not Sending / Timeout Errors
- **Check your webhook URL**: Test it with a tool like Postman or curl
- **Verify n8n is running**: Make sure your n8n instance is accessible
- **Check the console**: Open browser DevTools (F12) and look for errors
- **CORS issues**: Ensure your n8n webhook allows cross-origin requests

### Transcription/Summary Not Extracting Properly
Fathom may update their page structure. If extraction fails:
1. Open browser DevTools (F12)
2. Inspect the page elements
3. Update the selectors in `content.js` to match the current structure
4. Look for elements with class names or data attributes containing:
   - `transcript`, `transcription`, or similar for transcript content
   - `summary`, `highlight`, `key-point`, or similar for summary content

## Security Best Practices

1. **Never commit webhook-config.js**: It's already in `.gitignore`, but double-check
2. **Use HTTPS**: Always use secure webhook URLs (https://)
3. **Restrict webhook access**: Use n8n's authentication features if available
4. **Rotate webhooks**: Periodically change your webhook URL
5. **Monitor usage**: Check n8n logs for unexpected webhook calls

## Advanced Configuration

### Modifying the Button Position
Edit `styles.css` to change the button location:
```css
.fathom-export-btn {
  position: fixed;
  top: 20px;    /* Adjust these values */
  right: 20px;  /* to reposition the button */
  /* ... */
}
```

### Changing Timeout Settings
Edit the constants at the top of `content.js`:
```javascript
const WEBHOOK_TIMEOUT_MS = 30000;  // Change to 60000 for 60 seconds
```

### Customizing the Button Text
In `content.js`, find the `createExportButton` function and change:
```javascript
button.textContent = 'Export to n8n';  // Change this text
```

## Getting Help

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Test your webhook URL with curl: `curl -X POST -H "Content-Type: application/json" -d '{"test":"data"}' YOUR_WEBHOOK_URL`
3. Review the n8n webhook logs
4. Check if Fathom has updated their page structure

## Next Steps

Once you have the basic extension working:
- Build automated workflows in n8n to process your video data
- Create AI-powered analysis of your meeting transcripts
- Integrate with your CRM, project management, or documentation tools
- Set up automatic notifications for important meetings

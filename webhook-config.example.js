// Copy this file to webhook-config.js and add your n8n webhook URL
// webhook-config.js is in .gitignore for security

const WEBHOOK_CONFIG = {
  url: 'https://your-n8n-instance.com/webhook/your-webhook-id'
};

// For use in content script
if (typeof window !== 'undefined') {
  window.WEBHOOK_CONFIG = WEBHOOK_CONFIG;
}

// For use in background script
if (typeof self !== 'undefined') {
  self.WEBHOOK_CONFIG = WEBHOOK_CONFIG;
}

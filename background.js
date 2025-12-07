// Background service worker for the Fathom Video Exporter extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Fathom Video Exporter extension installed');
});

// Listen for messages from content script if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToWebhook') {
    // Handle webhook sending from background if needed
    sendResponse({ success: true });
  }
  return true;
});

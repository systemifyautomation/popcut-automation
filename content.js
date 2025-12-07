// Content script for Fathom video pages
(function() {
  'use strict';

  // Configuration constants
  const MIN_TEXT_LENGTH = 50;
  const MAX_TEXT_LENGTH = 10000;
  const MAX_TEXT_BLOCKS = 50;
  const WEBHOOK_TIMEOUT_MS = 30000;

  // Load webhook configuration
  let webhookUrl = null;
  
  // Try to load the webhook config
  async function loadWebhookConfig() {
    try {
      // Import the config if it exists
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('webhook-config.js');
      script.onload = function() {
        if (window.WEBHOOK_CONFIG && window.WEBHOOK_CONFIG.url) {
          webhookUrl = window.WEBHOOK_CONFIG.url;
          console.log('Webhook config loaded successfully');
        }
      };
      script.onerror = function() {
        console.warn('webhook-config.js not found. Please create it from webhook-config.example.js');
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading webhook config:', error);
    }
  }

  // Extract transcription from the page
  function extractTranscription() {
    // Fathom stores transcription in various possible locations
    // Look for transcript elements
    const transcriptElements = [
      ...document.querySelectorAll('[data-testid*="transcript"]'),
      ...document.querySelectorAll('[class*="transcript"]'),
      ...document.querySelectorAll('[id*="transcript"]')
    ];

    let transcription = '';

    // Try to find transcript text
    for (const element of transcriptElements) {
      const text = element.innerText || element.textContent;
      if (text && text.length > transcription.length) {
        transcription = text;
      }
    }

    // If no transcript found, try to find all text blocks that might be transcription
    // Limit scope to main content areas to avoid including navigation, headers, etc.
    if (!transcription) {
      const mainContent = document.querySelector('main, [role="main"], #content, .content');
      const searchScope = mainContent || document.body;
      
      const textBlocks = searchScope.querySelectorAll('p, div[class*="text"], span[class*="text"]');
      const possibleTranscript = Array.from(textBlocks)
        .map(el => el.innerText)
        .filter(text => text && text.length > MIN_TEXT_LENGTH && text.length < MAX_TEXT_LENGTH)
        .slice(0, MAX_TEXT_BLOCKS)
        .join('\n\n');
      
      if (possibleTranscript) {
        transcription = possibleTranscript;
      }
    }

    return transcription || 'No transcription found';
  }

  // Extract summary from the page
  function extractSummary() {
    // Look for summary elements
    const summaryElements = [
      ...document.querySelectorAll('[data-testid*="summary"]'),
      ...document.querySelectorAll('[class*="summary"]'),
      ...document.querySelectorAll('[id*="summary"]'),
      ...document.querySelectorAll('[class*="highlight"]'),
      ...document.querySelectorAll('[class*="key-point"]')
    ];

    let summary = '';

    for (const element of summaryElements) {
      const text = element.innerText || element.textContent;
      if (text && text.length > summary.length) {
        summary = text;
      }
    }

    return summary || 'No summary found';
  }

  // Send data to webhook
  async function sendToWebhook() {
    if (!webhookUrl) {
      throw new Error('Webhook URL not configured. Please create webhook-config.js from webhook-config.example.js');
    }

    // Validate webhook URL format
    try {
      new URL(webhookUrl);
      if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
        throw new Error('Invalid webhook URL: must start with http:// or https://');
      }
    } catch (error) {
      throw new Error('Invalid webhook URL format');
    }

    // Extract data
    const transcription = extractTranscription();
    const summary = extractSummary();
    
    // Get recording info from URL
    const url = window.location.href;
    let recordingId = 'unknown';
    
    // Try to extract recording ID from various URL patterns
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2) {
      recordingId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    }

    const payload = {
      recordingId,
      url,
      transcription,
      summary,
      timestamp: new Date().toISOString()
    };

    // Send to webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true };
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractAndSend') {
      // Handle async operation
      sendToWebhook()
        .then(result => {
          sendResponse(result);
        })
        .catch(error => {
          console.error('Error in extraction:', error);
          sendResponse({ 
            success: false, 
            error: error.message || 'Unknown error occurred' 
          });
        });
      
      // Return true to indicate we'll send response asynchronously
      return true;
    }
  });

  // Initialize the extension
  async function init() {
    console.log('Fathom Video Exporter: Content script loaded');
    
    // Load webhook configuration
    await loadWebhookConfig();
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


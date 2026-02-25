// Content script for Fathom video pages
(function() {
  'use strict';

  // Configuration constants
  const MIN_TEXT_LENGTH = 50;
  const MAX_TEXT_LENGTH = 10000;
  const MAX_TEXT_BLOCKS = 50;
  const WEBHOOK_TIMEOUT_MS = 30000;

  // Load webhook URL from config
  let WEBHOOK_URL = '';
  let TRAINING_WEBHOOK_URL = '';
  
  async function loadConfig() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('config.js');
    script.onload = () => {
      if (typeof CONFIG !== 'undefined') {
        WEBHOOK_URL = CONFIG.WEBHOOK_URL;
        TRAINING_WEBHOOK_URL = CONFIG.TRAINING_WEBHOOK_URL;
      }
    };
    document.head.appendChild(script);
  }
  
  loadConfig();

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'submitTrainingInstruction') {
      // Send training instruction to webhook
      fetch(TRAINING_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: request.instruction,
          timestamp: request.timestamp,
          type: 'training'
        })
      })
      .then(response => {
        if (response.ok) {
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: `HTTP error! status: ${response.status}` });
        }
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      
      return true; // Keep the message channel open for async response
    }
  });

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
    // Validate webhook URL format
    try {
      new URL(WEBHOOK_URL);
      if (!WEBHOOK_URL.startsWith('http://') && !WEBHOOK_URL.startsWith('https://')) {
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

    const response = await fetch(WEBHOOK_URL, {
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
    console.log('Popcut AI Matchmaker: Content script loaded');
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


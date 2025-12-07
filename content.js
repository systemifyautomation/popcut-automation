// Content script for Fathom video pages
(function() {
  'use strict';

  // Configuration constants
  const MIN_TEXT_LENGTH = 50;
  const MAX_TEXT_LENGTH = 10000;
  const MAX_TEXT_BLOCKS = 50;
  const WEBHOOK_TIMEOUT_MS = 30000;
  const BUTTON_FEEDBACK_DURATION_MS = 2000;

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

  // Wait for page to be fully loaded
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver((mutations) => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Element not found within timeout'));
      }, timeout);
    });
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
      alert('Webhook URL not configured. Please create webhook-config.js from webhook-config.example.js');
      return;
    }

    // Validate webhook URL format
    try {
      new URL(webhookUrl);
      if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
        alert('Invalid webhook URL: must start with http:// or https://');
        return;
      }
    } catch (error) {
      alert('Invalid webhook URL format');
      return;
    }

    const button = document.getElementById('fathom-export-button');
    if (!button) {
      console.error('Export button not found');
      return;
    }
    
    const originalText = button.textContent;
    
    try {
      button.textContent = 'Extracting...';
      button.disabled = true;

      // Extract data
      const transcription = extractTranscription();
      const summary = extractSummary();
      
      // Validate recordingId exists
      const pathParts = window.location.pathname.split('/share/');
      if (pathParts.length < 2 || !pathParts[1]) {
        throw new Error('Invalid Fathom share URL: missing recording ID');
      }
      const recordingId = pathParts[1];
      const url = window.location.href;

      const payload = {
        recordingId,
        url,
        transcription,
        summary,
        timestamp: new Date().toISOString()
      };

      button.textContent = 'Sending...';

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

      if (response.ok) {
        button.textContent = '✓ Sent!';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, BUTTON_FEEDBACK_DURATION_MS);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending to webhook:', error);
      button.textContent = '✗ Error';
      button.style.backgroundColor = '#ef4444';
      
      let errorMessage = 'Failed to send data to webhook.';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage + ' Check console for details.');
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.disabled = false;
      }, BUTTON_FEEDBACK_DURATION_MS);
    }
  }

  // Create and inject the export button
  function createExportButton() {
    // Check if button already exists
    if (document.getElementById('fathom-export-button')) {
      return;
    }

    const button = document.createElement('button');
    button.id = 'fathom-export-button';
    button.className = 'fathom-export-btn';
    button.textContent = 'Export to n8n';
    button.title = 'Send transcription and summary to n8n webhook';
    
    button.addEventListener('click', sendToWebhook);

    // Try to inject button in a good location
    // Look for header or control panel
    const possibleLocations = [
      document.querySelector('header'),
      document.querySelector('[class*="header"]'),
      document.querySelector('[class*="control"]'),
      document.querySelector('[class*="toolbar"]'),
      document.body
    ];

    for (const location of possibleLocations) {
      if (location) {
        location.appendChild(button);
        console.log('Export button injected successfully');
        break;
      }
    }
  }

  // Initialize the extension
  async function init() {
    // Check if we're on a Fathom share page
    if (!window.location.pathname.startsWith('/share/')) {
      console.log('Not on a Fathom share page, extension inactive');
      return;
    }

    console.log('Fathom Video Exporter: Initializing...');
    
    // Load webhook configuration
    await loadWebhookConfig();

    // Wait for page to be ready
    try {
      await waitForElement('body');
      
      // Wait a bit for dynamic content to load
      setTimeout(() => {
        createExportButton();
      }, 2000);
    } catch (error) {
      console.error('Error initializing extension:', error);
    }
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

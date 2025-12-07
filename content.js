// Content script for Fathom video pages
(function() {
  'use strict';

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
    if (!transcription) {
      const textBlocks = document.querySelectorAll('p, div[class*="text"], span[class*="text"]');
      const possibleTranscript = Array.from(textBlocks)
        .map(el => el.innerText)
        .filter(text => text && text.length > 50)
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

    const button = document.getElementById('fathom-export-button');
    const originalText = button.textContent;
    
    try {
      button.textContent = 'Extracting...';
      button.disabled = true;

      // Extract data
      const transcription = extractTranscription();
      const summary = extractSummary();
      const recordingId = window.location.pathname.split('/share/')[1];
      const url = window.location.href;

      const payload = {
        recordingId,
        url,
        transcription,
        summary,
        timestamp: new Date().toISOString()
      };

      button.textContent = 'Sending...';

      // Send to webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        button.textContent = '✓ Sent!';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 2000);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending to webhook:', error);
      button.textContent = '✗ Error';
      button.style.backgroundColor = '#ef4444';
      alert('Failed to send data to webhook. Check console for details.');
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.disabled = false;
      }, 2000);
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

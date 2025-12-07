// Popup script for Fathom Video Exporter
(function() {
  'use strict';

  const startBtn = document.getElementById('startMatchingBtn');
  const statusText = document.getElementById('statusText');
  const messageDiv = document.getElementById('message');

  // Show message to user
  function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `message show ${type}`;
    
    setTimeout(() => {
      messageDiv.classList.remove('show');
    }, 5000);
  }

  // Update status text
  function updateStatus(text, color = 'rgba(255, 255, 255, 0.8)') {
    statusText.textContent = text;
    statusText.style.color = color;
  }

  // Check if current tab is a Fathom website
  async function checkFathomSite() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url) {
        return false;
      }

      return tab.url.includes('fathom.video');
    } catch (error) {
      console.error('Error checking current site:', error);
      return false;
    }
  }

  // Initialize popup
  async function initialize() {
    const isFathomSite = await checkFathomSite();
    
    if (!isFathomSite) {
      startBtn.disabled = true;
      updateStatus('Please navigate to a Fathom video page', '#fca5a5');
      showMessage('This extension only works on fathom.video', 'error');
      return;
    }

    updateStatus('Ready to export', '#86efac');
  }

  // Handle start matching button click
  startBtn.addEventListener('click', async () => {
    try {
      startBtn.disabled = true;
      updateStatus('Extracting data...', '#93c5fd');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Send message to content script to start extraction
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractAndSend' });

      if (response && response.success) {
        updateStatus('Success!', '#86efac');
        showMessage('Data exported successfully!', 'success');
      } else {
        updateStatus('Export failed', '#fca5a5');
        showMessage(response?.error || 'Failed to export data', 'error');
      }
    } catch (error) {
      console.error('Error during extraction:', error);
      updateStatus('Error occurred', '#fca5a5');
      showMessage('Error: ' + error.message, 'error');
    } finally {
      setTimeout(() => {
        startBtn.disabled = false;
        updateStatus('Ready to export', 'rgba(255, 255, 255, 0.8)');
      }, 2000);
    }
  });

  // Initialize when popup opens
  initialize();
})();

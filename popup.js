// Popup script for Popcut AI Matchmaker
(function() {
  'use strict';

  // Get webhook URLs from config
  const WEBHOOK_URL = (typeof CONFIG !== 'undefined' && CONFIG.WEBHOOK_URL) || '';
  const TRAINING_WEBHOOK_URL = (typeof CONFIG !== 'undefined' && CONFIG.TRAINING_WEBHOOK_URL) || '';
  
  // Cache for extracted data
  let cachedData = {
    title: null,
    summary: null,
    transcription: null,
    url: null
  };

  // Initialize popup
  async function initialize() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const fathomIdInput = document.getElementById('fathomIdInput');
    
    // Check for pending results or errors from background script
    chrome.storage.local.get(['lastMatchResults', 'pendingResults', 'matchmakingError', 'matchmakingInProgress', 'matchmakingStartTime'], (data) => {
      // Clear badge when popup opens
      chrome.action.setBadgeText({ text: '' });
      
      // Check if matchmaking is still in progress
      if (data.matchmakingInProgress) {
        console.log('Matchmaking still in progress, resuming animation...');
        updateStatus('AI is analyzing...', '#93c5fd');
        showMessage('Matchmaking in progress... Please wait.', 'info');
        
        // Resume AI animation
        if (typeof aiLoader !== 'undefined' && aiLoader) {
          aiLoader.start();
        }
        
        // Disable the start button
        const startBtn = document.getElementById('startMatchingBtn');
        if (startBtn) {
          startBtn.disabled = true;
        }
        
        return; // Don't show results while processing
      }
      
      // Check for errors first
      if (data.matchmakingError) {
        showMessage('Previous matchmaking failed: ' + data.matchmakingError.message, 'error');
        updateStatus('Error occurred', '#fca5a5');
        // Clear the error after showing it
        chrome.storage.local.remove('matchmakingError');
      }
      // Then check for results
      else if (data.pendingResults && data.lastMatchResults && data.lastMatchResults.suggestions) {
        // New results available - display them
        displayResults(data.lastMatchResults.suggestions, data.lastMatchResults.keywords || []);
        showMessage('Matchmaking complete! Found ' + data.lastMatchResults.suggestions.length + ' matches', 'success');
        updateStatus('Success!', '#86efac');
        
        // Clear the pending flag
        chrome.storage.local.remove('pendingResults');
      }
      // Display previous results if they exist (but not pending)
      else if (data.lastMatchResults && data.lastMatchResults.suggestions) {
        displayResults(data.lastMatchResults.suggestions, data.lastMatchResults.keywords || []);
        showMessage('Showing previous results', 'info');
      }
    });
    
    // Check if we're on a Fathom page
    if (tab && tab.url && tab.url.includes('fathom.video')) {
      // Extract Fathom ID from URL and auto-fill
      const fathomId = extractFathomId(tab.url);
      if (fathomId) {
        fathomIdInput.value = fathomId;
        updateStatus('Fathom ID auto-filled', '#86efac');
        
        // Cache the URL
        cachedData.url = tab.url;
        
        // Auto-extract data from current page
        await extractDataFromPage(tab.id);
      }
    } else {
      updateStatus('Ready - enter Fathom ID to start', '#93c5fd');
    }
  }
  
  // Extract Fathom ID from URL
  function extractFathomId(url) {
    try {
      // Match patterns like: fathom.video/share/abcd1234 or https://app.fathom.video/call/abcd1234
      const match = url.match(/fathom\.video\/(?:share|call)\/([a-zA-Z0-9-]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting Fathom ID:', error);
      return null;
    }
  }
  
  // Extract data from current Fathom page
  async function extractDataFromPage(tabId) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Cache the URL
    cachedData.url = tab.url;
    
    // Extract and display the video title
    updateStatus('Extracting title...', '#93c5fd');
    const title = await extractTitle(tabId);
    cachedData.title = title;
    
    // Extract summary in background
    updateStatus('Extracting summary...', '#93c5fd');
    try {
      const summary = await extractSummary(tabId);
      cachedData.summary = summary;
    } catch (error) {
      console.error('Failed to extract summary:', error);
      cachedData.summary = 'Error extracting summary';
    }
    
    // Extract transcription in background
    updateStatus('Extracting transcription...', '#93c5fd');
    const transcription = await extractTranscription(tabId);
    cachedData.transcription = transcription;
    
    updateStatus('Ready to match', '#86efac');
    console.log('Cached data ready:', {
      title: cachedData.title,
      summaryLength: cachedData.summary?.length || 0,
      transcriptionLength: cachedData.transcription?.length || 0
    });
  }

  // Set up event listeners
  document.getElementById('startMatchingBtn').addEventListener('click', () => {
    handleStartMatching(cachedData, WEBHOOK_URL);
  });

  document.getElementById('talkToAiBtn').addEventListener('click', handleTalkToAI);
  document.getElementById('trainAiBtn').addEventListener('click', handleTrainAI);
  document.getElementById('closeTrainingBtn').addEventListener('click', handleCloseTraining);
  document.getElementById('submitInstructionBtn').addEventListener('click', () => {
    handleSubmitInstruction(TRAINING_WEBHOOK_URL);
  });

  // Initialize when popup opens
  initialize();
})();

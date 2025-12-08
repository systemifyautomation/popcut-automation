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
    const isFathomSite = await checkFathomSite();
    
    if (!isFathomSite) {
      const startBtn = document.getElementById('startMatchingBtn');
      const talkToAiBtn = document.getElementById('talkToAiBtn');
      const videoTitle = document.getElementById('videoTitle');
      
      startBtn.disabled = true;
      talkToAiBtn.disabled = true;
      // trainAiBtn remains enabled - works on any site
      videoTitle.textContent = 'Not on Fathom page';
      videoTitle.style.color = '#fca5a5';
      updateStatus('Train AI available on any site', '#93c5fd');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Cache the URL
    cachedData.url = tab.url;
    
    // Extract and display the video title
    updateStatus('Extracting title...', '#93c5fd');
    const title = await extractTitle(tab.id);
    document.getElementById('videoTitle').textContent = title;
    cachedData.title = title;
    
    // Extract summary in background
    updateStatus('Extracting summary...', '#93c5fd');
    try {
      const summary = await extractSummary(tab.id);
      cachedData.summary = summary;
    } catch (error) {
      console.error('Failed to extract summary:', error);
      cachedData.summary = 'Error extracting summary';
    }
    
    // Extract transcription in background
    updateStatus('Extracting transcription...', '#93c5fd');
    const transcription = await extractTranscription(tab.id);
    cachedData.transcription = transcription;
    
    updateStatus('Ready to export (data cached)', '#86efac');
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

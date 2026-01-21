// Event handlers for popup buttons

// Handle start matching button click
async function handleStartMatching(cachedData, WEBHOOK_URL) {
  const startBtn = document.getElementById('startMatchingBtn');
  const stopBtn = document.getElementById('stopMatchingBtn');
  const fathomIdInput = document.getElementById('fathomIdInput');
  
  try {
    startBtn.disabled = true;
    startBtn.style.display = 'none';
    if (stopBtn) {
      stopBtn.style.display = 'block';
    }
    
    // Clear previous results from storage
    chrome.storage.local.remove(['lastMatchResults', 'pendingResults', 'matchmakingError']);
    
    // Clear badge
    chrome.action.setBadgeText({ text: '' });
    
    // Get Fathom ID from input
    const fathomId = fathomIdInput.value.trim();
    if (!fathomId) {
      showMessage('Please enter a Fathom video ID', 'error');
      startBtn.disabled = false;
      return;
    }
    
    // Check if we have cached data
    if (!cachedData.title || !cachedData.url) {
      updateStatus('Preparing data...', '#93c5fd');
      // If no cached data, just send the Fathom ID
      cachedData.url = `https://app.fathom.video/share/${fathomId}`;
      cachedData.title = cachedData.title || 'Manual submission';
      cachedData.summary = cachedData.summary || '';
      cachedData.transcription = cachedData.transcription || '';
    }

    updateStatus('AI is analyzing...', '#93c5fd');
    showMessage('AI analysis started. This may take 2-3 minutes. You can close this popup and multitask - we\'ll notify you when done!', 'info');

    // Store matchmaking in progress state
    chrome.storage.local.set({
      matchmakingInProgress: true,
      matchmakingStartTime: new Date().toISOString()
    });

    // Start AI analysis animation
    if (typeof aiLoader !== 'undefined' && aiLoader) {
      aiLoader.start();
    }

    // Prepare payload with cached data and Fathom ID
    const payload = {
      fathomId: fathomId,
      url: cachedData.url,
      title: cachedData.title,
      summary: cachedData.summary,
      transcription: cachedData.transcription,
      timestamp: new Date().toISOString()
    };

    // Send request to background script instead of directly to webhook
    chrome.runtime.sendMessage({
      action: 'startMatchmaking',
      data: {
        payload: payload,
        webhookUrl: WEBHOOK_URL,
        fathomId: fathomId
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        updateStatus('Error occurred', '#fca5a5');
        showMessage('Error: ' + chrome.runtime.lastError.message, 'error');
        startBtn.disabled = false;
        startBtn.style.display = 'block';
        if (stopBtn) {
          stopBtn.style.display = 'none';
        }
        // Clear matchmaking in progress state
        chrome.storage.local.remove(['matchmakingInProgress', 'matchmakingStartTime']);
        return;
      }
      
      if (!response || !response.success) {
        console.error('Failed to start matchmaking');
        updateStatus('Error occurred', '#fca5a5');
        showMessage('Error: Failed to start matchmaking', 'error');
        startBtn.disabled = false;
        startBtn.style.display = 'block';
        if (stopBtn) {
          stopBtn.style.display = 'none';
        }
        // Clear matchmaking in progress state
        chrome.storage.local.remove(['matchmakingInProgress', 'matchmakingStartTime']);
        return;
      }
      
      // Matchmaking started successfully in background
      console.log('Matchmaking started in background');
      // The results will come via storage events or when popup reopens
    });
    
  } catch (error) {
    console.error('Error sending to webhook:', error);
    
    // Clear matchmaking in progress state
    chrome.storage.local.remove(['matchmakingInProgress', 'matchmakingStartTime']);
    
    // Hide AI animation on error
    if (typeof aiLoader !== 'undefined' && aiLoader) {
      aiLoader.hide();
    }
    
    updateStatus('Error occurred', '#fca5a5');
    showMessage('Error: ' + error.message, 'error');
    
    setTimeout(() => {
      startBtn.disabled = false;
      startBtn.style.display = 'block';
      if (stopBtn) {
        stopBtn.style.display = 'none';
      }
      updateStatus('Ready to export', 'rgba(255, 255, 255, 0.8)');
    }, 2000);
  }
}

// Handle stop matching button click
async function handleStopMatching() {
  const startBtn = document.getElementById('startMatchingBtn');
  const stopBtn = document.getElementById('stopMatchingBtn');
  
  try {
    // Stop animation
    if (typeof aiLoader !== 'undefined' && aiLoader) {
      aiLoader.hide();
    }
    
    // Send cancel message to background
    chrome.runtime.sendMessage({
      action: 'cancelMatchmaking'
    }, (response) => {
      if (response && response.success) {
        showMessage('Matchmaking cancelled', 'info');
        updateStatus('Ready for matching', 'rgba(255, 255, 255, 0.8)');
      }
    });
    
    // Update UI immediately
    startBtn.disabled = false;
    startBtn.style.display = 'block';
    if (stopBtn) {
      stopBtn.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error stopping matchmaking:', error);
    showMessage('Error: ' + error.message, 'error');
  }
}

// Handle Talk to the AI button click
function handleTalkToAI() {
  const talkToAiBtn = document.getElementById('talkToAiBtn');
  
  try {
    talkToAiBtn.disabled = true;
    updateStatus('Opening AI chat...', '#93c5fd');
    
    // TODO: Add your chat interface URL or logic here
    showMessage('Talk to AI feature coming soon!', 'info');
    
    updateStatus('Ready to export (data cached)', '#86efac');
  } catch (error) {
    console.error('Error opening AI chat:', error);
    showMessage('Error: ' + error.message, 'error');
  } finally {
    setTimeout(() => {
      talkToAiBtn.disabled = false;
    }, 1000);
  }
}

// Handle Train the AI button click
function handleTrainAI() {
  const trainingInterface = document.getElementById('trainingInterface');
  const instructionInput = document.getElementById('instructionInput');
  
  // Toggle training interface
  if (trainingInterface.style.display === 'none') {
    trainingInterface.style.display = 'block';
    instructionInput.focus();
    updateStatus('Enter training instruction', '#93c5fd');
  } else {
    trainingInterface.style.display = 'none';
    updateStatus('Ready to export (data cached)', '#86efac');
  }
}

// Handle close training interface
function handleCloseTraining() {
  document.getElementById('trainingInterface').style.display = 'none';
  updateStatus('Ready to export (data cached)', '#86efac');
}

// Handle submit instruction
async function handleSubmitInstruction(TRAINING_WEBHOOK_URL) {
  const submitInstructionBtn = document.getElementById('submitInstructionBtn');
  const instructionInput = document.getElementById('instructionInput');
  const instruction = instructionInput.value.trim();
  
  if (!instruction) {
    showMessage('Please enter an instruction', 'error');
    return;
  }
  
  try {
    submitInstructionBtn.disabled = true;
    updateStatus('Submitting instruction...', '#93c5fd');
    
    // Send directly to webhook - no need to inject into page
    const response = await fetch(TRAINING_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instruction: instruction
      })
    });
    
    if (response.ok) {
      showMessage('Instruction submitted successfully!', 'success');
      instructionInput.value = ''; // Clear the input
      updateStatus('Ready to export (data cached)', '#86efac');
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error submitting instruction:', error);
    showMessage('Error: ' + error.message, 'error');
    updateStatus('Error occurred', '#fca5a5');
  } finally {
    submitInstructionBtn.disabled = false;
  }
}

// Display matching results
function displayResults(suggestions, keywords = []) {
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsList = document.getElementById('resultsList');
  
  // Clear previous results
  resultsList.innerHTML = '';
  
  // Display keywords if available
  if (keywords.length > 0) {
    const keywordsDiv = document.createElement('div');
    keywordsDiv.className = 'keywords-section';
    keywordsDiv.innerHTML = `
      <div class="keywords-label">Keywords (extracted by AI):</div>
      <div class="keywords-list">${keywords.join(', ')}</div>
    `;
    resultsList.appendChild(keywordsDiv);
  }
  
  // Create result cards for each suggestion
  suggestions.forEach((editor, index) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    // Use rank from data or fallback to index
    const rank = editor.rank || (index + 1);
    
    let cardHTML = `
      <div class="result-rank">#${rank}</div>
      <div class="result-content">
        <div class="result-header">
          <div>
    `;
    
    // Display Editor Name
    if (editor.editor_name || editor.name) {
      cardHTML += `
        <h3 class="result-name">${editor.editor_name || editor.name}</h3>
      `;
    }
    
    cardHTML += `
          </div>
    `;
    
    // Display Overall Score
    if (editor.overall_score !== undefined) {
      cardHTML += `
          <div class="result-score">${editor.overall_score}</div>
      `;
    }
    
    cardHTML += `
        </div>
    `;
    
    // Display Why Best Fit
    if (editor.why_best_fit) {
      cardHTML += `
        <div class="result-field expanded" data-collapsible>
          <span class="result-label">Why Best Fit</span>
          <div class="result-value result-fit">${editor.why_best_fit}</div>
        </div>
      `;
    }
    
    // Display Bio Highlights
    if (editor.bio_highlights) {
      cardHTML += `
        <div class="result-field collapsed" data-collapsible>
          <span class="result-label">Bio Highlights</span>
          <div class="result-value result-highlights">${editor.bio_highlights}</div>
        </div>
      `;
    }
    
    // Display Transcription Insights
    if (editor.transcription_insights) {
      cardHTML += `
        <div class="result-field collapsed" data-collapsible>
          <span class="result-label">Client Needs</span>
          <div class="result-value">${editor.transcription_insights}</div>
        </div>
      `;
    }
    
    // Display Potential Concerns
    if (editor.potential_concerns) {
      cardHTML += `
        <div class="result-field collapsed" data-collapsible>
          <span class="result-label">Potential Concerns</span>
          <div class="result-value result-concerns">${editor.potential_concerns}</div>
        </div>
      `;
    }
    
    // Display Comparison to Others
    if (editor.comparison_to_others) {
      cardHTML += `
        <div class="result-field collapsed" data-collapsible>
          <span class="result-label">Comparison</span>
          <div class="result-value result-comparison">${editor.comparison_to_others}</div>
        </div>
      `;
    }
    
    // Legacy fields support (ID and Specializations)
    if (editor.id) {
      cardHTML += `
        <div class="result-field">
          <span class="result-label">Editor ID</span>
          <div class="result-value">${editor.id}</div>
        </div>
      `;
    }
    
    if (editor.specializations && editor.specializations.length > 0) {
      cardHTML += `
        <div class="result-field">
          <span class="result-label">Specializations</span>
          <div class="result-value">${editor.specializations.join(', ')}</div>
        </div>
      `;
    }
    
    cardHTML += `
      </div>
    `;
    
    card.innerHTML = cardHTML;
    resultsList.appendChild(card);
  });
  
  // Add click handlers for collapsible sections
  document.querySelectorAll('[data-collapsible] .result-label').forEach(label => {
    label.addEventListener('click', function() {
      const field = this.closest('.result-field');
      if (field.classList.contains('expanded')) {
        field.classList.remove('expanded');
        field.classList.add('collapsed');
      } else {
        field.classList.remove('collapsed');
        field.classList.add('expanded');
      }
    });
  });
  
  // Show results container
  resultsContainer.style.display = 'block';
  
  // Save to storage for persistence
  chrome.storage.local.set({
    lastMatchResults: {
      suggestions: suggestions,
      keywords: keywords,
      timestamp: new Date().toISOString()
    }
  });
}

// Handle close results
document.addEventListener('DOMContentLoaded', () => {
  const closeResultsBtn = document.getElementById('closeResultsBtn');
  if (closeResultsBtn) {
    closeResultsBtn.addEventListener('click', () => {
      document.getElementById('resultsContainer').style.display = 'none';
      // Clear stored results when user closes them
      chrome.storage.local.remove('lastMatchResults');
    });
  }
});

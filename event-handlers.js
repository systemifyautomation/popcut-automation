// Event handlers for popup buttons

// Handle start matching button click
async function handleStartMatching(cachedData, WEBHOOK_URL) {
  const startBtn = document.getElementById('startMatchingBtn');
  const fathomIdInput = document.getElementById('fathomIdInput');
  
  try {
    startBtn.disabled = true;
    
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
    showMessage('Processing matchmaking request... You can close this popup.', 'info');

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
        return;
      }
      
      if (!response) {
        console.error('No response from background');
        updateStatus('Error occurred', '#fca5a5');
        showMessage('Error: No response from background script', 'error');
        startBtn.disabled = false;
        return;
      }
      
      if (response.success) {
        const result = response.result;
        console.log('Matchmaking result:', result);
        
        updateStatus('Success!', '#86efac');
        
        // Display results if suggestions are returned
        if (result.suggestions && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
          displayResults(result.suggestions, result.keywords || []);
          showMessage('Matching complete! Found ' + result.suggestions.length + ' matches', 'success');
        } else {
          showMessage('Matching complete! No matches found', 'warning');
        }
      } else {
        console.error('Error from background:', response.error);
        updateStatus('Error occurred', '#fca5a5');
        showMessage('Error: ' + response.error, 'error');
      }
      
      setTimeout(() => {
        startBtn.disabled = false;
        updateStatus('Ready to export', 'rgba(255, 255, 255, 0.8)');
      }, 2000);
    });
    
  } catch (error) {
    console.error('Error sending to webhook:', error);
    updateStatus('Error occurred', '#fca5a5');
    showMessage('Error: ' + error.message, 'error');
    
    setTimeout(() => {
      startBtn.disabled = false;
      updateStatus('Ready to export', 'rgba(255, 255, 255, 0.8)');
    }, 2000);
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
    
    let cardHTML = `
      <div class="result-rank">#${index + 1}</div>
      <div class="result-content">
    `;
    
    // Display ID
    if (editor.id) {
      cardHTML += `
        <div class="result-field">
          <span class="result-label">ID:</span>
          <span class="result-value">${editor.id}</span>
        </div>
      `;
    }
    
    // Display Name
    if (editor.name) {
      cardHTML += `
        <div class="result-field">
          <span class="result-label">Name:</span>
          <span class="result-value">${editor.name}</span>
        </div>
      `;
    }
    
    // Display Specializations
    if (editor.specializations && editor.specializations.length > 0) {
      cardHTML += `
        <div class="result-field">
          <span class="result-label">Specializations:</span>
          <span class="result-value">${editor.specializations.join(', ')}</span>
        </div>
      `;
    }
    
    cardHTML += `
      </div>
    `;
    
    card.innerHTML = cardHTML;
    resultsList.appendChild(card);
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

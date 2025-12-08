// Event handlers for popup buttons

// Handle start matching button click
async function handleStartMatching(cachedData, WEBHOOK_URL) {
  const startBtn = document.getElementById('startMatchingBtn');
  
  try {
    startBtn.disabled = true;
    
    // Check if we have cached data
    if (!cachedData.title || !cachedData.url) {
      updateStatus('Extracting data...', '#93c5fd');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      cachedData.url = tab.url;
      cachedData.title = await extractTitle(tab.id);
      cachedData.summary = await extractSummary(tab.id);
      cachedData.transcription = await extractTranscription(tab.id);
    }

    updateStatus('Sending to webhook...', '#93c5fd');

    // Prepare payload with cached data
    const payload = {
      url: cachedData.url,
      title: cachedData.title,
      summary: cachedData.summary,
      transcription: cachedData.transcription,
      timestamp: new Date().toISOString()
    };

    // Send directly to webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      
      updateStatus('Success!', '#86efac');
      showMessage('Matching complete!', 'success');
      
      // Display results if data is returned
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        displayResults(result.data);
      }
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending to webhook:', error);
    updateStatus('Error occurred', '#fca5a5');
    showMessage('Error: ' + error.message, 'error');
  } finally {
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
function displayResults(data) {
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsList = document.getElementById('resultsList');
  
  // Clear previous results
  resultsList.innerHTML = '';
  
  // Create result cards for each match
  data.forEach((editor, index) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    let cardHTML = `
      <div class="result-rank">#${index + 1}</div>
      <div class="result-content">
    `;
    
    // Add all properties from the editor object dynamically
    for (const [key, value] of Object.entries(editor)) {
      if (value) {
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        cardHTML += `
          <div class="result-field">
            <span class="result-label">${label}:</span>
            <span class="result-value">${value}</span>
          </div>
        `;
      }
    }
    
    cardHTML += `
      </div>
    `;
    
    card.innerHTML = cardHTML;
    resultsList.appendChild(card);
  });
  
  // Show results container
  resultsContainer.style.display = 'block';
}

// Handle close results
document.addEventListener('DOMContentLoaded', () => {
  const closeResultsBtn = document.getElementById('closeResultsBtn');
  if (closeResultsBtn) {
    closeResultsBtn.addEventListener('click', () => {
      document.getElementById('resultsContainer').style.display = 'none';
    });
  }
});

// Background service worker for the Fathom Video Exporter extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Fathom Video Exporter extension installed');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startMatchmaking') {
    handleMatchmaking(request.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Handle matchmaking in background
async function handleMatchmaking(data) {
  const { payload, webhookUrl, fathomId } = data;
  
  try {
    console.log('Background: Starting matchmaking request...');
    
    // Send request to webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server did not return JSON. Check webhook URL.');
    }

    const result = await response.json();
    console.log('Background: Matchmaking result received:', result);
    
    // Store results for the popup
    // Handle new 'data' array structure from n8n
    const editors = result.data || result.suggestions || [];
    if (editors && Array.isArray(editors) && editors.length > 0) {
      await chrome.storage.local.set({
        lastMatchResults: {
          suggestions: editors,
          keywords: result.keywords || [],
          timestamp: new Date().toISOString(),
          fathomId: fathomId
        },
        pendingResults: true // Flag to indicate new results are available
      });
      
      // Clear matchmaking in progress state
      await chrome.storage.local.remove(['matchmakingInProgress', 'matchmakingStartTime']);
      
      console.log('Background: Results saved, attempting to open popup...');
      
      // Try to open the popup to show results
      try {
        await chrome.action.openPopup();
        console.log('Background: Popup opened successfully');
      } catch (popupError) {
        console.log('Background: Could not open popup automatically:', popupError.message);
        // If we can't open popup, set a badge to notify the user
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#86efac' });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Background: Error in matchmaking:', error);
    
    // Clear matchmaking in progress state
    await chrome.storage.local.remove(['matchmakingInProgress', 'matchmakingStartTime']);
    
    // Store error for display
    await chrome.storage.local.set({
      matchmakingError: {
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
    
    // Try to open popup to show error
    try {
      await chrome.action.openPopup();
    } catch (popupError) {
      console.log('Background: Could not open popup for error:', popupError.message);
      chrome.action.setBadgeText({ text: 'X' });
      chrome.action.setBadgeBackgroundColor({ color: '#fca5a5' });
    }
    
    throw error;
  }
}


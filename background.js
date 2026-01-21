// Background service worker for the Fathom Video Exporter extension

// Prevent service worker from being terminated during long operations
let activeOperations = 0;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Fathom Video Exporter extension installed');
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('Service worker started');
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('matchmaking-')) {
    // Clear the notification
    chrome.notifications.clear(notificationId);
    // Open the popup by focusing on any tab and then the user can click the icon
    // Note: We can't programmatically open popup, but we can bring attention to it
    console.log('Notification clicked - badge will remind user to open popup');
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startMatchmaking') {
    // Start matchmaking asynchronously without waiting for response
    handleMatchmaking(request.data);
    // Immediately respond to popup so it doesn't block
    sendResponse({ success: true, started: true });
    return false; // Don't keep channel open
  }
  
  if (request.action === 'cancelMatchmaking') {
    cancelMatchmaking()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Handle matchmaking in background
async function handleMatchmaking(data) {
  const { payload, webhookUrl, fathomId } = data;
  
  // Keep service worker alive by sending periodic pings
  let keepAliveInterval = null;
  
  // Track active operation
  activeOperations++;
  
  try {
    console.log('Background: Starting matchmaking request...');
    console.log('Background: Webhook may take 2-3 minutes to respond...');
    console.log('Background: Active operations:', activeOperations);
    
    // Set up keep-alive mechanism to prevent service worker suspension
    keepAliveInterval = setInterval(() => {
      console.log('Background: Keep-alive ping - worker still active');
      // Update badge to show we're still processing
      chrome.action.setBadgeText({ text: '...' });
    }, 20000); // Ping every 20 seconds
    
    // Send request to webhook (no timeout - will wait as long as needed)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true // Keep connection alive
    });
    
    // Clear keep-alive interval
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    
    console.log('Background: Response received from webhook');

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
    
    // Always clear matchmaking in progress state when we get a response
    await chrome.storage.local.remove(['matchmakingInProgress', 'matchmakingStartTime']);
    console.log('Background: Cleared matchmaking in progress state');
    
    // Store results for the popup
    // Handle new 'data' array structure from n8n
    const editors = result.data || result.suggestions || [];
    
    if (editors && Array.isArray(editors) && editors.length > 0) {
      console.log('Background: Storing', editors.length, 'editor results');
      await chrome.storage.local.set({
        lastMatchResults: {
          suggestions: editors,
          keywords: result.keywords || [],
          timestamp: new Date().toISOString(),
          fathomId: fathomId
        },
        pendingResults: true // Flag to indicate new results are available
      });
      
      console.log('Background: Results saved to storage');
      
      // Set badge to notify the user
      chrome.action.setBadgeText({ text: String(editors.length) });
      chrome.action.setBadgeBackgroundColor({ color: '#86efac' });
      console.log('Background: Badge set to notify user');
      
      // Show notification
      chrome.notifications.create('matchmaking-success-' + Date.now(), {
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Matchmaking Complete!',
        message: `Found ${editors.length} matching editor${editors.length > 1 ? 's' : ''}. Click the extension icon to view.`,
        priority: 2,
        requireInteraction: false
      });
      
      console.log('Background: Notification created');
    } else {
      console.log('Background: No editors found in response');
      // Still store empty results
      await chrome.storage.local.set({
        lastMatchResults: {
          suggestions: [],
          keywords: result.keywords || [],
          timestamp: new Date().toISOString(),
          fathomId: fathomId
        },
        pendingResults: true
      });
      
      // Set badge
      chrome.action.setBadgeText({ text: '0' });
      chrome.action.setBadgeBackgroundColor({ color: '#fca5a5' });
      
      // Show notification
      chrome.notifications.create('matchmaking-empty-' + Date.now(), {
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Matchmaking Complete',
        message: 'No matching editors found. Click the extension icon to try again.',
        priority: 1,
        requireInteraction: false
      });
    }
    
    // Operation complete
    activeOperations--;
    console.log('Background: Operation complete. Active operations:', activeOperations);
    
    return result;
  } catch (error) {
    console.error('Background: Error in matchmaking:', error);
    
    // Operation complete (even with error)
    activeOperations--;
    console.log('Background: Operation failed. Active operations:', activeOperations);
    
    // Clear keep-alive interval if still running
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    
    // Clear matchmaking in progress state
    await chrome.storage.local.remove(['matchmakingInProgress', 'matchmakingStartTime']);
    
    // Store error for display
    await chrome.storage.local.set({
      matchmakingError: {
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
    
    // Set error badge
    chrome.action.setBadgeText({ text: '✕' });
    chrome.action.setBadgeBackgroundColor({ color: '#fca5a5' });
    
    // Show error notification
    chrome.notifications.create('matchmaking-error-' + Date.now(), {
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Matchmaking Error',
      message: error.message,
      priority: 2,
      requireInteraction: false
    });
    
    throw error;
  }
}

// Cancel ongoing matchmaking
async function cancelMatchmaking() {
  console.log('Background: Cancelling matchmaking...');
  
  // Clear all matchmaking-related storage
  await chrome.storage.local.remove([
    'matchmakingInProgress',
    'matchmakingStartTime',
    'pendingResults',
    'matchmakingError'
  ]);
  
  // Clear badge
  chrome.action.setBadgeText({ text: '' });
  
  console.log('Background: Matchmaking cancelled');
}

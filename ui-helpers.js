// UI helper functions

// Show message to user
function showMessage(text, type = 'info') {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message show ${type}`;
  
  setTimeout(() => {
    messageDiv.classList.remove('show');
  }, 5000);
}

// Update status text
function updateStatus(text, color = 'rgba(255, 255, 255, 0.8)') {
  const statusText = document.getElementById('statusText');
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

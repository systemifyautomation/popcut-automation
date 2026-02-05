// Data extraction functions for Fathom pages

// Extract title from page
async function extractTitle(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Look for the title in video-call-chip element
        const chipElement = document.querySelector('video-call-chip span[style*="font-size: 20px"]');
        if (chipElement) {
          return chipElement.textContent.trim();
        }
        
        // Fallback to other possible title locations
        const titleElement = document.querySelector('h1, [class*="title"], [data-testid*="title"]');
        return titleElement ? titleElement.textContent.trim() : 'Unknown Title';
      }
    });
    
    return results && results[0] && results[0].result ? results[0].result : 'Unable to extract title';
  } catch (error) {
    console.error('Error extracting title:', error);
    return 'Error extracting title';
  }
}

// Extract transcription from page
async function extractTranscription(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Strategy 1: Look for transcript/transcription container elements
        const transcriptSelectors = [
          '[data-testid*="transcript"]',
          '[class*="transcript"]',
          '[id*="transcript"]',
          'page-call-detail-transcript',
          'ui-transcript',
          '[class*="captions"]',
          '[class*="subtitles"]'
        ];
        
        for (const selector of transcriptSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.innerText || element.textContent;
            if (text && text.length > 100) {
              return text.trim();
            }
          }
        }
        
        // Strategy 2: Look for "Copy Transcript" button and find related content
        const buttons = Array.from(document.querySelectorAll('button'));
        const copyTranscriptBtn = buttons.find(btn => 
          btn.textContent.includes('Copy Transcript') ||
          btn.textContent.includes('Copy transcript')
        );
        
        if (copyTranscriptBtn) {
          let parent = copyTranscriptBtn.parentElement;
          while (parent && parent !== document.body) {
            const contentElements = parent.querySelectorAll('ui-content, preview-markdown, [class*="content"]');
            for (const el of contentElements) {
              const text = el.innerText || el.textContent;
              if (text && text.length > 500) {
                return text.trim();
              }
            }
            parent = parent.parentElement;
          }
        }
        
        // Strategy 3: Find large text blocks that look like transcripts
        const allTextElements = document.querySelectorAll('div, section, article');
        let largestTranscript = '';
        
        for (const element of allTextElements) {
          const text = element.innerText;
          // Transcripts are typically very long and have timestamp patterns
          if (text && text.length > 500 && text.length < 200000) {
            // Check for transcript-like patterns (timestamps, speaker labels, etc.)
            const hasTimestamps = /\d{1,2}:\d{2}/.test(text);
            const hasMultipleParagraphs = (text.match(/\n\n/g) || []).length > 3;
            
            if ((hasTimestamps || hasMultipleParagraphs) && text.length > largestTranscript.length) {
              largestTranscript = text;
            }
          }
        }
        
        return largestTranscript.trim() || 'No transcription found';
      }
    });
    
    const transcription = results && results[0] && results[0].result;
    if (transcription && transcription !== 'No transcription found') {
      return transcription;
    } else {
      return 'No transcription available';
    }
  } catch (error) {
    console.error('Error extracting transcription:', error);
    return 'Error extracting transcription';
  }
}

// Extract summary from page
async function extractSummary(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Strategy 1: Look for the "Copy Summary" button and find its related content
        const buttons = Array.from(document.querySelectorAll('button'));
        const copySummaryBtn = buttons.find(btn => 
          btn.textContent.includes('Copy Summary')
        );
        
        if (copySummaryBtn) {
          // Find the closest parent container that holds the summary
          let parent = copySummaryBtn.parentElement;
          while (parent && parent !== document.body) {
            // Look for sibling or child elements with substantial text content
            const contentElements = parent.querySelectorAll('ui-content, preview-markdown, [class*="markdown"], [class*="content"]');
            for (const el of contentElements) {
              const text = el.innerText || el.textContent;
              if (text && text.length > 200) {
                return text.trim();
              }
            }
            parent = parent.parentElement;
          }
        }
        
        // Strategy 2: Look for common Fathom summary containers
        const summarySelectors = [
          'page-call-detail-ai-notes ui-content',
          'page-call-detail-ai-notes preview-markdown',
          'ui-content',
          'preview-markdown',
          '[class*="ai-notes"]',
          '[class*="summary"]'
        ];
        
        for (const selector of summarySelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.innerText || element.textContent;
            // Look for summary indicators in the text
            if (text && text.length > 200 && 
                (text.includes('Meeting Purpose') || 
                 text.includes('Key Takeaways') || 
                 text.includes('Summary') ||
                 text.includes('Topics'))) {
              return text.trim();
            }
          }
        }
        
        // Strategy 3: Find the largest text block that looks like a summary
        const allTextElements = document.querySelectorAll('div, section, article');
        let largestSummary = '';
        
        for (const element of allTextElements) {
          const text = element.innerText;
          if (text && 
              text.length > 200 && 
              text.length < 50000 &&
              (text.includes('Meeting Purpose') || 
               text.includes('Key Takeaways') ||
               text.includes('Next Steps'))) {
            if (text.length > largestSummary.length) {
              largestSummary = text;
            }
          }
        }
        
        return largestSummary.trim() || 'No summary found';
      }
    });
    
    const summary = results && results[0] && results[0].result;
    if (summary && summary !== 'No summary found') {
      return summary;
    } else {
      // Summary is optional - continue without it
      return 'No summary available - proceeding with transcription only';
    }
  } catch (error) {
    // Don't throw - summary is optional, just return placeholder
    return 'No summary available - proceeding with transcription only';
  }
}

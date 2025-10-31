// Debug logging
function debugLog(message) {
  console.log(`[Dutch Highlighter Background] ${message}`);
}

// Set default categories and website scope when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  debugLog('Extension installed, setting default values');
  chrome.storage.local.set({ 
    selectedCategories: ['whether_core'],
    websiteScope: 'all-websites',
    selectedWebsites: [],
    siteSpecificSettings: {}
  });
});

// Listen for messages from content script to fetch the dictionary
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDictionary') {
    debugLog('Received request to load dictionary');
    
    const url = chrome.runtime.getURL('data/dutch_frequency_dictionary.json');
    debugLog(`Fetching dictionary from: ${url}`);
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch dictionary: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(dictionaryData => {
        debugLog(`Dictionary loaded successfully (${Object.keys(dictionaryData).length} words)`);
        sendResponse({ success: true, data: dictionaryData });
      })
      .catch(error => {
        debugLog(`Error loading dictionary: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async sendResponse
  }
});

// Listen for extension icon click to inject content script on non-Dutch sites
chrome.action.onClicked.addListener((tab) => {
  // Check if the URL is not a Dutch or Belgian site
  const url = new URL(tab.url);
  const isDutchSite = url.hostname.endsWith('.nl') || url.hostname.endsWith('.be');
  
  if (!isDutchSite && tab.url.startsWith('http')) {
    debugLog(`Manual activation on non-Dutch site: ${url.hostname}`);
    
    // Execute AI core + content script on current tab (match manifest order)
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['js/ai/ai-core.js', 'js/content.js']
    })
    .then(() => {
      debugLog('Content script injected successfully');
      
      // Add CSS for highlighting
      return chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['css/highlighter.css']
      });
    })
    .then(() => {
      debugLog('CSS injected successfully');
      
      // Send a message to the newly injected content script to initialize
      chrome.tabs.sendMessage(tab.id, { 
        action: 'manualActivation',
        selectedCategories: ['whether_core'] // Default to core - we'll fetch actual settings later
      });
    })
    .catch(error => {
      debugLog(`Error injecting content script: ${error.message}`);
    });
  }
}); 
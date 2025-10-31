// Global variables
let dictionary = {};
let selectedCategories = ['whether_core']; // Default to core category
let tooltipElement = null;
let currentHostname = window.location.hostname;
let isManuallyActivated = false; // Flag for manual activation
let currentAIRequests = new Map(); // Track active AI requests for cancellation
let tooltipTimeout = null; // Debounce tooltip showing
const categoryPriority = [
  'whether_core',
  'whether_general',
  'whether_spoken',
  'whether_newspapers',
  'whether_fiction',
  'whether_web'
];

// Debug logging
function debugLog(message) {
  console.log(`[Dutch Highlighter] ${message}`);
}

// Function to load dictionary data
function loadDictionary() {
  debugLog('Loading dictionary data');
  return new Promise((resolve, reject) => {
    let responded = false;
    const timeoutMs = 4000;

    const done = (ok, err) => {
      if (responded) return; // prevent double resolve
      responded = true;
      if (ok) resolve(); else reject(err);
    };

    // Primary path: ask background (service worker) to fetch
    try {
      chrome.runtime.sendMessage({ action: 'getDictionary' }, response => {
        if (responded) return;
        if (response && response.success) {
          debugLog('Dictionary data received successfully (via background)');
          dictionary = response.data;
          if (dictionary['een']) {
            debugLog(`Word "een" found in dictionary with properties:`);
            debugLog(`- whether_core: ${dictionary['een'].whether_core} (${typeof dictionary['een'].whether_core})`);
            debugLog(`- Entry: ${JSON.stringify(dictionary['een'])}`);
          } else {
            debugLog('WARNING: Word "een" NOT found in dictionary!');
          }
          done(true);
        } else {
          const errorMsg = response ? response.error : 'No / bad response from background';
          debugLog(`Background load failed: ${errorMsg}`);
          // Fallback to direct fetch
          fallbackFetch(done);
        }
      });
    } catch (e) {
      debugLog(`chrome.runtime.sendMessage threw: ${e.message}`);
      fallbackFetch(done);
    }

    // Timeout fallback
    setTimeout(() => {
      if (!responded) {
        debugLog(`Dictionary load timeout after ${timeoutMs}ms, attempting direct fetch fallback`);
        fallbackFetch(done);
      }
    }, timeoutMs);

    function fallbackFetch(doneFn) {
      if (responded) return;
      const url = chrome.runtime.getURL('data/dutch_frequency_dictionary.json');
      debugLog(`Fallback direct fetch: ${url}`);
      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
          return r.json();
        })
        .then(data => {
          dictionary = data;
          debugLog(`Fallback fetch succeeded (${Object.keys(dictionary).length} words)`);
          if (dictionary['een']) {
            debugLog(`"een" entry OK in fallback: ${JSON.stringify(dictionary['een'])}`);
          }
          doneFn(true);
        })
        .catch(err => {
          debugLog(`Fallback fetch failed: ${err.message}`);
          doneFn(false, err.message);
        });
    }
  });
}

// Function to determine which category to use for highlighting based on priority
function getHighlightCategory(dictEntry) {
  // Check each category in order of priority
  for (const category of categoryPriority) {
    // If this category is selected and the word is in this category
    if (selectedCategories.includes(category) && dictEntry[category]) {
      return category.replace('whether_', ''); // Return without the "whether_" prefix
    }
  }
  return null; // No matching category found
}

// Function to highlight words in a text node
function highlightWordsInNode(textNode) {
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
    return 0;
  }
  
  const text = textNode.nodeValue;
  if (!text || text.trim() === '') return 0;
  
  try {
    // Improved word boundary regex that better handles Dutch words
    // This fixes an issue where some words like "een" might not be properly matched
    const wordRegex = /\b([a-zA-ZÀ-ÿ]+)\b/g;
    let match;
    let lastIndex = 0;
    let fragments = [];
    let wordsHighlighted = 0;
    
    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0].toLowerCase();
      const dictEntry = dictionary[word];
      
      // Extra debug for "een" to help diagnose issues
      if (word === "een") {
        debugLog(`Found word "een" in text: "${text}"`);
        if (dictEntry) {
          debugLog(`"een" entry in dictionary: ${JSON.stringify(dictEntry)}`);
          debugLog(`whether_core value: ${dictEntry.whether_core} (${typeof dictEntry.whether_core})`);
        } else {
          debugLog(`"een" NOT found in dictionary!`);
        }
      }
      
      // Check if word exists in dictionary and matches any of the selected categories
      const highlightCategory = dictEntry ? getHighlightCategory(dictEntry) : null;
      
      if (highlightCategory) {
        try {
          // Add text before the match
          fragments.push(document.createTextNode(text.substring(lastIndex, match.index)));
          
          // Create highlighted span
          const highlightSpan = document.createElement('span');
          highlightSpan.className = `dutch-highlighted-word dutch-highlighted-${highlightCategory}`;
          highlightSpan.textContent = match[0];
          highlightSpan.dataset.word = word;
          highlightSpan.dataset.pos = dictEntry.pos || '';
          highlightSpan.dataset.definition = dictEntry.definition || '';
          highlightSpan.dataset.category = highlightCategory;
          
          // Add event listeners for tooltip
          highlightSpan.addEventListener('mouseover', showTooltip);
          highlightSpan.addEventListener('mouseout', hideTooltip);
          
          fragments.push(highlightSpan);
          wordsHighlighted++;
          
          lastIndex = match.index + match[0].length;
        } catch (spanError) {
          debugLog(`Error creating span for word "${word}": ${spanError.message}`);
          // Skip this word but continue processing
          lastIndex = match.index + match[0].length;
        }
      }
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      fragments.push(document.createTextNode(text.substring(lastIndex)));
    }
    
    // Replace the text node with fragments if we have highlights
    if (fragments.length > 1) {
      try {
        const parentNode = textNode.parentNode;
        if (parentNode) {
          fragments.forEach(fragment => {
            parentNode.insertBefore(fragment, textNode);
          });
          parentNode.removeChild(textNode);
        }
      } catch (domError) {
        debugLog(`DOM manipulation error: ${domError.message}`);
        return 0;
      }
    }
    
    return wordsHighlighted;
  } catch (error) {
    debugLog(`Error in highlightWordsInNode: ${error.message}`);
    return 0;
  }
}

// Function to traverse the DOM and process text nodes
function processTextNodes(node) {
  // Skip certain elements
  const tagsToSkip = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'BUTTON', 'SELECT', 'OPTION'];
  
  if (tagsToSkip.includes(node.nodeName)) {
    return 0;
  }
  
  // Process text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    return highlightWordsInNode(node) || 0;
  }
  
  // Skip nodes with user interaction
  // Check if it's an element node before accessing element-specific properties
  if (node.nodeType === Node.ELEMENT_NODE && 
      (node.onclick || node.onmouseover || node.onmouseout || 
       node.hasAttribute('contenteditable') || 
       node.classList.contains('dutch-highlighted-word'))) {
    return 0;
  }
  
  // Process child nodes
  let totalHighlighted = 0;
  for (let i = 0; i < node.childNodes.length; i++) {
    totalHighlighted += processTextNodes(node.childNodes[i]) || 0;
  }
  
  return totalHighlighted;
}

// Function to show tooltip
function extractSentence(element) {
  // Attempt to get a reasonable sentence containing the word
  let container = element.closest('p, div, article, section') || element.parentElement;
  if (!container) return '';
  const text = container.textContent || '';
  if (!text) return '';
  // Split by sentence terminators, keep terminators
  const parts = text.match(/[^.!?]+[.!?]?/g) || [text];
  const target = element.textContent.trim().toLowerCase();
  const found = parts.find(p => p.toLowerCase().includes(target));
  return (found || parts[0]).trim().slice(0, 400); // limit length
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function renderGrammar(j) {
  console.debug('[Grammar] Rendering grammar data:', j);
  
  if (!j) {
    return '<div style="color:#999;">No grammar data</div>';
  }
  
  if (j.error && j.error !== 'grammar_failed') {
    return '<div style="color:#999;">Grammar analysis unavailable</div>';
  }
  
  // Handle both error objects and valid grammar data (translation handled separately now)
  const mainClause = j.main_clause || 'Main clause analysis unavailable';
  const explanation = j.explanation_en || j.explanation_cn || 'No explanation available';
  
  // Remove duplicate EN line (already shown in separate Translation section)
  let result = `<div><b>Main:</b> ${escapeHtml(mainClause)}</div>`;
  
  if (j.sub_clauses?.length) {
    result += `<div><b>Subs:</b> ${j.sub_clauses.map(escapeHtml).join('; ')}</div>`;
  }
  
  if (j.verbs?.length) {
    result += `<div><b>Verbs:</b> ${j.verbs.map(v => escapeHtml(v.form || v)).join(', ')}</div>`;
  }
  
  if (j.difficulty_points?.length) {
    result += `<div><b>Points:</b> ${j.difficulty_points.map(escapeHtml).join(' | ')}</div>`;
  }
  
  result += `<div style="margin-top:3px;${j._parsing_error ? 'color:#e74c3c;' : ''}">${escapeHtml(explanation)}</div>`;
  
  // Show parsing error indicator if present
  if (j._parsing_error) {
    result += `<div style="font-size:10px;color:#999;margin-top:2px;">⚠️ AI response parsing issue</div>`;
  }
  
  return result;
}

function buildAITooltip(span, sentence) {
  const pos = span.dataset.pos || '';
  const def = span.dataset.definition || '';
  const cat = span.dataset.category || '';
  return `
    <div class="word-header"><strong>${escapeHtml(span.textContent)}</strong></div>
    <div class="static-info">${escapeHtml(def)} ${pos ? '[' + escapeHtml(pos) + ']' : ''}</div>
    <div class="static-category">Category: ${escapeHtml(cat)}</div>
    <div class="ai-section">
      <div><strong>Translation:</strong> <span class="ai-translation">...</span></div>
      <div><strong>Grammar:</strong> <div class="ai-grammar" style="font-size:11px;color:#444">...</div></div>
      <div><strong>Examples:</strong> <div class="ai-examples" style="font-size:11px;color:#444">...</div></div>
    </div>
  `;
}

async function showTooltip(event) {
  try {
    const span = event.target;
    const word = span.dataset.word;
    const sentence = extractSentence(span);

    // Cancel any pending tooltip
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }

    // Cancel previous AI requests for this word
    if (currentAIRequests.has(word)) {
      const requests = currentAIRequests.get(word);
      requests.forEach(controller => {
        try {
          controller.abort();
        } catch (e) {
          // Ignore abort errors
        }
      });
      currentAIRequests.delete(word);
    }

    // Debounce tooltip showing
    tooltipTimeout = setTimeout(async () => {
      try {
        if (!tooltipElement) {
          tooltipElement = document.createElement('div');
          tooltipElement.className = 'dutch-tooltip';
          document.body.appendChild(tooltipElement);
        }

        tooltipElement.innerHTML = buildAITooltip(span, sentence);

        const rect = span.getBoundingClientRect();
        tooltipElement.style.left = `${rect.left + window.scrollX}px`;
        tooltipElement.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tooltipElement.style.display = 'block';

        // AI service usage with timeout and cancellation
        const ai = window.localAIService;
        if (ai) {
          await ai.loadSettings();
          debugLog(`[AI] Settings loaded: enabled=${ai.enabled} examples=${ai.examplesEnabled} trans=${ai.translationEnabled} grammar=${ai.grammarEnabled}`);
          if (ai.enabled) {
            const controllers = [];
            currentAIRequests.set(word, controllers);

            // Examples with timeout
            if (ai.examplesEnabled) {
              const exEl = tooltipElement.querySelector('.ai-examples');
              if (exEl) exEl.textContent = 'Loading examples...';
              
              const controller = new AbortController();
              controllers.push(controller);
              
              // Add progress updates
              let progressTimer = setInterval(() => {
                if (exEl && !controller.signal.aborted) {
                  const dots = '.'.repeat((Date.now() / 500) % 4);
                  exEl.textContent = `Loading examples${dots}`;
                }
              }, 500);
              
              Promise.race([
                ai.generateExamples(word),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Examples timeout')), 20000) // Increased to 20 seconds
                )
              ]).then(examples => {
                clearInterval(progressTimer);
                if (exEl && !controller.signal.aborted) {
                  debugLog(`[AI] Examples result for "${word}":`, examples);
                  console.log(`[AI] Full examples data:`, JSON.stringify(examples, null, 2));
                  
                  if (Array.isArray(examples) && examples.length > 0) {
                    // Check if examples have the right structure
                    const validExamples = examples.filter(e => e && (e.nl || e[ai.langSrc]) && e.en);
                    debugLog(`[AI] Valid examples count: ${validExamples.length}/${examples.length}`);
                    
                    if (validExamples.length > 0) {
                      exEl.innerHTML = validExamples.map((e, index) => {
                        const dutchText = e.nl || e[ai.langSrc] || '';
                        const englishText = e.en || '';
                        return `
                          <div style="margin-bottom: 8px; padding: 4px 0; border-bottom: 1px solid #eee;">
                            <div><strong style="color: #2c5aa0;">${index + 1}. ${escapeHtml(dutchText)}</strong></div>
                            <div style="font-style: italic; color: #666; margin-top: 1px;">${escapeHtml(englishText)}</div>
                          </div>
                        `;
                      }).join('');
                    } else {
                      exEl.textContent = 'Invalid example format';
                      debugLog(`[AI] Invalid examples structure:`, examples);
                    }
                  } else if (examples && examples.error && examples.error === 'parse_failed') {
                    // Show the parsing error but try to extract something useful
                    exEl.textContent = 'AI response format issue (using fallback)';
                    debugLog(`[AI] Parse failed, raw response:`, examples.raw);
                  } else if (examples && examples.error) {
                    exEl.textContent = `Examples error: ${examples.error}`;
                    debugLog(`[AI] Examples API error:`, examples);
                  } else {
                    exEl.textContent = 'No examples available';
                    debugLog(`[AI] No valid examples returned for "${word}". Type: ${typeof examples}, Value:`, examples);
                  }
                }
              }).catch(err => {
                clearInterval(progressTimer);
                if (exEl && !controller.signal.aborted) {
                  if (err.message.includes('timeout')) {
                    exEl.textContent = 'Examples timeout (AI model may be downloading)';
                  } else {
                    exEl.textContent = 'Examples error';
                  }
                  debugLog(`[AI] Examples error: ${err.message}`);
                }
              });
            }

            // Translation streaming with timeout
            if (sentence && ai.translationEnabled) {
              const transEl = tooltipElement.querySelector('.ai-translation');
              if (transEl) transEl.textContent = 'Translating...';
              
              const controller = new AbortController();
              controllers.push(controller);
              
              Promise.race([
                new Promise((resolve) => {
                  ai.streamTranslate(sentence, full => {
                    if (!controller.signal.aborted && transEl) {
                      transEl.textContent = full;
                      resolve(full);
                    }
                  });
                }),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Translation timeout')), 15000) // Increased to 15 seconds
                )
              ]).catch(err => {
                if (transEl && !controller.signal.aborted) {
                  transEl.textContent = err.message.includes('timeout') ? 'Translation timeout' : 'Translation error';
                }
              });
            }

            // Grammar with timeout
            if (sentence && ai.grammarEnabled) {
              const gramEl = tooltipElement.querySelector('.ai-grammar');
              if (gramEl) gramEl.textContent = 'Analyzing grammar...';
              
              const controller = new AbortController();
              controllers.push(controller);
              
              // Add progress updates
              let progressTimer = setInterval(() => {
                if (gramEl && !controller.signal.aborted) {
                  const dots = '.'.repeat((Date.now() / 500) % 4);
                  gramEl.textContent = `Analyzing grammar${dots}`;
                }
              }, 500);
              
              Promise.race([
                ai.analyzeGrammar(sentence),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Grammar timeout')), 25000) // Increased to 25 seconds
                )
              ]).then(json => {
                clearInterval(progressTimer);
                if (gramEl && !controller.signal.aborted) {
                  debugLog(`[AI] Grammar result for "${sentence}":`, json);
                  console.log(`[AI] Full grammar data:`, JSON.stringify(json, null, 2));
                  
                  // Debug the specific fields
                  console.log(`[AI] Grammar fields check:`, {
                    'main_clause': json?.main_clause,
                    'sub_clauses': json?.sub_clauses,
                    'verbs': json?.verbs,
                    'difficulty_points': json?.difficulty_points,
                    'explanation_en': json?.explanation_en,
                    'hasError': !!json?.error
                  });
                  
                  gramEl.innerHTML = renderGrammar(json);
                }
              }).catch(err => {
                clearInterval(progressTimer);
                if (gramEl && !controller.signal.aborted) {
                  if (err.message.includes('timeout')) {
                    gramEl.textContent = 'Grammar timeout (AI model may be downloading)';
                  } else {
                    gramEl.textContent = 'Grammar error';
                  }
                  debugLog(`[AI] Grammar error: ${err.message}`);
                }
              });
            }
          } else {
            debugLog('[AI] Disabled via settings');
          }
        } else {
          debugLog('[AI] localAIService not found');
        }
      } catch (error) {
        debugLog(`Error showing tooltip: ${error.message}`);
      }
    }, 200); // 200ms debounce delay

  } catch (error) {
    debugLog(`Error in showTooltip: ${error.message}`);
  }
}

// Function to hide tooltip
function hideTooltip() {
  // Cancel pending tooltip
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  
  // Cancel any active AI requests
  currentAIRequests.forEach((controllers, word) => {
    controllers.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        // Ignore abort errors
      }
    });
  });
  currentAIRequests.clear();
  
  if (tooltipElement) {
    tooltipElement.style.display = 'none';
  }
}

// Function to remove all highlights
function removeHighlights() {
  debugLog('Removing all highlights');
  const highlights = document.querySelectorAll('.dutch-highlighted-word');
  
  highlights.forEach(highlight => {
    // Get the original text
    const originalText = highlight.textContent;
    
    // Create a text node with the original text
    const textNode = document.createTextNode(originalText);
    
    // Replace the highlight with the text node
    highlight.parentNode.replaceChild(textNode, highlight);
  });
  
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }
}

// Function to highlight Dutch words on the page
function highlightWords() {
  debugLog('Starting to highlight words');
  
  // Make sure we have dictionary data
  if (!dictionary || Object.keys(dictionary).length === 0) {
    debugLog('Dictionary not loaded yet, aborting highlight');
    return;
  }
  
  // Process the document body
  const body = document.body;
  if (body) {
    const totalHighlighted = processTextNodes(body);
    debugLog(`Highlighted ${totalHighlighted} words in total`);
  } else {
    debugLog('Document body not found, cannot highlight');
  }
}

// Function to check if current site is in the selected websites list
// Function to determine if highlighting should be active
function shouldHighlight() {
  // Dutch sites (.nl and .be domains) or manually activated pages should always highlight
  const isDutchSite = currentHostname.endsWith('.nl') || currentHostname.endsWith('.be');
  return Promise.resolve(isDutchSite || isManuallyActivated);
}

// Function to load categories for current site
async function loadCategoriesForCurrentSite() {
  return new Promise(resolve => {
    chrome.storage.local.get(['selectedCategories', 'highlightingEnabled'], result => {
      debugLog('Loaded settings from storage');
      
      // Check if highlighting is enabled globally
      const isHighlightingEnabled = result.highlightingEnabled !== false; // Default to true
      
      if (!isHighlightingEnabled) {
        debugLog('Highlighting is disabled globally');
        resolve([]);
        return;
      }
      
      // Use saved categories or default to core
      let categoriesToUse = result.selectedCategories || ['whether_core'];
      
      debugLog(`Using categories: ${categoriesToUse.join(', ')}`);
      resolve(categoriesToUse);
    });
  });
}

// Initialize the extension
async function initialize() {
  debugLog('Initializing extension');
  
  try {
    // First check if highlighting is enabled globally
    const result = await new Promise(resolve => {
      chrome.storage.local.get(['highlightingEnabled'], resolve);
    });
    
    const isHighlightingEnabled = result.highlightingEnabled !== false; // Default to true
    
    if (!isHighlightingEnabled) {
      debugLog('Highlighting is disabled globally - skipping initialization');
      return;
    }
    
    // Load the dictionary first
    await loadDictionary();
    
    // Check if highlighting should be active for this site
    const shouldActivate = await shouldHighlight();
    
    if (shouldActivate) {
      // Load appropriate categories
      await loadCategoriesForCurrentSite();
      
      // Apply highlighting if we have categories
      if (selectedCategories && selectedCategories.length > 0) {
        highlightWords();
        
        // Preload AI for common words in background
        setTimeout(() => {
          preloadCommonExamples();
        }, 3000);
      }
    } else {
      debugLog('Highlighting not active for this site');
    }
  } catch (error) {
    debugLog(`Initialization error: ${error.message}`);
  }
}

// Preload examples for common Dutch words
async function preloadCommonExamples() {
  const commonWords = ['de', 'het', 'een', 'van', 'in', 'op', 'is', 'dat', 'te', 'voor'];
  const ai = window.localAIService;
  
  if (!ai || !ai.enabled || !ai.examplesEnabled) return;
  
  debugLog('Preloading examples for common words...');
  
  for (const word of commonWords) {
    try {
      // Only preload if not already cached
      if (!ai.exampleCache.has('E:' + word)) {
        setTimeout(async () => {
          try {
            await ai.generateExamples(word);
            debugLog(`Preloaded examples for: ${word}`);
          } catch (e) {
            // Silently fail for preloading
          }
        }, Math.random() * 5000); // Random delay to spread load
      }
    } catch (e) {
      // Continue with other words
    }
  }
}

// Listen for messages from the popup to update highlights
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateHighlights') {
    debugLog('Received update highlights message');
    
    // Remove existing highlights
    removeHighlights();
    
    // Update categories
    if (request.categories) {
      selectedCategories = request.categories;
      debugLog(`Updated categories: ${selectedCategories.join(', ')}`);
    }
    
    // Re-highlight with the new settings
    highlightWords();
    
    // Send response
    sendResponse({ success: true });
  } 
  else if (request.action === 'removeHighlights') {
    debugLog('Received remove highlights message');
    
    // Remove highlights
    removeHighlights();
    
    // Clear categories
    selectedCategories = [];
    
    // Send response
    sendResponse({ success: true });
  }
  else if (request.action === 'enableHighlighting') {
    debugLog('Received enable highlighting message');
    
    // Re-initialize the extension
    initialize();
    
    sendResponse({ success: true });
  }
  else if (request.action === 'disableHighlighting') {
    debugLog('Received disable highlighting message');
    
    // Remove all highlights
    removeHighlights();
    
    // Clear categories to prevent re-highlighting
    selectedCategories = [];
    
    sendResponse({ success: true });
  }
  else if (request.action === 'manualActivation') {
    debugLog('Received manual activation message');
    
    // Set manual activation flag
    isManuallyActivated = true;
    
    // Update categories if provided
    if (request.selectedCategories) {
      selectedCategories = request.selectedCategories;
    }
    
    // Load full settings
    loadCategoriesForCurrentSite().then(() => {
      // Apply highlighting
      highlightWords();
      
      // Send response
      sendResponse({ success: true });
    });
    
    return true; // Required for async sendResponse
  }
});

// Initialize when the content script loads
initialize();

// Optional: Re-highlight when the page content changes
// This uses MutationObserver to watch for DOM changes
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Check if highlighting should be active
      shouldHighlight().then(shouldActivate => {
        if (shouldActivate && selectedCategories.length > 0) {
          // Process only the added nodes
          mutation.addedNodes.forEach(node => {
            processTextNodes(node);
          });
        }
      });
    }
  });
});

// Start observing the document body for changes
if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}

// Test function to manually trigger highlighting (can be called from console)
window.testDutchHighlighter = function(categories = ['whether_core']) {
  debugLog(`Manually testing highlighting with categories: ${categories.join(', ')}`);
  if (!dictionary || Object.keys(dictionary).length === 0) {
    debugLog('Dictionary not loaded yet, trying to load it first...');
    loadDictionary().then(() => {
      debugLog(`Dictionary loaded with ${Object.keys(dictionary).length} words`);
      selectedCategories = categories;
      highlightWords();
    }).catch(error => {
      debugLog(`Failed to load dictionary: ${error}`);
    });
  } else {
    debugLog(`Using existing dictionary with ${Object.keys(dictionary).length} words`);
    selectedCategories = categories;
    highlightWords();
  }
}; 

// Test function to manually test AI examples (can be called from console)
window.testAIExamples = async function(word = 'huis') {
  console.log(`🧪 Testing AI Examples for word: "${word}"`);
  
  const ai = window.localAIService;
  if (!ai) {
    console.error('❌ localAIService not found');
    return;
  }
  
  try {
    await ai.loadSettings();
    console.log(`⚙️ AI Settings: enabled=${ai.enabled}, examples=${ai.examplesEnabled}`);
    
    if (!ai.enabled || !ai.examplesEnabled) {
      console.warn('⚠️ AI or examples are disabled');
      return;
    }
    
    console.log('🔄 Generating examples...');
    const startTime = Date.now();
    
    const examples = await ai.generateExamples(word);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Examples generated in ${duration}ms:`, examples);
    console.log('📋 Formatted examples:');
    
    if (Array.isArray(examples)) {
      examples.forEach((ex, i) => {
        console.log(`  ${i+1}. NL: ${ex.nl || ex.dutch || '(missing)'}`);
        console.log(`     EN: ${ex.en || ex.english || '(missing)'}`);
      });
    } else {
      console.log('❌ Examples is not an array:', typeof examples, examples);
    }
    
    return examples;
  } catch (error) {
    console.error('❌ Error testing examples:', error);
  }
};

// Diagnostic function to check AI status
window.checkAIStatus = async function() {
  console.log('🔍 Checking AI Status...');
  
  const ai = window.localAIService;
  if (!ai) {
    console.error('❌ localAIService not found');
    return;
  }
  
  try {
    // Check LanguageModel
    const LM = ai.LM();
    if (LM) {
      const status = await LM.availability();
      console.log(`📊 LanguageModel status: ${status}`);
      
      if (status === 'readily') {
        console.log('✅ LanguageModel is ready');
      } else if (status === 'after-download') {
        console.log('⏳ LanguageModel will be available after download');
        console.log('💡 You can run: preloadAIModel() to start download');
      } else {
        console.log('❌ LanguageModel is not available');
      }
    } else {
      console.log('❌ LanguageModel API not found');
    }
    
    // Check Translator
    const TR = ai.TR();
    if (TR) {
      const transStatus = await TR.availability({ sourceLanguage: 'nl', targetLanguage: 'en' });
      console.log(`🌍 Translator (nl->en) status: ${transStatus}`);
    } else {
      console.log('❌ Translator API not found');
    }
    
    // Check settings
    await ai.loadSettings();
    console.log('⚙️ Current AI settings:', {
      enabled: ai.enabled,
      examples: ai.examplesEnabled,
      translation: ai.translationEnabled,
      grammar: ai.grammarEnabled,
      langSrc: ai.langSrc,
      langTgt: ai.langTgt
    });
    
    // Check cache status
    console.log('💾 Cache status:', {
      examples: ai.exampleCache.size,
      grammar: ai.grammarCache.size,
      translation: ai.translationCache.size,
      sessionInitialized: ai.isInitialized
    });
    
  } catch (error) {
    console.error('❌ Error checking AI status:', error);
  }
};

// Function to manually preload AI model
window.preloadAIModel = async function() {
  console.log('🚀 Starting AI model preload...');
  
  const ai = window.localAIService;
  if (!ai) {
    console.error('❌ localAIService not found');
    return;
  }
  
  try {
    console.log('⏳ Initializing session (this may trigger model download)...');
    await ai.initializeSession();
    console.log('✅ AI model preloaded successfully!');
    
    // Test with a simple example
    console.log('🧪 Testing with example word...');
    const examples = await ai.generateExamples('test');
    console.log('✅ AI is working:', examples);
    
  } catch (error) {
    console.error('❌ Preload failed:', error);
    console.log('💡 Make sure your Chrome browser supports AI APIs');
  }
};

// Debug function to test grammar analysis
window.debugGrammar = async function(sentence = 'De politiek in Nederland is momenteel erg verdeeld.') {
  console.group(`🔍 Debug Grammar Analysis: "${sentence}"`);
  
  const ai = window.localAIService;
  if (!ai) {
    console.error('❌ localAIService not found');
    console.groupEnd();
    return;
  }
  
  try {
    await ai.loadSettings();
    console.log(`⚙️ Settings: enabled=${ai.enabled}, grammar=${ai.grammarEnabled}`);
    
    if (!ai.enabled || !ai.grammarEnabled) {
      console.warn('⚠️ AI or grammar analysis is disabled');
      console.groupEnd();
      return;
    }
    
    console.log('🔄 Starting grammar analysis...');
    const startTime = Date.now();
    
    const result = await ai.analyzeGrammar(sentence);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Analysis completed in ${duration}ms`);
    console.log('📊 Raw result object:', result);
    console.log('📋 Result type:', typeof result);
    console.log('📋 Has error:', !!result?.error);
    
    if (result) {
      console.log('🔍 Field analysis:');
      console.log(`  - sentence: "${result.sentence}"`);
      console.log(`  - translation_en: "${result.translation_en}"`);
      console.log(`  - main_clause: "${result.main_clause}"`);
      console.log(`  - sub_clauses: ${JSON.stringify(result.sub_clauses)}`);
      console.log(`  - verbs: ${JSON.stringify(result.verbs)}`);
      console.log(`  - difficulty_points: ${JSON.stringify(result.difficulty_points)}`);
      console.log(`  - explanation_en: "${result.explanation_en}"`);
      console.log(`  - _parsing_error: ${result._parsing_error}`);
      
      console.log('🎨 Rendered HTML:');
      const html = renderGrammar(result);
      console.log(html);
      
      // Create a test element to show the result
      const testDiv = document.createElement('div');
      testDiv.innerHTML = html;
      testDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:white;border:1px solid #ccc;padding:10px;z-index:10000;max-width:300px;font-size:12px;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
      document.body.appendChild(testDiv);
      
      setTimeout(() => testDiv.remove(), 15000); // Remove after 15 seconds
    }
    
    console.groupEnd();
    return result;
  } catch (error) {
    console.error('❌ Debug error:', error);
    console.groupEnd();
  }
};

console.log('🐛 Grammar debug function loaded. Run: debugGrammar("your dutch sentence")'); 
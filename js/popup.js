document.addEventListener('DOMContentLoaded', () => {
  // Get UI elements
  const mainToggle = document.getElementById('main-toggle');
  const mainContent = document.getElementById('main-content');
  const aiEnableToggle = document.getElementById('aiEnable');
  const aiFeatures = document.getElementById('ai-features');
  const aiControls = document.getElementById('ai-controls');
  
  // Load the main toggle state and categories
  chrome.storage.local.get(['highlightingEnabled', 'selectedCategories'], (result) => {
    const isEnabled = result.highlightingEnabled !== false; // Default to true
    mainToggle.checked = isEnabled;
    updateMainContentVisibility(isEnabled);
    
    // Handle categories
    if (result.selectedCategories && Array.isArray(result.selectedCategories)) {
      // Set checkboxes based on saved selections
      result.selectedCategories.forEach(category => {
        const checkbox = document.querySelector(`input[value="${category}"]`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    } else {
      // Default to core category if nothing is saved
      document.querySelector('input[value="whether_core"]').checked = true;
    }
  });
  
  // Handle main toggle change
  mainToggle.addEventListener('change', function() {
    const isEnabled = this.checked;
    
    // Save state immediately
    chrome.storage.local.set({ highlightingEnabled: isEnabled }, () => {
      // Update UI visibility
      updateMainContentVisibility(isEnabled);
      
      // Send message to content script to enable/disable highlighting
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: isEnabled ? 'enableHighlighting' : 'disableHighlighting'
          }).catch(() => {
            // Ignore if content script not loaded
          });
        }
      });
    });
  });
  
  // Update main content visibility
  function updateMainContentVisibility(enabled) {
    if (enabled) {
      mainContent.classList.remove('disabled');
    } else {
      mainContent.classList.add('disabled');
    }
  }
  
  // Handle AI enable toggle
  aiEnableToggle.addEventListener('change', function() {
    const isEnabled = this.checked;
    updateAIFeaturesVisibility(isEnabled);
    saveAISettings(); // Auto-save
  });
  
  // Update AI features visibility
  function updateAIFeaturesVisibility(enabled) {
    if (enabled) {
      aiFeatures.classList.remove('disabled');
      aiControls.classList.remove('disabled');
    } else {
      aiFeatures.classList.add('disabled');
      aiControls.classList.add('disabled');
    }
  }

  // Unified Apply & Save button logic
  function applyAll() {
    // Collect selected categories (allow empty if highlighting off)
    const checkboxes = document.querySelectorAll('input[name="category"]:checked');
    const selectedCategories = Array.from(checkboxes).map(cb => cb.value);
    if (mainToggle.checked && selectedCategories.length === 0) {
      alert('Select at least one category');
      return;
    }
    // Save highlighting preferences
    chrome.storage.local.set({
      selectedCategories,
      highlightingEnabled: mainToggle.checked
    }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          if (mainToggle.checked) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'updateHighlights', categories: selectedCategories }).catch(()=>{});
          } else {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'disableHighlighting' }).catch(()=>{});
          }
        }
      });
    });
    // Persist AI settings
    saveAISettings(true); // silent variant shows unified message
  }

  // ===== Local AI Settings Handling =====
  const aiEnableEl = document.getElementById('aiEnable');
  const aiExamplesEl = document.getElementById('aiExamples');
  const aiTransEl = document.getElementById('aiTrans');
  const aiGrammarEl = document.getElementById('aiGrammar');
  const aiSrcEl = document.getElementById('aiSrc');
  const aiTgtEl = document.getElementById('aiTgt');
  const aiMsgEl = document.getElementById('aiMsg');
  const applyAllBtn = document.getElementById('applyAll');

  // Load AI settings
  chrome.storage.sync.get([
    'localAIEnabled','localAIExamples','localAITranslation','localAIGrammar','localAISource','localAITarget'
  ], st => {
    if (st.localAIEnabled === false) {
      aiEnableEl.checked = false;
      updateAIFeaturesVisibility(false);
    } else {
      updateAIFeaturesVisibility(true);
    }
    if (st.localAIExamples === false) aiExamplesEl.checked = false;
    if (st.localAITranslation === false) aiTransEl.checked = false;
    if (st.localAIGrammar === false) aiGrammarEl.checked = false;
    if (st.localAISource) aiSrcEl.value = st.localAISource;
    if (st.localAITarget) aiTgtEl.value = st.localAITarget;
  });

  function saveAISettings(unified) {
    chrome.storage.sync.set({
      localAIEnabled: aiEnableEl.checked,
      localAIExamples: aiExamplesEl.checked,
      localAITranslation: aiTransEl.checked,
      localAIGrammar: aiGrammarEl.checked,
      localAISource: aiSrcEl.value.trim(),
      localAITarget: aiTgtEl.value.trim()
    }, () => {
      aiMsgEl.textContent = unified ? 'Settings applied ✓' : 'AI settings saved ✓';
      setTimeout(() => { aiMsgEl.textContent = ''; }, 1800);
    });
  }

  if (applyAllBtn) {
    applyAllBtn.addEventListener('click', applyAll);
  }
  // Auto-save on toggle changes
  [aiExamplesEl, aiTransEl, aiGrammarEl].forEach(el => {
    if (el) el.addEventListener('change', saveAISettings);
  });
});
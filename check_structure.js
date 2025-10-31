// This is a simple utility script that can be run in the browser console
// to check if all the necessary files for the extension are in place.

function checkExtensionStructure() {
  const requiredFiles = [
    'manifest.json',
    'popup.html',
    'css/highlighter.css',
    'js/content.js',
    'js/popup.js',
    'js/background.js',
    'data/dutch_frequency_dictionary.json'
  ];
  
  const results = {
    total: requiredFiles.length,
    found: 0,
    missing: []
  };
  
  requiredFiles.forEach(file => {
    fetch(chrome.runtime.getURL(file))
      .then(response => {
        if (response.ok) {
          console.log(`✅ Found: ${file}`);
          results.found++;
        } else {
          console.error(`❌ Missing: ${file}`);
          results.missing.push(file);
        }
        
        if (results.found + results.missing.length === results.total) {
          console.log(`\nSummary: Found ${results.found}/${results.total} required files`);
          if (results.missing.length > 0) {
            console.error(`Missing files: ${results.missing.join(', ')}`);
          } else {
            console.log('All required files are present!');
          }
        }
      })
      .catch(error => {
        console.error(`❌ Error checking ${file}: ${error.message}`);
        results.missing.push(file);
        
        if (results.found + results.missing.length === results.total) {
          console.log(`\nSummary: Found ${results.found}/${results.total} required files`);
          if (results.missing.length > 0) {
            console.error(`Missing files: ${results.missing.join(', ')}`);
          } else {
            console.log('All required files are present!');
          }
        }
      });
  });
}

// The function can be called from the background script console:
// checkExtensionStructure(); 
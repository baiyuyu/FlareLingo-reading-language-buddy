// Test script to verify the selected websites functionality

// Mock chrome API
const mockChrome = {
  storage: {
    local: {
      data: {},
      get: function(keys, callback) {
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (this.data[key] !== undefined) {
              result[key] = this.data[key];
            }
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            result[key] = this.data[key] !== undefined ? this.data[key] : keys[key];
          });
        } else if (typeof keys === 'string') {
          if (this.data[keys] !== undefined) {
            result[keys] = this.data[keys];
          }
        } else if (keys === null) {
          Object.keys(this.data).forEach(key => {
            result[key] = this.data[key];
          });
        }
        callback(result);
      },
      set: function(items, callback) {
        Object.keys(items).forEach(key => {
          this.data[key] = items[key];
        });
        if (callback) callback();
      },
      clear: function() {
        this.data = {};
      }
    }
  }
};

// Test function to check if a site is considered selected
function isCurrentSiteSelected(selectedWebsites, currentHostname) {
  if (!selectedWebsites || !Array.isArray(selectedWebsites)) {
    return false;
  }
  
  // Check for exact match
  if (selectedWebsites.includes(currentHostname)) {
    return true;
  }
  
  // Check for domain match (e.g., example.com would match sub.example.com)
  for (const site of selectedWebsites) {
    if (currentHostname.endsWith(site) && 
        (currentHostname === site || currentHostname.endsWith('.' + site))) {
      return true;
    }
  }
  
  return false;
}

// Test cases
const testCases = [
  {
    name: 'Default settings (All websites)',
    setup: () => {
      mockChrome.storage.local.clear();
      mockChrome.storage.local.set({
        selectedCategories: ['whether_core'],
        websiteScope: 'all-websites',
        selectedWebsites: [],
        siteSpecificSettings: {}
      });
    },
    currentHostname: 'example.com',
    expectedCategories: ['whether_core'],
    expectedHighlighting: true
  },
  {
    name: 'Selected websites - current site included',
    setup: () => {
      mockChrome.storage.local.clear();
      mockChrome.storage.local.set({
        selectedCategories: ['whether_core'],
        websiteScope: 'selected-websites',
        selectedWebsites: ['example.com', 'dutch-site.nl'],
        siteSpecificSettings: {
          'example.com': ['whether_fiction', 'whether_newspapers']
        }
      });
    },
    currentHostname: 'example.com',
    expectedCategories: ['whether_fiction', 'whether_newspapers'],
    expectedHighlighting: true
  },
  {
    name: 'Selected websites - current site not included',
    setup: () => {
      mockChrome.storage.local.clear();
      mockChrome.storage.local.set({
        selectedCategories: ['whether_core'],
        websiteScope: 'selected-websites',
        selectedWebsites: ['dutch-site.nl', 'another-site.com'],
        siteSpecificSettings: {}
      });
    },
    currentHostname: 'example.com',
    expectedCategories: [],
    expectedHighlighting: false
  },
  {
    name: 'Selected websites - subdomain match',
    setup: () => {
      mockChrome.storage.local.clear();
      mockChrome.storage.local.set({
        selectedCategories: ['whether_core'],
        websiteScope: 'selected-websites',
        selectedWebsites: ['example.com'],
        siteSpecificSettings: {
          'example.com': ['whether_core', 'whether_general']
        }
      });
    },
    currentHostname: 'blog.example.com',
    expectedCategories: ['whether_core', 'whether_general'],
    expectedHighlighting: true
  },
  {
    name: 'Selected websites - similar domain but not matching',
    setup: () => {
      mockChrome.storage.local.clear();
      mockChrome.storage.local.set({
        selectedCategories: ['whether_core'],
        websiteScope: 'selected-websites',
        selectedWebsites: ['example.com'],
        siteSpecificSettings: {}
      });
    },
    currentHostname: 'myexample.com',
    expectedCategories: [],
    expectedHighlighting: false
  }
];

// Function to simulate loading categories for a specific site
async function loadCategoriesForSite(currentHostname) {
  return new Promise((resolve) => {
    mockChrome.storage.local.get(['selectedCategories', 'websiteScope', 'selectedWebsites', 'siteSpecificSettings'], (result) => {
      // Default to core category if nothing is saved
      let categories = ['whether_core'];
      
      // If there are saved categories, use them as default
      if (result.selectedCategories && Array.isArray(result.selectedCategories)) {
        categories = result.selectedCategories;
      }
      
      // Check if we should apply highlighting based on the scope setting
      if (result.websiteScope === 'all-websites') {
        // Use global categories for all websites
        console.log(`Using global categories: ${categories.join(', ')}`);
      } else if (result.websiteScope === 'selected-websites') {
        // Check if current site is in the list of selected websites or matches a domain
        let matchedSite = null;
        if (isCurrentSiteSelected(result.selectedWebsites, currentHostname)) {
          // Find the specific site that matched (for subdomain support)
          for (const site of result.selectedWebsites) {
            if (currentHostname === site || 
                (currentHostname.endsWith('.' + site) && currentHostname.endsWith(site))) {
              matchedSite = site;
              break;
            }
          }
          
          // Use site-specific settings if available for the matched site
          if (result.siteSpecificSettings && matchedSite && result.siteSpecificSettings[matchedSite]) {
            categories = result.siteSpecificSettings[matchedSite];
            console.log(`Using site-specific categories for ${matchedSite}: ${categories.join(', ')}`);
          } else {
            console.log(`Using global categories for selected site ${currentHostname}: ${categories.join(', ')}`);
          }
        } else {
          // Current site is not selected, don't highlight anything
          console.log(`Current site ${currentHostname} is not in selected websites, disabling highlights`);
          categories = [];
        }
      }
      
      resolve(categories);
    });
  });
}

// Run tests
async function runTests() {
  console.log('===== Testing selected websites functionality =====\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  for (const test of testCases) {
    console.log(`Running test: ${test.name}`);
    
    // Setup test conditions
    test.setup();
    
    // Get categories for the current hostname
    const categories = await loadCategoriesForSite(test.currentHostname);
    
    // Verify categories
    const expectedCategoriesStr = JSON.stringify(test.expectedCategories.sort());
    const actualCategoriesStr = JSON.stringify(categories.sort());
    
    let categoriesPass = expectedCategoriesStr === actualCategoriesStr;
    
    // Verify highlighting status (categories length > 0 means highlighting is enabled)
    const actualHighlighting = categories.length > 0;
    const highlightingPass = actualHighlighting === test.expectedHighlighting;
    
    if (categoriesPass && highlightingPass) {
      console.log(`✅ PASS: Categories and highlighting status as expected`);
      testsPassed++;
    } else {
      if (!categoriesPass) {
        console.log(`❌ FAIL: Expected categories: ${expectedCategoriesStr}, got: ${actualCategoriesStr}`);
      }
      if (!highlightingPass) {
        console.log(`❌ FAIL: Expected highlighting: ${test.expectedHighlighting}, got: ${actualHighlighting}`);
      }
      testsFailed++;
    }
    
    console.log(''); // Add empty line for readability
  }
  
  // Additional tests for the isCurrentSiteSelected function
  console.log('===== Testing isCurrentSiteSelected function =====\n');
  
  const domainTests = [
    {
      name: 'Exact domain match',
      selectedSites: ['example.com'],
      currentSite: 'example.com',
      expected: true
    },
    {
      name: 'Subdomain match',
      selectedSites: ['example.com'],
      currentSite: 'blog.example.com',
      expected: true
    },
    {
      name: 'Similar but not matching domain',
      selectedSites: ['example.com'],
      currentSite: 'myexample.com',
      expected: false
    },
    {
      name: 'Empty selected sites list',
      selectedSites: [],
      currentSite: 'example.com',
      expected: false
    },
    {
      name: 'Multiple selected sites',
      selectedSites: ['example.com', 'test.nl', 'dutch-site.be'],
      currentSite: 'test.nl',
      expected: true
    }
  ];
  
  for (const test of domainTests) {
    console.log(`Running domain test: ${test.name}`);
    
    const result = isCurrentSiteSelected(test.selectedSites, test.currentSite);
    
    if (result === test.expected) {
      console.log(`✅ PASS: ${test.currentSite} ${result ? 'is' : 'is not'} selected as expected`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL: ${test.currentSite} should ${test.expected ? 'be' : 'not be'} selected`);
      testsFailed++;
    }
    
    console.log(''); // Add empty line for readability
  }
  
  // Print test summary
  console.log('===== Test Summary =====');
  console.log(`Total tests: ${testCases.length + domainTests.length}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  
  return testsFailed === 0;
}

// Run all tests
runTests().then(success => {
  console.log(`\nTest execution ${success ? 'succeeded' : 'failed'}`);
}); 
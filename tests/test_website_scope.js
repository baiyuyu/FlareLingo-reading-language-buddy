// Test script to verify website scope functionality

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

// Test cases
const testCases = [
  {
    name: 'Default settings',
    setup: () => {
      mockChrome.storage.local.clear();
      mockChrome.storage.local.set({
        selectedCategories: ['whether_core'],
        websiteScope: 'all-websites',
        siteSpecificSettings: {}
      });
    },
    currentHostname: 'example.com',
    expectedCategories: ['whether_core']
  },
  {
    name: 'Global settings with multiple categories',
    setup: () => {
      mockChrome.storage.local.clear();
      mockChrome.storage.local.set({
        selectedCategories: ['whether_core', 'whether_general'],
        websiteScope: 'all-websites',
        siteSpecificSettings: {
          'example.com': ['whether_fiction']
        }
      });
    },
    currentHostname: 'example.com',
    expectedCategories: ['whether_core', 'whether_general']
  },
  {
    name: 'Site-specific settings for current site',
    setup: () => {
      mockChrome.storage.local.clear();
      mockChrome.storage.local.set({
        selectedCategories: ['whether_core'],
        websiteScope: 'current-website',
        siteSpecificSettings: {
          'example.com': ['whether_fiction', 'whether_newspapers']
        }
      });
    },
    currentHostname: 'example.com',
    expectedCategories: ['whether_fiction', 'whether_newspapers']
  },
  {
    name: 'Site-specific settings for different site',
    setup: () => {
      mockChrome.storage.local.clear();
      mockChrome.storage.local.set({
        selectedCategories: ['whether_core'],
        websiteScope: 'current-website',
        siteSpecificSettings: {
          'example.com': ['whether_fiction']
        }
      });
    },
    currentHostname: 'othersite.com',
    expectedCategories: ['whether_core']
  },
  {
    name: 'Site-specific settings without config for current site',
    setup: () => {
      mockChrome.storage.local.clear();
      mockChrome.storage.local.set({
        selectedCategories: ['whether_core', 'whether_general'],
        websiteScope: 'current-website',
        siteSpecificSettings: {
          'another.com': ['whether_fiction']
        }
      });
    },
    currentHostname: 'example.com',
    expectedCategories: ['whether_core', 'whether_general']
  }
];

// Function to simulate loading categories for a specific site
async function loadCategoriesForSite(hostname) {
  return new Promise((resolve) => {
    mockChrome.storage.local.get(['selectedCategories', 'websiteScope', 'siteSpecificSettings'], (result) => {
      // Default to core category if nothing is saved
      let categories = ['whether_core'];
      
      // If there are saved categories, use them as default
      if (result.selectedCategories && Array.isArray(result.selectedCategories)) {
        categories = result.selectedCategories;
      }
      
      // Check if we're using site-specific settings
      if (result.websiteScope === 'current-website' && 
          result.siteSpecificSettings && 
          result.siteSpecificSettings[hostname]) {
        // Use the site-specific categories
        categories = result.siteSpecificSettings[hostname];
      }
      
      resolve(categories);
    });
  });
}

// Run tests
async function runTests() {
  console.log('===== Testing website scope functionality =====\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  for (const test of testCases) {
    console.log(`Running test: ${test.name}`);
    
    // Setup test conditions
    test.setup();
    
    // Get categories for the current hostname
    const categories = await loadCategoriesForSite(test.currentHostname);
    
    // Verify results
    const expectedStr = JSON.stringify(test.expectedCategories.sort());
    const actualStr = JSON.stringify(categories.sort());
    
    if (expectedStr === actualStr) {
      console.log(`✅ PASS: Got expected categories: ${actualStr}`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Expected: ${expectedStr}, got: ${actualStr}`);
      testsFailed++;
    }
    
    console.log(''); // Add empty line for readability
  }
  
  // Print test summary
  console.log('===== Test Summary =====');
  console.log(`Total tests: ${testCases.length}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  
  return testsFailed === 0;
}

// Run all tests
runTests().then(success => {
  console.log(`\nTest execution ${success ? 'succeeded' : 'failed'}`);
}); 
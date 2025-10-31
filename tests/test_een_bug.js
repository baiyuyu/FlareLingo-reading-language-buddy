// Test script to debug why "een" is not highlighted when Core words is selected

// Mock the dictionary with entry for "een"
const mockDictionary = {
  "een": {
    pos: "art",
    definition: "a",
    whether_core: true,
    whether_general: false,
    whether_spoken: false,
    whether_fiction: false,
    whether_newspapers: false,
    whether_web: false
  },
  "de": {
    pos: "art",
    definition: "the",
    whether_core: true,
    whether_general: false,
    whether_spoken: false,
    whether_fiction: false,
    whether_newspapers: false,
    whether_web: false
  }
};

// Test cases
const testCases = [
  "Dit is een test.",
  "De appel is rood.",
  "Een belangrijk woord."
];

// Function to reproduce the bug
function testHighlighting() {
  console.log("Test Highlighting for 'een' issue");
  
  // Test with currentCategory = 'whether_core'
  const currentCategory = 'whether_core';
  
  testCases.forEach(text => {
    console.log(`\nTest case: "${text}"`);
    
    // Split the text into words
    const wordRegex = /\b[a-zA-ZÀ-ÿ]+\b/g;
    let match;
    
    // Reset the lastIndex property
    wordRegex.lastIndex = 0;
    
    console.log("Words found and highlighting status:");
    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0].toLowerCase();
      const dictEntry = mockDictionary[word];
      
      // Check if word exists in dictionary and matches the selected category
      if (dictEntry && dictEntry[currentCategory]) {
        console.log(`  - "${word}": HIGHLIGHTED (${currentCategory} = ${dictEntry[currentCategory]})`);
      } else {
        if (dictEntry) {
          console.log(`  - "${word}": NOT HIGHLIGHTED (${currentCategory} = ${dictEntry[currentCategory]})`);
        } else {
          console.log(`  - "${word}": NOT HIGHLIGHTED (not in dictionary)`);
        }
      }
    }
  });
}

// Run the test
testHighlighting();

// Additional test to verify the issue
function checkEenEntryAccess() {
  console.log("\n\nDEBUG whether_core property access:");
  
  const eenEntry = mockDictionary["een"];
  console.log("Full 'een' entry:", eenEntry);
  
  // Test different ways to access the property
  console.log("Direct access - eenEntry.whether_core:", eenEntry.whether_core);
  console.log("Bracket access - eenEntry['whether_core']:", eenEntry['whether_core']);
  
  // Test with a variable
  const categoryToCheck = 'whether_core';
  console.log("Variable access - eenEntry[categoryToCheck]:", eenEntry[categoryToCheck]);
}

// Run additional test
checkEenEntryAccess(); 
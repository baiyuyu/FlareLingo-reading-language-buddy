// Test script to debug the dictionary loading and highlighting function

// Test function to check if "een" and other words are properly loaded
function testDictionaryLoading(dictionaryData) {
  const dictionary = typeof dictionaryData === 'string' ? JSON.parse(dictionaryData) : dictionaryData;
  
  // Test words to check
  const wordsToCheck = ['een', 'de', 'het', 'voor', 'van'];
  
  console.log('\nChecking specific words in the dictionary:');
  wordsToCheck.forEach(word => {
    if (dictionary[word]) {
      console.log(`\nWord: "${word}"`);
      console.log(`  - Present in dictionary: YES`);
      console.log(`  - Part of : ${dictionary[word].pos}`);
      console.log(`  - Definition: ${dictionary[word].definition}`);
      console.log(`  - whether_core: ${dictionary[word].whether_core}`);
      
      // Additional debugging for "een"
      if (word === "een") {
        console.log('\nDetailed debug for "een":');
        const entry = dictionary[word];
        console.log('  Full entry:', JSON.stringify(entry));
        console.log('  Type of whether_core:', typeof entry.whether_core);
        console.log('  Direct property access:', entry.whether_core);
        console.log('  Bracket notation access:', entry['whether_core']);
        
        // Test the exact condition used in content.js
        const currentCategory = 'whether_core';
        console.log(`  dictEntry[currentCategory] (${currentCategory}):`, entry[currentCategory]);
        console.log(`  Condition would evaluate to:`, entry && entry[currentCategory]);
      }
    } else {
      console.log(`\nWord: "${word}"`);
      console.log(`  - Present in dictionary: NO`);
    }
  });
  
  return dictionary;
}

// Mock data for testing (just a few words)
const mockDictionaryData = {
  "de": {
    "pos": "art",
    "definition": "the",
    "whether_core": true,
    "whether_general": false,
    "whether_spoken": false,
    "whether_fiction": false,
    "whether_newspapers": false,
    "whether_web": false
  },
  "en": {
    "pos": "conj",
    "definition": "and",
    "whether_core": true,
    "whether_general": false,
    "whether_spoken": false,
    "whether_fiction": false,
    "whether_newspapers": false,
    "whether_web": false
  },
  "in": {
    "pos": "prep",
    "definition": "in",
    "whether_core": true,
    "whether_general": false,
    "whether_spoken": false,
    "whether_fiction": false,
    "whether_newspapers": false,
    "whether_web": false
  },
  "van": {
    "pos": "prep",
    "definition": "of",
    "whether_core": true,
    "whether_general": false,
    "whether_spoken": false,
    "whether_fiction": false,
    "whether_newspapers": false,
    "whether_web": false
  },
  "een": {
    "pos": "art",
    "definition": "a",
    "whether_core": true,
    "whether_general": false,
    "whether_spoken": false,
    "whether_fiction": false,
    "whether_newspapers": false,
    "whether_web": false
  },
  "voor": {
    "pos": "prep",
    "definition": "a) for b) in front of",
    "whether_core": true,
    "whether_general": false,
    "whether_spoken": false,
    "whether_fiction": false,
    "whether_newspapers": false,
    "whether_web": false
  }
};

// Run the tests
console.log('=== BEGINNING DICTIONARY TESTS ===');
const dictionary = testDictionaryLoading(mockDictionaryData);

// Test the highlighting function with the dictionary
function testHighlighting(dictionary) {
  console.log('\n=== TESTING HIGHLIGHTING FUNCTION ===');
  
  // Test cases
  const testCases = [
    "Dit is een test.",
    "De appel is rood.",
    "Een belangrijke test."
  ];
  
  // Current category
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
      const dictEntry = dictionary[word];
      
      console.log(`  Word: "${word}"`);
      console.log(`    - In dictionary: ${dictEntry ? 'YES' : 'NO'}`);
      
      if (dictEntry) {
        console.log(`    - whether_core: ${dictEntry.whether_core}`);
        console.log(`    - Type of whether_core: ${typeof dictEntry.whether_core}`);
        console.log(`    - dictEntry[currentCategory]: ${dictEntry[currentCategory]}`);
        console.log(`    - Would be highlighted: ${dictEntry && dictEntry[currentCategory] ? 'YES' : 'NO'}`);
      } else {
        console.log(`    - Would be highlighted: NO (not in dictionary)`);
      }
    }
  });
}

// Run highlighting test
testHighlighting(dictionary);

// Check edge cases and comparison operators
function testComparisonOperators() {
  console.log('\n=== TESTING COMPARISON OPERATORS ===');
  
  const tests = [
    { value: true, desc: 'JavaScript true' },
    { value: 'True', desc: 'String "True"' },
    { value: 'true', desc: 'String "true"' }
  ];
  
  tests.forEach(test => {
    console.log(`\nTesting with ${test.desc}:`);
    console.log(`  - Strict equality with true: ${test.value === true}`);
    console.log(`  - Loose equality with true: ${test.value == true}`);
    console.log(`  - Boolean conversion: ${Boolean(test.value)}`);
    console.log(`  - Double negation: ${!!test.value}`);
  });
}

// Run comparison test
testComparisonOperators(); 
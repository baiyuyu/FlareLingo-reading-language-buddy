// Test the word boundary regex to ensure it properly matches words like "een"

// Test cases with different word boundary contexts
const testCases = [
  "Dit is een test.", // Basic case
  "Dit is één test.", // With accent
  "een woord staat aan het begin.", // At beginning of sentence
  "Aan het einde staat een.", // At end of sentence
  "Dit-is-een-test.", // With hyphens
  "een, twee, drie", // With comma
  "(een)", // In parentheses
  "\"een\"", // In quotes
  "een.", // With period
  "Is dit een?", // With question mark
  "een!", // With exclamation
  "een;een" // With semicolon
];

// Test the original regex
console.log("=== TESTING ORIGINAL REGEX ===");
const originalRegex = /\b[a-zA-ZÀ-ÿ]+\b/g;
testRegex(originalRegex, "Original");

// Test the improved regex
console.log("\n=== TESTING IMPROVED REGEX ===");
const improvedRegex = /\b([a-zA-ZÀ-ÿ]+)\b/g;
testRegex(improvedRegex, "Improved");

// Test a simpler regex
console.log("\n=== TESTING SIMPLE WORD REGEX ===");
const simpleRegex = /\b\w+\b/g;
testRegex(simpleRegex, "Simple");

// Alternative regex that might work better
console.log("\n=== TESTING ALTERNATIVE REGEX ===");
const alternativeRegex = /(?<!\w)([a-zA-ZÀ-ÿ]+)(?!\w)/g;
testRegex(alternativeRegex, "Alternative");

// Function to test regex against test cases
function testRegex(regex, regexName) {
  console.log(`${regexName} regex: ${regex}`);
  
  let totalMatches = 0;
  let eenMatches = 0;
  
  testCases.forEach(testCase => {
    console.log(`\nTest case: "${testCase}"`);
    
    // Reset regex lastIndex
    regex.lastIndex = 0;
    
    // Find all matches
    const matches = [];
    let match;
    while ((match = regex.exec(testCase)) !== null) {
      matches.push({ word: match[0], index: match.index });
      totalMatches++;
      
      if (match[0].toLowerCase() === "een") {
        eenMatches++;
      }
    }
    
    // Display results
    if (matches.length > 0) {
      console.log("Matches found:");
      matches.forEach(m => {
        const isEen = m.word.toLowerCase() === "een" ? " (EEN FOUND!)" : "";
        console.log(`  - "${m.word}" at position ${m.index}${isEen}`);
      });
    } else {
      console.log("No matches found");
    }
  });
  
  console.log(`\nSummary for ${regexName} regex:`);
  console.log(`- Total matches: ${totalMatches}`);
  console.log(`- "een" matches: ${eenMatches}`);
}

// Test specific word highlighting logic
console.log("\n\n=== TESTING WORD HIGHLIGHTING LOGIC ===");

function testWordHighlighting(text, currentCategory) {
  console.log(`\nText: "${text}"`);
  console.log(`Category: ${currentCategory}`);
  
  // Mock dictionary with 'een' entry
  const dictionary = {
    'een': {
      pos: 'art',
      definition: 'a',
      whether_core: true,
      whether_general: false,
      whether_spoken: false,
      whether_fiction: false,
      whether_newspapers: false,
      whether_web: false
    }
  };
  
  // Reset regex
  const wordRegex = /\b([a-zA-ZÀ-ÿ]+)\b/g;
  wordRegex.lastIndex = 0;
  
  // Find all matches
  let match;
  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0].toLowerCase();
    const dictEntry = dictionary[word];
    
    console.log(`Word: "${word}"`);
    console.log(`  - In dictionary: ${!!dictEntry}`);
    
    if (dictEntry) {
      console.log(`  - whether_core: ${dictEntry.whether_core}`);
      console.log(`  - dictEntry[currentCategory]: ${dictEntry[currentCategory]}`);
      console.log(`  - Would highlight: ${!!(dictEntry && dictEntry[currentCategory])}`);
    }
  }
}

// Test a few cases
testWordHighlighting("Dit is een test.", "whether_core");
testWordHighlighting("Een belangrijke test.", "whether_core");
testWordHighlighting("Dit is een test.", "whether_general");

// Finally, test if the condition logic is correct
console.log("\n\n=== TESTING CONDITION LOGIC ===");

function testCondition(dictEntry, currentCategory) {
  console.log(`\nTesting condition with:`);
  console.log(`- dictEntry: ${JSON.stringify(dictEntry)}`);
  console.log(`- currentCategory: ${currentCategory}`);
  
  if (dictEntry) {
    console.log(`- dictEntry[currentCategory]: ${dictEntry[currentCategory]}`);
  }
  
  const result = dictEntry && dictEntry[currentCategory];
  console.log(`- dictEntry && dictEntry[currentCategory] = ${result}`);
  
  return result;
}

// Test different conditions
testCondition({ whether_core: true }, "whether_core");
testCondition({ whether_core: false }, "whether_core");
testCondition({ whether_general: true }, "whether_core");
testCondition(null, "whether_core"); 
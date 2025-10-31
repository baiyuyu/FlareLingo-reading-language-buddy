// Test script to specifically check if "een" is properly loaded from the dictionary file

const fs = require('fs');
const path = require('path');

// Path to the dictionary file
const dictionaryPath = path.resolve(__dirname, '..', 'data', 'dutch_frequency_dictionary.json');

// Log the path for debugging
console.log(`Dictionary path: ${dictionaryPath}`);

// Function to find a specific word in the JSON file
function findWordInJSON(filePath, targetWord) {
  console.log(`Searching for word "${targetWord}" in ${filePath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File does not exist: ${filePath}`);
      return null;
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const dictionaryData = JSON.parse(fileContent);
    
    console.log(`Total words in dictionary: ${Object.keys(dictionaryData).length}`);
    
    // Search for the target word
    if (dictionaryData[targetWord]) {
      console.log(`Found word "${targetWord}" in dictionary:`);
      console.log(JSON.stringify(dictionaryData[targetWord], null, 2));
      return {
        word: targetWord,
        entry: dictionaryData[targetWord]
      };
    } else {
      console.log(`Word "${targetWord}" not found in dictionary`);
      return null;
    }
  } catch (error) {
    console.error(`Error searching dictionary: ${error.message}`);
    return null;
  }
}

// Test for finding "een" in the dictionary
function testEenInDictionary() {
  console.log('Running test for "een" in dictionary');
  
  const result = findWordInJSON(dictionaryPath, 'een');
  
  if (result) {
    console.log('\nSuccess: "een" was found in the dictionary');
    
    // Test if "een" has the 'whether_core' property correctly set
    if (result.entry.whether_core === true) {
      console.log('Success: "een" has whether_core set to true');
    } else {
      console.error(`Error: "een" has whether_core set to ${result.entry.whether_core}`);
    }
    
    // Test the dictionary's structure
    console.log('\nChecking dictionary entry structure:');
    const expectedProperties = [
      'pos', 'definition', 'whether_core', 'whether_general', 
      'whether_spoken', 'whether_fiction', 'whether_newspapers', 'whether_web'
    ];
    
    const missingProperties = expectedProperties.filter(prop => !(prop in result.entry));
    
    if (missingProperties.length === 0) {
      console.log('Success: Dictionary entry has all expected properties');
    } else {
      console.error(`Error: Dictionary entry is missing these properties: ${missingProperties.join(', ')}`);
    }
  } else {
    console.error('FAILURE: "een" was not found in the dictionary');
  }
}

// Similar to content.js but focused on "een"
function testParsedData(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File does not exist: ${filePath}`);
      return;
    }
    
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const dictionary = JSON.parse(jsonData);
    
    console.log('Checking if "een" exists in the parsed dictionary...');
    
    if (dictionary['een']) {
      console.log(`Found "een" in dictionary:`);
      console.log(JSON.stringify(dictionary['een'], null, 2));
      
      const entry = dictionary['een'];
      
      // Test the content.js condition
      const currentCategory = 'whether_core';
      console.log(`\nTesting condition: dictEntry && dictEntry[currentCategory]`);
      console.log(`Result: ${entry && entry[currentCategory]}`);
      
      return;
    }
    
    console.log('Did not find "een" in the dictionary');
  } catch (error) {
    console.error(`Error in test parsing: ${error.message}`);
  }
}

// Run all tests
(function runTests() {
  console.log('===== Testing if "een" is properly loaded from dictionary =====\n');
  
  // Test 1: Search for "een" directly in the dictionary file
  testEenInDictionary();
  
  console.log('\n===== Testing parsing logic similar to content.js =====\n');
  
  // Test 2: Check if "een" is properly loaded using a similar method to content.js
  testParsedData(dictionaryPath);
})(); 
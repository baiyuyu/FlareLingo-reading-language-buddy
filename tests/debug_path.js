const path = require('path');
const fs = require('fs');

console.log('Current directory:', __dirname);
console.log('Parent directory:', path.resolve(__dirname, '..'));

const dictionaryPath = path.resolve(__dirname, '..', 'data', 'dutch_frequency_dictionary.json');
console.log('Dictionary path:', dictionaryPath);

try {
  // Check if file exists
  if (fs.existsSync(dictionaryPath)) {
    console.log('Dictionary file exists!');
    const stats = fs.statSync(dictionaryPath);
    console.log('File size:', stats.size, 'bytes');
  } else {
    console.log('Dictionary file does not exist at this path');
  }
} catch (err) {
  console.error('Error checking file:', err);
} 
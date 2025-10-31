#!/bin/bash

# Create clean build directory
rm -rf build
mkdir -p build

# Copy only the necessary files for the extension
cp manifest.json build/
cp popup.html build/
mkdir -p build/js
cp js/*.js build/js/
mkdir -p build/css
cp css/*.css build/css/
mkdir -p build/images
cp images/*.png build/images/
mkdir -p build/data
cp data/dutch_frequency_dictionary.json build/data/

# Create the zip file
cd build
zip -r ../dutch_word_highlight.zip *
cd ..

echo "Extension packaged successfully as dutch_word_highlight.zip"
echo "Note: The package excludes development files (tests, screenshots, etc.)" 
# Dutch Vocabulary Highlighter

A Chrome extension to help users learn Dutch vocabulary while browsing Dutch websites. Features local AI-powered examples, grammar analysis, and real-time translation using Chrome's built-in AI APIs.

## Features

- **Smart Highlighting**: Highlights Dutch words from specific categories on webpages
- **Interactive Tooltips**: Shows part of speech, English definitions, and word category on hover
- **AI-Powered Learning**: Local AI generates examples, grammar analysis, and translations
- **Multiple Categories**: Supports core, general, spoken, fiction, newspaper, and web vocabulary
- **Flexible Scope**: Apply to all Dutch sites or selected websites only
- **Privacy-First**: All AI processing happens locally in your browser
- **No API Keys**: Uses Chrome's built-in AI APIs (no external services required)

## AI Features

- **Real-time Translation**: Streams translation as you hover over sentences
- **Grammar Analysis**: Breaks down sentence structure, verbs, and difficulty points
- **Example Sentences**: Generates contextual Dutch examples with English translations
- **Performance Optimized**: Debounced requests, caching, and timeout protection

## Documentation

- [Chrome AI APIs Integration Guide (English)](Chrome-AI-APIs-README-EN.md)
- [Chrome AI APIs 集成指南 (中文)](Chrome-AI-APIs-README-CN.md)

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" and select the `dutch_word_highlighter` folder
4. The extension should now be installed and active (even without icons)

## Usage

1. Navigate to any website (including Dutch websites with .nl or .be domains)
2. Dutch words from the selected category will be highlighted (default: core words)
3. Hover over a highlighted word to see its part of speech, English definition, and word category
4. Click the extension icon in the toolbar to open the settings popup
5. Select a different category of words to highlight
6. Choose whether to apply settings to "All websites" or "Selected websites only"
7. If you choose "Selected websites only", you can add or remove websites from the list
8. Click "Apply" to update the highlights on the current page

### Website Selection

The extension now supports two modes of operation:
- **All websites**: Apply the same highlighting settings across all sites you visit
- **Selected websites only**: Define a list of websites where highlighting should be active
  - You can add multiple websites to the list
  - Each website can have its own unique category settings
  - For websites not in your list, no highlighting will be applied
  - The current website is automatically suggested when you choose this option

## Troubleshooting

### Debug Mode
The extension now has detailed console logging. Open your browser's Developer Tools (F12) and check the console for messages prefixed with `[Dutch Highlighter]` to see what's happening.

### Installation Issues
- **Missing Icon Error**: We've configured the extension to work without icons. You may see an error during installation, but it should still work.
- If you still have issues, run this in the browser console after installing the extension:
  ```javascript
  checkExtensionStructure();
  ```

### Runtime Issues
- If words are not being highlighted, check the console for any errors
- Verify the dictionary file is loaded by looking for log message: "Dictionary loaded successfully"
- Check that you're on a website where the content script is running (inspect Network tab in Developer Tools)

## Dictionary Data

The extension uses a JSON file containing Dutch words with their parts of speech, English definitions, and category flags. This file is placed in the `data` folder as `dutch_frequency_dictionary.json`.

## Development

The extension is built with:
- Manifest Version 3
- Plain JavaScript (no external libraries)
- CSS for styling
- HTML for the popup UI 

## Packaging for Distribution

To create a package ready for submission to the Chrome Web Store:

1. Make sure all your changes are committed and tested
2. Run the provided build script:
   ```bash
   ./build.sh
   ```
3. This will create a file named `dutch_word_highlight.zip` in your project root
4. The zip file contains only the necessary files for the extension, following Chrome Web Store requirements
5. Upload this zip file to the Chrome Web Store Developer Dashboard

The build script automatically:
- Creates a clean build directory
- Copies only the extension files (manifest.json, HTML, JS, CSS, images, and data)
- Packages them into a zip file
- Excludes development files like tests, git data, and raw data

### Manual Packaging (Alternative)

If you need to manually package the extension:

1. Create a new directory for the packaged extension
2. Copy the following files and directories:
   - manifest.json
   - popup.html
   - js/
   - css/
   - images/
   - data/dutch_frequency_dictionary.json
3. Zip the contents of this directory (not the directory itself)
4. Upload the resulting zip file to the Chrome Web Store 

## Publishing to Chrome Web Store

To publish your extension to the Chrome Web Store, you will need the following:

### Store Listing Information

| Field | Content |
|-------|---------|
| Name | Dutch Vocabulary Highlighter |
| Short Description | Highlights Dutch words on webpages with translations to aid language learning |
| Category | Education |

### Full Description

```
Dutch Vocabulary Highlighter helps you learn Dutch vocabulary while browsing the web.

The extension highlights Dutch words from various frequency categories (core, general, spoken, fiction, newspaper, web) on any webpage you visit. When you hover over a highlighted word, a tooltip shows its part of speech, English definition, and category.

Key features:
• Highlights Dutch words from your selected category on any webpage
• Shows part of speech, English translations, and word categories in tooltips
• Supports multiple vocabulary categories based on frequency lists
• Apply highlighting globally or to selected websites only
• Easy-to-use popup interface for customizing settings
• Works on all websites, with special support for Dutch domains (.nl and .be)

Perfect for Dutch language learners of all levels who want to build their vocabulary while browsing authentic Dutch content online!
```

### Visual Assets

- **Icons**: The extension already includes icons in the required sizes (16x16, 48x48, 128x128)
- **Screenshots**: You need to create at least one screenshot (1280×800 or 640×400 resolution)
  
  Suggested screenshots:
  1. The extension highlighting Dutch words on a popular Dutch website
  2. The popup interface showing category selection options
  3. A tooltip showing a word's translation when hovering
  4. The website selection interface

### Privacy Practices

```
This extension:
- Does not collect any user data
- Stores user preferences locally using Chrome's storage API
- Does not transmit any data to external servers
- All dictionary data is included within the extension package
```

### Permissions Explanation

| Permission | Justification |
|------------|---------------|
| storage | Required to save user preferences such as selected word categories and website-specific settings |
| activeTab | Needed to access and modify the content of the current tab to highlight words and display tooltips |
| scripting | Used to inject the content script into pages to perform word highlighting |

### Additional Requirements

- A developer account in the Chrome Web Store ($5 one-time fee)
- A Privacy Policy URL (if applicable)
- Developer contact information (email address) 


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

MIT License
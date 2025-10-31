# FlareLingo – Reading Language Buddy

🌟 **A Chrome extension that transforms any webpage into an intelligent Dutch learning environment using browser-native AI APIs.**

Seamlessly learn Dutch vocabulary while reading - no account required, complete privacy protection, all AI processing happens locally in your browser.

## ✨ Key Features

- 🎯 **Smart Highlighting**: Highlights Dutch words from curated frequency categories
- 🤖 **AI-Powered Learning**: Real-time translation, grammar analysis, and example sentences
- 🔐 **Privacy-First**: All processing happens locally - no external servers or data collection
- ⚡ **Performance Optimized**: Lightweight with intelligent caching and timeout protection
- 🌐 **Flexible Scope**: Apply to all websites or selected sites only

## 🚀 Quick Start

### Installation
1. Clone or download this repository
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select project folder

### Usage
1. Browse any website (works best on Dutch content)
2. Dutch words are automatically highlighted
3. Hover over highlighted words for translations and grammar info
4. Click extension icon to customize categories and settings

## 🛠️ Troubleshooting

- **No highlighting**: Check console for `[FlareLingo]` messages
- **AI not working**: Requires Chrome 128+ with AI features enabled
- **Installation issues**: Extension works without icons - ignore icon errors

## � Technical Details

- **Built with**: Chrome Extension Manifest V3, Vanilla JavaScript
- **AI Integration**: Chrome's built-in AI APIs (`aiLanguageModel`, `aiTranslator`)
- **Dictionary**: Curated Dutch frequency word lists with linguistic data
- **Privacy**: All data stored locally, no external communication

---

## 🚢 Distribution & Packaging

### 📦 Creating a Distribution Package

Ready to share FlareLingo? Use our automated build script:

```bash
# Make the build script executable (first time only)
chmod +x ./build.sh

# Create distribution package
./build.sh
```

This creates `flarelingo-reading-buddy.zip` containing only the essential extension files, ready for Chrome Web Store submission.

#### 📋 What's Included in the Package
- ✅ `manifest.json` - Extension configuration
- ✅ `popup.html` - User interface  
- ✅ `js/` - All JavaScript logic and AI integration
- ✅ `css/` - Styling and visual design
- ✅ `images/` - Extension icons and assets
- ✅ `data/dutch_frequency_dictionary.json` - Core vocabulary data

#### 🚫 What's Excluded
- ❌ Development files (`tests/`, `raw_data/`, etc.)
- ❌ Git metadata and version control files
- ❌ Documentation and project notes
- ❌ Build scripts and configuration

---

## 🏪 Chrome Web Store Publishing

### 📝 Store Listing Information

| 📋 Field | 📄 Content |
|-----------|-------------|
| **Name** | FlareLingo – Reading Language Buddy |
| **Short Description** | Subtle inline Dutch vocabulary learning while you read any website |
| **Category** | Education > Language Learning |
| **Version** | 1.0.4 |

### 📖 Full Store Description

```
🌟 FlareLingo transforms any webpage into an intelligent Dutch learning environment using Chrome's built-in AI.

Perfect for international professionals, students, and Dutch language enthusiasts who want to build vocabulary while consuming authentic content.

✨ KEY FEATURES:
• Smart highlighting of Dutch words from curated frequency lists
• AI-powered real-time translation and grammar analysis  
• Interactive tooltips with definitions and linguistic context
• Multiple vocabulary categories (core, general, fiction, news, web)
• Flexible website targeting (all sites or custom selections)
• Complete privacy - all processing happens locally in your browser

🔐 PRIVACY-FIRST:
• No account required, no data collection
• Uses Chrome's built-in AI APIs - no external servers
• All your learning data stays on your device

🎯 PERFECT FOR:
• International professionals working in Dutch environments
• Students studying Dutch language and culture  
• Expatriates navigating daily life in the Netherlands/Belgium
• Anyone reading Dutch news, blogs, or professional content

Transform your browsing into effortless vocabulary building!
```

### 🎨 Visual Assets Needed

- **📱 Screenshots**: 1280×800 or 640×400 resolution
  - Extension highlighting words on a Dutch news site
  - Popup interface showing category selection
  - Tooltip displaying word translation and grammar
  - AI translation streaming in action

- **🖼️ Icons**: Already included in required sizes (16×16, 48×48, 128×128)

### 🔒 Privacy & Permissions

#### Privacy Statement
```
FlareLingo respects your privacy:
✅ No user data collection or transmission
✅ All preferences stored locally using Chrome's storage API  
✅ No external server communication
✅ Dictionary data included within extension package
✅ AI processing happens entirely in your browser
```

#### Permission Justifications

| 🔑 Permission | 📝 Justification |
|---------------|-------------------|
| `storage` | Save user preferences for vocabulary categories and website settings |
| `activeTab` | Access current tab content to highlight words and display translations |
| `scripting` | Inject content script for word highlighting functionality |
| `aiLanguageModel` | Use Chrome's built-in AI for grammar analysis and example generation |

### 📋 Submission Requirements

- ✅ Chrome Web Store Developer Account ($5 one-time fee)
- ✅ Extension package (created with build script)
- ✅ Privacy policy URL (if collecting any data)
- ✅ Developer contact information
- ✅ Store listing content and screenshots

---

## 👨‍💻 Development & Contributing

### 🛠️ Local Development Setup

### 🛠️ Local Development Setup

1. **📥 Clone the Repository**
   ```bash
   git clone [repository-url]
   cd FlareLingo-reading-language-buddy
   ```

2. **🔧 Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → select project folder

3. **🧪 Test & Debug**
   - Check console for `[FlareLingo]` messages
   - Use the test files in `tests/` directory
   - Modify code and reload extension

### 📁 Project Structure

```
FlareLingo-reading-language-buddy/
├── 📄 manifest.json           # Extension configuration
├── 🖥️ popup.html             # User interface
├── js/                       # Core functionality
│   ├── 🤖 ai/               # AI integration layer
│   ├── 🎯 content.js        # Webpage interaction
│   ├── 🔧 background.js     # Extension lifecycle
│   └── 🎨 popup.js          # UI logic
├── css/                      # Styling
├── data/                     # Dictionary & language data
├── tests/                    # Development testing files
└── docs/                     # Documentation
```

### 🤝 Contributing

We welcome contributions! Please:
1. 🍴 Fork the repository
2. 🌱 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

---

## 🔮 Future Roadmap

### 🎯 Short-term Goals
- 🎵 **Audio Pronunciation**: Text-to-speech for Dutch pronunciation practice
- 📊 **Progress Tracking**: Learning statistics and vocabulary mastery insights
- 🔄 **Spaced Repetition**: Intelligent re-surfacing of learned words
- 📱 **Mobile Support**: Adaptation for mobile browser extensions

### 🌟 Long-term Vision  
- 🌍 **Multi-language Support**: Extend to other European languages
- 🧠 **Advanced Grammar**: Deep syntactic analysis with visual parse trees
- 👥 **Community Features**: Share vocabulary lists and learning progress
- 🎯 **Adaptive Learning**: AI-powered personalization based on individual patterns

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

```
MIT License - Feel free to use, modify, and distribute!
```

---

## 🙏 Acknowledgments

- 🤖 **Chrome AI Team**: For pioneering browser-native AI capabilities
- 📚 **Dutch Language Community**: For linguistic resources and frequency data
- 🌍 **Open Source Community**: For inspiration and collaborative spirit
- 🎓 **Language Learning Enthusiasts**: For feedback and feature suggestions

---

<div align="center">

### 🌟 **Transform Your Reading into Learning with FlareLingo!** 🌟

*Built with ❤️ using Chrome's Built-in AI APIs, vanilla JavaScript, and a passion for breaking down language barriers.*

**[⭐ Star us on GitHub](https://github.com/baiyuyu/FlareLingo-reading-language-buddy)** | **[📝 Report Issues](https://github.com/baiyuyu/FlareLingo-reading-language-buddy/issues)** | **[💬 Join Discussions](https://github.com/baiyuyu/FlareLingo-reading-language-buddy/discussions)**

</div>
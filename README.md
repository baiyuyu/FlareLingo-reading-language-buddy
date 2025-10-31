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

## � Distribution

Create a distribution package:
```bash
chmod +x ./build.sh && ./build.sh
```

This creates `flarelingo-reading-buddy.zip` ready for Chrome Web Store submission.

## ‍💻 Development

### Project Structure
```
FlareLingo-reading-language-buddy/
├── manifest.json              # Extension configuration
├── popup.html                 # User interface
├── js/                        # Core functionality
│   ├── ai/                    # AI integration
│   ├── content.js             # Webpage interaction
│   └── popup.js               # UI logic
├── css/                       # Styling
├── data/                      # Dictionary data
└── tests/                     # Testing files
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**🌟 Transform Your Reading into Learning with FlareLingo! 🌟**

*Built with Chrome's Built-in AI APIs and a passion for language learning.*

[⭐ Star on GitHub](https://github.com/baiyuyu/FlareLingo-reading-language-buddy) • [📝 Report Issues](https://github.com/baiyuyu/FlareLingo-reading-language-buddy/issues)

</div>
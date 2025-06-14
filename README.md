# Tyumi

<div align="center">

![Tyumi Logo](logo.svg)

**A feature-rich, open-source AI assistant platform**

[![Version](https://img.shields.io/badge/version-v0.9.5-blue.svg)](https://github.com/h1ddenpr0cess20/Tyumi)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow.svg)]()

</div>

## Overview

Tyumi is a powerful, client-side AI chatbot web application that seamlessly integrates with multiple AI providers including OpenAI, Anthropic, Google, Mistral AI, x.ai, and local Ollama models. Built with a modular architecture, it offers advanced features like personality customization, tool calling, text-to-speech, theme customization, and secure local storage.

## 🌟 Key Features
    
### 🤖 Multi-Provider AI Support
- **OpenAI** (GPT-4.1, GPT-4o, o3, o4, etc)
- **Anthropic** (Claude models)
- **Google** (Gemini models)
- **Mistral AI**
- **x.ai** (Grok models)
- **Local Ollama** models

### 🛠️ Advanced Tool Calling
- **Web Search** - Real-time internet search capabilities
- **Image Generation** - Create images via AI
- **Finance Tools** - Stock prices, market data
- **Utility Functions** - Various helper tools
- **Extensible Architecture** - Easy to add new tools

### 🎨 Rich User Experience
- **Multiple Themes** - Dark, Light, Neon, Metal, Country, and more
- **Responsive Design** - Works on desktop and mobile
- **Code Syntax Highlighting** - Beautiful code display with copy buttons
- **Markdown Support** - Rich text formatting
- **Image Gallery** - View and manage generated images

### 🗣️ Text-to-Speech
- **Multiple Voice Options** - Choose from available system voices
- **Autoplay Support** - Optional automatic speech
- **Audio Controls** - Play, pause, and manage TTS

### 💾 Local Storage & Privacy
- **IndexedDB Storage** - All conversations stored locally
- **No Server Dependency** - Runs entirely in your browser
- **Secure API Key Management** - Keys stored locally, never transmitted
- **Chat History Management** - Save, load, rename, and export conversations

### ⚙️ Customization
- **Personality Presets** - Multiple AI personality options
- **Custom System Prompts** - Define your own AI behavior
- **Model Parameters** - Adjust temperature, top-p, max tokens
- **Location Awareness** - Optional geographical context

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- API keys for your preferred AI service(s)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/h1ddenpr0cess20/Tyumi.git
   cd Tyumi
   ```

2. **Open in browser:**
   - Simply open `index.html` in your web browser
   - Or serve from a local web server for HTTPS features

3. **Configure API Keys:**
   - Click the settings button (⚙️)
   - Navigate to "API Keys" tab
   - Enter your API keys for desired services
   - Keys are stored securely in your browser's local storage

### Using HTTPS (Recommended)

For full functionality (including TTS and location services), serve over HTTPS:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then access via `https://localhost:8000` (you may need to accept the self-signed certificate).

## 📖 Usage

### Basic Chat
1. Select your preferred AI service and model
2. Type your message in the input field
3. Press Enter or click Send
4. Watch as the AI responds in real-time

### Advanced Features

#### Tool Calling
- Enable "Tool Calling" in settings
- Ask questions that require web search, image generation, or other tools
- The AI will automatically use appropriate tools when needed
- Be sure to obtain API keys before enabling the tools

#### Personality Customization
- Choose from preset personalities (Creative, Technical, Friendly, etc.)
- Or create custom system prompts for specific use cases

#### Theme Switching
- Click the theme selector to change appearance
- Themes include syntax highlighting for code blocks

#### Conversation Management
- All chats are auto-saved locally
- Access chat history via the History panel
- Export conversations as text files
- Rename or delete conversations as needed

## 🏗️ Architecture

Tyumi follows a modular architecture with clear separation of concerns:

```
src/
├── config/           # Configuration files
├── css/              # Styling (themes, components)
├── js/
│   ├── components/   # UI components
│   ├── init/         # Initialization modules
│   ├── services/     # API and service logic
│   └── utils/        # Utility functions
└── index.html        # Main application file
```

### Key Components
- **Initialization**: Modular startup sequence
- **Message Flow**: User input → API → Streaming response → UI
- **Tool System**: Extensible function calling framework
- **Storage**: IndexedDB for conversations and images
- **Theming**: CSS custom properties with multiple theme support

## 🔧 Configuration

### Adding New AI Models
Update the model configurations in `src/config/config.js` and `src/js/init/modelSettings.js`.

### Creating Custom Themes
Add theme files to:
- `src/css/themes/base/` for UI themes
- `src/css/themes/code/` for syntax highlighting themes

## 🛠️ Development

### Adding New Tools
1. Create tool implementation in `src/js/services/tools/`
2. Register in `src/js/services/tools/definitions.js`
3. Update UI settings if needed

### Modifying UI
- Components: `src/js/components/`
- Styling: `src/css/components/`
- Themes: `src/css/themes/`

### API Integration
- Main API logic: `src/js/services/api.js`
- Streaming: `src/js/services/streaming.js`
- Tool calling: `src/js/services/tools/tools.js`

## 🔒 Security & Privacy

- **Client-Side Only**: No data sent to Tyumi servers
- **Local Storage**: All conversations stored in your browser
- **API Key Security**: Keys stored locally, transmitted only to respective AI providers
- **No Tracking**: No analytics or user tracking

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💝 Support

If you find this project helpful, consider supporting its development:

**Cryptocurrency Donations:**
- **Bitcoin (BTC)**: `34rgxUdtg3aM5Fm6Q3aMwT1qEuFYQmSzLd`
- **Bitcoin Cash (BCH)**: `13JUmyzZ3vnddCqiqwAvzHJaCmMcjVpJD1`
- **Ethereum (ETH)**: `0xE8ac85A7331F66e7795A64Ab51C8c5A5A85Ed761`
- **Dogecoin (DOGE)**: `DCmgAhS7U77krayBN1cooeaic2H8F289uY`

## 🙏 Acknowledgments

- Built with modern web technologies
- Uses [marked.js](https://marked.js.org/) for Markdown parsing
- Syntax highlighting powered by [Highlight.js](https://highlightjs.org/)
- Icons and design inspired by modern web applications

## 📞 Contact

- **GitHub**: [@h1ddenpr0cess20](https://github.com/h1ddenpr0cess20)
- **Project Repository**: [https://github.com/h1ddenpr0cess20/Tyumi](https://github.com/h1ddenpr0cess20/Tyumi)

---

<div align="center">
<strong>© 2025 Dustin Whyte | Released under the MIT License</strong>
</div>

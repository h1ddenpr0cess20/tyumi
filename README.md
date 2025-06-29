# Tyumi

<div align="center">

![Tyumi Logo](src/assets/img/logo.svg)

**An open source AI assistant platform**

[![Version](https://img.shields.io/badge/version-v0.9.7-blue.svg)](https://github.com/h1ddenpr0cess20/Tyumi)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

## Overview

Tyumi is a powerful, client-side AI chatbot web application that seamlessly integrates with multiple AI providers including OpenAI, Anthropic, Google, Mistral, xAI, and local Ollama models. Built with a modular architecture, it offers advanced features like personality customization, tool calling, text-to-speech, theme customization, and secure local storage.

## 🌟 Key Features
    
### 🤖 Multi-Provider AI Support
- **OpenAI** (GPT-4.1, GPT-4o, o3, o4, etc)
- **Anthropic** (Claude models)
- **Google** (Gemini models)
- **Mistral**
- **xAI** (Grok models)
- **Local Ollama** models

### 🛠️ Advanced Tool Calling
- **Web Search** - Real-time internet search capabilities
- **Image Generation** - Create images via AI
- **Finance Tools** - Stock prices, cryptocurrency, market data
- **Food & Recipes** - Restaurant recommendations, recipes, nutrition info
- **Entertainment** - Movies, music, games, and media recommendations
- **Social Media** - Social platform integrations and content tools
- **Job Search** - Career opportunities and job market insights
- **Real Estate** - Property search and market information
- **Spotify Integration** - Music search and playlist management
- **Utility Functions** - Weather, time, calculations, and helper tools
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
- **IndexedDB Storage** - All conversations, images, and audio stored locally
- **No Server Dependency** - Runs entirely in your browser
- **Secure API Key Management** - Keys stored locally, never transmitted
- **Chat History Management** - Save, load, rename, and export conversations
- **Audio Message Storage** - TTS audio messages saved and managed locally
- **Database Migration** - Seamless upgrades from previous versions

### 🌐 Enhanced Services
- **Location Services** - Optional geographical context and location-aware features
- **Notification System** - System notifications and user alerts
- **Mobile Optimization** - Enhanced mobile interface and touch interactions
- **Menu System** - Organized panel navigation and state management

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

3. **Android APK (Optional):**
   - Download `tyumi.apk` from the `apk/` directory
   - Install on Android device for a native app experience
   - The APK is a WebView wrapper that runs the web application located at tyumi.app

4. **Configure API Keys:**
   - Click the settings button (⚙️)
   - Navigate to "API Keys" tab
   - Enter your API keys for desired services
   - Keys are stored securely in your browser's local storage

> **Ollama users:** To use tool-calling features with Ollama, you must select a model that supports tools. We recommend using the Qwen3 model. Look for models with the `tools` label on the [Ollama model search page](https://ollama.com/search?c=tools).

### Using HTTPS (Recommended)

For full functionality, you should serve Tyumi over HTTPS. Here’s how to set up a local HTTPS server with a self-signed certificate:

### 1. Generate a Self-Signed SSL Certificate

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

- When prompted, you can enter dummy values or leave fields blank.
- This will create `key.pem` (private key) and `cert.pem` (certificate) in your current directory.

### 2. Serve Locally with HTTPS

**Using Node.js (http-server):**

First, install `http-server` if you haven’t:

```bash
npm install -g http-server
```

Then launch with SSL:

```bash
http-server -S -C cert.pem -K key.pem -p 8000
```

**Using Python 3:**

```bash
python -m http.server 8000 --bind 127.0.0.1 --directory . --ssl-certfile cert.pem --ssl-keyfile key.pem
```
*(Note: Native SSL support requires Python 3.10+. For earlier versions, consider using a third-party package like `sslserver`.)*

### 3. Access the App

Open your browser and go to:  
`https://localhost:8000`

You may need to accept a security warning for the self-signed certificate.


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
- Available tools include finance, food, entertainment, social media, jobs, real estate, and more
- Be sure to obtain API keys before enabling the tools

#### Personality Customization
- Choose from preset personalities (Creative, Technical, Friendly, etc.)
- Or create custom system prompts for specific use cases

#### Theme Switching
- Click the theme selector to change appearance
- Themes include syntax highlighting for code blocks

#### Conversation Management
- All chats are auto-saved locally with IndexedDB
- Access chat history via the History panel
- Export conversations as text files with optional reasoning content
- Rename or delete conversations as needed
- Audio messages are stored and managed locally
- Database migration tools for upgrading from previous versions

## 🏗️ Architecture

Tyumi follows a modular architecture with clear separation of concerns:

```
src/
├── config/           # Configuration files
├── css/              # Styling (themes, components)
│   ├── components/   # Modular component styles
│   │   ├── features/ # Feature-specific styles (gallery, history)
│   │   ├── layout/   # Layout and responsive design
│   │   └── ui/       # UI controls and animations
│   └── themes/       # Theme system with base and code themes
├── html/             # HTML templates and panels
├── js/
│   ├── components/   # UI components
│   ├── init/         # Initialization modules
│   ├── lib/          # External libraries
│   ├── services/     # API and service logic
│   │   └── tools/    # Tool implementations (finance, food, social, etc.)
│   └── utils/        # Utility functions
└── index.html        # Main application file
```

### Key Components
- **Initialization**: Modular startup sequence with service configuration
- **Message Flow**: User input → API → Streaming response → UI
- **Tool System**: Extensible function calling framework with specialized tools
- **Storage**: IndexedDB for conversations, images, and audio messages
- **Theming**: CSS custom properties with multiple theme support
- **Location Services**: Geolocation and location-aware functionality
- **Notification System**: User alerts and system notifications
- **Mobile Support**: Responsive design with mobile-specific optimizations

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
- **Dogecoin (DOGE)**: `DCmgAhS7U77krayBN1cooeaic2H8F289uY`

## 🙏 Acknowledgments

- Built with modern web technologies
- Uses [marked.js](https://marked.js.org/) for Markdown parsing
- Syntax highlighting powered by [Highlight.js](https://highlightjs.org/)
- Content sanitization via [DOMPurify](https://github.com/cure53/DOMPurify)
- Icons and design inspired by modern web applications

## 📞 Contact

- **GitHub**: [@h1ddenpr0cess20](https://github.com/h1ddenpr0cess20)
- **Project Repository**: [https://github.com/h1ddenpr0cess20/Tyumi](https://github.com/h1ddenpr0cess20/Tyumi)

---

<div align="center">
<strong>© 2025 Dustin Whyte | Released under the MIT License</strong>
</div>

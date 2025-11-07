# 🌍 BabelPod

A progressive web application for language learners that allows you to play podcasts in one language and instantly translate challenging sections to English (or other languages) with the click of a button.

## ✨ Features

- **Podcast Playback**: Load and play podcasts from RSS feeds with CORS proxy support
- **Standard Controls**: Play/pause, rewind/skip (15s, 30s)
- **Instant Translation**: Special "Rewind 15s & Translate" button that:
  - Rewinds 15 seconds
  - Transcribes the audio segment using your chosen method
  - Translates it to your target language
  - Plays the translation out loud using text-to-speech
- **Multiple Transcription Options**:
  - Browser Speech Recognition (free, no setup)
  - OpenAI Whisper API (paid, very accurate)
  - Self-hosted Whisper API (free, private, accurate)
- **Auto Language Detection**: Automatically detects podcast language from RSS feed
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Progressive**: Built with modern web standards for a native app-like experience

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd babelpod
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

### Running Tests

```bash
# Run tests once
npm test -- --run

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui
```

## 🎙️ Self-Hosted Whisper API (Recommended)

For the best experience - accurate transcription without paying for API calls - you can run Whisper locally using Docker.

### Quick Setup

1. Make sure Docker is installed on your machine

2. Start the Whisper service:
```bash
docker-compose up -d
```

3. Wait for the model to download (first time only, ~100MB-1GB depending on model):
```bash
docker-compose logs -f whisper
```

4. Once you see "Application startup complete", the API is ready at `http://localhost:9001`

5. In BabelPod:
   - Click Settings ⚙️
   - Select "Self-Hosted Whisper API"
   - The URL should be pre-filled: `http://localhost:9001`
   - Save and start translating!

### CORS Support

The Docker setup includes an nginx proxy that adds CORS headers automatically:
- **Port 9001**: Public API with CORS support (use this in BabelPod) ✅
- Port 9000: Internal Whisper API (no CORS, Docker network only)

The nginx proxy handles all CORS preflight requests and adds the necessary headers to allow browser-based apps to access the Whisper API.

### Model Selection

Edit `docker-compose.yml` to change the `ASR_MODEL` setting:
- `tiny`: Fastest, least accurate (~1GB RAM)
- `base`: Good balance (~1GB RAM) ⭐ **Recommended**
- `small`: Better accuracy (~2GB RAM)
- `medium`: Very good accuracy (~5GB RAM)
- `large-v3`: Best accuracy (~10GB RAM, GPU recommended)

### GPU Support

For much faster transcription with GPU:
1. Install [nvidia-docker](https://github.com/NVIDIA/nvidia-docker)
2. In `docker-compose.yml`, change the image to:
   ```yaml
   image: onerahmet/openai-whisper-asr-webservice:latest-gpu
   ```
3. Uncomment the `deploy` section
4. Restart: `docker-compose down && docker-compose up -d`

### API Documentation

Once running, view the API docs at: `http://localhost:9001/docs`

### Stopping the Service

```bash
# Stop without removing data
docker-compose stop

# Stop and remove (models are preserved in volume)
docker-compose down

# Remove everything including cached models
docker-compose down -v
```

## 🚀 Deployment

This project is configured for automatic deployment to GitHub Pages.

### Live Demo

Visit the live app at: `https://markgravestock.github.io/babelpod/`

### How it Works

1. Push to `main` or `master` branch
2. GitHub Actions automatically:
   - Runs linter
   - Runs all tests (35 tests)
   - Builds the application
   - Deploys to GitHub Pages

### Setting Up GitHub Pages

1. Go to your repository Settings → Pages
2. Under "Build and deployment", select:
   - Source: **GitHub Actions**
3. The workflow will automatically deploy on the next push to main

## 📖 How to Use

1. **Load a Podcast**:
   - Enter a podcast RSS feed URL in the input field
   - Or try one of the sample Spanish podcasts

2. **Select an Episode**:
   - Browse the episode list
   - Click on an episode to start playing

3. **Use Standard Controls**:
   - Play/Pause: Start or stop playback
   - Rewind 15s/30s: Skip backwards
   - Skip 15s/30s: Skip forwards
   - Progress bar: Click to jump to any point

4. **Translate on Demand**:
   - When you hear something you don't understand
   - Click "Rewind 15s & Translate"
   - The app will rewind, translate, and speak the translation
   - Original playback resumes from where you rewound

## 🔧 Technology Stack

### Frontend
- **React 19**: UI library
- **Vite**: Build tool and dev server
- **CSS3**: Responsive styling with gradients and animations

### Services & APIs
- **RSS Parser**: For loading podcast feeds with CORS proxy fallback
- **MyMemory Translation API**: Free translation service (no API key required)
- **Web Speech API**: Browser-based text-to-speech and speech recognition
- **Transcription Options**:
  - Browser Speech Recognition API (free, built-in)
  - OpenAI Whisper API (paid, requires API key)
  - Self-hosted Whisper API (free, run locally with Docker)

## 🎯 Use Cases

Perfect for:
- Language learners who want to practice with real content
- People learning Spanish, French, German, or any language
- Podcast enthusiasts who want to understand challenging sections
- Students practicing listening comprehension

## 🌐 CORS Support

BabelPod automatically handles CORS restrictions for both RSS feeds and audio playback:
- **RSS Feeds**: Tries multiple CORS proxies automatically
- **Audio Playback**: Proxies audio through CORS-enabled servers
- **Web Audio API**: Proper `crossOrigin` attribute for transcription features

Most podcasts will work out of the box!

## 📱 Progressive Web App Features

BabelPod is built with PWA capabilities in mind:
- Responsive design works on all screen sizes
- Mobile-first approach
- Future: Add service worker for offline functionality
- Future: Add manifest for "Add to Home Screen"

## 🤝 Contributing

Contributions are welcome! Here are some areas for improvement:
1. Add real speech-to-text integration (Whisper API)
2. Support for more languages
3. Offline support with service workers
4. Podcast search and discovery
5. Save favorite episodes
6. Adjustable translation segment duration
7. Multiple translation services
8. User preferences and settings

## 📄 License

MIT License - feel free to use this for learning or commercial projects!

## 🙏 Acknowledgments

- Translation powered by [MyMemory Translation API](https://mymemory.translated.net/)
- RSS parsing by [rss-parser](https://github.com/rbren/rss-parser)
- Text-to-speech by Web Speech API

## 🐛 Known Limitations

1. **Browser Speech Recognition**:
   - Only works in Chrome and Edge (uses Google's speech recognition)
   - Requires internet connection
   - May be less accurate than Whisper

2. **Self-Hosted Whisper**:
   - Requires Docker and sufficient RAM (1-10GB depending on model)
   - CPU transcription is slower (15-30 seconds for 15s audio)
   - GPU recommended for real-time transcription

3. **Browser Support**:
   - Text-to-speech requires modern browser with Web Speech API
   - Best experience in Chrome, Edge, Safari
   - Firefox has limited TTS voice support

4. **CORS Proxies**:
   - Some CORS proxies may be slow or rate-limited
   - Self-hosted option recommended for production use

## 💡 Tips

- Use headphones for the best experience
- Start with slower-paced podcasts if you're a beginner
- The translation feature works best with clear audio
- Adjust playback speed in your browser if needed

---

Built with ❤️ for language learners everywhere!

# 🌍 BabelPod

A progressive web application for language learners that allows you to play podcasts in one language and instantly translate challenging sections to English (or other languages) with the click of a button.

## ✨ Features

- **Podcast Playback**: Load and play podcasts from RSS feeds
- **Standard Controls**: Play/pause, rewind/skip (15s, 30s)
- **Instant Translation**: Special "Rewind 15s & Translate" button that:
  - Rewinds 15 seconds
  - Transcribes the audio segment
  - Translates it to your target language
  - Plays the translation out loud using text-to-speech
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

### Services
- **RSS Parser**: For loading podcast feeds
- **MyMemory Translation API**: Free translation service (no API key required)
- **Web Speech API**: Browser-based text-to-speech (completely free)

### Future Enhancements (Not Yet Implemented)
- **OpenAI Whisper API**: For accurate speech-to-text transcription
  - Currently using mock transcription for PoC
  - To enable: Add your OpenAI API key in settings

## 🎯 Use Cases

Perfect for:
- Language learners who want to practice with real content
- People learning Spanish, French, German, or any language
- Podcast enthusiasts who want to understand challenging sections
- Students practicing listening comprehension

## 🌐 CORS Considerations

Some podcast feeds may have CORS restrictions. If you encounter CORS errors:
1. Use a CORS proxy (for development only)
2. Consider setting up a backend server to fetch RSS feeds
3. Test with podcasts that have proper CORS headers

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

1. **Transcription**: Currently using mock transcription for demonstration
   - Real transcription requires OpenAI Whisper API (paid)
   - Alternative: Use browser's SpeechRecognition API (limited browser support)

2. **CORS**: Some podcast feeds may not work due to CORS restrictions

3. **Browser Support**:
   - Text-to-speech requires modern browser with Web Speech API
   - Best experience in Chrome, Edge, Safari
   - Firefox has limited TTS voice support

## 💡 Tips

- Use headphones for the best experience
- Start with slower-paced podcasts if you're a beginner
- The translation feature works best with clear audio
- Adjust playback speed in your browser if needed

---

Built with ❤️ for language learners everywhere!

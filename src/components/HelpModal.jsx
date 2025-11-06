import './HelpModal.css';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2>How to use BabelPod</h2>

        <section className="help-section">
          <h3>🎧 Getting Started</h3>
          <ol>
            <li>Enter a podcast RSS feed URL in the search box</li>
            <li>Click "Load Podcast" to fetch the episodes</li>
            <li>Browse and select an episode to play</li>
          </ol>
        </section>

        <section className="help-section">
          <h3>🎮 Player Controls</h3>
          <ul>
            <li><strong>Play/Pause:</strong> Start or stop playback</li>
            <li><strong>⏪ 30s / ↶ 15s:</strong> Rewind backwards</li>
            <li><strong>15s ↷ / 30s ⏩:</strong> Skip forwards</li>
            <li><strong>Progress Bar:</strong> Click anywhere to jump to that position</li>
          </ul>
        </section>

        <section className="help-section">
          <h3>🌍 Translation Feature</h3>
          <p>
            The <strong>"🔄 Rewind 15s & Translate"</strong> button is the key feature for language learners:
          </p>
          <ol>
            <li>When you hear something you don't understand, click this button</li>
            <li>The app will rewind 15 seconds</li>
            <li>It transcribes that audio segment (currently uses mock data)</li>
            <li>Translates it to English using MyMemory API</li>
            <li>Speaks the translation out loud using your browser's text-to-speech</li>
            <li>Then continues playback from where you rewound</li>
          </ol>
        </section>

        <section className="help-section">
          <h3>💾 Recent Podcasts</h3>
          <p>
            BabelPod automatically saves your recent podcast feeds in your browser's local storage.
            The last 5 podcasts you've loaded will appear in the "Recent Podcasts" section for quick access.
          </p>
        </section>

        <section className="help-section">
          <h3>📚 Finding Podcasts</h3>
          <p>Look for RSS feed URLs from:</p>
          <ul>
            <li>Podcast websites (look for RSS icons)</li>
            <li>NPR podcasts: <code>https://feeds.npr.org/...</code></li>
            <li>BBC podcasts: <code>https://podcasts.files.bbci.co.uk/...</code></li>
            <li>Most podcast hosting platforms provide RSS feeds</li>
          </ul>
        </section>

        <section className="help-section">
          <h3>⚠️ Known Limitations</h3>
          <ul>
            <li>Some podcast feeds may have CORS restrictions</li>
            <li>Transcription currently uses mock data (OpenAI Whisper API integration coming)</li>
            <li>Translation quality depends on MyMemory API</li>
            <li>Text-to-speech quality varies by browser and language</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

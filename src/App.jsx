import { useState } from 'react';
import PodcastLoader from './components/PodcastLoader';
import EpisodeList from './components/EpisodeList';
import AudioPlayer from './components/AudioPlayer';
import HelpModal from './components/HelpModal';
import { parsePodcastFeed } from './services/rssService';
import './App.css';

function App() {
  const [podcast, setPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [sourceLang, setSourceLang] = useState('es'); // Default: Spanish
  const [targetLang, setTargetLang] = useState('en'); // Default: English
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handlePodcastLoad = async (feedUrl) => {
    const podcastData = await parsePodcastFeed(feedUrl);
    setPodcast(podcastData);
    setEpisodes(podcastData.episodes);
    setSelectedEpisode(null); // Reset selection when loading new podcast
    return podcastData; // Return for the loader to save
  };

  const handleEpisodeSelect = (episode) => {
    setSelectedEpisode(episode);
    // Scroll to player
    setTimeout(() => {
      document.querySelector('.audio-player')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🌍 BabelPod</h1>
          <button
            className="help-btn"
            onClick={() => setIsHelpOpen(true)}
            title="Help & Instructions"
          >
            ❓ Help
          </button>
        </div>
        <p className="app-subtitle">
          Learn languages through podcasts with instant translation
        </p>
      </header>

      <main className="app-main">
        <PodcastLoader onPodcastLoad={handlePodcastLoad} />

        {selectedEpisode && (
          <div className="player-section">
            <AudioPlayer
              episode={selectedEpisode}
              sourceLang={sourceLang}
              targetLang={targetLang}
            />
          </div>
        )}

        <EpisodeList
          podcast={podcast}
          episodes={episodes}
          selectedEpisode={selectedEpisode}
          onEpisodeSelect={handleEpisodeSelect}
        />
      </main>

      <footer className="app-footer">
        <p className="footer-note">
          Built with React • Translation powered by MyMemory & Web Speech API
        </p>
      </footer>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

export default App;

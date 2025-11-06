import { useState } from 'react';
import PodcastLoader from './components/PodcastLoader';
import EpisodeList from './components/EpisodeList';
import AudioPlayer from './components/AudioPlayer';
import HelpModal from './components/HelpModal';
import SettingsModal from './components/SettingsModal';
import { getSettings } from './services/settingsService';
import { parsePodcastFeed } from './services/rssService';
import './App.css';

function App() {
  const [podcast, setPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(getSettings());

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

  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🌍 BabelPod</h1>
          <div className="header-buttons">
            <button
              className="settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
            >
              ⚙️ Settings
            </button>
            <button
              className="help-btn"
              onClick={() => setIsHelpOpen(true)}
              title="Help & Instructions"
            >
              ❓ Help
            </button>
          </div>
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
              settings={settings}
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
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSettingsSave}
      />
    </div>
  );
}

export default App;

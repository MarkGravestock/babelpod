import { useState } from 'react';
import './PodcastLoader.css';

export default function PodcastLoader({ onPodcastLoad, onEpisodeSelect }) {
  const [feedUrl, setFeedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Sample podcast feeds for testing
  const sampleFeeds = [
    {
      name: 'Spanish Pod (Example)',
      url: 'https://feeds.megaphone.fm/ESP1277329447',
      language: 'Spanish'
    },
    {
      name: 'Coffee Break Spanish',
      url: 'https://coffeebreaklanguages.com/coffeebreakspanish-podcast/',
      language: 'Spanish'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!feedUrl.trim()) {
      setError('Please enter a podcast RSS feed URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onPodcastLoad(feedUrl);
    } catch (err) {
      setError(err.message || 'Failed to load podcast. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = async (url) => {
    setFeedUrl(url);
    setIsLoading(true);
    setError('');

    try {
      await onPodcastLoad(url);
    } catch (err) {
      setError(err.message || 'Failed to load podcast. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="podcast-loader">
      <form onSubmit={handleSubmit} className="feed-form">
        <div className="input-group">
          <input
            type="url"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="Enter podcast RSS feed URL..."
            className="feed-input"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} className="load-btn">
            {isLoading ? '⏳ Loading...' : '📡 Load Podcast'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="sample-feeds">
        <p className="sample-label">Try a sample podcast:</p>
        <div className="sample-buttons">
          {sampleFeeds.map((feed, index) => (
            <button
              key={index}
              onClick={() => loadSample(feed.url)}
              disabled={isLoading}
              className="sample-btn"
            >
              {feed.name} <span className="lang-badge">{feed.language}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="info-box">
        <h4>💡 How to use BabelPod:</h4>
        <ol>
          <li>Enter a podcast RSS feed URL or try a sample</li>
          <li>Select an episode to play</li>
          <li>Use standard controls: play/pause, rewind, skip</li>
          <li>Click "Rewind 15s & Translate" when you need help understanding something</li>
        </ol>
      </div>
    </div>
  );
}

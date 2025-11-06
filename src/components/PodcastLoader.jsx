import { useState, useEffect } from 'react';
import './PodcastLoader.css';

const STORAGE_KEY = 'babelpod_feeds';

export default function PodcastLoader({ onPodcastLoad }) {
  const [feedUrl, setFeedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedFeeds, setSavedFeeds] = useState([]);

  // Load saved feeds from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedFeeds(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved feeds:', e);
      }
    }
  }, []);

  const saveFeedToStorage = (url, title) => {
    const feed = {
      url,
      title: title || 'Untitled Podcast',
      lastUsed: new Date().toISOString()
    };

    const updated = [
      feed,
      ...savedFeeds.filter(f => f.url !== url)
    ].slice(0, 5); // Keep only last 5

    setSavedFeeds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeFeed = (url) => {
    const updated = savedFeeds.filter(f => f.url !== url);
    setSavedFeeds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!feedUrl.trim()) {
      setError('Please enter a podcast RSS feed URL');
      return;
    }

    await loadFeed(feedUrl);
  };

  const loadFeed = async (url) => {
    setIsLoading(true);
    setError('');

    try {
      const podcastData = await onPodcastLoad(url);
      saveFeedToStorage(url, podcastData.title);
      setFeedUrl('');
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

      {savedFeeds.length > 0 && (
        <div className="saved-feeds">
          <h3 className="saved-label">Recent Podcasts</h3>
          <div className="saved-list">
            {savedFeeds.map((feed) => (
              <div key={feed.url} className="saved-feed-item">
                <button
                  onClick={() => loadFeed(feed.url)}
                  disabled={isLoading}
                  className="saved-feed-btn"
                >
                  <span className="feed-title">{feed.title}</span>
                  <span className="feed-date">
                    {new Date(feed.lastUsed).toLocaleDateString()}
                  </span>
                </button>
                <button
                  onClick={() => removeFeed(feed.url)}
                  className="remove-feed-btn"
                  title="Remove from recent"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

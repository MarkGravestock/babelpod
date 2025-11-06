import './EpisodeList.css';

export default function EpisodeList({ podcast, episodes, selectedEpisode, onEpisodeSelect }) {
  if (!podcast || !episodes || episodes.length === 0) {
    return null;
  }

  return (
    <div className="episode-list-container">
      <div className="podcast-header">
        {podcast.image && (
          <img src={podcast.image} alt={podcast.title} className="podcast-image" />
        )}
        <div className="podcast-info">
          <h2>{podcast.title}</h2>
          <p className="podcast-description">{podcast.description}</p>
          <p className="episode-count">{episodes.length} episodes available</p>
        </div>
      </div>

      <div className="episodes-grid">
        {episodes.map((episode) => (
          <div
            key={episode.id}
            className={`episode-card ${selectedEpisode?.id === episode.id ? 'selected' : ''}`}
            onClick={() => onEpisodeSelect(episode)}
          >
            {episode.image && (
              <img src={episode.image} alt={episode.title} className="episode-thumb" />
            )}
            <div className="episode-content">
              <h3 className="episode-title">{episode.title}</h3>
              <p className="episode-desc">{episode.description}</p>
              <div className="episode-meta">
                {episode.pubDate && (
                  <span className="pub-date">
                    {new Date(episode.pubDate).toLocaleDateString()}
                  </span>
                )}
                {episode.duration && (
                  <span className="duration">{episode.duration}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['itunes:duration', 'duration'],
      ['itunes:image', 'image'],
    ]
  }
});

export async function parsePodcastFeed(url) {
  try {
    const feed = await parser.parseURL(url);

    return {
      title: feed.title,
      description: feed.description,
      image: feed.image?.url || feed.itunes?.image,
      episodes: feed.items.map(item => ({
        id: item.guid || item.link,
        title: item.title,
        description: item.contentSnippet || item.description,
        audioUrl: item.enclosure?.url,
        duration: item.duration,
        pubDate: item.pubDate,
        image: item.itunes?.image || feed.image?.url
      })).filter(ep => ep.audioUrl) // Only include episodes with audio
    };
  } catch (error) {
    throw new Error(`Failed to parse podcast feed: ${error.message}`);
  }
}

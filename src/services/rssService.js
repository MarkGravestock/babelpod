// Browser-compatible RSS parser (no Node.js dependencies)

// Use a CORS proxy for development to avoid CORS issues
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export async function parsePodcastFeed(feedUrl) {
  try {
    // Fetch the RSS feed through CORS proxy
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(feedUrl)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.statusText}`);
    }

    const xmlText = await response.text();

    // Parse XML using DOMParser (browser native)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid RSS feed format');
    }

    // Extract podcast info
    const channel = xmlDoc.querySelector('channel');
    if (!channel) {
      throw new Error('Invalid RSS feed: No channel element found');
    }

    const title = getElementText(channel, 'title');
    const description = getElementText(channel, 'description');
    const imageUrl = getImageUrl(channel);

    // Extract episodes
    const items = Array.from(xmlDoc.querySelectorAll('item'));
    const episodes = items.map((item, index) => {
      const enclosure = item.querySelector('enclosure');
      const audioUrl = enclosure?.getAttribute('url');

      // Only include items with audio
      if (!audioUrl) return null;

      return {
        id: getElementText(item, 'guid') || getElementText(item, 'link') || `episode-${index}`,
        title: getElementText(item, 'title') || 'Untitled Episode',
        description: getElementText(item, 'description') || '',
        audioUrl: audioUrl,
        duration: getElementText(item, 'itunes\\:duration'),
        pubDate: getElementText(item, 'pubDate'),
        image: getImageUrl(item) || imageUrl
      };
    }).filter(ep => ep !== null);

    return {
      title: title || 'Unknown Podcast',
      description: description || '',
      image: imageUrl,
      episodes
    };
  } catch (error) {
    console.error('RSS parsing error:', error);
    throw new Error(`Failed to parse podcast feed: ${error.message}`);
  }
}

// Helper function to get text content from an element
function getElementText(parent, tagName) {
  const element = parent.querySelector(tagName);
  return element?.textContent?.trim() || '';
}

// Helper function to get image URL (tries multiple sources)
function getImageUrl(parent) {
  // Try itunes:image first
  const itunesImage = parent.querySelector('itunes\\:image');
  if (itunesImage) {
    const href = itunesImage.getAttribute('href');
    if (href) return href;
  }

  // Try regular image element
  const image = parent.querySelector('image url');
  if (image) {
    return image.textContent.trim();
  }

  // Try media:thumbnail
  const mediaThumbnail = parent.querySelector('media\\:thumbnail');
  if (mediaThumbnail) {
    const url = mediaThumbnail.getAttribute('url');
    if (url) return url;
  }

  return null;
}

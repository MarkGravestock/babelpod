// Browser-compatible RSS parser with multiple CORS proxy fallbacks

// Try multiple CORS proxies in order
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  // Direct fetch (will only work if the feed has CORS headers)
  ''
];

export async function parsePodcastFeed(feedUrl) {
  let lastError = null;

  // Try each CORS proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy ? `${proxy}${encodeURIComponent(feedUrl)}` : feedUrl;
      console.log(`Attempting to fetch from: ${proxyUrl}`);

      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
      const language = getLanguageCode(channel);

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

      const result = {
        title: title || 'Unknown Podcast',
        description: description || '',
        image: imageUrl,
        language: language,
        episodes
      };

      console.log('Successfully parsed podcast:', result);
      return result;

    } catch (error) {
      console.warn(`Failed with proxy ${proxy || 'direct'}:`, error.message);
      lastError = error;
      // Continue to next proxy
    }
  }

  // All proxies failed
  console.error('All CORS proxies failed:', lastError);
  throw new Error(`Failed to parse podcast feed: ${lastError?.message || 'All proxies failed'}. Try using the demo podcast instead.`);
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

// Helper function to extract and normalize language code from RSS feed
function getLanguageCode(channel) {
  // Try to get language from <language> tag
  let langCode = getElementText(channel, 'language');

  if (!langCode) {
    // Try iTunes language tag
    langCode = getElementText(channel, 'itunes\\:language');
  }

  if (!langCode) {
    return null;
  }

  // Normalize language code (e.g., "en-US" -> "en", "es-MX" -> "es")
  langCode = langCode.toLowerCase().split('-')[0];

  return langCode;
}

// Export CORS proxies for reuse in other components
export { CORS_PROXIES };

// Function to get CORS-proxied URL
export function getCorsProxiedUrl(url, proxyIndex = 0) {
  if (proxyIndex >= CORS_PROXIES.length) {
    return null; // No more proxies to try
  }

  const proxy = CORS_PROXIES[proxyIndex];
  return proxy ? `${proxy}${encodeURIComponent(url)}` : url;
}

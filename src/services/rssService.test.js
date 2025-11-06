import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parsePodcastFeed } from './rssService';

describe('rssService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    global.DOMParser = class {
      parseFromString(xmlString) {
        // Mock XML parsing - return a simplified mock
        return {
          querySelector: (selector) => {
            if (selector === 'parsererror') return null;
            if (selector === 'channel') {
              return {
                querySelector: (s) => {
                  const mockData = {
                    'title': { textContent: 'Test Podcast' },
                    'description': { textContent: 'A test podcast description' },
                  };
                  return mockData[s] || null;
                }
              };
            }
            return null;
          },
          querySelectorAll: (selector) => {
            if (selector === 'item') {
              return [{
                querySelector: (s) => {
                  const mockItem = {
                    'title': { textContent: 'Episode 1' },
                    'description': { textContent: 'First episode' },
                    'guid': { textContent: 'ep1' },
                    'pubDate': { textContent: '2024-01-01' },
                    'enclosure': { getAttribute: () => 'https://example.com/audio.mp3' }
                  };
                  return mockItem[s] || null;
                }
              }];
            }
            return [];
          }
        };
      }
    };
  });

  it('should parse RSS feed successfully', async () => {
    const mockXML = `
      <?xml version="1.0"?>
      <rss><channel>
        <title>Test Podcast</title>
        <description>A test podcast</description>
        <item>
          <title>Episode 1</title>
          <enclosure url="https://example.com/audio.mp3" />
        </item>
      </channel></rss>
    `;

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockXML
    });

    const result = await parsePodcastFeed('https://example.com/feed.xml');

    expect(result).toHaveProperty('title', 'Test Podcast');
    expect(result).toHaveProperty('description', 'A test podcast description');
    expect(result.episodes).toHaveLength(1);
    expect(result.episodes[0]).toHaveProperty('title', 'Episode 1');
    expect(result.episodes[0]).toHaveProperty('audioUrl', 'https://example.com/audio.mp3');
  });

  it('should try multiple CORS proxies on failure', async () => {
    // First proxy fails
    global.fetch.mockRejectedValueOnce(new Error('CORS error'));

    // Second proxy fails
    global.fetch.mockRejectedValueOnce(new Error('CORS error'));

    // Direct fetch fails
    global.fetch.mockRejectedValueOnce(new Error('CORS error'));

    await expect(parsePodcastFeed('https://example.com/feed.xml'))
      .rejects.toThrow('Failed to parse podcast feed');

    // Should have tried all 3 proxies
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle HTTP errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    // Try second proxy
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    // Try third proxy
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(parsePodcastFeed('https://example.com/feed.xml'))
      .rejects.toThrow();
  });

  it('should handle invalid XML', async () => {
    const invalidXML = 'not valid xml';

    // Mock DOMParser to return parse error
    global.DOMParser = class {
      parseFromString() {
        return {
          querySelector: (selector) => {
            if (selector === 'parsererror') return {}; // Error exists
            return null;
          },
          querySelectorAll: () => []
        };
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => invalidXML
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => invalidXML
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => invalidXML
    });

    await expect(parsePodcastFeed('https://example.com/feed.xml'))
      .rejects.toThrow();
  });

  it('should filter out episodes without audio', async () => {
    global.DOMParser = class {
      parseFromString() {
        return {
          querySelector: (selector) => {
            if (selector === 'parsererror') return null;
            if (selector === 'channel') {
              return {
                querySelector: (s) => {
                  // Return null for image elements to avoid getAttribute errors
                  if (s.includes('image') || s.includes('thumbnail')) return null;
                  return { textContent: 'Test' };
                }
              };
            }
            return null;
          },
          querySelectorAll: (selector) => {
            if (selector === 'item') {
              return [
                {
                  querySelector: (s) => {
                    if (s === 'enclosure') return { getAttribute: () => 'http://audio.mp3' };
                    // Return null for image elements to avoid getAttribute errors
                    if (s.includes('image') || s.includes('thumbnail')) return null;
                    return { textContent: 'Episode with audio' };
                  }
                },
                {
                  querySelector: (s) => {
                    if (s === 'enclosure') return null; // No audio
                    // Return null for image elements to avoid getAttribute errors
                    if (s.includes('image') || s.includes('thumbnail')) return null;
                    return { textContent: 'Episode without audio' };
                  }
                }
              ];
            }
            return [];
          }
        };
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<xml></xml>'
    });

    const result = await parsePodcastFeed('https://example.com/feed.xml');

    // Only one episode should be included (the one with audio)
    expect(result.episodes).toHaveLength(1);
  });
});

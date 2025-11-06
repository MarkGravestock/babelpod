import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PodcastLoader from './PodcastLoader';

describe('PodcastLoader', () => {
  beforeEach(() => {
    // Clear local storage before each test
    localStorage.clear();
  });

  it('should render input and load button', () => {
    const mockOnLoad = vi.fn();
    render(<PodcastLoader onPodcastLoad={mockOnLoad} />);

    expect(screen.getByPlaceholderText(/Enter podcast RSS feed URL/i)).toBeInTheDocument();
    expect(screen.getByText(/📡 Load Podcast/i)).toBeInTheDocument();
  });

  it('should show error when submitting empty URL', async () => {
    const mockOnLoad = vi.fn();
    render(<PodcastLoader onPodcastLoad={mockOnLoad} />);

    const button = screen.getByText(/📡 Load Podcast/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a podcast RSS feed URL/i)).toBeInTheDocument();
    });

    expect(mockOnLoad).not.toHaveBeenCalled();
  });

  it('should call onPodcastLoad when valid URL is submitted', async () => {
    const mockOnLoad = vi.fn().mockResolvedValue({
      title: 'Test Podcast',
      episodes: []
    });

    render(<PodcastLoader onPodcastLoad={mockOnLoad} />);

    const input = screen.getByPlaceholderText(/Enter podcast RSS feed URL/i);
    const button = screen.getByText(/📡 Load Podcast/i);

    fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalledWith('https://example.com/feed.xml');
    });
  });

  it('should display recent podcasts from local storage', () => {
    const recentFeeds = [
      {
        url: 'https://example.com/feed1.xml',
        title: 'Podcast 1',
        lastUsed: new Date().toISOString()
      }
    ];

    localStorage.setItem('babelpod_feeds', JSON.stringify(recentFeeds));

    const mockOnLoad = vi.fn();
    render(<PodcastLoader onPodcastLoad={mockOnLoad} />);

    expect(screen.getByText('Recent Podcasts')).toBeInTheDocument();
    expect(screen.getByText('Podcast 1')).toBeInTheDocument();
  });

  it('should load podcast when clicking saved feed', async () => {
    const recentFeeds = [
      {
        url: 'https://example.com/feed1.xml',
        title: 'Podcast 1',
        lastUsed: new Date().toISOString()
      }
    ];

    localStorage.setItem('babelpod_feeds', JSON.stringify(recentFeeds));

    const mockOnLoad = vi.fn().mockResolvedValue({
      title: 'Podcast 1',
      episodes: []
    });

    render(<PodcastLoader onPodcastLoad={mockOnLoad} />);

    const savedFeedButton = screen.getByText('Podcast 1');
    fireEvent.click(savedFeedButton);

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalledWith('https://example.com/feed1.xml');
    });
  });

  it('should remove feed when clicking remove button', async () => {
    const recentFeeds = [
      {
        url: 'https://example.com/feed1.xml',
        title: 'Podcast 1',
        lastUsed: new Date().toISOString()
      }
    ];

    localStorage.setItem('babelpod_feeds', JSON.stringify(recentFeeds));

    const mockOnLoad = vi.fn();
    render(<PodcastLoader onPodcastLoad={mockOnLoad} />);

    expect(screen.getByText('Podcast 1')).toBeInTheDocument();

    const removeButton = screen.getByTitle('Remove from recent');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('Podcast 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Recent Podcasts')).not.toBeInTheDocument();
    });
  });

  it('should show loading state during load', async () => {
    const mockOnLoad = vi.fn().mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve({ title: 'Test', episodes: [] }), 100));
    });

    render(<PodcastLoader onPodcastLoad={mockOnLoad} />);

    const input = screen.getByPlaceholderText(/Enter podcast RSS feed URL/i);
    const button = screen.getByText(/📡 Load Podcast/i);

    fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/⏳ Loading.../i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/📡 Load Podcast/i)).toBeInTheDocument();
    });
  });

  it('should display error message on load failure', async () => {
    const mockOnLoad = vi.fn().mockRejectedValue(new Error('Failed to load'));

    render(<PodcastLoader onPodcastLoad={mockOnLoad} />);

    const input = screen.getByPlaceholderText(/Enter podcast RSS feed URL/i);
    const button = screen.getByText(/📡 Load Podcast/i);

    fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    });
  });
});

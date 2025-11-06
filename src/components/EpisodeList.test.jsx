import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EpisodeList from './EpisodeList';

describe('EpisodeList', () => {
  const mockPodcast = {
    title: 'Test Podcast',
    description: 'A test podcast description',
    image: 'https://example.com/image.jpg'
  };

  const mockEpisodes = [
    {
      id: 'ep1',
      title: 'Episode 1',
      description: 'First episode description',
      audioUrl: 'https://example.com/ep1.mp3',
      pubDate: '2024-01-01',
      duration: '30:00',
      image: 'https://example.com/ep1.jpg'
    },
    {
      id: 'ep2',
      title: 'Episode 2',
      description: 'Second episode description',
      audioUrl: 'https://example.com/ep2.mp3',
      pubDate: '2024-01-08',
      duration: '45:00',
      image: 'https://example.com/ep2.jpg'
    }
  ];

  it('should not render when podcast is null', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <EpisodeList
        podcast={null}
        episodes={[]}
        selectedEpisode={null}
        onEpisodeSelect={mockOnSelect}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when episodes array is empty', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <EpisodeList
        podcast={mockPodcast}
        episodes={[]}
        selectedEpisode={null}
        onEpisodeSelect={mockOnSelect}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render podcast header with title and description', () => {
    const mockOnSelect = vi.fn();
    render(
      <EpisodeList
        podcast={mockPodcast}
        episodes={mockEpisodes}
        selectedEpisode={null}
        onEpisodeSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
    expect(screen.getByText('A test podcast description')).toBeInTheDocument();
    expect(screen.getByText('2 episodes available')).toBeInTheDocument();
  });

  it('should render all episodes', () => {
    const mockOnSelect = vi.fn();
    render(
      <EpisodeList
        podcast={mockPodcast}
        episodes={mockEpisodes}
        selectedEpisode={null}
        onEpisodeSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Episode 1')).toBeInTheDocument();
    expect(screen.getByText('Episode 2')).toBeInTheDocument();
    expect(screen.getByText('First episode description')).toBeInTheDocument();
    expect(screen.getByText('Second episode description')).toBeInTheDocument();
  });

  it('should call onEpisodeSelect when episode is clicked', () => {
    const mockOnSelect = vi.fn();
    render(
      <EpisodeList
        podcast={mockPodcast}
        episodes={mockEpisodes}
        selectedEpisode={null}
        onEpisodeSelect={mockOnSelect}
      />
    );

    const episode1 = screen.getByText('Episode 1').closest('.episode-card');
    fireEvent.click(episode1);

    expect(mockOnSelect).toHaveBeenCalledWith(mockEpisodes[0]);
  });

  it('should highlight selected episode', () => {
    const mockOnSelect = vi.fn();
    render(
      <EpisodeList
        podcast={mockPodcast}
        episodes={mockEpisodes}
        selectedEpisode={mockEpisodes[0]}
        onEpisodeSelect={mockOnSelect}
      />
    );

    const episode1Card = screen.getByText('Episode 1').closest('.episode-card');
    expect(episode1Card).toHaveClass('selected');

    const episode2Card = screen.getByText('Episode 2').closest('.episode-card');
    expect(episode2Card).not.toHaveClass('selected');
  });

  it('should display episode metadata (date and duration)', () => {
    const mockOnSelect = vi.fn();
    render(
      <EpisodeList
        podcast={mockPodcast}
        episodes={mockEpisodes}
        selectedEpisode={null}
        onEpisodeSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('30:00')).toBeInTheDocument();
    expect(screen.getByText('45:00')).toBeInTheDocument();
  });

  it('should display episode images', () => {
    const mockOnSelect = vi.fn();
    render(
      <EpisodeList
        podcast={mockPodcast}
        episodes={mockEpisodes}
        selectedEpisode={null}
        onEpisodeSelect={mockOnSelect}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(2); // At least 2 episode images
  });
});

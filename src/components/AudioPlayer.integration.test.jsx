/**
 * Integration tests for AudioPlayer translation flow
 * Tests the complete user journey including audio playback
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AudioPlayer from './AudioPlayer';

// Mock translation service
vi.mock('../services/translationService', () => ({
  translateAudioSegment: vi.fn(async () => ({
    originalText: 'Hola mundo',
    translatedText: 'Hello world',
    segment: { startTime: 10, endTime: 25, duration: 15 }
  })),
  speakText: vi.fn(async () => {
    // Simulate speech delay
    await new Promise(resolve => setTimeout(resolve, 100));
  })
}));

// Mock RSS service
vi.mock('../services/rssService', () => ({
  getCorsProxiedUrl: vi.fn((url) => url),
  CORS_PROXIES: ['https://proxy1.com/', 'https://proxy2.com/']
}));

describe('AudioPlayer Integration Tests', () => {
  const mockEpisode = {
    title: 'Test Episode',
    description: 'Test Description',
    audioUrl: 'test-audio.mp3',
    image: 'test-image.jpg'
  };

  const mockSettings = {
    transcriptionMethod: 'selfhosted',
    selfHostedWhisperUrl: 'http://localhost:9000',
    sourceLang: 'es',
    targetLang: 'en'
  };

  beforeEach(() => {
    // Mock HTMLMediaElement for audio
    window.HTMLMediaElement.prototype.load = vi.fn(function() {
      setTimeout(() => {
        if (this.onloadedmetadata) {
          this.onloadedmetadata();
        }
      }, 0);
    });

    window.HTMLMediaElement.prototype.play = vi.fn(function() {
      return Promise.resolve();
    });

    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('should save and restore original audio position after translation', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AudioPlayer episode={mockEpisode} settings={mockSettings} />
    );

    // Get the audio element
    const audioElement = container.querySelector('audio');
    await waitFor(() => {
      expect(audioElement).toBeTruthy();
    });

    // Simulate audio playing at 25 seconds
    audioElement.currentTime = 25;
    audioElement.dispatchEvent(new Event('timeupdate'));

    // Click the translate button
    const translateButton = screen.getByRole('button', { name: /rewind 15s & translate/i });
    await user.click(translateButton);

    // Wait for translation to complete
    await waitFor(() => {
      expect(screen.queryByText(/transcribing/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify audio position was restored to original (25s, not 10s)
    expect(audioElement.currentTime).toBe(25);
  });

  it('should pause audio during translation and resume if it was playing', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer episode={mockEpisode} settings={mockSettings} />);

    await waitFor(() => {
      expect(audioElement).toBeDefined();
    });

    // Start playing
    audioElement.currentTime = 30;
    audioElement.paused = false;

    const translateButton = screen.getByRole('button', { name: /rewind 15s & translate/i });
    await user.click(translateButton);

    // Should pause immediately
    expect(audioElement.pause).toHaveBeenCalled();

    // Wait for translation to complete
    await waitFor(() => {
      expect(screen.queryByText(/translation complete/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should resume playing
    expect(audioElement.play).toHaveBeenCalled();
  });

  it('should show transcribed and translated text during translation', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer episode={mockEpisode} settings={mockSettings} />);

    await waitFor(() => {
      expect(audioElement).toBeDefined();
    });

    audioElement.currentTime = 20;

    const translateButton = screen.getByRole('button', { name: /rewind 15s & translate/i });
    await user.click(translateButton);

    // Wait for transcribed text to appear
    await waitFor(() => {
      expect(screen.getByText('Hola mundo')).toBeInTheDocument();
    });

    // Wait for translated text to appear
    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    // Text should have labels
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Translation')).toBeInTheDocument();
  });

  it('should clear translation texts after delay', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer episode={mockEpisode} settings={mockSettings} />);

    await waitFor(() => {
      expect(audioElement).toBeDefined();
    });

    audioElement.currentTime = 15;

    const translateButton = screen.getByRole('button', { name: /rewind 15s & translate/i });
    await user.click(translateButton);

    // Wait for texts to appear
    await waitFor(() => {
      expect(screen.getByText('Hola mundo')).toBeInTheDocument();
    });

    // Wait for texts to disappear (3 second delay + 300ms fade)
    await waitFor(() => {
      expect(screen.queryByText('Hola mundo')).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should restore position on error', async () => {
    const { translateAudioSegment } = await import('../services/translationService');

    // Make translation fail
    translateAudioSegment.mockRejectedValueOnce(new Error('Translation failed'));

    const user = userEvent.setup();
    render(<AudioPlayer episode={mockEpisode} settings={mockSettings} />);

    await waitFor(() => {
      expect(audioElement).toBeDefined();
    });

    const originalPosition = 35;
    audioElement.currentTime = originalPosition;

    const translateButton = screen.getByRole('button', { name: /rewind 15s & translate/i });
    await user.click(translateButton);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    // Should restore original position even on error
    expect(audioElement.currentTime).toBe(originalPosition);
  });

  it('should disable translate button when audio time is less than 1 second', () => {
    render(<AudioPlayer episode={mockEpisode} settings={mockSettings} />);

    audioElement.currentTime = 0.5;

    if (audioElement.ontimeupdate) {
      audioElement.ontimeupdate();
    }

    const translateButton = screen.getByRole('button', { name: /rewind 15s & translate/i });
    expect(translateButton).toBeDisabled();
  });

  it('should enable translate button when audio time is greater than 1 second', async () => {
    render(<AudioPlayer episode={mockEpisode} settings={mockSettings} />);

    await waitFor(() => {
      expect(audioElement).toBeDefined();
    });

    audioElement.currentTime = 5;

    if (audioElement.ontimeupdate) {
      audioElement.ontimeupdate();
    }

    await waitFor(() => {
      const translateButton = screen.getByRole('button', { name: /rewind 15s & translate/i });
      expect(translateButton).not.toBeDisabled();
    });
  });
});

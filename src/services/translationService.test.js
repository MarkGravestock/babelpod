import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateText, speakText, extractAudioSegment } from './translationService';

describe('translationService', () => {
  describe('extractAudioSegment', () => {
    it('should extract segment info from audio element', async () => {
      const mockAudio = {
        currentTime: 30
      };

      const result = await extractAudioSegment(mockAudio, 15);

      expect(result).toEqual({
        startTime: 15,
        endTime: 30,
        duration: 15
      });
    });

    it('should not go below 0 for start time', async () => {
      const mockAudio = {
        currentTime: 5
      };

      const result = await extractAudioSegment(mockAudio, 15);

      expect(result.startTime).toBe(0);
      expect(result.duration).toBe(5);
    });
  });

  describe('translateText', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should translate text successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: {
            translatedText: 'Hello, how are you?'
          }
        })
      });

      const result = await translateText('Hola, como estas?', 'es', 'en');

      expect(result).toBe('Hello, how are you?');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.mymemory.translated.net')
      );
    });

    it('should throw error on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(translateText('test', 'es', 'en')).rejects.toThrow('Translation failed');
    });

    it('should handle API error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 500,
          responseDetails: 'API Error'
        })
      });

      await expect(translateText('test', 'es', 'en')).rejects.toThrow('API Error');
    });
  });

  describe('speakText', () => {
    beforeEach(() => {
      // Mock speechSynthesis
      global.window = {
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: vi.fn(() => [
            { lang: 'en-US', name: 'English Voice' },
            { lang: 'es-ES', name: 'Spanish Voice' }
          ])
        }
      };
      global.SpeechSynthesisUtterance = vi.fn(function(text) {
        this.text = text;
        this.lang = '';
        this.rate = 1;
        this.voice = null;
        this.onend = null;
        this.onerror = null;
      });
    });

    it('should speak text with correct language', async () => {
      // Create a promise that will resolve when speak is called
      const speakPromise = speakText('Hello world', 'en-US');

      // Get the utterance that was created
      const utteranceInstance = SpeechSynthesisUtterance.mock.results[0].value;

      // Verify the utterance was configured correctly
      expect(utteranceInstance.text).toBe('Hello world');
      expect(utteranceInstance.lang).toBe('en-US');

      // Simulate speech ending
      if (utteranceInstance.onend) {
        utteranceInstance.onend();
      }

      await speakPromise;

      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('should reject if speechSynthesis is not supported', async () => {
      delete global.window.speechSynthesis;

      await expect(speakText('test')).rejects.toThrow(
        'Text-to-speech not supported in this browser'
      );
    });
  });
});

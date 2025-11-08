import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transcribeWithSelfHostedWhisper } from './selfHostedWhisperTranscription';

// Mock MediaRecorder
class MockMediaRecorder {
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
    this.onerror = null;
  }

  start(timeslice) {
    this.state = 'recording';
    // Simulate data chunks being recorded
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({
          data: new Blob(['test audio data 1'], { type: this.options.mimeType })
        });
      }
    }, 50);
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({
          data: new Blob(['test audio data 2'], { type: this.options.mimeType })
        });
      }
    }, 150);
  }

  stop() {
    this.state = 'inactive';
    setTimeout(() => {
      if (this.onstop) {
        this.onstop();
      }
    }, 10);
  }

  static isTypeSupported(mimeType) {
    return mimeType === 'audio/webm;codecs=opus';
  }
}

describe('selfHostedWhisperTranscription', () => {
  let originalMediaRecorder;
  let originalAudioContext;

  beforeEach(() => {
    // Save originals
    originalMediaRecorder = global.MediaRecorder;
    originalAudioContext = global.AudioContext;

    // Set up mocks
    global.MediaRecorder = MockMediaRecorder;
    global.fetch = vi.fn();

    // Mock AudioContext
    global.AudioContext = function() {
      return {
        createMediaElementSource: vi.fn(() => ({
          connect: vi.fn(),
          disconnect: vi.fn()
        })),
        createMediaStreamDestination: vi.fn(() => ({
          stream: {}
        })),
        destination: {},
        state: 'running',
        close: vi.fn()
      };
    };

    // Mock Audio constructor - store instances for test access
    global.Audio = function() {
      const instance = {
        src: '',
        crossOrigin: '',
        preload: '',
        currentTime: 0,
        duration: 100,
        load: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        onloadedmetadata: null,
        onerror: null,
        onplay: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      if (!global.Audio.instances) {
        global.Audio.instances = [];
      }
      global.Audio.instances.push(instance);
      return instance;
    };
  });

  afterEach(() => {
    global.MediaRecorder = originalMediaRecorder;
    global.AudioContext = originalAudioContext;
    if (global.Audio && global.Audio.instances) {
      delete global.Audio.instances;
    }
    vi.clearAllMocks();
  });

  describe('transcribeWithSelfHostedWhisper', () => {
    it('should throw error if API URL is not provided', async () => {
      const mockAudio = {};
      await expect(
        transcribeWithSelfHostedWhisper(mockAudio, 0, 15, 'es', '')
      ).rejects.toThrow('Self-hosted Whisper API URL is required');
    });

    it('should use provided audio buffer (continuous strategy)', async () => {
      const mockAudio = { src: 'test.mp3', crossOrigin: 'anonymous' };
      const mockBuffer = new Blob(['buffered audio'], { type: 'audio/webm' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          text: 'Hola mundo',
          language: 'spanish'
        })
      });

      const result = await transcribeWithSelfHostedWhisper(
        mockAudio,
        0,
        15,
        'auto',
        'http://localhost:9001',
        mockBuffer
      );

      expect(result).toEqual({
        text: 'Hola mundo',
        language: 'es' // Should map 'spanish' to 'es'
      });

      // Should not create Audio element when using buffer
      expect(global.Audio.instances || []).toHaveLength(0);
    });

    it('should record audio on-demand when buffer not provided', async () => {
      vi.useFakeTimers();

      const mockAudio = {
        src: 'test.mp3',
        crossOrigin: 'anonymous',
        currentTime: 0,
        duration: 100
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          text: 'Hello world',
          language: 'english'
        })
      });

      // Start the transcription (don't await yet)
      const transcriptionPromise = transcribeWithSelfHostedWhisper(
        mockAudio,
        10,
        25,
        'auto',
        'http://localhost:9001'
      );

      // Advance timers to trigger audio loaded
      await vi.advanceTimersByTimeAsync(50);

      // Trigger audio loaded event
      const audioInstance = global.Audio.instances[0];
      if (audioInstance && audioInstance.onloadedmetadata) {
        audioInstance.onloadedmetadata();
      }

      // Advance to allow setup
      await vi.advanceTimersByTimeAsync(50);

      // Trigger play event to start recording
      if (audioInstance && audioInstance.onplay) {
        audioInstance.onplay();
      }

      // Advance timers through the recording duration (15 seconds)
      await vi.advanceTimersByTimeAsync(15000);

      // Advance a bit more to allow mediaRecorder.onstop to fire
      await vi.advanceTimersByTimeAsync(50);

      // Now await the transcription result
      const result = await transcriptionPromise;

      expect(result).toEqual({
        text: 'Hello world',
        language: 'en' // Should map 'english' to 'en'
      });

      // Should have created an Audio element for on-demand recording
      expect(global.Audio.instances).toHaveLength(1);

      vi.useRealTimers();
    });

    it('should handle plain text response from API', async () => {
      const mockAudio = { src: 'test.mp3', crossOrigin: 'anonymous' };
      const mockBuffer = new Blob(['buffered audio'], { type: 'audio/webm' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'text/plain']]),
        text: async () => 'Plain text transcription'
      });

      const result = await transcribeWithSelfHostedWhisper(
        mockAudio,
        0,
        15,
        'es',
        'http://localhost:9001',
        mockBuffer
      );

      expect(result).toEqual({
        text: 'Plain text transcription',
        language: 'es' // Should use input language for plain text
      });
    });

    it('should map language names to ISO codes', async () => {
      const mockAudio = { src: 'test.mp3', crossOrigin: 'anonymous' };
      const mockBuffer = new Blob(['buffered audio'], { type: 'audio/webm' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          text: 'Dzień dobry',
          language: 'polish'
        })
      });

      const result = await transcribeWithSelfHostedWhisper(
        mockAudio,
        0,
        15,
        'auto',
        'http://localhost:9001',
        mockBuffer
      );

      expect(result.language).toBe('pl'); // 'polish' should map to 'pl'
    });

    it('should throw error when API returns error', async () => {
      const mockAudio = { src: 'test.mp3', crossOrigin: 'anonymous' };
      const mockBuffer = new Blob(['buffered audio'], { type: 'audio/webm' });

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error'
      });

      await expect(
        transcribeWithSelfHostedWhisper(mockAudio, 0, 15, 'es', 'http://localhost:9001', mockBuffer)
      ).rejects.toThrow('Self-hosted Whisper API error');
    });

    it('should throw error when no speech detected', async () => {
      const mockAudio = { src: 'test.mp3', crossOrigin: 'anonymous' };
      const mockBuffer = new Blob(['buffered audio'], { type: 'audio/webm' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          text: '',
          language: 'english'
        })
      });

      await expect(
        transcribeWithSelfHostedWhisper(mockAudio, 0, 15, 'auto', 'http://localhost:9001', mockBuffer)
      ).rejects.toThrow('No speech detected');
    });

    it('should handle connection errors gracefully', async () => {
      const mockAudio = { src: 'test.mp3', crossOrigin: 'anonymous' };
      const mockBuffer = new Blob(['buffered audio'], { type: 'audio/webm' });

      global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(
        transcribeWithSelfHostedWhisper(mockAudio, 0, 15, 'es', 'http://localhost:9001', mockBuffer)
      ).rejects.toThrow('Cannot connect to self-hosted Whisper API');
    });

    it('should normalize API URL by removing trailing slash', async () => {
      const mockAudio = { src: 'test.mp3', crossOrigin: 'anonymous' };
      const mockBuffer = new Blob(['buffered audio'], { type: 'audio/webm' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          text: 'Test',
          language: 'english'
        })
      });

      await transcribeWithSelfHostedWhisper(
        mockAudio,
        0,
        15,
        'auto',
        'http://localhost:9001/', // URL with trailing slash
        mockBuffer
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:9001/asr', // Should be normalized without double slash
        expect.any(Object)
      );
    });

    it('should send correct FormData to API', async () => {
      const mockAudio = { src: 'test.mp3', crossOrigin: 'anonymous' };
      const mockBuffer = new Blob(['buffered audio'], { type: 'audio/webm' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          text: 'Test',
          language: 'english'
        })
      });

      await transcribeWithSelfHostedWhisper(
        mockAudio,
        0,
        15,
        'es',
        'http://localhost:9001',
        mockBuffer
      );

      const fetchCall = global.fetch.mock.calls[0];
      const formData = fetchCall[1].body;

      expect(formData).toBeInstanceOf(FormData);
      // Note: We can't easily inspect FormData contents in tests,
      // but we verify it was created and sent
    });
  });
});

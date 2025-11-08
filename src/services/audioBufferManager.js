// Audio Buffer Manager for continuous recording
// Maintains a rolling buffer of the last N seconds of audio

/**
 * Creates and manages a continuous audio buffer
 */
export class AudioBufferManager {
  constructor(audioElement, bufferDuration = 15000) {
    this.audioElement = audioElement;
    this.bufferDuration = bufferDuration;
    this.audioChunks = [];
    this.mediaRecorder = null;
    this.audioContext = null;
    this.source = null;
    this.isRecording = false;
    this.tempAudio = null;
  }

  /**
   * Start continuous recording
   */
  async start() {
    if (this.isRecording) {
      console.log('Buffer already recording');
      return;
    }

    try {
      // Create a temporary audio element for buffering
      // This prevents interference with the main audio playback
      this.tempAudio = new Audio();
      this.tempAudio.src = this.audioElement.src;
      this.tempAudio.crossOrigin = this.audioElement.crossOrigin;
      this.tempAudio.muted = true; // Mute the buffer audio to avoid echo
      this.tempAudio.volume = 0;

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.source = this.audioContext.createMediaElementSource(this.tempAudio);
      const destination = this.audioContext.createMediaStreamDestination();

      // Connect to recording destination (not speakers)
      this.source.connect(destination);

      this.mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm'
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push({
            blob: e.data,
            timestamp: Date.now()
          });

          // Remove chunks older than buffer duration
          this.cleanOldChunks();
        }
      };

      // Request data every second to maintain smooth buffer
      this.mediaRecorder.start(1000);

      // Keep temp audio in sync with main audio
      this.syncInterval = setInterval(() => {
        if (this.tempAudio && this.audioElement && !this.audioElement.paused) {
          // Sync position
          const timeDiff = Math.abs(this.tempAudio.currentTime - this.audioElement.currentTime);
          if (timeDiff > 0.5) { // If more than 500ms out of sync
            this.tempAudio.currentTime = this.audioElement.currentTime;
          }

          // Ensure temp audio is playing when main audio is playing
          if (this.tempAudio.paused && !this.audioElement.paused) {
            this.tempAudio.play().catch(e => console.error('Failed to play temp audio:', e));
          }
        }
      }, 500);

      this.isRecording = true;
      console.log('Audio buffer started - continuous recording active');

    } catch (error) {
      console.error('Failed to start audio buffer:', error);
      this.stop();
      throw error;
    }
  }

  /**
   * Stop continuous recording
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(e => console.error('Error closing AudioContext:', e));
      this.audioContext = null;
    }

    if (this.tempAudio) {
      this.tempAudio.pause();
      this.tempAudio.src = '';
      this.tempAudio.load();
      this.tempAudio = null;
    }

    this.audioChunks = [];
    this.isRecording = false;
    console.log('Audio buffer stopped');
  }

  /**
   * Remove chunks older than buffer duration
   */
  cleanOldChunks() {
    const cutoff = Date.now() - this.bufferDuration;
    while (this.audioChunks.length > 0 && this.audioChunks[0].timestamp < cutoff) {
      this.audioChunks.shift();
    }
  }

  /**
   * Get the buffered audio as a Blob
   * @returns {Blob} The buffered audio
   */
  getBufferedAudio() {
    if (this.audioChunks.length === 0) {
      throw new Error('No audio in buffer. Make sure continuous buffering is enabled and audio is playing.');
    }

    // Clean old chunks before creating blob
    this.cleanOldChunks();

    const blobs = this.audioChunks.map(chunk => chunk.blob);
    const audioBlob = new Blob(blobs, { type: 'audio/webm' });

    console.log(`Returning buffered audio: ${this.audioChunks.length} chunks, ${(audioBlob.size / 1024).toFixed(2)} KB`);

    return audioBlob;
  }

  /**
   * Update the source audio element (when episode changes)
   */
  updateSource(audioElement) {
    const wasRecording = this.isRecording;

    if (wasRecording) {
      this.stop();
    }

    this.audioElement = audioElement;

    if (wasRecording) {
      // Restart with new source
      setTimeout(() => {
        this.start().catch(e => console.error('Failed to restart buffer:', e));
      }, 500);
    }
  }
}

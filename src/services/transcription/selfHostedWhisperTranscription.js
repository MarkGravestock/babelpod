// Self-hosted Whisper API transcription

// Keep track of the audio context and source across calls
let persistentAudioContext = null;
let persistentSource = null;
let connectedAudioElement = null;

/**
 * Record audio segment from audio element to a blob
 * @param {HTMLAudioElement} audioElement - The audio element
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @returns {Promise<Blob>} - Audio blob
 */
async function recordAudioSegment(audioElement, startTime, endTime) {
  return new Promise((resolve, reject) => {
    let mediaRecorder = null;

    const cleanup = () => {
      try {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };

    try {
      // Create or reuse the AudioContext and MediaElementSource
      if (!persistentAudioContext || persistentAudioContext.state === 'closed') {
        persistentAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Only create a new source if we haven't connected this audio element yet
      if (!persistentSource || connectedAudioElement !== audioElement) {
        // Disconnect previous source if it exists
        if (persistentSource) {
          try {
            persistentSource.disconnect();
          } catch (e) {
            // Ignore disconnect errors
          }
        }

        // Create new source for this audio element
        persistentSource = persistentAudioContext.createMediaElementSource(audioElement);
        connectedAudioElement = audioElement;

        // Connect to destination for audio output
        persistentSource.connect(persistentAudioContext.destination);
      }

      // Create a new destination for recording each time
      const destination = persistentAudioContext.createMediaStreamDestination();

      // Temporarily connect to the recording destination
      persistentSource.connect(destination);

      mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Disconnect from recording destination
        try {
          persistentSource.disconnect(destination);
        } catch (e) {
          // Ignore disconnect errors
        }

        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        resolve(blob);
      };

      mediaRecorder.onerror = (error) => {
        cleanup();
        reject(new Error(`MediaRecorder error: ${error.message || 'Unknown error'}`));
      };

      // Set audio to start time
      audioElement.currentTime = startTime;

      const playHandler = () => {
        mediaRecorder.start();

        // Stop recording after duration
        const duration = (endTime - startTime) * 1000;
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, duration);

        // Remove event listener after it fires
        audioElement.removeEventListener('play', playHandler);
      };

      audioElement.addEventListener('play', playHandler);

      audioElement.play().catch(error => {
        cleanup();
        audioElement.removeEventListener('play', playHandler);
        reject(new Error(`Failed to play audio: ${error.message}`));
      });

    } catch (error) {
      cleanup();
      reject(new Error(`Failed to record audio segment: ${error.message}`));
    }
  });
}

/**
 * Transcribe audio using self-hosted Whisper API
 * @param {HTMLAudioElement} audioElement - The audio element to transcribe from
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @param {string} language - Language code (e.g., 'es', 'fr')
 * @param {string} apiUrl - Self-hosted Whisper API URL
 * @returns {Promise<string>} - The transcribed text
 */
export async function transcribeWithSelfHostedWhisper(audioElement, startTime, endTime, language, apiUrl) {
  if (!apiUrl) {
    throw new Error('Self-hosted Whisper API URL is required. Please configure it in Settings.');
  }

  // Normalize API URL (remove trailing slash)
  const baseUrl = apiUrl.replace(/\/$/, '');

  try {
    // Step 1: Record the audio segment
    console.log(`Recording audio segment from ${startTime}s to ${endTime}s`);
    const audioBlob = await recordAudioSegment(audioElement, startTime, endTime);

    // Step 2: Send to self-hosted Whisper API
    // whisper-asr-webservice uses a different endpoint format
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.webm');
    // Only specify language if provided, otherwise Whisper will auto-detect
    // whisper-asr-webservice auto-detects when language is not provided or empty
    if (language && language !== 'auto') {
      formData.append('language', language);
    }
    formData.append('task', 'transcribe');
    formData.append('output', 'txt');

    console.log(`Sending to self-hosted Whisper API at ${baseUrl}/asr...`);
    const response = await fetch(`${baseUrl}/asr`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Self-hosted Whisper API error: ${errorMessage}`);
    }

    const result = await response.text();
    console.log('Self-hosted Whisper transcription:', result);

    if (!result || result.trim() === '') {
      throw new Error('No speech detected in the audio segment');
    }

    return result.trim();

  } catch (error) {
    // Provide more helpful error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to self-hosted Whisper API at ${baseUrl}. Make sure the service is running and accessible.`);
    }
    throw new Error(`Self-hosted Whisper transcription failed: ${error.message}`);
  }
}

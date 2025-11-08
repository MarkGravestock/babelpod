// OpenAI Whisper API transcription

/**
 * Record audio segment from audio element to a blob
 * @param {HTMLAudioElement} audioElement - The audio element
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @returns {Promise<Blob>} - Audio blob
 */
async function recordAudioSegment(audioElement, startTime, endTime) {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioElement);
      const destination = audioContext.createMediaStreamDestination();

      source.connect(destination);
      source.connect(audioContext.destination);

      const mediaRecorder = new MediaRecorder(destination.stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        audioElement.pause();
        resolve(blob);
      };

      // Set audio to start time
      audioElement.currentTime = startTime;

      audioElement.onplay = () => {
        mediaRecorder.start();

        // Stop recording after duration
        const duration = (endTime - startTime) * 1000;
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, duration);
      };

      audioElement.play().catch(error => {
        reject(new Error(`Failed to play audio: ${error.message}`));
      });

    } catch (error) {
      reject(new Error(`Failed to record audio segment: ${error.message}`));
    }
  });
}

/**
 * Transcribe audio using OpenAI Whisper API
 * @param {HTMLAudioElement} audioElement - The audio element to transcribe from
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @param {string} language - Language code (e.g., 'es', 'fr') or 'auto' for auto-detect
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<{text: string, language: string}>} - The transcribed text and detected language
 */
export async function transcribeWithWhisper(audioElement, startTime, endTime, language, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Please add your API key in Settings.');
  }

  try {
    // Step 1: Record the audio segment
    console.log(`Recording audio segment from ${startTime}s to ${endTime}s`);
    const audioBlob = await recordAudioSegment(audioElement, startTime, endTime);

    // Step 2: Send to Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    // Only specify language if provided, otherwise Whisper will auto-detect
    if (language && language !== 'auto') {
      formData.append('language', language);
    }
    // Use verbose_json to get detected language
    formData.append('response_format', 'verbose_json');

    console.log('Sending to Whisper API...');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Whisper API error: ${errorMessage}`);
    }

    const result = await response.json();
    console.log('Whisper transcription:', result);

    if (!result.text || result.text.trim() === '') {
      throw new Error('No speech detected in the audio segment');
    }

    return {
      text: result.text.trim(),
      language: result.language || language || 'auto' // Return detected language
    };

  } catch (error) {
    throw new Error(`Whisper transcription failed: ${error.message}`);
  }
}

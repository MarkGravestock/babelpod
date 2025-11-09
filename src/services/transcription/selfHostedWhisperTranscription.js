// Self-hosted Whisper API transcription

/**
 * Map Whisper language names to ISO 639-1 codes
 * Whisper returns language names like "english", "spanish", "polish"
 * Translation APIs need ISO codes like "en", "es", "pl"
 */
function whisperLanguageToISO(languageName) {
  const languageMap = {
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'dutch': 'nl',
    'russian': 'ru',
    'chinese': 'zh',
    'japanese': 'ja',
    'korean': 'ko',
    'arabic': 'ar',
    'turkish': 'tr',
    'polish': 'pl',
    'danish': 'da',
    'swedish': 'sv',
    'norwegian': 'no',
    'finnish': 'fi',
    'greek': 'el',
    'czech': 'cs',
    'hungarian': 'hu',
    'romanian': 'ro',
    'bulgarian': 'bg',
    'ukrainian': 'uk',
    'croatian': 'hr',
    'serbian': 'sr',
    'slovak': 'sk',
    'slovenian': 'sl',
    'lithuanian': 'lt',
    'latvian': 'lv',
    'estonian': 'et',
    'thai': 'th',
    'vietnamese': 'vi',
    'indonesian': 'id',
    'malay': 'ms',
    'hindi': 'hi',
    'bengali': 'bn',
    'tamil': 'ta',
    'telugu': 'te',
    'hebrew': 'he',
    'persian': 'fa',
    'urdu': 'ur',
    'catalan': 'ca',
    'basque': 'eu',
    'galician': 'gl'
  };

  const normalizedName = languageName?.toLowerCase().trim();
  const isoCode = languageMap[normalizedName];

  if (isoCode) {
    console.log(`Mapped Whisper language "${languageName}" to ISO code "${isoCode}"`);
    return isoCode;
  }

  // If not found in map, return as-is (might already be ISO code)
  console.warn(`Unknown language name from Whisper: "${languageName}", using as-is`);
  return languageName || 'auto';
}

/**
 * Record audio segment from audio element to a blob
 * @param {HTMLAudioElement} audioElement - The audio element
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @returns {Promise<Blob>} - Audio blob
 */
async function recordAudioSegment(audioElement, startTime, endTime) {
  return new Promise((resolve, reject) => {
    let audioContext = null;
    let source = null;
    let tempAudio = null;
    let mediaRecorder = null;

    const cleanup = () => {
      try {
        if (tempAudio) {
          tempAudio.pause();
          tempAudio.onplay = null;
          tempAudio.src = '';
          tempAudio.load();
        }
        if (source) {
          source.disconnect();
        }
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };

    // Create a temporary audio element for recording
    // This prevents the "already connected" error on subsequent recordings
    tempAudio = new Audio();
    tempAudio.src = audioElement.src;
    tempAudio.crossOrigin = audioElement.crossOrigin;
    tempAudio.preload = 'auto';

    // Wait for audio to be ready
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Audio loading timeout'));
    }, 10000);

    tempAudio.onloadedmetadata = () => {
      clearTimeout(timeout);
      console.log(`Audio loaded. Duration: ${tempAudio.duration}s`);

      try {
        // Set audio to start time and verify it's valid
        if (startTime < 0 || startTime >= tempAudio.duration) {
          throw new Error(`Invalid start time ${startTime}s (duration: ${tempAudio.duration}s)`);
        }
        let validEndTime = endTime;
        if (endTime > tempAudio.duration) {
          console.warn(`End time ${endTime}s exceeds duration ${tempAudio.duration}s, clamping to duration`);
          validEndTime = tempAudio.duration;
        }

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaElementSource(tempAudio);
        const destination = audioContext.createMediaStreamDestination();

        // Connect to both the recorder and speakers
        source.connect(destination);
        source.connect(audioContext.destination);

        // Specify mimeType to ensure FFmpeg compatibility
        const mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          throw new Error(`MediaRecorder does not support ${mimeType}`);
        }

        mediaRecorder = new MediaRecorder(destination.stream, { mimeType });
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
            console.log(`Recorded chunk: ${e.data.size} bytes`);
          }
        };

        mediaRecorder.onstop = () => {
          console.log(`Recording stopped. Total chunks: ${chunks.length}`);

          if (chunks.length === 0) {
            cleanup();
            reject(new Error('No audio data was recorded'));
            return;
          }

          const blob = new Blob(chunks, { type: mimeType });
          console.log(`Created audio blob: ${blob.size} bytes`);

          // Pause audio before cleanup
          if (tempAudio) {
            tempAudio.pause();
          }

          // Clean up AudioContext and disconnect source
          cleanup();

          resolve(blob);
        };

        mediaRecorder.onerror = (error) => {
          cleanup();
          reject(new Error(`MediaRecorder error: ${error.message || 'Unknown error'}`));
        };

        tempAudio.currentTime = startTime;

        tempAudio.onplay = () => {
          console.log(`Starting recording from ${startTime}s to ${validEndTime}s`);

          // Request data every 100ms to ensure we get chunks
          mediaRecorder.start(100);

          // Stop recording after duration
          const duration = (validEndTime - startTime) * 1000;
          setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              console.log('Stopping recording...');
              mediaRecorder.stop();
            }
          }, duration);
        };

        tempAudio.play().catch(error => {
          cleanup();
          reject(new Error(`Failed to play audio: ${error.message}`));
        });

      } catch (error) {
        cleanup();
        reject(new Error(`Failed to record audio segment: ${error.message}`));
      }
    };

    tempAudio.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Failed to load audio'));
    };

    // Trigger load
    tempAudio.load();
  });
}

/**
 * Transcribe audio using self-hosted Whisper API
 * @param {HTMLAudioElement} audioElement - The audio element to transcribe from
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @param {string} language - Language code (e.g., 'es', 'fr') or 'auto' for auto-detect
 * @param {string} apiUrl - Self-hosted Whisper API URL
 * @param {Blob} audioBuffer - Optional pre-recorded audio buffer (for continuous buffering strategy)
 * @returns {Promise<{text: string, language: string}>} - The transcribed text and detected language
 */
export async function transcribeWithSelfHostedWhisper(audioElement, startTime, endTime, language, apiUrl, audioBuffer = null) {
  if (!apiUrl) {
    throw new Error('Self-hosted Whisper API URL is required. Please configure it in Settings.');
  }

  // Normalize API URL (remove trailing slash)
  const baseUrl = apiUrl.replace(/\/$/, '');

  try {
    let audioBlob;

    if (audioBuffer) {
      // Step 1a: Use provided buffer (continuous buffering strategy)
      console.log('Using pre-recorded audio buffer (continuous strategy)');
      audioBlob = audioBuffer;
    } else {
      // Step 1b: Record the audio segment on-demand (traditional strategy)
      console.log(`Recording audio segment from ${startTime}s to ${endTime}s (on-demand strategy)`);
      audioBlob = await recordAudioSegment(audioElement, startTime, endTime);
    }

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
    // Use json output to get detected language
    formData.append('output', 'json');

    console.log(`Sending to self-hosted Whisper API at ${baseUrl}/asr...`);
    const response = await fetch(`${baseUrl}/asr`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Self-hosted Whisper API error: ${errorMessage}`);
    }

    // whisper-asr-webservice returns JSON with 'json' output format
    const contentType = response.headers.get('content-type');
    let result;
    let text;
    let detectedLanguage = language || 'auto';

    if (contentType && contentType.includes('application/json')) {
      // JSON response - should include detected language
      result = await response.json();
      console.log('Self-hosted Whisper transcription (JSON):', result);
      text = result.text || '';

      // Convert language name to ISO code if detected
      if (result.language) {
        detectedLanguage = whisperLanguageToISO(result.language);
      } else {
        detectedLanguage = language || 'auto';
      }
    } else {
      // Plain text response - language detection not available
      text = await response.text();
      console.log('Self-hosted Whisper transcription (text):', text);
      // When we get plain text, we can't determine the detected language
      // Use the input language if provided, otherwise default to 'auto'
      detectedLanguage = (language && language !== 'auto') ? language : 'auto';
    }

    if (!text || text.trim() === '') {
      throw new Error('No speech detected in the audio segment');
    }

    return {
      text: text.trim(),
      language: detectedLanguage
    };

  } catch (error) {
    // Provide more helpful error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to self-hosted Whisper API at ${baseUrl}. Make sure the service is running and accessible.`);
    }
    throw new Error(`Self-hosted Whisper transcription failed: ${error.message}`);
  }
}

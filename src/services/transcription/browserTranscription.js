// Browser-based speech recognition using Web Speech API

export function isBrowserSpeechRecognitionSupported() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Transcribe audio from an audio element using browser's SpeechRecognition API
 * @param {HTMLAudioElement} audioElement - The audio element to transcribe from
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @param {string} language - Language code (e.g., 'es-ES', 'fr-FR')
 * @returns {Promise<{text: string, language: string}>} - The transcribed text and language
 */
export async function transcribeWithBrowser(audioElement, startTime, endTime, language = 'es-ES') {
  if (!isBrowserSpeechRecognitionSupported()) {
    throw new Error('Browser speech recognition is not supported. Please use Chrome or Edge, or switch to Whisper API in settings.');
  }

  return new Promise((resolve, reject) => {
    let cleanupCalled = false;
    let audioContext = null;
    let source = null;

    try {
      // Create SpeechRecognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure recognition
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let transcript = '';
      let isRecognitionActive = false;

      // Create audio context and connect to audio element
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      source = audioContext.createMediaElementSource(audioElement);
      const destination = audioContext.createMediaStreamDestination();

      // Connect audio element to both speakers and recognition stream
      source.connect(audioContext.destination);
      source.connect(destination);

      // Handle recognition results
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        cleanup();

        // Provide helpful error messages
        if (event.error === 'no-speech') {
          reject(new Error('Browser speech recognition couldn\'t detect speech. This method works best with microphone input and may not work reliably with podcast audio. For better results, use Self-Hosted Whisper (free, accurate) or OpenAI Whisper API in Settings.'));
        } else if (event.error === 'aborted') {
          reject(new Error('Speech recognition was aborted'));
        } else {
          reject(new Error(`Speech recognition failed: ${event.error}`));
        }
      };

      recognition.onend = () => {
        cleanup();
        if (transcript.trim()) {
          // Extract language code from full language (e.g., 'es-ES' -> 'es')
          const langCode = language.split('-')[0];
          resolve({
            text: transcript.trim(),
            language: langCode
          });
        } else {
          reject(new Error('No speech detected in the audio segment'));
        }
      };

      const cleanup = () => {
        // Prevent double cleanup
        if (cleanupCalled) return;
        cleanupCalled = true;

        isRecognitionActive = false;
        try {
          audioElement.pause();

          // Properly close AudioContext
          if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().catch(e => console.error('Error closing AudioContext:', e));
          }
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      };

      // Start playback and recognition
      audioElement.currentTime = startTime;

      audioElement.onplay = () => {
        if (!isRecognitionActive) {
          recognition.start();
          isRecognitionActive = true;
        }
      };

      // Stop recognition when segment ends
      const duration = (endTime - startTime) * 1000;
      setTimeout(() => {
        if (isRecognitionActive) {
          recognition.stop();
        }
      }, duration);

      // Start playback
      audioElement.play().catch(error => {
        cleanup();
        reject(new Error(`Failed to play audio: ${error.message}`));
      });

    } catch (error) {
      reject(new Error(`Browser transcription failed: ${error.message}`));
    }
  });
}

/**
 * Get language code for SpeechRecognition from simple language code
 * @param {string} lang - Simple language code (e.g., 'es', 'fr')
 * @returns {string} - Full language code (e.g., 'es-ES', 'fr-FR')
 */
export function getFullLanguageCode(lang) {
  const languageMap = {
    'es': 'es-ES',
    'en': 'en-US',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'ja': 'ja-JP',
    'zh': 'zh-CN',
    'ko': 'ko-KR'
  };
  return languageMap[lang] || 'en-US';
}

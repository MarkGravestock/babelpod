// Translation service using free APIs

// Extract audio segment (last N seconds)
export async function extractAudioSegment(audioElement, durationSeconds = 15) {
  const currentTime = audioElement.currentTime;
  const startTime = Math.max(0, currentTime - durationSeconds);

  return {
    startTime,
    endTime: currentTime,
    duration: currentTime - startTime
  };
}

// Transcribe audio using OpenAI Whisper API
// Note: Requires API key - user needs to provide their own
export async function transcribeAudio(audioBlob, sourceLanguage = 'es', apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key required. Please add your key in settings.');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.mp3');
  formData.append('model', 'whisper-1');
  formData.append('language', sourceLanguage);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Transcription failed: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.text;
}

// Translate text using MyMemory Translation API (free, no key required)
export async function translateText(text, sourceLang = 'es', targetLang = 'en') {
  // MyMemory API - completely free, no registration needed
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Translation failed');
  }

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || 'Translation failed');
  }

  return data.responseData.translatedText;
}

// Text-to-speech using Web Speech API (free, built into browsers)
export function speakText(text, lang = 'en-US') {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Text-to-speech not supported in this browser'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for learning

    // Try to find a voice for the target language
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(voice => voice.lang.startsWith(lang.split('-')[0]));
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);

    window.speechSynthesis.speak(utterance);
  });
}

// Record audio segment from audio element
export async function recordAudioSegment(audioElement, startTime, endTime) {
  return new Promise((resolve, reject) => {
    try {
      // Create an audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create media element source
      const source = audioContext.createMediaElementSource(audioElement);

      // Create destination for recording
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination);

      // Create media recorder
      const mediaRecorder = new MediaRecorder(destination.stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        resolve(blob);
      };

      // Set audio to start time and start recording
      audioElement.currentTime = startTime;

      audioElement.onplay = () => {
        mediaRecorder.start();

        // Stop recording after duration
        setTimeout(() => {
          mediaRecorder.stop();
          audioElement.pause();
        }, (endTime - startTime) * 1000);
      };

      audioElement.play();

    } catch (error) {
      reject(new Error(`Failed to record audio segment: ${error.message}`));
    }
  });
}

// Main translation pipeline
export async function translateAudioSegment(
  audioElement,
  durationSeconds = 15,
  sourceLang = 'es',
  targetLang = 'en',
  apiKey = null
) {
  try {
    // Step 1: Extract segment info
    const segment = await extractAudioSegment(audioElement, durationSeconds);

    // For PoC without Whisper API, we'll skip transcription
    // and show a placeholder message
    if (!apiKey) {
      // Use mock transcription for demo
      const mockText = "Este es un texto de ejemplo para demostración.";
      const translatedText = await translateText(mockText, sourceLang, targetLang);

      return {
        originalText: mockText,
        translatedText,
        segment
      };
    }

    // Step 2: Record the audio segment
    // Note: This is complex due to CORS issues with audio sources
    // For PoC, we'll use a simpler approach

    // Step 3: Transcribe (with API key)
    // const audioBlob = await recordAudioSegment(audioElement, segment.startTime, segment.endTime);
    // const originalText = await transcribeAudio(audioBlob, sourceLang, apiKey);

    // Step 4: Translate
    // const translatedText = await translateText(originalText, sourceLang, targetLang);

    // For now, return mock data
    throw new Error('Full transcription requires OpenAI API key. Add your key in settings to enable this feature.');

  } catch (error) {
    throw error;
  }
}

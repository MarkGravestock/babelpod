// Translation service with transcription strategy pattern

import { transcribeWithBrowser, isBrowserSpeechRecognitionSupported, getFullLanguageCode } from './transcription/browserTranscription';
import { transcribeWithWhisper } from './transcription/whisperTranscription';

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

/**
 * Transcribe audio segment using the selected strategy
 * @param {HTMLAudioElement} audioElement - The audio element
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @param {string} sourceLang - Source language code
 * @param {Object} settings - User settings with transcription method and API key
 * @returns {Promise<string>} - The transcribed text
 */
async function transcribeAudioSegment(audioElement, startTime, endTime, sourceLang, settings) {
  const method = settings.transcriptionMethod || 'browser';

  if (method === 'browser') {
    // Use browser SpeechRecognition
    if (!isBrowserSpeechRecognitionSupported()) {
      throw new Error('Browser speech recognition not supported. Please use Chrome/Edge or switch to Whisper API in Settings.');
    }

    const fullLangCode = getFullLanguageCode(sourceLang);
    return await transcribeWithBrowser(audioElement, startTime, endTime, fullLangCode);

  } else if (method === 'whisper') {
    // Use OpenAI Whisper API
    if (!settings.whisperApiKey) {
      throw new Error('OpenAI API key required. Please add your key in Settings.');
    }

    return await transcribeWithWhisper(
      audioElement,
      startTime,
      endTime,
      sourceLang,
      settings.whisperApiKey
    );

  } else {
    throw new Error(`Unknown transcription method: ${method}`);
  }
}

/**
 * Main translation pipeline - transcribe audio segment and translate it
 * @param {HTMLAudioElement} audioElement - The audio element
 * @param {number} durationSeconds - Duration to rewind (default 15s)
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @param {Object} settings - User settings
 * @returns {Promise<Object>} - Object with originalText, translatedText, and segment info
 */
export async function translateAudioSegment(
  audioElement,
  durationSeconds = 15,
  sourceLang = 'es',
  targetLang = 'en',
  settings = {}
) {
  // Step 1: Extract segment info
  const segment = await extractAudioSegment(audioElement, durationSeconds);

  // Step 2: Transcribe the audio segment
  const originalText = await transcribeAudioSegment(
    audioElement,
    segment.startTime,
    segment.endTime,
    sourceLang,
    settings
  );

  console.log('Transcribed text:', originalText);

  // Step 3: Translate the text
  const translatedText = await translateText(originalText, sourceLang, targetLang);

  console.log('Translated text:', translatedText);

  return {
    originalText,
    translatedText,
    segment
  };
}

// Export for testing
export { transcribeAudioSegment };

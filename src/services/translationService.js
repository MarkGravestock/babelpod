// Translation service with transcription strategy pattern

import { transcribeWithBrowser, isBrowserSpeechRecognitionSupported, getFullLanguageCode } from './transcription/browserTranscription';
import { transcribeWithWhisper } from './transcription/whisperTranscription';
import { transcribeWithSelfHostedWhisper } from './transcription/selfHostedWhisperTranscription';

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

  } else if (method === 'selfhosted') {
    // Use self-hosted Whisper API
    if (!settings.selfHostedWhisperUrl) {
      throw new Error('Self-hosted Whisper API URL required. Please configure it in Settings.');
    }

    return await transcribeWithSelfHostedWhisper(
      audioElement,
      startTime,
      endTime,
      sourceLang,
      settings.selfHostedWhisperUrl
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
  const transcriptionResult = await transcribeAudioSegment(
    audioElement,
    segment.startTime,
    segment.endTime,
    sourceLang,
    settings
  );

  console.log('Transcribed text:', transcriptionResult.text);
  console.log('Detected language:', transcriptionResult.language);

  // Step 3: Translate the text
  // Use detected language from transcription if auto-detect was requested
  let detectedSourceLang = transcriptionResult.language;

  // If language is still 'auto' (couldn't be detected), try to use sourceLang
  // If both are 'auto', fall back to a sensible default for translation
  if (detectedSourceLang === 'auto') {
    if (sourceLang !== 'auto') {
      detectedSourceLang = sourceLang;
    } else {
      // Last resort: assume Spanish as it's a common podcast language
      // User can override by manually selecting language in settings
      console.warn('Could not detect language, defaulting to Spanish (es) for translation');
      detectedSourceLang = 'es';
    }
  }

  const translatedText = await translateText(
    transcriptionResult.text,
    detectedSourceLang,
    targetLang
  );

  console.log('Translated text:', translatedText);

  return {
    originalText: transcriptionResult.text,
    translatedText,
    segment,
    detectedLanguage: transcriptionResult.language
  };
}

// Export for testing
export { transcribeAudioSegment };

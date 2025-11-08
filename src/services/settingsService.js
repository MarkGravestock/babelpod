// Settings storage service
const STORAGE_KEY = 'babelpod_settings';

/**
 * Get browser's language preference
 * @returns {string} - Two-letter language code
 */
function getBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  // Extract just the language code (e.g., 'en-US' -> 'en')
  return browserLang.split('-')[0].toLowerCase();
}

const DEFAULT_SETTINGS = {
  transcriptionMethod: 'browser',
  whisperApiKey: '',
  selfHostedWhisperUrl: 'http://localhost:9001',
  sourceLang: 'auto', // Auto-detect from RSS feed or let Whisper detect
  targetLang: getBrowserLanguage(), // User's browser language
  audioBufferStrategy: 'continuous' // 'continuous' or 'on-demand'
};

/**
 * Get current settings from localStorage
 * @returns {Object} Settings object
 */
export function getSettings() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse settings:', e);
    }
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object to save
 */
export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

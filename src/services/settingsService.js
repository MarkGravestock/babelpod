// Settings storage service
const STORAGE_KEY = 'babelpod_settings';

const DEFAULT_SETTINGS = {
  transcriptionMethod: 'browser',
  whisperApiKey: '',
  selfHostedWhisperUrl: 'http://localhost:9000',
  sourceLang: 'es',
  targetLang: 'en'
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

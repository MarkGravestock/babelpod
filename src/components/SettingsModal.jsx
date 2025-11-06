import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/settingsService';
import './SettingsModal.css';

export default function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState(getSettings());

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    onClose(settings);
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2>Settings</h2>

        <div className="settings-section">
          <h3>🎙️ Transcription Method</h3>
          <p className="section-description">
            Choose how audio should be transcribed for translation
          </p>

          <div className="radio-group">
            <label className={`radio-option ${settings.transcriptionMethod === 'browser' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="transcriptionMethod"
                value="browser"
                checked={settings.transcriptionMethod === 'browser'}
                onChange={(e) => handleChange('transcriptionMethod', e.target.value)}
              />
              <div className="radio-content">
                <strong>Browser Speech Recognition</strong>
                <span className="badge free">Free</span>
                <p>Uses your browser's built-in speech recognition. Works in Chrome and Edge. No API key required.</p>
                <div className="pros-cons">
                  <div className="pros">
                    ✅ Completely free<br/>
                    ✅ No API key needed<br/>
                    ✅ Real-time
                  </div>
                  <div className="cons">
                    ⚠️ Chrome/Edge only<br/>
                    ⚠️ May be less accurate<br/>
                    ⚠️ Requires internet
                  </div>
                </div>
              </div>
            </label>

            <label className={`radio-option ${settings.transcriptionMethod === 'whisper' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="transcriptionMethod"
                value="whisper"
                checked={settings.transcriptionMethod === 'whisper'}
                onChange={(e) => handleChange('transcriptionMethod', e.target.value)}
              />
              <div className="radio-content">
                <strong>OpenAI Whisper API</strong>
                <span className="badge paid">Paid</span>
                <p>High-quality transcription using OpenAI's Whisper model. Requires API key.</p>
                <div className="pros-cons">
                  <div className="pros">
                    ✅ Very accurate<br/>
                    ✅ Works in all browsers<br/>
                    ✅ Handles noise well
                  </div>
                  <div className="cons">
                    💳 Requires API key<br/>
                    💳 Costs $0.006/minute<br/>
                    ⏱️ Slightly slower
                  </div>
                </div>
              </div>
            </label>
          </div>

          {settings.transcriptionMethod === 'whisper' && (
            <div className="api-key-section">
              <label htmlFor="apiKey">
                <strong>OpenAI API Key</strong>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  Get API Key →
                </a>
              </label>
              <input
                id="apiKey"
                type="password"
                value={settings.whisperApiKey}
                onChange={(e) => handleChange('whisperApiKey', e.target.value)}
                placeholder="sk-..."
                className="api-key-input"
              />
              <small>Your API key is stored locally in your browser and never sent anywhere except OpenAI.</small>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3>🌍 Languages</h3>

          <div className="form-group">
            <label htmlFor="sourceLang">Podcast Language (Source)</label>
            <select
              id="sourceLang"
              value={settings.sourceLang}
              onChange={(e) => handleChange('sourceLang', e.target.value)}
              className="language-select"
            >
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
              <option value="ko">Korean</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="targetLang">Translation Language (Target)</label>
            <select
              id="targetLang"
              value={settings.targetLang}
              onChange={(e) => handleChange('targetLang', e.target.value)}
              className="language-select"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
        </div>

        <div className="settings-actions">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/settingsService';
import './SettingsModal.css';

export default function SettingsModal({ isOpen, onClose, onSave }) {
  const [settings, setSettings] = useState(getSettings());

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    if (onSave) {
      onSave(settings);
    } else {
      onClose();
    }
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
                <span className="badge" style={{background: '#ff6b6b'}}>⚠️ Unreliable</span>
                <p>Uses your browser's built-in speech recognition. <strong>Often fails with podcast audio</strong> - designed for microphone input.</p>
                <div className="pros-cons">
                  <div className="pros">
                    ✅ Completely free<br/>
                    ✅ No API key needed<br/>
                    ✅ No setup required
                  </div>
                  <div className="cons">
                    ❌ Often fails with podcasts<br/>
                    ⚠️ Chrome/Edge only<br/>
                    ⚠️ Less accurate<br/>
                    ⚠️ Requires internet
                  </div>
                </div>
                <div style={{marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,107,107,0.1)', borderRadius: '6px', fontSize: '0.85rem'}}>
                  <strong>⚠️ Not Recommended:</strong> Browser speech recognition is designed for microphone input and often can't detect speech in podcast audio. Use Self-Hosted Whisper for reliable results.
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

            <label className={`radio-option ${settings.transcriptionMethod === 'selfhosted' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="transcriptionMethod"
                value="selfhosted"
                checked={settings.transcriptionMethod === 'selfhosted'}
                onChange={(e) => handleChange('transcriptionMethod', e.target.value)}
              />
              <div className="radio-content">
                <strong>Self-Hosted Whisper API</strong>
                <span className="badge free">Free</span>
                <span className="badge" style={{background: '#51cf66'}}>⭐ Recommended</span>
                <p>Run your own Whisper server locally or on your infrastructure. Best of both worlds - free, accurate, and reliable.</p>
                <div className="pros-cons">
                  <div className="pros">
                    ✅ Completely free<br/>
                    ✅ Very accurate<br/>
                    ✅ Reliable (works with podcasts)<br/>
                    ✅ Private & secure<br/>
                    ✅ Works in all browsers
                  </div>
                  <div className="cons">
                    ⚙️ Requires setup (5 min)<br/>
                    💻 Needs Docker<br/>
                    🐌 CPU: ~15-30s transcription<br/>
                    ⚡ GPU: real-time
                  </div>
                </div>
                <div style={{marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(81,207,102,0.1)', borderRadius: '6px', fontSize: '0.85rem'}}>
                  <strong>💡 Quick Setup:</strong> Run <code>docker-compose up -d</code> in the project folder. See README for details.
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

          {settings.transcriptionMethod === 'selfhosted' && (
            <div className="api-key-section">
              <label htmlFor="selfHostedUrl">
                <strong>Whisper API URL</strong>
                <a
                  href="https://github.com/ahmetoner/whisper-asr-webservice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  Setup Guide →
                </a>
              </label>
              <input
                id="selfHostedUrl"
                type="text"
                value={settings.selfHostedWhisperUrl}
                onChange={(e) => handleChange('selfHostedWhisperUrl', e.target.value)}
                placeholder="http://localhost:9001"
                className="api-key-input"
              />
              <small>URL of your self-hosted Whisper API with CORS proxy. See docker-compose.yml in the project root for setup.</small>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3>🌍 Languages</h3>

          <div className="form-group">
            <label htmlFor="sourceLang">
              Podcast Language (Source)
              <small style={{display: 'block', fontWeight: 'normal', color: '#888', marginTop: '4px'}}>
                Auto-detect from RSS feed or Whisper
              </small>
            </label>
            <select
              id="sourceLang"
              value={settings.sourceLang}
              onChange={(e) => handleChange('sourceLang', e.target.value)}
              className="language-select"
            >
              <option value="auto">🔍 Auto-detect (recommended)</option>
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
            <label htmlFor="targetLang">
              Your Language (Target)
              <small style={{display: 'block', fontWeight: 'normal', color: '#888', marginTop: '4px'}}>
                Detected from your browser settings
              </small>
            </label>
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

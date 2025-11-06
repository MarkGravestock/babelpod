import { useState, useRef, useEffect } from 'react';
import { translateText, speakText } from '../services/translationService';
import './AudioPlayer.css';

export default function AudioPlayer({ episode, sourceLang = 'es', targetLang = 'en' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationStatus, setTranslationStatus] = useState('');
  const [rewindSeconds] = useState(15);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTime = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration));
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  // The special feature: Rewind and translate to English
  const rewindAndTranslate = async () => {
    const audio = audioRef.current;
    const wasPlaying = isPlaying;

    try {
      // Pause the audio
      if (wasPlaying) {
        audio.pause();
        setIsPlaying(false);
      }

      setIsTranslating(true);
      setTranslationStatus('Preparing to translate last 15 seconds...');

      // Calculate the segment we want to translate
      const endTime = audio.currentTime;
      const startTime = Math.max(0, endTime - rewindSeconds);
      const segmentDuration = endTime - startTime;

      setTranslationStatus(`Getting transcript for ${segmentDuration.toFixed(1)}s segment...`);

      // For PoC, we'll use a simplified approach:
      // Since we can't easily transcribe pre-recorded audio without a backend,
      // we'll demonstrate the concept with a mock transcript
      // In production, you'd send the audio segment to Whisper API

      // Mock original text (in a real app, this would come from Whisper)
      const mockOriginalText = generateMockTranscript(segmentDuration);

      setTranslationStatus('Translating to English...');

      // Translate the text
      const translatedText = await translateText(mockOriginalText, sourceLang, targetLang);

      setTranslationStatus('Speaking translation...');

      // Rewind the audio
      audio.currentTime = startTime;

      // Speak the translation using browser TTS
      const targetLangCode = targetLang === 'en' ? 'en-US' : targetLang === 'es' ? 'es-ES' : targetLang;
      await speakText(translatedText, targetLangCode);

      setTranslationStatus('Translation complete!');

      // Resume playback from the start of the segment
      if (wasPlaying) {
        audio.play();
        setIsPlaying(true);
      }

      // Clear status after a delay
      setTimeout(() => setTranslationStatus(''), 3000);

    } catch (error) {
      setTranslationStatus(`Error: ${error.message}`);
      console.error('Translation error:', error);

      // Clear error after a delay
      setTimeout(() => setTranslationStatus(''), 5000);
    } finally {
      setIsTranslating(false);
    }
  };

  // Generate mock transcript based on duration (for PoC demonstration)
  const generateMockTranscript = (duration) => {
    const phrases = [
      "Hola, bienvenidos a nuestro podcast.",
      "Hoy vamos a hablar sobre la cultura española.",
      "Es muy importante entender el contexto histórico.",
      "La comida mediterránea es muy saludable.",
      "El idioma español es hablado por millones de personas.",
      "La música tradicional tiene muchas influencias.",
      "Vamos a continuar con nuestra conversación.",
    ];

    // Select phrases to roughly match the duration (assuming ~3 seconds per phrase)
    const numPhrases = Math.ceil(duration / 3);
    const selectedPhrases = [];

    for (let i = 0; i < numPhrases; i++) {
      selectedPhrases.push(phrases[i % phrases.length]);
    }

    return selectedPhrases.join(' ');
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!episode) {
    return <div className="audio-player empty">No episode selected</div>;
  }

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={episode.audioUrl} preload="metadata" />

      <div className="episode-info">
        {episode.image && (
          <img src={episode.image} alt={episode.title} className="episode-image" />
        )}
        <div className="episode-details">
          <h3>{episode.title}</h3>
          <p className="episode-description">{episode.description}</p>
        </div>
      </div>

      <div className="progress-container" onClick={handleSeek}>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          />
        </div>
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="controls">
        <button onClick={() => skipTime(-30)} className="control-btn" title="Rewind 30s">
          ⏪ 30s
        </button>

        <button onClick={() => skipTime(-15)} className="control-btn" title="Rewind 15s">
          ↶ 15s
        </button>

        <button onClick={togglePlayPause} className="control-btn play-pause">
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button onClick={() => skipTime(15)} className="control-btn" title="Skip 15s">
          15s ↷
        </button>

        <button onClick={() => skipTime(30)} className="control-btn" title="Skip 30s">
          30s ⏩
        </button>
      </div>

      <div className="translation-controls">
        <button
          onClick={rewindAndTranslate}
          disabled={isTranslating || currentTime < 1}
          className="translate-btn"
          title="Rewind 15 seconds and play translation in English"
        >
          {isTranslating ? '⏳ Translating...' : '🔄 Rewind 15s & Translate'}
        </button>
      </div>

      {translationStatus && (
        <div className="translation-status">
          {translationStatus}
        </div>
      )}
    </div>
  );
}

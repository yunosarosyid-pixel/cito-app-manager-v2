// Audio chime utility for incoming team drafts using standard Web Audio API
// Does not require external audio files and works on all modern mobile & desktop browsers.

export function playIncomingDraftChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Pleasant two-tone chime (E5 -> G#5 -> B5)
    const notes = [
      { freq: 659.25, time: 0.0, dur: 0.18 }, // E5
      { freq: 830.61, time: 0.15, dur: 0.20 }, // G#5
      { freq: 987.77, time: 0.32, dur: 0.45 }, // B5
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Envelope: quick attack, smooth exponential decay
      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.25, now + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // Optional gentle haptic vibration on mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 150]);
    }
  } catch (err) {
    console.info('Audio chime notice:', err);
  }
}

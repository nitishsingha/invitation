import type { MusicMood } from '../types/invitation';

class AmbientChimePlayer {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private playing = false;

  public start(mood: MusicMood): void {
    if (mood === 'none' || this.playing) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.playing = true;

    const scales: Record<Exclude<MusicMood, 'none'>, number[]> = {
      'harp-bliss': [261.63, 329.63, 392.0, 493.88, 523.25, 659.25],
      'celebration-chime': [293.66, 369.99, 440.0, 587.33, 659.25],
      'serene-flute': [246.94, 293.66, 369.99, 440.0, 493.88],
    };

    const notes = scales[mood];
    let step = 0;

    const playNote = () => {
      if (!this.ctx || !this.playing) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = mood === 'serene-flute' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(notes[step % notes.length], now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.2);
      step += 1;
    };

    playNote();
    this.timer = window.setInterval(playNote, 1300);
  }

  public stop(): void {
    this.playing = false;
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const ambientPlayer = new AmbientChimePlayer();

/** Browser-safe synthesized tactical cues; the context is unlocked only by the operation button. */
export class AudioSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;

  unlock() {
    if (this.context) {
      void this.context.resume();
      return;
    }
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    this.context = new AudioContextCtor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.18;
    this.master.connect(this.context.destination);
  }

  rifleShot() {
    this.unlock();
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const oscillatorGain = this.context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(118, now);
    oscillator.frequency.exponentialRampToValueAtTime(48, now + 0.075);
    oscillatorGain.gain.setValueAtTime(0.055, now);
    oscillatorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    oscillator.connect(oscillatorGain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.095);
    this.noiseBurst(0.065, 0.08, 0.36);
  }

  hitConfirm() {
    this.unlock();
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(860, now);
    oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.052);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.065);
  }

  enemyShot() {
    this.unlock();
    this.noiseBurst(0.055, 0.12, 0.18);
  }

  dispose() {
    this.master?.disconnect();
    void this.context?.close();
    this.context = null;
    this.master = null;
  }

  private noiseBurst(duration: number, volume: number, filterFrequency: number) {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const frameCount = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900 + filterFrequency * 3000;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(now);
    source.stop(now + duration);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

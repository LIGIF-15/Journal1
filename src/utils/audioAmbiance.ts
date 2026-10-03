// Web Audio API ambient sound generator for calm writing sessions
class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private rainGain: GainNode | null = null;
  private noiseNode: AudioNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  public toggle(): boolean {
    this.init();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.startRainSound();
      return true;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }

  private startRainSound() {
    if (!this.ctx) return;

    try {
      // Create pink noise buffer for soft rainfall
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
        b6 = white * 0.115926;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Low pass filter to make it gentle and distant
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      // Gain node for smooth fade-in
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 1.5);

      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      noiseSource.start();
      this.noiseNode = noiseSource;
      this.rainGain = gainNode;
      this.isPlaying = true;
    } catch {
      this.isPlaying = false;
    }
  }

  public stop() {
    if (this.rainGain && this.ctx) {
      try {
        this.rainGain.gain.setValueAtTime(this.rainGain.gain.value, this.ctx.currentTime);
        this.rainGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          if (this.noiseNode) {
            try {
              (this.noiseNode as AudioBufferSourceNode).stop();
            } catch {
              // ignore
            }
            this.noiseNode.disconnect();
            this.noiseNode = null;
          }
          this.isPlaying = false;
        }, 550);
      } catch {
        this.isPlaying = false;
      }
    } else {
      this.isPlaying = false;
    }
  }
}

export const soundEngine = new AmbientSoundEngine();

'use client';

/**
 * VaagaTypePanalam — Sound Engine
 *
 * Procedural Web Audio API sound synthesis for zero-latency, zero-download
 * tactile typing feedback (mechanical clicks and error bumps).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  public init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Default volume
        
        // Pre-compute brown noise buffer for mechanical 'clack'
        const bufferSize = this.ctx.sampleRate * 0.1; // 100ms
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; // Compensate gain
        }
      } catch (e) {
        console.error('Web Audio API not supported', e);
      }
    }
  }

  public playKeystroke() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    const time = this.ctx.currentTime;

    // 1. The Clack (Noise burst)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    
    // High-pass filter to remove rumble from the clack
    const hpFilter = this.ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 800;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.03); // Very short

    noiseSource.connect(hpFilter);
    hpFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // 2. The Thock (Low sine resonance)
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.6, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    // Play
    noiseSource.start(time);
    noiseSource.stop(time + 0.04);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  public playError() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const time = this.ctx.currentTime;

    // Dull, low frequency bump
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.15);

    // Low-pass filter to muffle it
    const lpFilter = this.ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = 600;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    osc.connect(lpFilter);
    lpFilter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  private ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const soundEngine = new SoundEngine();

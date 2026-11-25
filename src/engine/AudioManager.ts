/**
 * AudioManager – every sound in the game is synthesised live with the Web Audio API.
 * No audio files, no copyrighted music. Audio only starts after the first user gesture.
 */
export type SoundName =
  | 'tap' | 'switch' | 'doorOpen' | 'doorClose' | 'knock' | 'bounce' | 'boing' | 'typing'
  | 'phoneRing' | 'notify' | 'laugh' | 'giggle' | 'pillow' | 'squeak' | 'chairSpin' | 'footsteps'
  | 'chime' | 'cuckoo' | 'bigChime' | 'gulp' | 'whoosh' | 'thud' | 'swish' | 'creak' | 'moo'
  | 'meow' | 'quack' | 'pop' | 'yawn' | 'sparkle' | 'grunt' | 'robot' | 'jingle' | 'kiss'
  | 'snore' | 'alarm0' | 'alarm1' | 'alarm2' | 'alarm3' | 'birds' | 'crickets' | 'zip' | 'aww'
  | 'hmm' | 'disco' | 'pageFlip' | 'brush' | 'teddyDance'
  | 'blow' | 'bubblePop' | 'block' | 'crash' | 'vroom' | 'crunch' | 'sing' | 'clap' | 'dance'
  | 'bark' | 'yip' | 'slurp' | 'pour' | 'tada' | 'unwrap' | 'scribble' | 'whine'
  | 'drum' | 'hum' | 'splash' | 'birthday' | 'clink' | 'ding';

export type GuitarTune = 'kid' | 'kid2' | 'papa' | 'funny';

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

type ToneOpts = { type?: OscillatorType; vol?: number; to?: number; attack?: number; vibrato?: number; filter?: number };
type BurstOpts = { type?: BiquadFilterType; freq?: number; to?: number; vol?: number; q?: number };

class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private volume = 1;
  private lastPlayed = new Map<string, number>();
  private active = 0;
  private fanNode: { gain: GainNode } | null = null;
  private fanWanted = 0;
  private noiseBuf: AudioBuffer | null = null;
  private pluckCache = new Map<number, AudioBuffer>();

  /** Must be called from a user gesture (browser autoplay rules). */
  unlock() {
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.55 * this.volume : 0;
      this.master.connect(comp).connect(this.ctx.destination);
      this.syncFan();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  get unlocked() {
    return !!this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(on ? 0.55 * this.volume : 0, this.ctx.currentTime, 0.05);
  }

  /** Parent-corner volume (0..1), applied on top of mute. */
  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.setEnabled(this.enabled);
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  /** Quiet whooshing ambience for the ceiling fan (0 = off, 1 slow, 2 fast). */
  setFan(level: number) {
    this.fanWanted = level;
    this.syncFan();
  }

  private syncFan() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    if (!this.fanNode) {
      const src = ctx.createBufferSource();
      src.buffer = this.makeNoise(2, true);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(lp).connect(gain).connect(this.master);
      src.start();
      this.fanNode = { gain };
    }
    const target = this.fanWanted === 0 ? 0 : this.fanWanted === 1 ? 0.03 : 0.055;
    this.fanNode.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.4);
  }

  private makeNoise(seconds: number, brown = false): AudioBuffer {
    const ctx = this.ctx!;
    if (!brown && this.noiseBuf) return this.noiseBuf;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = w;
    }
    if (!brown) this.noiseBuf = buf;
    return buf;
  }

  // ---------- primitive voices ----------
  private tone(freq: number, start: number, dur: number, opts: ToneOpts = {}) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = opts.type ?? 'sine';
    const t0 = ctx.currentTime + start;
    o.frequency.setValueAtTime(freq, t0);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t0 + dur);
    const g = ctx.createGain();
    const vol = opts.vol ?? 0.3;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (opts.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node: AudioNode = o;
    if (opts.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = opts.filter;
      f.Q.value = 2;
      node.connect(f);
      node = f;
    }
    if (opts.vibrato) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = opts.vibrato;
      lg.gain.value = freq * 0.04;
      lfo.connect(lg).connect(o.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur + 0.05);
    }
    node.connect(g).connect(this.master!);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  private burst(start: number, dur: number, opts: BurstOpts = {}) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.makeNoise(1.5);
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? 'lowpass';
    const t0 = ctx.currentTime + start;
    f.frequency.setValueAtTime(opts.freq ?? 800, t0);
    if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
    f.Q.value = opts.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(opts.vol ?? 0.3, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t0, Math.random() * 0.4);
    src.stop(t0 + dur + 0.05);
  }

  /** Karplus–Strong plucked string – an original synthesised guitar voice. */
  private pluck(freq: number, start: number, vol = 0.35, dur = 1.4) {
    const ctx = this.ctx!;
    const key = Math.round(freq * 10);
    let buf = this.pluckCache.get(key);
    if (!buf) {
      const sr = ctx.sampleRate;
      const len = Math.floor(sr * dur);
      buf = ctx.createBuffer(1, len, sr);
      const d = buf.getChannelData(0);
      const N = Math.max(2, Math.round(sr / freq));
      const ring = new Float32Array(N);
      for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
      let p = 0;
      for (let i = 0; i < len; i++) {
        const next = (p + 1) % N;
        d[i] = ring[p];
        ring[p] = 0.497 * (ring[p] + ring[next]);
        p = next;
      }
      this.pluckCache.set(key, buf);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    src.connect(lp).connect(g).connect(this.master!);
    src.start(ctx.currentTime + start);
  }

  /** Rate-limits identical sounds and caps simultaneous voices so audio never piles up. */
  private ok(name: string, minGapMs = 70): boolean {
    if (!this.ctx || !this.master || !this.enabled || this.ctx.state !== 'running') return false;
    const now = performance.now();
    if (now - (this.lastPlayed.get(name) ?? 0) < minGapMs) return false;
    if (this.active > 10) return false;
    this.lastPlayed.set(name, now);
    this.active++;
    setTimeout(() => (this.active = Math.max(0, this.active - 1)), 900);
    return true;
  }

  guitar(tune: GuitarTune) {
    if (!this.ok('guitar', 300)) return;
    const seqs: Record<GuitarTune, [number, number][]> = {
      // [midi note, start time] – original little riffs
      kid: [[52, 0], [56, 0.02], [59, 0.04], [64, 0.06], [52, 0.45], [56, 0.47], [59, 0.49], [64, 0.51], [57, 0.9], [61, 0.92], [64, 0.94], [69, 0.96]],
      kid2: [[55, 0], [59, 0.03], [62, 0.06], [67, 0.09], [57, 0.35], [60, 0.38], [64, 0.41], [62, 0.7], [66, 0.73], [69, 0.76], [74, 0.79]],
      papa: [[64, 0], [67, 0.25], [71, 0.5], [72, 0.75], [71, 1.0], [67, 1.25], [69, 1.5], [64, 1.9], [60, 1.92], [55, 1.94]],
      funny: [[72, 0], [71, 0.15], [70, 0.3], [69, 0.45], [62, 0.7], [62, 0.85], [74, 1.1], [50, 1.4]],
    };
    seqs[tune].forEach(([n, t]) => this.pluck(NOTE(n), t, tune === 'kid' ? 0.45 : 0.32));
    if (tune === 'funny') this.tone(300, 1.4, 0.6, { type: 'triangle', to: 90, vol: 0.2 });
  }

  play(name: SoundName) {
    if (!this.ok(name)) return;
    const T = (f: number, s: number, d: number, o?: ToneOpts) => this.tone(f, s, d, o);
    const B = (s: number, d: number, o?: BurstOpts) => this.burst(s, d, o);
    switch (name) {
      case 'tap': T(880, 0, 0.08, { type: 'triangle', vol: 0.12, to: 1200 }); break;
      case 'switch': B(0, 0.03, { type: 'highpass', freq: 2000, vol: 0.35 }); T(1800, 0, 0.03, { type: 'square', vol: 0.05 }); B(0.05, 0.03, { type: 'highpass', freq: 3000, vol: 0.2 }); break;
      case 'doorOpen': T(180, 0, 0.5, { type: 'sawtooth', to: 260, vol: 0.05, vibrato: 18, filter: 600 }); B(0.05, 0.4, { freq: 300, vol: 0.1 }); break;
      case 'doorClose': T(90, 0, 0.18, { vol: 0.4, to: 50 }); B(0, 0.15, { freq: 400, vol: 0.25 }); break;
      case 'knock': [0, 0.22, 0.44].forEach((s) => { T(140, s, 0.12, { vol: 0.5, to: 80 }); B(s, 0.06, { freq: 900, vol: 0.25 }); }); break;
      case 'bounce': T(320, 0, 0.18, { vol: 0.35, to: 140 }); T(300, 0.3, 0.12, { vol: 0.2, to: 150 }); T(280, 0.5, 0.08, { vol: 0.1, to: 160 }); break;
      case 'boing': T(180, 0, 0.35, { type: 'triangle', to: 520, vol: 0.25, vibrato: 14 }); break;
      case 'typing': for (let i = 0; i < 9; i++) B(i * 0.07 + Math.random() * 0.02, 0.025, { type: 'bandpass', freq: 2500 + Math.random() * 1500, vol: 0.18, q: 3 }); break;
      case 'phoneRing': for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) T(i % 2 ? 1046 : 1318, r * 0.9 + i * 0.06, 0.06, { type: 'square', vol: 0.06 }); break;
      case 'notify': T(1318, 0, 0.25, { vol: 0.18 }); T(1760, 0.12, 0.35, { vol: 0.15 }); break;
      case 'laugh': for (let i = 0; i < 6; i++) T(560 - i * 30, i * 0.13, 0.1, { type: 'sawtooth', vol: 0.12, filter: 1100, to: 420 - i * 20 }); break;
      case 'giggle': for (let i = 0; i < 5; i++) T(820 + (i % 2) * 120, i * 0.09, 0.07, { type: 'sawtooth', vol: 0.1, filter: 1500, to: 700 }); break;
      case 'pillow': B(0, 0.25, { freq: 300, to: 120, vol: 0.5 }); break;
      case 'squeak': T(1100, 0, 0.15, { to: 1700, vol: 0.18 }); T(1600, 0.17, 0.12, { to: 1200, vol: 0.15 }); break;
      case 'chairSpin': T(700, 0, 0.9, { type: 'triangle', to: 900, vol: 0.06, vibrato: 9 }); B(0, 0.9, { type: 'bandpass', freq: 500, to: 1500, vol: 0.1, q: 2 }); break;
      case 'footsteps': [0, 0.18, 0.36, 0.54].forEach((s) => T(110, s, 0.07, { vol: 0.25, to: 70 })); break;
      case 'chime': [0, 0.5].forEach((s, i) => { T(i ? 784 : 988, s, 1.2, { vol: 0.15 }); T((i ? 784 : 988) * 2.01, s, 0.6, { vol: 0.05 }); }); break;
      case 'cuckoo': T(784, 0, 0.22, { vol: 0.22, filter: 900 }); T(622, 0.28, 0.35, { vol: 0.22, filter: 800 }); break;
      case 'bigChime': [72, 76, 79, 84, 79, 84].forEach((n, i) => T(NOTE(n), i * 0.28, 1.4, { vol: 0.13 })); break;
      case 'gulp': [0, 0.25, 0.5].forEach((s) => T(260, s, 0.12, { vol: 0.25, to: 130 })); break;
      case 'whoosh': B(0, 0.4, { type: 'bandpass', freq: 400, to: 2500, vol: 0.25, q: 1.5 }); break;
      case 'thud': T(100, 0, 0.2, { vol: 0.45, to: 55 }); B(0, 0.1, { freq: 600, vol: 0.2 }); break;
      case 'swish': B(0, 0.5, { type: 'highpass', freq: 1200, to: 4000, vol: 0.12 }); break;
      case 'creak': T(240, 0, 0.6, { type: 'sawtooth', to: 330, vol: 0.04, vibrato: 25, filter: 900 }); break;
      case 'moo': T(150, 0, 0.9, { type: 'sawtooth', to: 115, vol: 0.18, filter: 450, attack: 0.15 }); break;
      case 'meow': T(520, 0, 0.55, { type: 'sawtooth', to: 760, vol: 0.12, filter: 1200, attack: 0.05 }); T(760, 0.35, 0.3, { type: 'sawtooth', to: 420, vol: 0.1, filter: 1000 }); break;
      case 'quack': [0, 0.22].forEach((s) => T(420, s, 0.16, { type: 'sawtooth', to: 300, vol: 0.14, filter: 1300 })); break;
      case 'pop': T(600, 0, 0.08, { to: 1200, vol: 0.25 }); break;
      case 'yawn': T(420, 0, 1.0, { type: 'sawtooth', to: 200, vol: 0.06, filter: 700, attack: 0.2 }); break;
      case 'sparkle': [84, 88, 91, 96, 91, 96].forEach((n, i) => T(NOTE(n), i * 0.07, 0.4, { vol: 0.08 })); break;
      case 'grunt': T(130, 0, 0.5, { type: 'sawtooth', vol: 0.1, filter: 500, vibrato: 12 }); break;
      case 'robot': [0, 0.12, 0.24].forEach((s, i) => T(600 + i * 200, s, 0.09, { type: 'square', vol: 0.06 })); break;
      case 'jingle': for (let i = 0; i < 8; i++) T(2400 + Math.random() * 1600, i * 0.05, 0.12, { vol: 0.05 }); break;
      case 'kiss': T(1500, 0, 0.08, { to: 600, vol: 0.12 }); break;
      case 'snore': T(90, 0, 0.9, { type: 'sawtooth', vol: 0.05, filter: 300, vibrato: 30, attack: 0.3 }); break;
      case 'alarm0': for (let i = 0; i < 14; i++) T(2093, i * 0.06, 0.05, { type: 'square', vol: 0.035 }); break;
      case 'alarm1': [0, 0.25, 0.5].forEach((s) => { T(2200, s, 0.12, { to: 3200, vol: 0.1 }); T(2600, s + 0.1, 0.1, { to: 2000, vol: 0.08 }); }); break;
      case 'alarm2': T(500, 0, 0.25, { type: 'sawtooth', to: 900, vol: 0.1, filter: 1200 }); T(900, 0.25, 0.7, { type: 'sawtooth', to: 600, vol: 0.1, filter: 1300, vibrato: 7 }); break;
      case 'alarm3': [67, 72, 76, 79].forEach((n, i) => T(NOTE(n), i * 0.16, 0.25, { type: 'sawtooth', vol: 0.08, filter: 1800 })); break;
      case 'birds': [0, 0.3, 0.45].forEach((s) => T(3000, s, 0.1, { to: 4200, vol: 0.05 })); break;
      case 'crickets': for (let i = 0; i < 6; i++) T(4400, i * 0.05, 0.03, { vol: 0.03 }); break;
      case 'zip': B(0, 0.25, { type: 'bandpass', freq: 1500, to: 4000, vol: 0.15, q: 4 }); break;
      case 'aww': T(500, 0, 0.7, { type: 'sawtooth', to: 380, vol: 0.08, filter: 900, attack: 0.1 }); break;
      case 'hmm': T(200, 0, 0.5, { type: 'sawtooth', vol: 0.07, filter: 400, vibrato: 5 }); break;
      case 'disco':
        for (let i = 0; i < 8; i++) {
          T(70, i * 0.25, 0.15, { vol: 0.35, to: 45 });
          if (i % 2) B(i * 0.25, 0.05, { type: 'highpass', freq: 6000, vol: 0.1 });
          T(NOTE([60, 64, 67, 72][i % 4]), i * 0.25, 0.2, { type: 'square', vol: 0.03 });
        }
        break;
      case 'pageFlip': B(0, 0.15, { type: 'highpass', freq: 2500, vol: 0.12 }); break;
      case 'brush': for (let i = 0; i < 4; i++) B(i * 0.18, 0.12, { type: 'highpass', freq: 3000, vol: 0.06 }); break;
      case 'blow': B(0, 0.6, { type: 'bandpass', freq: 900, to: 600, vol: 0.12, q: 0.8 }); T(1400, 0.2, 0.25, { to: 1900, vol: 0.05 }); break;
      case 'bubblePop': T(900 + Math.random() * 500, 0, 0.06, { to: 1800, vol: 0.2 }); B(0, 0.03, { type: 'highpass', freq: 4000, vol: 0.08 }); break;
      case 'block': T(520 + Math.random() * 160, 0, 0.09, { type: 'triangle', vol: 0.3, to: 380 }); B(0, 0.04, { type: 'bandpass', freq: 1800, vol: 0.15, q: 3 }); break;
      case 'crash': for (let i = 0; i < 7; i++) { T(420 - i * 35 + Math.random() * 60, i * 0.08 + Math.random() * 0.03, 0.1, { type: 'triangle', vol: 0.25, to: 250 }); B(i * 0.08, 0.05, { type: 'bandpass', freq: 1500, vol: 0.12, q: 2 }); } break;
      case 'vroom': T(110, 0, 1.1, { type: 'sawtooth', to: 240, vol: 0.07, filter: 700, vibrato: 22 }); break;
      case 'crunch': [0, 0.28, 0.56].forEach((st) => B(st, 0.09, { type: 'bandpass', freq: 2200, vol: 0.2, q: 1.5 })); break;
      case 'sing': [67, 69, 71, 74, 71, 69, 67].forEach((n, i) => T(NOTE(n), i * 0.2, 0.22, { type: 'triangle', vol: 0.09, vibrato: 6 })); break;
      case 'clap': [0, 0.3, 0.6].forEach((st) => B(st, 0.05, { type: 'bandpass', freq: 1400, vol: 0.3, q: 1 })); break;
      case 'dance': [60, 64, 67, 64, 65, 69, 72, 69, 67, 64, 60, 64].forEach((n, i) => { T(NOTE(n), i * 0.2, 0.18, { type: 'triangle', vol: 0.09 }); if (i % 2 === 0) T(NOTE(n - 24), i * 0.2, 0.2, { vol: 0.12 }); }); break;
      case 'bark': [0, 0.24].forEach((st) => { T(420, st, 0.13, { type: 'sawtooth', to: 260, vol: 0.18, filter: 900 }); B(st, 0.06, { type: 'bandpass', freq: 700, vol: 0.12, q: 2 }); }); break;
      case 'yip': T(900, 0, 0.12, { type: 'sawtooth', to: 1300, vol: 0.1, filter: 1600 }); break;
      case 'slurp': B(0, 0.35, { type: 'bandpass', freq: 1200, to: 2600, vol: 0.12, q: 3 }); T(500, 0.05, 0.25, { to: 900, vol: 0.06 }); break;
      case 'pour': for (let i = 0; i < 10; i++) B(i * 0.05 + Math.random() * 0.02, 0.03, { type: 'bandpass', freq: 2500 + Math.random() * 1500, vol: 0.14, q: 4 }); break;
      case 'tada': [60, 64, 67, 72].forEach((n, i) => T(NOTE(n), i * 0.1, i === 3 ? 0.9 : 0.15, { type: 'triangle', vol: 0.14 })); break;
      case 'unwrap': B(0, 0.5, { type: 'highpass', freq: 2500, to: 5000, vol: 0.14 }); B(0.25, 0.3, { type: 'highpass', freq: 3000, vol: 0.1 }); break;
      case 'scribble': for (let i = 0; i < 5; i++) B(i * 0.07, 0.06, { type: 'bandpass', freq: 3200, vol: 0.05, q: 2 }); break;
      case 'whine': T(900, 0, 0.6, { type: 'sine', to: 650, vol: 0.08, vibrato: 7 }); break;
      case 'drum': [0, 0.18, 0.36, 0.45, 0.54].forEach((st, i) => { T(i % 2 ? 180 : 120, st, 0.12, { vol: 0.35, to: 60 }); B(st, 0.05, { type: 'bandpass', freq: i % 2 ? 2400 : 900, vol: 0.12, q: 2 }); }); break;
      case 'hum': T(120, 0, 1.6, { type: 'sawtooth', vol: 0.03, filter: 300, attack: 0.1 }); T(240, 0, 1.6, { vol: 0.02 }); break;
      case 'splash': B(0, 0.6, { type: 'bandpass', freq: 1800, to: 900, vol: 0.18, q: 0.8 }); break;
      case 'birthday': [[67, 0], [67, 0.2], [69, 0.4], [67, 0.8], [72, 1.2], [71, 1.6]].forEach(([n, st]) => T(NOTE(n), st, 0.35, { type: 'triangle', vol: 0.12 })); break;
      case 'clink': T(2600, 0, 0.25, { vol: 0.08 }); T(3400, 0.02, 0.2, { vol: 0.05 }); break;
      case 'ding': T(1568, 0, 1.0, { vol: 0.15 }); T(3136, 0, 0.4, { vol: 0.04 }); break;
      case 'teddyDance': [72, 74, 76, 79, 76, 74, 72, 67].forEach((n, i) => T(NOTE(n), i * 0.18, 0.16, { type: 'triangle', vol: 0.1 })); break;
    }
  }
}

export const AudioManager = new AudioManagerImpl();

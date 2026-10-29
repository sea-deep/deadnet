let context: AudioContext | undefined;
export function tone(
  kind: "connect" | "mail" | "click" | "disk" | "line" | "refresh" | "trash" | "window_open" | "window_close" | "error",
  muted: boolean,
) {
  if (muted) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    const now = context.currentTime;
    if (kind === "disk" || kind === "line") {
      const length = kind === "disk" ? 0.18 : 1.2;
      const noise = context.createBuffer(
        1,
        context.sampleRate * length,
        context.sampleRate,
      );
      const values = noise.getChannelData(0);
      for (let i = 0; i < values.length; i++)
        values[i] =
          (Math.random() * 2 - 1) * Math.exp((-i / values.length) * 6);
      const source = context.createBufferSource(),
        filter = context.createBiquadFilter(),
        gain = context.createGain();
      source.buffer = noise;
      filter.type = "bandpass";
      filter.frequency.value = kind === "disk" ? 1800 : 320;
      filter.Q.value = 1.5;
      gain.gain.value = kind === "disk" ? 0.035 : 0.05;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start(now);
      return;
    }
    if (kind === "refresh") {
      const o = context!.createOscillator(), g = context!.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(120, now);
      o.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      o.connect(g).connect(context!.destination);
      o.start(now); o.stop(now + 0.5);
      // crackle layer
      const noise = context!.createBuffer(1, context!.sampleRate * 0.3, context!.sampleRate);
      const vals = noise.getChannelData(0);
      for (let i = 0; i < vals.length; i++) vals[i] = (Math.random() * 2 - 1) * Math.exp(-i / vals.length * 4) * 0.3;
      const src = context!.createBufferSource(), fg = context!.createGain();
      src.buffer = noise; fg.gain.value = 0.03;
      src.connect(fg).connect(context!.destination);
      src.start(now + 0.05);
      return;
    }
    if (kind === "trash") {
      const noise = context!.createBuffer(1, context!.sampleRate * 0.25, context!.sampleRate);
      const vals = noise.getChannelData(0);
      for (let i = 0; i < vals.length; i++) vals[i] = (Math.random() * 2 - 1) * Math.exp(-i / vals.length * 5);
      const src = context!.createBufferSource(), f = context!.createBiquadFilter(), g = context!.createGain();
      src.buffer = noise; f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = 0.8;
      g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      src.connect(f).connect(g).connect(context!.destination);
      src.start(now);
      return;
    }
    if (kind === "window_open" || kind === "window_close") {
      const o = context!.createOscillator(), g = context!.createGain();
      o.type = "sine";
      o.frequency.value = kind === "window_open" ? 440 : 330;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.025, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o.connect(g).connect(context!.destination);
      o.start(now); o.stop(now + 0.09);
      return;
    }
    if (kind === "error") {
      [280, 220].forEach((freq, i) => {
        const o = context!.createOscillator(), g = context!.createGain();
        o.type = "square"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now + i * 0.15);
        g.gain.linearRampToValueAtTime(0.02, now + i * 0.15 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.12);
        o.connect(g).connect(context!.destination);
        o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.13);
      });
      return;
    }
    const notes =
      kind === "connect"
        ? [196, 261.63, 329.63, 392]
        : kind === "mail"
          ? [680, 510]
          : [300];
    notes.forEach((f, i) => {
      const o = context!.createOscillator(),
        g = context!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * (kind === "connect" ? 0.38 : 0.11));
      g.gain.linearRampToValueAtTime(
        0.035,
        now + i * (kind === "connect" ? 0.38 : 0.11) + 0.01,
      );
      g.gain.exponentialRampToValueAtTime(
        0.001,
        now +
          i * (kind === "connect" ? 0.38 : 0.11) +
          (kind === "connect" ? 0.55 : 0.22),
      );
      o.connect(g);
      g.connect(context!.destination);
      o.start(now + i * (kind === "connect" ? 0.38 : 0.11));
      o.stop(
        now +
          i * (kind === "connect" ? 0.38 : 0.11) +
          (kind === "connect" ? 0.56 : 0.23),
      );
    });
  } catch {
    /* Audio support is optional. */
  }
}

let ambient: HTMLAudioElement | undefined;
export function duckAmbient(duck: boolean) {
  if (ambient) ambient.volume = duck ? 0.025 : 0.075;
}
export function setAmbient(enabled: boolean) {
  if (!ambient) {
    ambient = new Audio(
      import.meta.env.BASE_URL + "assets/audio/ambient-horror.ogg",
    );
    ambient.loop = true;
    ambient.volume = 0.075;
  }
  if (enabled) void ambient.play().catch(() => {});
  else ambient.pause();
}

let context: AudioContext | undefined;
export function tone(
  kind: "connect" | "mail" | "click" | "disk" | "line",
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

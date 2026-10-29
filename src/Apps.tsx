import { useEffect, useRef, useState } from "react";
import type { Action, AgentId, Event, Snapshot } from "./types";
import { PixelIcon } from "./icons";
import { exhibition } from "./api";
import { duckAmbient, tone } from "./sound";
import { GAME_LIST, GameIcon, type GameId } from "./games";
import { SaveItem } from "./CaseApps";
export type AppId =
  | "computer"
  | "trash"
  | "readme"
  | "browser"
  | "mail"
  | "archive"
  | "recycle"
  | "people"
  | "monitor"
  | "notebook"
  | "games"
  | "spirit";
export const APP_INFO: Record<
  AppId,
  {
    title: string;
    icon:
      | "browser"
      | "mail"
      | "archive"
      | "recycle"
      | "people"
      | "monitor"
      | "notebook"
      | "games"
      | "spirit"
      | "usb"
      | "photos"
      | "calendar"
      | "computer";
  }
> = {
  computer: { title: "My Computer", icon: "computer" },
  trash: { title: "Trash Bin", icon: "recycle" },
  readme: { title: "Casebook", icon: "usb" },
  browser: { title: "Messenger", icon: "spirit" },
  spirit: { title: "Unknown Signal", icon: "spirit" },
  mail: { title: "Mail", icon: "mail" },
  archive: { title: "Photos", icon: "photos" },
  recycle: { title: "Calendar", icon: "calendar" },
  people: { title: "Address Book", icon: "people" },
  monitor: { title: "System Monitor", icon: "monitor" },
  notebook: { title: "Notepad", icon: "notebook" },
  games: { title: "Games", icon: "games" },
};
export interface AppProps {
  data: Snapshot;
  perform: (a: Action) => Promise<boolean>;
  open: (id: AppId) => void;
  busy: boolean;
  target: AgentId;
  setTarget: (id: AgentId) => void;
  composeTo: (id: AgentId, attachment?: string) => void;
  muted?: boolean;
  activeApp?: AppId;
  gameRequest?: { id: GameId; nonce: number };
  mailDraft?: { recipient: AgentId; attachment?: string; nonce: number };
}
function Stamp({ id, data }: { id: string; data: Snapshot }) {
  const a = data.world.agents.find((a) => a.id === id);
  return (
    <span className="avatar" style={{ background: a?.color || "#737770" }}>
      {a?.initials || "you"}
    </span>
  );
}
function Sender({ e, data }: { e: Event; data: Snapshot }) {
  if (e.audioTranscript) return <>Nora Vale (recording)</>;
  return (
    <>
      {data.world.agents.find((a) => a.id === e.actor)?.name ||
        (e.actor === "visitor" ? "You" : "Network service")}
    </>
  );
}
function Provenance({ e }: { e: Event }) {
  return e.origin === "baseline" ? (
    <span className="provenance baseline">Scripted baseline</span>
  ) : null;
}
export function Mail(props: AppProps) {
  const {
    data,
    perform,
    busy,
    target,
    setTarget,
    mailDraft,
    muted,
    activeApp,
    open,
  } = props;
  const [compose, setCompose] = useState(false);
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox");
  const [selected, setSelected] = useState("seed-mail");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState("");
  useEffect(() => {
    if (mailDraft) {
      setCompose(true);
      setTarget(mailDraft.recipient);
      setAttachment(mailDraft.attachment || "");
    }
  }, [mailDraft?.nonce]);
  const [voiceError, setVoiceError] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [audio, setAudio] = useState("");
  const audioElement = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    if (activeApp !== "mail") audioElement.current?.pause();
  }, [activeApp]);
  useEffect(() => () => duckAmbient(false), []);
  const requestId = useRef(0);
  const messages = data.world.events
    .filter(
      (e) =>
        e.channel === "mail" &&
        e.actor !== "nora" &&
        e.to !== "nora" &&
        (e.to === "visitor" || e.actor === "visitor"),
    )
    .slice()
    .reverse();
  const visibleMessages = messages.filter((e) =>
    folder === "inbox" ? e.to === "visitor" : e.actor === "visitor",
  );
  const message =
    visibleMessages.find((e) => e.id === selected) || visibleMessages[0];
  useEffect(() => {
    return () => {
      if (audio) URL.revokeObjectURL(audio);
    };
  }, [audio]);
  useEffect(() => {
    requestId.current++;
    setAudio("");
    setVoiceError("");
    setVoiceLoading(false);
    setPosition(0);
    setDuration(0);
    setPlaying(false);
  }, [message?.id]);
  async function play() {
    if (!message) return;
    if (audio && audioElement.current) {
      audioElement.current.currentTime = 0;
      void audioElement.current.play();
      return;
    }
    const current = ++requestId.current;
    setVoiceLoading(true);
    setVoiceError("");
    try {
      const r = await fetch(`/api/audio/${message.id}`, { method: "POST" });
      if (!r.ok) {
        const detail = (await r.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(detail.error || `Recording unavailable (${r.status}).`);
      }
      const blob = await r.blob();
      if (requestId.current === current) setAudio(URL.createObjectURL(blob));
    } catch (e) {
      if (requestId.current === current) setVoiceError((e as Error).message);
    } finally {
      if (requestId.current === current) setVoiceLoading(false);
    }
  }
  return (
    <div className="mail-app">
      <div className="app-toolbar">
        <button onClick={() => setCompose(true)}>
          <PixelIcon name="mail" size={24} /> Write a message
        </button>
        <button
          onClick={() => {
            setFolder("inbox");
            setCompose(false);
            if (visibleMessages[0]) setSelected(visibleMessages[0].id);
          }}
        >
          Inbox ({messages.filter((e) => e.to === "visitor").length})
        </button>
        <span className="toolbar-note">Private correspondence</span>
      </div>
      <div className="mail-layout">
        <aside className="mail-folders">
          <strong>Local mail</strong>
          <button
            className={folder === "inbox" ? "active" : ""}
            onClick={() => {
              setFolder("inbox");
              setCompose(false);
            }}
          >
            Inbox ({messages.filter((e) => e.to === "visitor").length})
          </button>
          <button
            className={folder === "sent" ? "active" : ""}
            onClick={() => {
              setFolder("sent");
              setCompose(false);
            }}
          >
            Sent
          </button>
        </aside>
        <div className="mail-panes">
          <div className="mail-table-head">
            <span>Sender</span>
            <span>Subject</span>
            <span>Received</span>
          </div>
          <aside className="mail-list">
            {visibleMessages.map((e) => (
              <button
                key={e.id}
                className={message?.id === e.id && !compose ? "active" : ""}
                onClick={() => {
                  setSelected(e.id);
                  setCompose(false);
                }}
              >
                <strong>
                  <Sender e={e} data={data} />
                </strong>
                <span>{e.subject || "A quiet word"}</span>
                <small>
                  {e.archivedAt || (e.tick === 0 ? "31 Oct" : "2 Nov")}
                </small>
              </button>
            ))}
          </aside>
          <main className="mail-body">
            {compose ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await perform({
                    type: "message",
                    target,
                    text,
                    evidenceId: attachment || undefined,
                  });
                  if (ok) {
                    setText("");
                    // Show the letter that was just sent, in the Sent folder.
                    setFolder("sent");
                    setSelected("latest");
                    setCompose(false);
                  }
                }}
              >
                <h1>New message</h1>
                <OfflineNotice
                  data={data}
                  perform={perform}
                  busy={busy}
                  open={open}
                />
                <label>
                  To{" "}
                  <select
                    aria-label="Recipient"
                    value={target}
                    onChange={(e) => setTarget(e.target.value as AgentId)}
                  >
                    {data.world.agents
                      .filter((a) => a.id !== "nora")
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (@{a.handle})
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Attachment{" "}
                  <select
                    aria-label="Attach evidence"
                    value={attachment}
                    onChange={(e) => setAttachment(e.target.value)}
                  >
                    <option value="">No attachment</option>
                    {data.archive
                      .filter((e) => data.world.collected.includes(e.id))
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.filename}
                        </option>
                      ))}
                  </select>
                </label>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  disabled={busy}
                  value={text}
                  maxLength={1000}
                  onChange={(e) => setText(e.target.value)}
                  placeholder=""
                  required
                  rows={7}
                />
                <div className="form-footer">
                  <small>{text.length}/1000</small>
                  <button
                    className="primary"
                    disabled={
                      busy ||
                      isOffline(data) ||
                      !text.trim() ||
                      !data.world.remainingTurns
                    }
                  >
                    {busy ? "Waiting for a reply…" : "Send privately"}
                  </button>
                </div>
              </form>
            ) : message ? (
              <>
                <div className="letter-heading">
                  <p>
                    From:{" "}
                    <strong>
                      <Sender e={message} data={data} />
                    </strong>
                  </p>
                  <p>
                    To:{" "}
                    {message.to === "visitor"
                      ? message.origin === "seed"
                        ? "Nora Vale"
                        : "You"
                      : data.world.agents.find((a) => a.id === message.to)
                          ?.name}
                  </p>
                  <p>Received: {message.archivedAt || "2 November 1999"}</p>
                  <h1>{message.subject || "A quiet word"}</h1>
                  <Provenance e={message} />
                </div>
                <div className="letter-text">{message.text}</div>
                {message.id === "personal-bus" && (
                  <SaveItem {...props} id="carrier" />
                )}
                {message.audioTranscript && (
                  <details className="voicemail-transcript">
                    <summary>Read original voicemail transcript</summary>
                    <p>{message.audioTranscript}</p>
                  </details>
                )}
                {message.factIds.length > 0 && (
                  <p className="attachment-note">
                    Attached:{" "}
                    {message.factIds
                      .map(
                        (id) => data.archive.find((e) => e.id === id)?.filename,
                      )
                      .join(", ")}
                  </p>
                )}
                <div className="letter-actions">
                  <button
                    onClick={() => {
                      if (
                        message.actor !== "system" &&
                        message.actor !== "visitor"
                      )
                        setTarget(message.actor);
                      setCompose(true);
                    }}
                  >
                    Reply privately
                  </button>
                  {message.to === "visitor" && message.audioTranscript && (
                    <button
                      onClick={() => void play()}
                      disabled={
                        exhibition || !data.status.voice || voiceLoading
                      }
                    >
                      {voiceLoading
                        ? "Loading recording…"
                        : audio
                          ? "Replay recording"
                          : "Play recording"}
                    </button>
                  )}
                </div>
                {audio && (
                  <>
                    <audio
                      ref={audioElement}
                      aria-label="Voicemail playback"
                      src={audio}
                      hidden
                      muted={muted}
                      autoPlay
                      onPlay={() => {
                        setPlaying(true);
                        duckAmbient(true);
                      }}
                      onPause={() => {
                        setPlaying(false);
                        duckAmbient(false);
                      }}
                      onEnded={() => {
                        setPlaying(false);
                        duckAmbient(false);
                      }}
                      onLoadedMetadata={(e) =>
                        setDuration(e.currentTarget.duration)
                      }
                      onTimeUpdate={(e) =>
                        setPosition(e.currentTarget.currentTime)
                      }
                      onError={() => {
                        setPlaying(false);
                        duckAmbient(false);
                        setVoiceError(
                          "The recording couldn’t play. Read the transcript instead.",
                        );
                      }}
                    />
                    <div
                      className="voice-transport"
                      role="group"
                      aria-label="Recording controls"
                    >
                      <button
                        onClick={() => {
                          if (playing) audioElement.current?.pause();
                          else void audioElement.current?.play();
                        }}
                      >
                        {playing ? "Pause recording" : "Resume recording"}
                      </button>
                      <button
                        onClick={() => {
                          audioElement.current?.pause();
                          if (audioElement.current)
                            audioElement.current.currentTime = 0;
                        }}
                      >
                        Stop
                      </button>
                      <input
                        type="range"
                        aria-label="Recording position"
                        min={0}
                        max={duration || 1}
                        step={0.1}
                        value={Math.min(position, duration || 1)}
                        onChange={(e) => {
                          if (audioElement.current)
                            audioElement.current.currentTime = Number(
                              e.target.value,
                            );
                        }}
                      />
                      <time>
                        {Math.floor(position)} / {Math.ceil(duration)} s
                      </time>
                    </div>
                  </>
                )}
                {(!data.status.voice || exhibition) &&
                  message.to === "visitor" &&
                  message.audioTranscript && (
                    <p className="fine-print">
                      Audio is unavailable in this edition. Read the transcript.
                    </p>
                  )}
                {voiceError && (
                  <p role="alert" className="inline-error">
                    {voiceError}
                  </p>
                )}
              </>
            ) : (
              <p className="empty">No correspondence yet.</p>
            )}
          </main>
        </div>
      </div>
      <div className="window-status">
        <span>{messages.length} messages</span>
        <span>Your inbox is stored on this computer.</span>
      </div>
    </div>
  );
}
export function People({ data, target, setTarget, open, composeTo }: AppProps) {
  const people = data.world.agents.filter((p) => p.id !== "nora");
  const a =
    people.find((p) => p.id === target) ?? people[0] ?? data.world.agents[0];
  if (!a) return <p className="empty-state">No accounts on this network.</p>;
  return (
    <div className="people-app">
      <aside className="people-list">
        {people.map((p) => (
          <button
            key={p.id}
            className={p.id === a.id ? "active" : ""}
            onClick={() => setTarget(p.id)}
          >
            <Stamp id={p.id} data={data} />
            <span>
              {p.name}
              <small>@{p.handle}</small>
            </span>
          </button>
        ))}
      </aside>
      <main className="profile">
        <div className="profile-heading">
          <Stamp id={a.id} data={data} />
          <div>
            <h1>{a.name}</h1>
            <span>
              @{a.handle} · <i className="led" /> online
            </span>
          </div>
        </div>
        <blockquote>“{a.bio}”</blockquote>
        <dl className="profile-facts">
          <div>
            <dt>Last active</dt>
            <dd>
              {a.lastActive ? `Network turn ${a.lastActive}` : "This morning"}
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{a.handle}@deadnet.local</dd>
          </div>
          <div>
            <dt>Group</dt>
            <dd>{a.role}</dd>
          </div>
        </dl>
        <button onClick={() => composeTo(a.id)}>
          Write to {a.name.split(" ")[0]}
        </button>
      </main>
    </div>
  );
}
/** True when live replies are selected but no model can answer them. */
export function isOffline(data: Snapshot) {
  return (
    !exhibition &&
    data.world.mode === "live" &&
    (!data.status.available || quotaSpent(data))
  );
}
/** Today's free AI allowance is used up for this visitor or for everyone. */
function quotaSpent(data: Snapshot) {
  const q = data.status.quota;
  return Boolean(
    q && (q.visitorUsed >= q.visitorLimit || q.globalUsed >= q.globalLimit),
  );
}
export function OfflineNotice({
  data,
  perform,
  busy,
  open,
  inReadMe,
}: Pick<AppProps, "data" | "perform" | "busy" | "open"> & {
  inReadMe?: boolean;
}) {
  if (!isOffline(data)) return null;
  return (
    <div className="offline-notice" role="status">
      <p>
        <strong>
          {data.status.available
            ? "Today’s free AI replies are used up,"
            : "No AI model is connected,"}
        </strong>{" "}
        so nobody can reply live right now. Switch to scripted replies to keep
        playing
        {data.status.available
          ? ", or come back tomorrow."
          : inReadMe
            ? ", or connect a model in System Monitor."
            : ", or check the connection in System Monitor."}
      </p>
      <div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void perform({ type: "mode", mode: "baseline" })}
        >
          Use scripted replies
        </button>
        {!inReadMe && (
          <button type="button" onClick={() => open("readme")}>
            System Monitor
          </button>
        )}
      </div>
    </div>
  );
}
export function Notebook() {
  const initial =
    "rent\nbatteries\nblue scarf at mara’s\n\nask adam about the station flat\nget a spare cut this time\n\nsunday: bring bread, return bowls";
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem("deadnet-case-notes-v3") ?? initial;
    } catch {
      return initial;
    }
  });
  const [confirmClear, setConfirmClear] = useState(false);
  function edit(value: string) {
    setText(value);
    setConfirmClear(false);
    try {
      localStorage.setItem("deadnet-case-notes-v3", value);
    } catch {
      /* Session-only fallback. */
    }
  }
  function save() {
    const u = URL.createObjectURL(new Blob([text], { type: "text/plain" })),
      a = document.createElement("a");
    a.href = u;
    a.download = "notes.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  const lines = text.split("\n").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="plain-notepad">
      <div className="menubar">
        <button
          onClick={() => {
            if (text.trim()) setConfirmClear(true);
            else edit("");
          }}
        >
          New
        </button>
        <button onClick={save}>Save As…</button>
        <button
          onClick={() => {
            void navigator.clipboard?.writeText(text);
          }}
        >
          Copy
        </button>
        <span className="notepad-hint">Ctrl/Cmd+S saves a copy</span>
      </div>
      {confirmClear && (
        <div className="notepad-confirm" role="alert" aria-label="Clear notes">
          <span>Clear all notes? This can’t be undone.</span>
          <button
            onClick={() => {
              edit("");
            }}
          >
            Clear notes
          </button>
          <button autoFocus onClick={() => setConfirmClear(false)}>
            Cancel
          </button>
        </div>
      )}
      <textarea
        aria-label="Notepad document"
        spellCheck={false}
        value={text}
        onChange={(e) => edit(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            save();
          }
        }}
      />
      <div className="window-status">
        <span>notes.txt</span>
        <span>
          {lines} {lines === 1 ? "line" : "lines"} · {words}{" "}
          {words === 1 ? "word" : "words"}
        </span>
      </div>
    </div>
  );
}
/** Seconds of play that recover one of Nora's game saves. */
const PLAY_TO_RECOVER = 20;
export function Games({
  data,
  perform,
  muted,
  activeApp,
  gameRequest,
}: AppProps) {
  const [game, setGame] = useState<string | null>(null),
    [run, setRun] = useState(0),
    [paused, setPaused] = useState(false),
    [soundOff, setSoundOff] = useState(false),
    [frameState, setFrameState] = useState<"loading" | "ready" | "error">(
      "loading",
    ),
    frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (gameRequest) setGame(gameRequest.id);
  }, [gameRequest?.nonce]);
  const current = GAME_LIST.find((g) => g.id === game);
  const played = data.world.played || [];
  const recovered = Boolean(game && played.includes(game));
  const [seconds, setSeconds] = useState(0);
  // Keep elapsed time in a ref: state updaters must stay pure, and StrictMode
  // can invoke them twice, which would double-submit a recovered save.
  const elapsed = useRef(0);
  // Optional play history is recorded without affecting the investigation.
  useEffect(() => {
    elapsed.current = 0;
    setSeconds(0);
  }, [game, run]);
  useEffect(() => {
    if (!game || recovered || paused || activeApp !== "games") return;
    const t = setInterval(() => {
      if (document.hidden) return;
      elapsed.current += 1;
      setSeconds(elapsed.current);
      // Retry every five seconds if the save could not be recorded (for
      // example while the server is briefly unreachable).
      if (
        elapsed.current === PLAY_TO_RECOVER ||
        (elapsed.current > PLAY_TO_RECOVER && elapsed.current % 5 === 0)
      )
        void perform({ type: "played", game: game as GameId });
    }, 1000);
    return () => clearInterval(t);
  }, [game, run, recovered, paused, activeApp]);
  const syncSound = () => {
    const child = frame.current?.contentWindow;
    child?.postMessage(
      {
        type: "deadnet-audio",
        muted: Boolean(muted || soundOff || paused || activeApp !== "games"),
      },
      location.origin,
    );
    child?.postMessage(
      { type: "deadnet-pause", paused: paused || activeApp !== "games" },
      location.origin,
    );
  };
  useEffect(syncSound, [muted, activeApp, game, run, paused, soundOff]);
  // A missing or broken game page should say so instead of showing a blank card.
  useEffect(() => {
    if (game) setFrameState("loading");
  }, [game, run]);
  useEffect(() => {
    if (!game || frameState !== "loading") return;
    const t = setTimeout(() => setFrameState("error"), 12000);
    return () => clearTimeout(t);
  }, [game, run, frameState]);
  function key(k: string, down: boolean) {
    const wasd: Record<string, string> = {
      w: "ArrowUp",
      a: "ArrowLeft",
      s: "ArrowDown",
      d: "ArrowRight",
    };
    const backwards = k === "Shift+Tab";
    const mapped = wasd[k] || (backwards ? "Tab" : k);
    const codes: Record<string, number> = {
      ArrowLeft: 37,
      ArrowUp: 38,
      ArrowRight: 39,
      ArrowDown: 40,
      " ": 32,
      Enter: 13,
      Tab: 9,
      Escape: 27,
    };
    frame.current?.contentWindow?.postMessage(
      {
        type: "deadnet-key",
        key: mapped,
        code: mapped === " " ? "Space" : mapped,
        keyCode: codes[mapped],
        down,
        shiftKey: backwards,
      },
      location.origin,
    );
  }
  const keys =
    game === "flappy"
      ? [" "]
      : game === "phantomicus"
        ? ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight", " ", "Enter"]
        : [
            "ArrowLeft",
            "ArrowUp",
            "ArrowDown",
            "ArrowRight",
            "w",
            "a",
            "s",
            "d",
            ...(game === "tetris" || game === "snake" ? [" "] : []),
          ];
  // Keys pressed while the desktop (not the game frame) has focus still reach
  // the game, e.g. right after opening it from a desktop icon.
  useEffect(() => {
    if (!game || paused || activeApp !== "games") return;
    const forward = (down: boolean) => (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      const backwards = false;
      if (!backwards && !keys.includes(e.key)) return;
      e.preventDefault();
      if (down && e.repeat) return;
      key(backwards ? "Shift+Tab" : e.key, down);
    };
    const down = forward(true),
      up = forward(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [game, paused, activeApp, run]);
  return (
    <div className="games-app">
      <div className="game-shell-toolbar">
        <button
          onClick={() => {
            setGame(null);
            setPaused(false);
          }}
        >
          Games
        </button>
        {current && (
          <>
            <span className="game-program-name">{current.name}.exe</span>
            <button
              onClick={() => {
                setRun(run + 1);
                setPaused(false);
              }}
            >
              New game
            </button>
            <button aria-pressed={paused} onClick={() => setPaused(!paused)}>
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              aria-pressed={soundOff || muted}
              disabled={muted}
              onClick={() => setSoundOff(!soundOff)}
            >
              {muted ? "Muted" : soundOff ? "Sound off" : "Sound on"}
            </button>
          </>
        )}
      </div>
      {current ? (
        <div className="game-frame">
          <iframe
            ref={frame}
            onLoad={() => {
              setFrameState("ready");
              syncSound();
              // Give the game keyboard focus as soon as it opens.
              frame.current?.focus();
              frame.current?.contentWindow?.focus();
            }}
            onError={() => setFrameState("error")}
            key={game + "-" + run}
            title={current.name}
            src={`${import.meta.env.BASE_URL}games/${game}/index.html`}
            sandbox="allow-scripts allow-same-origin allow-forms"
            allow="autoplay; gamepad"
          />
          {frameState === "loading" && (
            <div className="game-overlay" role="status">
              Loading {current.name}…
            </div>
          )}
          {frameState === "error" && (
            <div className="game-overlay game-overlay-error" role="alert">
              <p>{current.name} didn’t load.</p>
              <button
                type="button"
                onClick={() => {
                  setFrameState("loading");
                  setRun(run + 1);
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="game-folder-wrap">
          <p className="game-recovery-note">
            Adam’s games, copied for Nora. She was supposed to be packing.
          </p>
          <div className="game-folder">
            {GAME_LIST.map((g) => (
              <button key={g.id} onClick={() => setGame(g.id)}>
                <GameIcon id={g.id} />
                <strong>
                  {g.name}
                  {played.includes(g.id) ? " ✓" : ""}
                </strong>
                <span>{g.keys}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {current && (
        <div className="game-keyboard" aria-label="Game controls">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              aria-label={k === " " ? "Space" : k}
              disabled={paused}
              onPointerDown={(e) => {
                e.preventDefault();
                key(k, true);
              }}
              onPointerUp={() => key(k, false)}
              onPointerLeave={() => key(k, false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  key(k, true);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter") key(k, false);
              }}
            >
              {(
                {
                  ArrowLeft: "←",
                  ArrowUp: "↑",
                  ArrowDown: "↓",
                  ArrowRight: "→",
                  " ": "Space",
                  "Shift+Tab": "⇧Tab",
                } as Record<string, string>
              )[k] || k}
            </button>
          ))}
          {paused && <span>Paused</span>}
        </div>
      )}
      <footer className="game-credits">
        {current?.id === "phantomicus" ? (
          <a
            href={"https://github.com/" + current.repo}
            target="_blank"
            rel="noreferrer"
          >
            {current.name} © {current.author} · MIT
          </a>
        ) : (
          <span>{current ? current.name : `${GAME_LIST.length} games`}</span>
        )}
        {current && (
          <span className="game-recovery" role="status">
            {recovered ? "Played ✓" : "Nora’s game library"}
          </span>
        )}
      </footer>
    </div>
  );
}
export function Monitor({ data, perform, busy }: AppProps) {
  const [reset, setReset] = useState(false);
  const [tab, setTab] = useState<"activity" | "traces">("activity");
  const traces = data.world.traces;
  const inputTokens = traces.reduce((n, t) => n + t.inputTokens, 0);
  const outputTokens = traces.reduce((n, t) => n + t.outputTokens, 0);
  const averageLatency = traces.length
    ? traces.reduce((n, t) => n + t.latencyMs, 0) / traces.length
    : 0;
  const reportedCost = traces.reduce((n, t) => n + (t.costUsd || 0), 0);
  return (
    <div className="monitor-app">
      <div className="monitor-tabs">
        <button
          className={tab === "activity" ? "pressed" : ""}
          onClick={() => setTab("activity")}
        >
          Network activity
        </button>
        <button
          className={tab === "traces" ? "pressed" : ""}
          onClick={() => setTab("traces")}
        >
          Inference traces ({traces.length})
        </button>
      </div>
      <div className="monitor-screen">
        <div className="console-heading">
          <span>DEADNET / RECOVERY SERVICE</span>
          <span>v0.1</span>
        </div>
        <div className="console-lines">
          <p>
            MODEL{" "}
            <strong>
              {data.world.mode === "baseline"
                ? "DETERMINISTIC BASELINE"
                : data.status.model}
            </strong>
          </p>
          <p>
            STATUS{" "}
            <strong
              className={
                data.status.available ? "console-good" : "console-warning"
              }
            >
              {data.world.mode === "baseline"
                ? "SCRIPTED · NO LIVE AI"
                : data.status.available
                  ? data.status.provider === "openrouter"
                    ? "FREE HOSTED MODEL CONFIGURED"
                    : "LOCAL INFERENCE READY"
                  : "MODEL DISCONNECTED"}
            </strong>
          </p>
          <p>
            TURN <strong>{String(data.world.tick).padStart(4, "0")}</strong>{" "}
            <span>ALLOWANCE {data.world.remainingTurns}/18</span>
          </p>
          <p>
            ACCOUNTS <strong>3</strong> <span>EXTERNAL ORIGIN: UNVERIFIED</span>
          </p>
        </div>
        {tab === "activity" ? (
          <div className="event-log">
            {data.world.events
              .filter((e) => e.channel === "system")
              .slice(-16)
              .reverse()
              .map((e) => (
                <p key={e.id}>
                  <span>[{String(e.tick).padStart(4, "0")}]</span> {e.text}
                </p>
              ))}
          </div>
        ) : (
          <div className="trace-list">
            {traces.length > 0 && (
              <p className="trace-summary">
                {traces.length} turn{traces.length === 1 ? "" : "s"} ·{" "}
                {inputTokens} in / {outputTokens} out · avg{" "}
                {(averageLatency / 1000).toFixed(1)}s
                {reportedCost > 0
                  ? ` · $${reportedCost.toFixed(4)} reported`
                  : " · no reported cost"}
              </p>
            )}
            {traces.length ? (
              traces
                .slice()
                .reverse()
                .map((t) => (
                  <details key={t.id}>
                    <summary>
                      <span
                        className={
                          t.status === "ok" ? "console-good" : "console-warning"
                        }
                      >
                        {t.status.toUpperCase()}
                      </span>{" "}
                      {t.actor} · {(t.latencyMs / 1000).toFixed(1)}s ·{" "}
                      {t.inputTokens} in / {t.outputTokens} out
                    </summary>
                    <p>
                      {t.model} · {t.tokensPerSecond} tok/s
                      <br />
                      Decision: {t.action || "none"}
                      <br />
                      Source: {t.sourceId}
                      <br />
                      Attempts: {t.attempts} · prompt hash:{" "}
                      {t.promptHash || "fixture"}
                      <br />
                      {t.error || "Validated and committed to local SQLite."}
                    </p>
                  </details>
                ))
            ) : (
              <p>
                No model turns yet. Listen to the network or write privately.
              </p>
            )}
          </div>
        )}
      </div>
      {data.status.quota && (
        <p className="monitor-quota">
          Free requests today: {data.status.quota.visitorUsed}/
          {data.status.quota.visitorLimit} · Shared account:{" "}
          {data.status.quota.globalUsed}/{data.status.quota.globalLimit}. Resets
          at 00:00 UTC. No paid fallback.
        </p>
      )}
      <div className="monitor-controls">
        <label>
          <input
            type="checkbox"
            checked={data.world.auto}
            disabled={
              busy || !data.world.remainingTurns || !data.status.autonomy
            }
            onChange={(e) =>
              void perform({ type: "auto", enabled: e.target.checked })
            }
          />{" "}
          Let the network run (one turn / 35 sec)
        </label>
        <button
          disabled={busy || !data.world.remainingTurns}
          onClick={() => void perform({ type: "tick" })}
        >
          {busy ? "Generating…" : "Advance one turn"}
        </button>
        <button disabled={busy} onClick={() => void perform({ type: "renew" })}>
          Renew 18 turns
        </button>
      </div>
      {!data.status.autonomy && (
        <p className="fine-print monitor-note" role="status">
          Autonomous turns are disabled on the hosted copy so shared capacity
          stays available. You can still advance the story one turn at a time.
        </p>
      )}
      <p className="fine-print monitor-note">
        Autonomy stops when this page disconnects, the service restarts, or the
        allowance runs out. Private messages use one turn. No catch-up
        generation.
      </p>
      <div className="monitor-settings">
        <label>
          Response engine{" "}
          <select
            aria-label="Response engine"
            disabled={busy}
            value={data.world.mode}
            onChange={(e) =>
              void perform({
                type: "mode",
                mode: e.target.value as "live" | "baseline",
              })
            }
          >
            <option value="live" disabled={exhibition}>
              Live open-weight model
            </option>
            <option value="baseline">Deterministic baseline (scripted)</option>
          </select>
        </label>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(data.world, null, 2)], {
                type: "application/json",
              }),
              url = URL.createObjectURL(blob),
              a = document.createElement("a");
            a.href = url;
            a.download = "deadnet-investigation.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Export investigation
        </button>
        <button onClick={() => setReset(!reset)}>New investigation…</button>
      </div>
      {reset && (
        <div className="reset-confirm" role="alert">
          <span>
            This deletes the current fictional world and all its private
            messages. Export it first to keep a copy.
          </span>
          <button
            disabled={busy}
            onClick={() => {
              void perform({ type: "reset" });
              setReset(false);
            }}
          >
            Delete world and restart
          </button>
          <button onClick={() => setReset(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export function Spirit({ data, perform, busy, open }: AppProps) {
  const released =
    data.world.ending === "exposed" && data.world.accused === "sysop";
  const [text, setText] = useState(""),
    [attachment, setAttachment] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const messages = data.world.events.filter(
    (e) =>
      e.channel === "mail" &&
      ((e.actor === "nora" && e.to === "visitor") ||
        (e.actor === "visitor" && e.to === "nora")),
  );
  useEffect(() => {
    log.current?.scrollTo(0, log.current.scrollHeight);
  }, [messages.length, busy]);
  return (
    <div className="spirit-app">
      <div className="spirit-toolbar">
        <PixelIcon name="spirit" size={24} />
        <strong>nora_v</strong>
        <span>{released ? "Connection closed" : "Unverified connection"}</span>
      </div>
      <div
        className="spirit-log"
        ref={log}
        role="log"
        aria-label="Nora conversation"
        aria-live="polite"
      >
        <p className="signal-system">
          Connection opened. Last seen: 31 October 1999.
        </p>
        {!messages.length && (
          <div className="signal-message">
            <strong>unknown:</strong>
            <p>i can hear the keys. is somebody there?</p>
            <p>adam? is that you? you’re late for soup.</p>
          </div>
        )}
        {messages.map((e) => (
          <div
            key={e.id}
            className={`signal-message ${e.actor === "visitor" ? "from-visitor" : ""}`}
          >
            <strong>{e.actor === "visitor" ? "You" : "nora_v"}:</strong>
            <p>{e.text}</p>
            {e.origin === "baseline" && <small>Scripted baseline</small>}
          </div>
        ))}
        {busy && <p className="signal-system">Receiving…</p>}
        {data.world.traces.at(-1)?.actor === "nora" &&
          data.world.traces.at(-1)?.status === "error" && (
            <p className="signal-system" role="status">
              Line interrupted. Your message was saved; try sending again.
            </p>
          )}
      </div>
      <OfflineNotice data={data} perform={perform} busy={busy} open={open} />
      {released ? (
        <p className="fine-print spirit-limit" role="status">
          The signal closed after your report. Her messages remain.
        </p>
      ) : !data.world.remainingTurns ? (
        <p className="fine-print spirit-limit" role="status">
          No turns remain.{" "}
          <button
            type="button"
            className="link"
            onClick={() => open("monitor")}
          >
            Renew the allowance
          </button>{" "}
          in System Monitor, or keep reading the recovered files.
        </p>
      ) : null}
      <form
        className="spirit-compose"
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await perform({
              type: "message",
              target: "nora",
              text,
              evidenceId: attachment || undefined,
            })
          ) {
            setText("");
            setAttachment("");
          }
        }}
      >
        <label>
          Attachment{" "}
          <select
            aria-label="Show Nora a file"
            value={attachment}
            onChange={(e) => setAttachment(e.target.value)}
          >
            <option value="">None</option>
            {data.archive
              .filter((e) => data.world.collected.includes(e.id))
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.filename}
                </option>
              ))}
          </select>
        </label>
        <textarea
          aria-label="Message Nora"
          disabled={busy || released}
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <div>
          <small className="spirit-count" aria-live="polite">
            {text.length}/1000
          </small>
          <button type="button" onClick={() => open("readme")}>
            Casebook
          </button>
          <button
            type="submit"
            disabled={
              busy ||
              released ||
              isOffline(data) ||
              !text.trim() ||
              !data.world.remainingTurns
            }
          >
            Send
          </button>
        </div>
      </form>
      <div className="window-status">
        <span>
          {data.world.mode === "baseline"
            ? "Scripted baseline"
            : "Live AI · Connection open"}
        </span>
        <span>{data.world.remainingTurns} turns remain</span>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type { Action, AgentId, Event, Snapshot } from "./types";
import { PixelIcon } from "./icons";
import { exhibition } from "./api";
import { duckAmbient } from "./sound";
import { GAME_LIST, GameIcon, type GameId } from "./games";
import { caseProgress, GAMES_TO_RECOVER } from "./rules";
export type AppId =
  | "readme"
  | "browser"
  | "mail"
  | "archive"
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
      | "people"
      | "monitor"
      | "notebook"
      | "games"
      | "spirit";
  }
> = {
  readme: { title: "Read Me", icon: "notebook" },
  browser: { title: "Chat Logs", icon: "browser" },
  spirit: { title: "Unknown Signal", icon: "spirit" },
  mail: { title: "Inbox", icon: "mail" },
  archive: { title: "My Documents", icon: "archive" },
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
export function Browser({ data, open, perform, busy, setTarget }: AppProps) {
  const [tab, setTab] = useState<"feed" | "directory">("feed");
  const [filter, setFilter] = useState("all");
  const feed = data.world.events
    .filter(
      (e) => e.channel === "feed" && (filter === "all" || e.actor === filter),
    )
    .slice()
    .reverse();
  return (
    <div className="browser-app">
      <div className="menubar">
        <button onClick={() => open("archive")}>File</button>
        <button onClick={() => open("people")}>Directory</button>
        <button onClick={() => open("monitor")}>Connection</button>
        <button onClick={() => open("readme")}>Help</button>
      </div>
      <div className="browser-tools">
        <button
          onClick={() => {
            setTab("feed");
            setFilter("all");
          }}
          title="Home"
        >
          <PixelIcon name="browser" size={18} />
          <span>Home</span>
        </button>
        <button aria-label="Mail" onClick={() => open("mail")}>
          <PixelIcon name="mail" size={18} />
          <span>Mail</span>
        </button>
        <button aria-label="Archive" onClick={() => open("archive")}>
          <PixelIcon name="archive" size={18} />
          <span>Archive</span>
        </button>
        <span className="tool-divider" />
        <label htmlFor="address">Address</label>
        <div id="address" className="address">
          <span>http://</span>deadnet.local/
          {tab === "feed" ? "neighborhood" : "directory"}
        </div>
        <span className="connection-mark">
          d<span>n</span>
        </span>
      </div>
      <div className="web-page">
        <div className="web-date">
          <span>Sunday, October 31, 1999</span>
          <span>
            <i className="led" />{" "}
            {data.world.agents.filter((a) => a.id !== "nora").length} accounts
            connected
          </span>
        </div>
        <header className="web-masthead">
          <div>
            <p className="web-name">
              DEADNET<span> directory</span>
            </p>
          </div>
        </header>
        <nav className="web-nav" aria-label="DeadBrowser">
          <button
            className={tab === "feed" ? "selected" : ""}
            onClick={() => setTab("feed")}
          >
            Residents’ messages
          </button>
          <button
            className={tab === "directory" ? "selected" : ""}
            onClick={() => setTab("directory")}
          >
            Address book
          </button>
          <button onClick={() => open("archive")}>The archive</button>
          <button onClick={() => open("notebook")}>Notepad</button>
        </nav>
        {tab === "feed" ? (
          <>
            <div className="web-columns">
              <main className="feed-column">
                <div className="section-title">
                  <h1>Residents’ messages</h1>
                  <label>
                    Show{" "}
                    <select
                      aria-label="Filter feed"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">everyone</option>
                      {data.world.agents
                        .filter((a) => a.id !== "nora")
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.handle}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
                {feed.length ? (
                  feed.map((e) => (
                    <article className="post" key={e.id}>
                      <Stamp id={e.actor} data={data} />
                      <div className="post-main">
                        <div className="post-header">
                          <button
                            className="web-link"
                            onClick={() => {
                              if (e.actor !== "visitor" && e.actor !== "system")
                                setTarget(e.actor);
                              open("people");
                            }}
                          >
                            <Sender e={e} data={data} />
                          </button>
                          <time>
                            {e.tick === 0
                              ? e.archivedAt || "this morning"
                              : `network turn ${e.tick}`}
                          </time>
                        </div>
                        <p>{e.text}</p>
                        <div className="post-meta">
                          <Provenance e={e} />
                          {e.factIds.length > 0 && (
                            <button
                              className="web-link"
                              onClick={() => open("notebook")}
                            >
                              Attached record
                            </button>
                          )}
                          {e.actor !== "visitor" && e.actor !== "system" && (
                            <button
                              className="web-link"
                              onClick={() => {
                                setTarget(e.actor as AgentId);
                                open("mail");
                              }}
                            >
                              Write privately
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty">No messages from this account yet.</p>
                )}
                <div className="feed-end">End of messages</div>
              </main>
              <aside className="web-sidebar">
                <div className="online-box">
                  <h2>Online now</h2>
                  {data.world.agents
                    .filter((a) => a.id !== "nora")
                    .map((a) => (
                      <button
                        className="online-person"
                        key={a.id}
                        onClick={() => {
                          setTarget(a.id);
                          open("people");
                        }}
                      >
                        <Stamp id={a.id} data={data} />
                        <span>
                          <strong>{a.handle}</strong>
                          <small>{a.role}</small>
                        </span>
                        <i className="led" />
                      </button>
                    ))}
                </div>
                <figure className="archive-photo">
                  <img
                    src={`${import.meta.env.BASE_URL}assets/earthrise.jpg`}
                    alt="Earth rising above the lunar horizon, photographed during Apollo 8"
                    width="180"
                    height="180"
                  />
                  <figcaption>
                    EARTH.JPG · cached 1968
                    <br />
                    <a
                      href="https://science.nasa.gov/resource/image-earthrise/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      NASA / William Anders
                    </a>
                  </figcaption>
                </figure>
                <button
                  className="web-link archive-link"
                  onClick={() => open("archive")}
                >
                  Browse recovered files
                </button>
                <div className="counter-box">
                  <span>You are visitor</span>
                  <strong>
                    0 0{" "}
                    {String(data.world.boots)
                      .padStart(4, "0")
                      .split("")
                      .join(" ")}
                  </strong>
                </div>
                <button
                  className="network-step"
                  disabled={busy || data.world.remainingTurns === 0}
                  onClick={() => void perform({ type: "tick" })}
                >
                  {busy ? "Someone is typing…" : "Listen to the network →"}
                </button>
                <p className="step-hint">
                  Advance one social turn.
                  <br />
                  {data.world.remainingTurns} turns in this allowance.
                </p>
              </aside>
            </div>
          </>
        ) : (
          <div className="directory">
            <h1>Address book</h1>
            {data.world.agents
              .filter((a) => a.id !== "nora")
              .map((a) => (
                <button
                  key={a.id}
                  className="directory-person"
                  onClick={() => {
                    setTarget(a.id);
                    open("people");
                  }}
                >
                  <Stamp id={a.id} data={data} />
                  <span>
                    <strong>{a.name}</strong>
                    <small>
                      @{a.handle} · {a.role}
                    </small>
                    <span>{a.bio}</span>
                  </span>
                  <span>View profile →</span>
                </button>
              ))}
          </div>
        )}
        <footer className="web-footer">
          <span>DEADNET COMMUNITY NETWORK</span>
          <a
            href="https://p.yusukekamiyamane.com/"
            target="_blank"
            rel="noreferrer"
          >
            Fugue Icons © Yusuke Kamiyamane
          </a>
        </footer>
      </div>
      <div className="window-status">
        <span>
          <i className="led" /> Connected to deadnet.local
        </span>
        <span>
          {data.world.mode === "baseline" ? "Scripted baseline" : "Done"}
        </span>
      </div>
    </div>
  );
}
export function Mail({
  data,
  perform,
  busy,
  target,
  setTarget,
  mailDraft,
  muted,
  activeApp,
  open,
}: AppProps) {
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
  const message = messages.find((e) => e.id === selected) || messages[0];
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
  }, [selected]);
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
      if (!r.ok) throw new Error((await r.json()).error);
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
            setCompose(false);
            if (messages[0]) setSelected(messages[0].id);
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
                <small>{e.tick === 0 ? "03:17" : `turn ${e.tick}`}</small>
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
                      ? message.id === "seed-mail"
                        ? "Nora Vale"
                        : "You"
                      : data.world.agents.find((a) => a.id === message.to)
                          ?.name}
                  </p>
                  <h1>{message.subject || "A quiet word"}</h1>
                  <Provenance e={message} />
                </div>
                <div className="letter-text">{message.text}</div>
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
export function Archive({ data, perform, busy, composeTo, open }: AppProps) {
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState("carrier"),
    [sendMenu, setSendMenu] = useState(false),
    [policy, setPolicy] = useState<"sealed" | "exposed">("sealed"),
    [suspect, setSuspect] = useState<"" | "mara" | "len" | "sysop">("");
  const records = data.archive.filter((e) =>
    `${e.filename} ${e.folder}`.toLowerCase().includes(search.toLowerCase()),
  );
  const record = data.archive.find((e) => e.id === selected)!;
  const progress = caseProgress(data.world);
  const readable = !record.locked || progress.unlocked;
  useEffect(() => {
    if (readable && !data.world.collected.includes(selected) && !busy)
      void perform({ type: "collect", evidenceId: selected });
  }, [selected, readable, busy, data.world.collected.join(",")]);
  function save() {
    const url = URL.createObjectURL(
      new Blob([record.body], { type: "text/plain" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = record.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="archive-app">
      <div className="menubar">
        <button onClick={save} disabled={!readable}>
          Save As…
        </button>
        <button onClick={() => setSendMenu(!sendMenu)} disabled={!readable}>
          Send To…
        </button>
        <label className="search-field">
          Find{" "}
          <input
            aria-label="Search files"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="explorer-address">
        Address <span>C:\WINDOWS\Desktop\My Documents</span>
      </div>
      <div className="archive-layout">
        <aside className="file-list">
          <p>My Documents</p>
          {records.map((e) => (
            <button
              key={e.id}
              className={selected === e.id ? "active" : ""}
              onClick={() => {
                setSelected(e.id);
                setSendMenu(false);
              }}
            >
              <PixelIcon
                name={
                  e.id === "birthday"
                    ? "mail"
                    : e.id === "manifest"
                      ? "disk"
                      : "notebook"
                }
                size={27}
              />
              <span>
                <strong>{e.filename}</strong>
                <small>{e.folder}</small>
              </span>
            </button>
          ))}
          {!records.length && <p>No files found.</p>}
        </aside>
        <main className="file-reader">
          <div className="file-heading">
            <h1>{record.filename}</h1>
            <span>Modified: {record.date}</span>
          </div>
          <pre>
            {readable
              ? record.body
              : `Cannot read CASE_14.BAK.\n\nData error (cyclic redundancy check).\n\nRecovery needs more of Nora’s data:\n  ${progress.files >= 2 ? "[x]" : "[ ]"} Open the other files in this folder (${progress.files}/2)\n  ${progress.games >= GAMES_TO_RECOVER ? "[x]" : "[ ]"} Play ${GAMES_TO_RECOVER} of Nora’s games to recover their saves (${progress.games}/${GAMES_TO_RECOVER})`}
          </pre>
          {!readable && progress.games < GAMES_TO_RECOVER && (
            <button onClick={() => open("games")}>Open Nora’s games</button>
          )}
          {sendMenu && (
            <div className="file-send-menu" aria-label="Send file to">
              {data.world.agents
                .filter((a) => a.id !== "nora")
                .map((a) => (
                  <button
                    key={a.id}
                    disabled={busy}
                    onClick={() => {
                      composeTo(a.id, record.id);
                      setSendMenu(false);
                    }}
                  >
                    {a.name}
                  </button>
                ))}
              <button
                disabled={busy || data.world.ending === "sealed"}
                onClick={() => {
                  void perform({ type: "publish", evidenceId: record.id });
                  setSendMenu(false);
                }}
              >
                Network mailing list
              </button>
            </div>
          )}
          {record.id === "manifest" && readable && (
            <fieldset className="file-policy">
              <legend>Case file</legend>
              {data.world.ending === "open" ? (
                <>
                  <p className="fine-print">
                    Who opened room 317 at 03:17? Publish the evidence and name
                    them, or keep the case private.
                  </p>
                  <label>
                    <input
                      type="radio"
                      name="sharing"
                      checked={policy === "sealed"}
                      disabled={data.world.published.length > 0}
                      onChange={() => setPolicy("sealed")}
                    />{" "}
                    Keep private
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="sharing"
                      checked={policy === "exposed"}
                      onChange={() => setPolicy("exposed")}
                    />{" "}
                    Publish case evidence
                  </label>
                  {policy === "exposed" && (
                    <label>
                      Suspect{" "}
                      <select
                        aria-label="Report suspect"
                        value={suspect}
                        onChange={(e) =>
                          setSuspect(e.target.value as typeof suspect)
                        }
                      >
                        <option value="">Choose a name</option>
                        {data.world.agents
                          .filter((a) => a.id !== "nora")
                          .map((a) => (
                            <option value={a.id} key={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  <button
                    disabled={busy || (policy === "exposed" && !suspect)}
                    onClick={() =>
                      void perform({
                        type: "resolve",
                        choice: policy,
                        suspect: suspect || undefined,
                      })
                    }
                  >
                    {policy === "exposed" ? "File report" : "Keep case private"}
                  </button>
                  <p className="fine-print">This choice is final.</p>
                </>
              ) : (
                <p>
                  {data.world.ending === "exposed"
                    ? `Report filed. You named ${data.world.agents.find((a) => a.id === data.world.accused)?.name ?? "a suspect"}. Check Unknown Signal and Inbox for what happened next.`
                    : "Case kept private. Check Unknown Signal and Inbox for what happened next."}
                </p>
              )}
            </fieldset>
          )}
        </main>
      </div>
      <div className="window-status">
        <span>{records.length} object(s)</span>
        <span>Local disk</span>
      </div>
    </div>
  );
}
export function People({ data, target, setTarget, open, composeTo }: AppProps) {
  const a = data.world.agents.find((a) => a.id === target)!;
  return (
    <div className="people-app">
      <aside className="people-list">
        {data.world.agents
          .filter((p) => p.id !== "nora")
          .map((p) => (
            <button
              key={p.id}
              className={p.id === target ? "active" : ""}
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
        <button onClick={() => open("mail")}>
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
            ? ", or connect a model (see Replies below)."
            : ", or connect a model (see Read Me)."}
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
            Read Me
          </button>
        )}
      </div>
    </div>
  );
}
export function ReadMe(props: AppProps) {
  const { data, open } = props;
  const engine = exhibition
    ? "This public edition uses scripted replies. Run it locally for live AI replies (see the GitHub README)."
    : data.world.mode === "baseline"
      ? "Replies are scripted (no AI). You can switch to a live model in System Monitor."
      : data.status.available
        ? `Replies are written live by an AI model (${data.status.model}). They can take a few seconds.`
        : "No AI model is connected yet. Press Use scripted replies to play now, or add OPENROUTER_API_KEY to .env (or start Ollama) and restart the server. See README.md.";
  return (
    <div className="readme-app">
      <article>
        <h1>Room 317</h1>
        <p>
          Nora Vale was found dead in room 317 of Westhaven House at 03:17 on 31
          October 1999. The police called it an accident. This is her computer,
          and something on it is still answering.
        </p>
        <p className="readme-goal">
          <strong>Your goal:</strong> work out who was in the room with Nora,
          then file the case report.
        </p>
        <OfflineNotice {...props} inReadMe />
        <h2>How to play</h2>
        <ol>
          <li>
            <strong>Read.</strong> Check{" "}
            <button className="link" onClick={() => open("mail")}>
              Inbox
            </button>{" "}
            and{" "}
            <button className="link" onClick={() => open("browser")}>
              Chat Logs
            </button>
            . Mara is Nora’s neighbour, Len is the night porter, Owen is the
            building manager.
          </li>
          <li>
            <strong>Recover.</strong> Open{" "}
            <button className="link" onClick={() => open("archive")}>
              My Documents
            </button>{" "}
            and read the files. The damaged <b>CASE_14.BAK</b> shares its disk
            with Nora’s game saves: also play any two of her{" "}
            <button className="link" onClick={() => open("games")}>
              Games
            </button>{" "}
            for 20 seconds each, and the file repairs itself.
          </li>
          <li>
            <strong>Ask.</strong>{" "}
            <button className="link" onClick={() => open("spirit")}>
              Unknown Signal
            </button>{" "}
            is Nora. Attach a file you have opened and ask what she remembers.
            You can also write to the residents from Inbox or Address Book. Each
            message uses one of 18 turns.
          </li>
          <li>
            <strong>Decide.</strong> In CASE_14.BAK, choose{" "}
            <i>Publish case evidence</i>, name a suspect and press{" "}
            <i>File report</i>, or keep the case private. This can’t be undone.
          </li>
        </ol>
        <h2>Controls</h2>
        <p>
          Double-click an icon to open it (one tap on a phone). Drag, resize,
          minimise and maximise windows. The speaker in the tray mutes sound.
          Nora’s six games are part of the case: their saves help repair her
          files.
        </p>
        <h2>Replies</h2>
        <p>{engine}</p>
      </article>
      <div className="window-status">
        <span>READ ME.TXT</span>
        <span>Open again from the desktop or Start</span>
      </div>
    </div>
  );
}
export function Notebook() {
  const initial =
    "rent\nbatteries\nblue scarf at mara’s\n\nL. last bus, 02:58\ngreen lamp still on downstairs\n\nhe knocked twice. i thought it was her.\n\n03:17 —";
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem("deadnet-case-notes-v3") ?? initial;
    } catch {
      return initial;
    }
  });
  function edit(value: string) {
    setText(value);
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
  return (
    <div className="plain-notepad">
      <div className="menubar">
        <button onClick={() => edit("")}>New</button>
        <button onClick={save}>Save As…</button>
        <button
          onClick={() => {
            void navigator.clipboard?.writeText(text);
          }}
        >
          Copy
        </button>
      </div>
      <textarea
        aria-label="Notepad document"
        spellCheck={false}
        value={text}
        onChange={(e) => edit(e.target.value)}
      />
      <div className="window-status">
        <span>notes.txt</span>
        <span>Ln {text.split("\n").length}</span>
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
    frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (gameRequest) setGame(gameRequest.id);
  }, [gameRequest?.nonce]);
  const current = GAME_LIST.find((g) => g.id === game);
  const played = data.world.played || [];
  const recovered = Boolean(game && played.includes(game));
  const [seconds, setSeconds] = useState(0);
  // Playing a game for a while recovers its save, which CASE_14.BAK needs.
  useEffect(() => {
    setSeconds(0);
  }, [game]);
  useEffect(() => {
    if (!game || recovered || paused || activeApp !== "games") return;
    const t = setInterval(() => {
      if (document.hidden) return;
      setSeconds((n) => {
        if (n + 1 === PLAY_TO_RECOVER)
          void perform({ type: "played", game: game as GameId });
        return n + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [game, recovered, paused, activeApp]);
  const progress = caseProgress(data.world);
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
  function key(key: string, down: boolean) {
    const codes: Record<string, number> = {
      ArrowLeft: 37,
      ArrowUp: 38,
      ArrowRight: 39,
      ArrowDown: 40,
      " ": 32,
      Enter: 13,
      Tab: 9,
    };
    frame.current?.contentWindow?.postMessage(
      {
        type: "deadnet-key",
        key,
        code: key === " " ? "Space" : key,
        keyCode: codes[key],
        down,
      },
      location.origin,
    );
  }
  const keys =
    game === "flappy"
      ? [" "]
      : game === "hocus"
        ? ["Tab", "Enter"]
        : game === "phantomicus"
          ? ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight", " ", "Enter"]
          : [
              "ArrowLeft",
              "ArrowUp",
              "ArrowDown",
              "ArrowRight",
              ...(game === "tetris" || game === "snake" ? [" "] : []),
            ];
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
        <iframe
          ref={frame}
          onLoad={syncSound}
          key={game + "-" + run}
          title={current.name}
          src={`${import.meta.env.BASE_URL}games/${game}/index.html`}
          sandbox="allow-scripts allow-same-origin allow-forms"
          allow="autoplay; gamepad"
        />
      ) : (
        <div className="game-folder-wrap">
          <p className="game-recovery-note">
            Nora’s game saves sit on the same damaged sectors as CASE_14.BAK.
            Play any {GAMES_TO_RECOVER} of her games for {PLAY_TO_RECOVER}{" "}
            seconds each to recover them ({progress.games}/{GAMES_TO_RECOVER}).
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
                } as Record<string, string>
              )[k] || k}
            </button>
          ))}
          {paused && <span>Paused</span>}
        </div>
      )}
      <footer className="game-credits">
        {current ? (
          <a
            href={"https://github.com/" + current.repo}
            target="_blank"
            rel="noreferrer"
          >
            {current.name} © {current.author} · MIT
          </a>
        ) : (
          <span>6 objects</span>
        )}
        {current && (
          <span className="game-recovery" role="status">
            {recovered
              ? "Nora’s save recovered ✓"
              : `Recovering Nora’s save… ${Math.min(seconds, PLAY_TO_RECOVER)}/${PLAY_TO_RECOVER}s`}
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
            disabled={busy || !data.world.remainingTurns}
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
            <p>
              i can’t remember that night. i used to play my games when i
              couldn’t sleep. maybe they kept something.
            </p>
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
          <button type="button" onClick={() => open("archive")}>
            My Documents
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
            : "Connection open"}
        </span>
        <span>{data.world.remainingTurns} turns remain</span>
      </div>
    </div>
  );
}

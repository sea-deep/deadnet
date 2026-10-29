import { useEffect, useRef, useState } from "react";
import type { Action, AgentId, Event, Snapshot } from "./types";
import { PixelIcon } from "./icons";
import { exhibition } from "./api";
export type AppId =
  | "browser"
  | "mail"
  | "archive"
  | "people"
  | "monitor"
  | "notebook"
  | "games";
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
      | "games";
  }
> = {
  browser: { title: "Internet", icon: "browser" },
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
        <button onClick={() => open("notebook")}>Help</button>
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
            <i className="led" /> {data.world.agents.length} accounts connected
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
            The neighborhood
          </button>
          <button
            className={tab === "directory" ? "selected" : ""}
            onClick={() => setTab("directory")}
          >
            People & places
          </button>
          <button onClick={() => open("archive")}>The archive</button>
          <button onClick={() => open("notebook")}>Notepad</button>
        </nav>
        {tab === "feed" ? (
          <>
            <div className="web-columns">
              <main className="feed-column">
                <div className="section-title">
                  <h1>The neighborhood</h1>
                  <label>
                    Show{" "}
                    <select
                      aria-label="Filter feed"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">everyone</option>
                      {data.world.agents.map((a) => (
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
                              ? "this morning"
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
                  {data.world.agents.map((a) => (
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
            <h1>People & places</h1>
            {data.world.agents.map((a) => (
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
  const requestId = useRef(0);
  const messages = data.world.events
    .filter(
      (e) =>
        e.channel === "mail" && (e.to === "visitor" || e.actor === "visitor"),
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
  }, [selected]);
  async function play() {
    if (!message) return;
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
                <label>
                  To{" "}
                  <select
                    aria-label="Recipient"
                    value={target}
                    onChange={(e) => setTarget(e.target.value as AgentId)}
                  >
                    {data.world.agents.map((a) => (
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
                      busy || !text.trim() || !data.world.remainingTurns
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
                      ? "You"
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
                        ? "Rendering voicemail…"
                        : audio
                          ? "Replay voicemail"
                          : "Listen as voicemail"}
                    </button>
                  )}
                </div>
                {audio && (
                  <audio
                    aria-label="Voicemail playback"
                    src={audio}
                    controls
                    muted={muted}
                    autoPlay
                  />
                )}
                {(!data.status.voice || exhibition) &&
                  message.to === "visitor" && (
                    <p className="fine-print">
                      Optional ElevenLabs voice is not configured. The full
                      message is shown above.
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
export function Archive({ data, perform, busy, composeTo }: AppProps) {
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState("carrier"),
    [sendMenu, setSendMenu] = useState(false),
    [policy, setPolicy] = useState<"sealed" | "exposed">("sealed");
  const records = data.archive.filter((e) =>
    `${e.filename} ${e.folder}`.toLowerCase().includes(search.toLowerCase()),
  );
  const record = data.archive.find((e) => e.id === selected)!;
  const readable =
    !record.locked ||
    data.world.collected.filter((id) => id !== "manifest").length >= 2;
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
              : "Cannot read CONTINUITY.INI.\n\nData error (cyclic redundancy check)."}
          </pre>
          {sendMenu && (
            <div className="file-send-menu" aria-label="Send file to">
              {data.world.agents.map((a) => (
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
              <legend>Sharing</legend>
              {data.world.ending === "open" ? (
                <>
                  <label>
                    <input
                      type="radio"
                      name="sharing"
                      checked={policy === "sealed"}
                      disabled={data.world.published.length > 0}
                      onChange={() => setPolicy("sealed")}
                    />{" "}
                    Private
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="sharing"
                      checked={policy === "exposed"}
                      onChange={() => setPolicy("exposed")}
                    />{" "}
                    Everyone on the network
                  </label>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void perform({ type: "resolve", choice: policy })
                    }
                  >
                    Apply
                  </button>
                </>
              ) : (
                <p>
                  Permissions saved:{" "}
                  {data.world.ending === "exposed" ? "public" : "private"}.
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
        {data.world.agents.map((p) => (
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
export function Notebook() {
  const initial =
    "milk\nbatteries\n\nlen's birthday again. forgot a card.\n\nthe same photograph was in the folder yesterday.\ni think.\n\n03:17 —";
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem("deadnet-notes-v2") ?? initial;
    } catch {
      return initial;
    }
  });
  function edit(value: string) {
    setText(value);
    try {
      localStorage.setItem("deadnet-notes-v2", value);
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
const GAME_LIST = [
  {
    id: "snake",
    name: "Snake",
    keys: "Arrow keys",
    author: "Patrick Gillespie",
    repo: "patorjk/JavaScript-Snake",
  },
  {
    id: "flappy",
    name: "Flappy Bird",
    keys: "Space or click",
    author: "pyforgedev",
    repo: "pyforgedev/flappy-bird",
  },
  {
    id: "tetris",
    name: "Tetris",
    keys: "Space · Arrow keys",
    author: "Jake Gordon",
    repo: "jakesgordon/javascript-tetris",
  },
  {
    id: "2048",
    name: "2048",
    keys: "Arrow keys",
    author: "Gabriele Cirulli",
    repo: "gabrielecirulli/2048",
  },
  {
    id: "phantomicus",
    name: "Phantomicus",
    keys: "Enter · Arrows · Space",
    author: "Cody Ebberson",
    repo: "codyebberson/js13k-phantomicus",
  },
  {
    id: "hocus",
    name: "Hocus :focus",
    keys: "Tab · Enter",
    author: "HTeuMeuLeu",
    repo: "hteumeuleu/hocus-focus",
  },
];
export function Games({ muted, activeApp }: AppProps) {
  const [game, setGame] = useState<string | null>(null),
    [run, setRun] = useState(0),
    frame = useRef<HTMLIFrameElement>(null);
  const current = GAME_LIST.find((g) => g.id === game);
  const syncSound = () =>
    frame.current?.contentWindow?.postMessage(
      { type: "deadnet-audio", muted: Boolean(muted || activeApp !== "games") },
      location.origin,
    );
  useEffect(syncSound, [muted, activeApp, game, run]);
  return (
    <div className="games-app">
      <div className="menubar">
        <button onClick={() => setGame(null)}>Games</button>
        {current && <button onClick={() => setRun(run + 1)}>Restart</button>}
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
        <div className="game-folder">
          {GAME_LIST.map((g) => (
            <button key={g.id} onClick={() => setGame(g.id)}>
              <PixelIcon name="games" size={32} />
              <strong>{g.name}</strong>
              <span>{g.keys}</span>
            </button>
          ))}
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
          <span>DEADNET / CONTINUITY SERVICE</span>
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

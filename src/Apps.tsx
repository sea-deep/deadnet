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
  | "notebook";
export const APP_INFO: Record<
  AppId,
  {
    title: string;
    icon: "browser" | "mail" | "archive" | "people" | "monitor" | "notebook";
  }
> = {
  browser: { title: "DeadBrowser", icon: "browser" },
  mail: { title: "GhostMail", icon: "mail" },
  archive: { title: "Archive.exe", icon: "archive" },
  people: { title: "People.exe", icon: "people" },
  monitor: { title: "System Monitor", icon: "monitor" },
  notebook: { title: "Evidence notebook", icon: "notebook" },
};
export interface AppProps {
  data: Snapshot;
  perform: (a: Action) => Promise<boolean>;
  open: (id: AppId) => void;
  busy: boolean;
  target: AgentId;
  setTarget: (id: AgentId) => void;
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
  return (
    <span className={"provenance " + e.origin}>
      {e.origin === "model"
        ? "Generated"
        : e.origin === "baseline"
          ? "Scripted baseline"
          : e.origin === "seed"
            ? "Opening record"
            : e.origin === "system"
              ? "System event"
              : "Your message"}
    </span>
  );
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
          <button onClick={() => open("notebook")}>
            My discoveries <span>{data.world.collected.length}</span>
          </button>
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
export function Mail({ data, perform, busy, target, setTarget }: AppProps) {
  const [compose, setCompose] = useState(false);
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox");
  const [selected, setSelected] = useState("seed-mail");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState("");
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
                <h1>A quiet word.</h1>
                <p>
                  Only this account receives your message. They may choose to
                  tell someone else.
                </p>
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
                  Attach recovered evidence{" "}
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
                  placeholder="Ask about a memory. Mention a contradiction. Tell them something only you know."
                  required
                  rows={7}
                />
                <div className="form-footer">
                  <small>{text.length}/1000 · saved locally</small>
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
export function Archive({ data, perform, busy, open }: AppProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("carrier");
  const records = data.archive.filter((e) =>
    `${e.filename} ${e.title} ${e.folder}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const record = data.archive.find((e) => e.id === selected)!;
  const unlocked =
    !record.locked ||
    data.world.collected.filter((id) => id !== "manifest").length >= 2;
  return (
    <div className="archive-app">
      <div className="app-toolbar">
        <PixelIcon name="archive" size={28} />
        <div>
          <strong>Recovered files</strong>
        </div>
        <label className="search-field">
          Find{" "}
          <input
            aria-label="Search archive"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filename or subject"
          />
        </label>
      </div>
      <div className="archive-layout">
        <aside className="file-list">
          <p>LOCAL DISK (C:)</p>
          <span className="folder-tree">└ RECOVERED</span>
          {records.map((e) => (
            <button
              className={e.id === selected ? "active" : ""}
              key={e.id}
              onClick={() => setSelected(e.id)}
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
                <small>
                  {e.folder}
                  {data.world.collected.includes(e.id) ? " · recovered" : ""}
                </small>
              </span>
            </button>
          ))}
          {!records.length && <p className="empty">No matching files.</p>}
          <p className="file-warning">
            Some timestamps disagree
            <br />
            with the system clock.
          </p>
        </aside>
        <main className="file-reader">
          <div className="file-heading">
            <span>{record.date}</span>
            <h1>{record.title}</h1>
            <p>{unlocked ? record.excerpt : "File fragments incomplete."}</p>
          </div>
          <pre className={!unlocked ? "locked-file" : ""}>
            {unlocked
              ? record.body
              : "CONTINUITY.INI\n\n[ File fragments incomplete ]\n\nRecover CARRIER.LOG and\nHAPPY_BIRTHDAY.EML to\nreconstruct this record."}
          </pre>
          <div className="file-actions">
            <button
              className="primary"
              disabled={
                busy || !unlocked || data.world.collected.includes(record.id)
              }
              onClick={() =>
                void perform({ type: "collect", evidenceId: record.id })
              }
            >
              {data.world.collected.includes(record.id)
                ? "Saved in notebook"
                : "Recover this record"}
            </button>
            <button onClick={() => open("notebook")}>Open notebook</button>
          </div>
        </main>
      </div>
      <div className="window-status">
        <span>{data.archive.length} recovered records</span>
        <span>Read-only archive · nothing sent to accounts</span>
      </div>
    </div>
  );
}
export function People({ data, target, setTarget, open }: AppProps) {
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
            <dt>Current stance</dt>
            <dd>{a.stance}</dd>
          </div>
          <div>
            <dt>Network role</dt>
            <dd>{a.role}</dd>
          </div>
        </dl>
        <button onClick={() => open("mail")}>
          Write to {a.name.split(" ")[0]}
        </button>
        <details className="inspector">
          <summary>Inspect simulation state (contains spoilers)</summary>
          <h2>What this account believes</h2>
          <p>{a.belief}</p>
          <h2>Relationships</h2>
          {Object.entries(a.relationships).map(([id, trust]) => (
            <div className="relationship" key={id}>
              <span>{id}</span>
              <meter
                aria-label={`Trust toward ${id}`}
                min={-10}
                max={10}
                value={trust}
              />
              <span>
                {trust > 0 ? "+" : ""}
                {trust}
              </span>
            </div>
          ))}
          <h2>Known evidence</h2>
          <p>{a.knownFacts.join(", ") || "No recovered evidence received."}</p>
          <h2>Recent subjective memories</h2>
          {a.memories
            .slice(-5)
            .reverse()
            .map((m, i) => (
              <p className="memory" key={i}>
                Turn {m.tick}: {m.text}
              </p>
            ))}
          {!a.memories.length && <p>No new memories yet.</p>}
        </details>
      </main>
    </div>
  );
}
export function Notebook({ data, perform, busy, open, setTarget }: AppProps) {
  const [shareId, setShareId] = useState("");
  return (
    <div className="notebook-app">
      <header>
        <PixelIcon name="notebook" size={38} />
        <div>
          <h1>Evidence notebook</h1>
        </div>
      </header>
      <div className="notebook-scroll">
        <div className="investigation-steps">
          <span className={data.world.collected.length ? "complete" : ""}>
            Recover a record
          </span>
          <span
            className={
              data.world.events.some(
                (e) => e.actor === "visitor" && e.factIds.length,
              )
                ? "complete"
                : ""
            }
          >
            Tell someone
          </span>
          <span
            className={
              data.world.collected.includes("manifest") ? "complete" : ""
            }
          >
            Find the backup
          </span>
        </div>
        {data.world.collected.length === 0 ? (
          <div className="notebook-empty">
            <p>Mara mentioned a file before you found it.</p>
            <h2>Start with CARRIER.LOG.</h2>
            <p>
              Read her message in GhostMail, then look through the recovered
              files. Compare what the accounts remember with what the records
              say.
            </p>
            <button className="primary" onClick={() => open("archive")}>
              Open recovered files
            </button>
          </div>
        ) : (
          data.archive
            .filter((e) => data.world.collected.includes(e.id))
            .map((e) => (
              <article className="evidence-note" key={e.id}>
                <small>{e.filename}</small>
                <h2>{e.title}</h2>
                <p>{e.fact}</p>
                <div className="evidence-actions">
                  <button
                    onClick={() => setShareId(shareId === e.id ? "" : e.id)}
                  >
                    Tell one account…
                  </button>
                  <button
                    disabled={
                      busy ||
                      data.world.published.includes(e.id) ||
                      data.world.ending === "sealed"
                    }
                    onClick={() =>
                      void perform({ type: "publish", evidenceId: e.id })
                    }
                  >
                    {data.world.published.includes(e.id)
                      ? "In the public record"
                      : "Publish to the feed"}
                  </button>
                </div>
                {shareId === e.id && (
                  <div className="share-options">
                    {data.world.agents.map((a) => (
                      <button
                        key={a.id}
                        disabled={busy}
                        onClick={() => {
                          setTarget(a.id);
                          void perform({
                            type: "message",
                            target: a.id,
                            text: "I recovered this record. What do you make of it?",
                            evidenceId: e.id,
                          });
                          setShareId("");
                          open("mail");
                        }}
                      >
                        Tell {a.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))
        )}
        {data.world.collected.includes("manifest") && (
          <section className="resolution">
            <h2>
              {data.world.ending === "open"
                ? "What do you owe a memory?"
                : data.world.ending === "exposed"
                  ? "The correction is permanent."
                  : "You let the morning continue."}
            </h2>
            <p>
              {data.world.ending === "open"
                ? "You have the complete record. Release the truth to everyone, or seal the archive and let their routine continue. Both choices persist. Private memories cannot be erased."
                : data.world.ending === "exposed"
                  ? "Every account can now encounter the archive. Advance the network to hear what they believe."
                  : "The archive can no longer enter the public feed. The accounts keep what you already told them."}
            </p>
            {data.world.ending === "open" && (
              <div className="resolution-actions">
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    void perform({ type: "resolve", choice: "exposed" })
                  }
                >
                  Release the complete record
                </button>
                <button
                  disabled={busy || data.world.published.length > 0}
                  onClick={() =>
                    void perform({ type: "resolve", choice: "sealed" })
                  }
                >
                  Seal the archive
                </button>
              </div>
            )}
            {data.world.published.length > 0 &&
              data.world.ending === "open" && (
                <small>
                  Some evidence is already public. It cannot be taken back.
                </small>
              )}
          </section>
        )}
      </div>
      <div className="window-status">
        <span>{data.world.collected.length}/3 records recovered</span>
        <span>
          {data.world.ending === "open"
            ? "Investigation in progress"
            : "Choice saved"}
        </span>
      </div>
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
                  ? "LOCAL INFERENCE READY"
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
              Live local model
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

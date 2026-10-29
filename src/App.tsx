import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { act, exhibition, OFFLINE_MESSAGE, readState } from "./api";
import type { Action, AgentId, Snapshot } from "./types";
import {
  APP_INFO,
  Archive,
  Browser,
  Games,
  Spirit,
  Mail,
  Monitor,
  Notebook,
  People,
  ReadMe,
  type AppId,
  type AppProps,
} from "./Apps";
import { PixelIcon } from "./icons";
import { tone, setAmbient } from "./sound";
import { GAME_LIST, GameIcon, type GameId } from "./games";
type WindowState = {
  id: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  z: number;
};
const components = {
  readme: ReadMe,
  browser: Browser,
  mail: Mail,
  archive: Archive,
  people: People,
  monitor: Monitor,
  notebook: Notebook,
  games: Games,
  spirit: Spirit,
};
const defaults: Record<AppId, { width: number; height: number }> = {
  readme: { width: 640, height: 640 },
  browser: { width: 970, height: 740 },
  mail: { width: 790, height: 560 },
  archive: { width: 800, height: 610 },
  people: { width: 660, height: 590 },
  monitor: { width: 790, height: 580 },
  notebook: { width: 650, height: 500 },
  games: { width: 900, height: 680 },
  spirit: { width: 620, height: 610 },
};
export default function App() {
  const [data, setData] = useState<Snapshot>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem("deadnet-muted") === "true";
    } catch {
      return false;
    }
  });
  const [bootStage, setBootStage] = useState(-1);
  const [mailDraft, setMailDraft] = useState<AppProps["mailDraft"]>();
  const [reduce, setReduce] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [wallpaper, setWallpaper] = useState(() => {
    try {
      return localStorage.getItem("deadnet-wallpaper") || "forest";
    } catch {
      return "forest";
    }
  });

  const [start, setStart] = useState(false);
  const [target, setTarget] = useState<AgentId>("mara");
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [size, setSize] = useState({ width: innerWidth, height: innerHeight });
  const [notice, setNotice] = useState(true);
  const [noticeId, setNoticeId] = useState("seed-mail");
  const received = useRef<Set<string> | null>(null);
  const incomingMail =
    data?.world.events.filter(
      (e) => e.channel === "mail" && e.to === "visitor" && e.actor !== "nora",
    ) || [];
  const noticeMail = incomingMail.find((e) => e.id === noticeId);
  useEffect(() => {
    if (!data) return;
    if (received.current) {
      const latest = incomingMail
        .filter((e) => !received.current!.has(e.id))
        .at(-1);
      if (latest) {
        setNoticeId(latest.id);
        setNotice(true);
      }
    }
    received.current = new Set(incomingMail.map((e) => e.id));
  }, [incomingMail.map((e) => e.id).join(",")]);
  const [selectedIcon, setSelectedIcon] = useState<string>();
  const [gameRequest, setGameRequest] = useState<{
    id: GameId;
    nonce: number;
  }>();
  const z = useRef(10);
  const generation = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const resize = () => setSize({ width: innerWidth, height: innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    let alive = true;
    async function refresh() {
      try {
        const snapshot = await readState();
        if (alive) {
          setData(snapshot);
          // Connection is back: drop a stale "can't reach the server" notice.
          setError((old) => (old === OFFLINE_MESSAGE ? "" : old));
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    }
    void refresh();
    const id = setInterval(() => {
      if (!generation.current) void refresh();
    }, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStart(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const open = useCallback((id: AppId) => {
    setStart(false);
    if (id === "mail") setNotice(false);
    setWindows((old) => {
      const existing = old.find((w) => w.id === id);
      if (existing)
        return old.map((w) =>
          w.id === id ? { ...w, minimized: false, z: ++z.current } : w,
        );
      const index = old.length;
      return [
        ...old,
        {
          id,
          x: Math.min(
            150 + index * 38,
            Math.max(0, innerWidth - defaults[id].width - 20),
          ),
          y: Math.min(
            45 + index * 32,
            Math.max(0, innerHeight - defaults[id].height - 65),
          ),
          width: Math.min(defaults[id].width, innerWidth - 32),
          height: Math.min(defaults[id].height, innerHeight - 90),
          minimized: false,
          maximized: false,
          z: ++z.current,
        },
      ];
    });
  }, []);
  function launchGame(id: GameId) {
    setGameRequest({ id, nonce: Date.now() });
    open("games");
  }
  function composeTo(id: AgentId, attachment?: string) {
    setTarget(id);
    setMailDraft({ recipient: id, attachment, nonce: Date.now() });
    open("mail");
  }
  async function perform(action: Action) {
    if (generation.current) return false;
    generation.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await act(action);
      setData(next);
      if (action.type === "message" || action.type === "tick")
        tone("mail", muted);
      if (action.type === "collect") tone("disk", muted);
      if (action.type === "resolve") tone("line", muted);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      generation.current = false;
      setBusy(false);
    }
  }
  function boot() {
    setConnected(true);
    tone("connect", muted);
    setBootStage(9);
    if (
      data?.status.available &&
      data.status.provider === "ollama" &&
      data.world.mode === "live"
    )
      void perform({ type: "auto", enabled: true });
    // First visit: explain the case before anything else.
    let seen = false;
    try {
      seen = localStorage.getItem("deadnet-readme-seen") === "true";
      localStorage.setItem("deadnet-readme-seen", "true");
    } catch {}
    if (!seen) open("readme");
    setTimeout(() => {
      root.current?.focus();
    }, 50);
  }
  useEffect(() => {
    if (bootStage < 0 || bootStage >= 9 || connected) return;
    const t = setTimeout(
      () => {
        if (bootStage === 8) boot();
        else setBootStage(bootStage + 1);
      },
      reduce ? 140 : 500,
    );
    return () => clearTimeout(t);
  }, [bootStage, connected]);
  function powerOn() {
    tone("connect", muted);
    setAmbient(!muted);
    setBootStage(0);
  }
  const update = (id: AppId, patch: Partial<WindowState>) =>
    setWindows((old) => old.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  const focused = windows
    .filter((w) => !w.minimized)
    .sort((a, b) => b.z - a.z)[0]?.id;
  const mobile = size.width < 740;
  useEffect(() => {
    const updateAudio = () =>
      setAmbient(
        connected && !muted && !document.hidden && focused !== "games",
      );
    updateAudio();
    document.addEventListener("visibilitychange", updateAudio);
    return () => {
      document.removeEventListener("visibilitychange", updateAudio);
      setAmbient(false);
    };
  }, [connected, muted, focused]);
  useEffect(() => {
    try {
      localStorage.setItem("deadnet-muted", String(muted));
    } catch {}
  }, [muted]);
  const props = data
    ? ({
        data,
        perform,
        open,
        busy: busy || data.status.busy,
        target,
        setTarget,
        composeTo,
        mailDraft,
        muted,
        activeApp: focused,
        gameRequest,
      } satisfies AppProps)
    : undefined;
  return (
    <div
      ref={root}
      tabIndex={-1}
      className={`desktop wallpaper-${wallpaper} ${reduce ? "reduced-motion" : ""} ${exhibition ? "exhibition" : ""}`}
      data-ui
      style={
        wallpaper === "forest"
          ? {
              backgroundImage: `url(${import.meta.env.BASE_URL}assets/forest.jpg)`,
            }
          : undefined
      }
    >
      {exhibition && (
        <div className="exhibition-banner">
          <strong>DETERMINISTIC EXHIBITION</strong>
          <span>
            This edition uses scripted responses. Run locally for live Gemma.
          </span>
          <a
            href="https://github.com/sea-deep/deadnet"
            target="_blank"
            rel="noreferrer"
          >
            Get the local experience ↗
          </a>
        </div>
      )}
      <nav
        inert={!connected}
        className="desktop-icons"
        aria-label="Desktop applications"
        style={{
          gridTemplateRows: `repeat(${Math.min(8, Math.max(2, Math.floor((size.height - (exhibition ? 138 : 80)) / 88)))}, 88px)`,
        }}
      >
        {(Object.keys(APP_INFO) as AppId[]).map((id) => (
          <button
            key={id}
            onClick={() => {
              setSelectedIcon(id);
              if (mobile) open(id);
            }}
            onDoubleClick={() => open(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") open(id);
            }}
            className={`desktop-icon ${selectedIcon === id ? "chosen" : ""}`}
          >
            <PixelIcon name={APP_INFO[id].icon} size={36} />
            <span>
              {APP_INFO[id].title}
              {id === "mail" && data ? (
                <b>
                  {
                    data.world.events.filter(
                      (e) =>
                        e.channel === "mail" &&
                        e.to === "visitor" &&
                        e.actor !== "nora",
                    ).length
                  }
                </b>
              ) : null}
            </span>
          </button>
        ))}
        {GAME_LIST.map((game) => (
          <button
            key={game.id}
            className={`desktop-icon ${selectedIcon === game.id ? "chosen" : ""}`}
            onClick={() => {
              setSelectedIcon(game.id);
              if (mobile) launchGame(game.id);
            }}
            onDoubleClick={() => launchGame(game.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") launchGame(game.id);
            }}
          >
            <GameIcon id={game.id} />
            <span>{game.name}</span>
          </button>
        ))}
      </nav>
      <div inert={!connected} className="windows-area">
        {connected &&
          props &&
          windows.map((w) => {
            const Component = components[w.id],
              max = w.maximized || mobile;
            const width = max
              ? size.width - (mobile ? 8 : 36)
              : Math.min(w.width, size.width - 16);
            const height = max
              ? size.height - (exhibition ? 91 : 61)
              : Math.min(w.height, size.height - 80);
            const x = max
                ? mobile
                  ? 4
                  : 18
                : Math.max(0, Math.min(w.x, size.width - width - 4)),
              y = max
                ? 8
                : Math.max(0, Math.min(w.y, size.height - height - 54));
            return (
              <Rnd
                key={w.id}
                size={{ width, height }}
                position={{ x, y }}
                minWidth={mobile ? 280 : 450}
                minHeight={340}
                bounds="parent"
                dragHandleClassName="title-drag"
                cancel="button"
                disableDragging={max}
                enableResizing={!max}
                onDragStop={(_e, d) => update(w.id, { x: d.x, y: d.y })}
                onResizeStop={(_e, _dir, ref, _delta, position) =>
                  update(w.id, {
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                    ...position,
                  })
                }
                onMouseDown={() => {
                  if (focused !== w.id) update(w.id, { z: ++z.current });
                }}
                style={{ display: w.minimized ? "none" : "flex", zIndex: w.z }}
                className={`os-window ${focused === w.id ? "focused" : ""}`}
              >
                <section
                  className="window-frame window"
                  aria-label={APP_INFO[w.id].title}
                >
                  <div className="titlebar title-bar">
                    <div
                      className="title-drag title-bar-text"
                      tabIndex={0}
                      aria-label={`${APP_INFO[w.id].title} title bar. Arrow keys move window; Enter maximizes.`}
                      onDoubleClick={() =>
                        update(w.id, { maximized: !w.maximized })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          update(w.id, { maximized: !w.maximized });
                        if (e.key.startsWith("Arrow")) {
                          e.preventDefault();
                          update(w.id, {
                            x:
                              w.x +
                              (e.key === "ArrowLeft"
                                ? -20
                                : e.key === "ArrowRight"
                                  ? 20
                                  : 0),
                            y:
                              w.y +
                              (e.key === "ArrowUp"
                                ? -20
                                : e.key === "ArrowDown"
                                  ? 20
                                  : 0),
                          });
                        }
                      }}
                    >
                      <PixelIcon name={APP_INFO[w.id].icon} size={17} />
                      <span>
                        {APP_INFO[w.id].title}
                        {w.id === "browser" ? " — Residents’ messages" : ""}
                      </span>
                    </div>
                    <div className="window-buttons title-bar-controls">
                      <button
                        aria-label={`Minimize ${APP_INFO[w.id].title}`}
                        onClick={() => update(w.id, { minimized: true })}
                      >
                        <span className="minimize-icon" />
                      </button>
                      <button
                        aria-label={`Maximize ${APP_INFO[w.id].title}`}
                        onClick={() =>
                          update(w.id, { maximized: !w.maximized })
                        }
                      >
                        <span
                          className={
                            w.maximized ? "restore-icon" : "maximize-icon"
                          }
                        />
                      </button>
                      <button
                        aria-label={`Close ${APP_INFO[w.id].title}`}
                        onClick={() =>
                          setWindows((old) => old.filter((x) => x.id !== w.id))
                        }
                      >
                        <span className="close-icon" />
                      </button>
                    </div>
                  </div>
                  <div className="window-content">
                    <Component {...props} />
                  </div>
                </section>
              </Rnd>
            );
          })}
      </div>
      {connected && notice && data && noticeMail && (
        <aside className="mail-notification">
          <div className="notification-heading">
            <PixelIcon name="mail" size={19} />
            <strong>You have new mail.</strong>
            <button
              aria-label="Dismiss mail notification"
              onClick={() => setNotice(false)}
            >
              ×
            </button>
          </div>
          <button
            className="notification-body"
            onClick={() => {
              open("mail");
              setNotice(false);
            }}
          >
            <strong>
              {data.world.agents.find((a) => a.id === noticeMail.actor)
                ?.handle || "Network service"}
            </strong>
            <span>“{noticeMail.subject || "New message"}”</span>
          </button>
        </aside>
      )}
      {error && (
        <div role="alert" className="error-toast">
          <PixelIcon name="monitor" size={26} />
          <p>{error}</p>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {start && (
        <nav className="start-menu" aria-label="Start menu">
          <div className="start-spine">
            NORA VALE<span> PERSONAL COMPUTER</span>
          </div>
          <div className="start-items">
            {(Object.keys(APP_INFO) as AppId[]).map((id) => (
              <button key={id} onClick={() => open(id)}>
                <PixelIcon name={APP_INFO[id].icon} size={25} />
                {APP_INFO[id].title}
              </button>
            ))}
            <hr />
            <button onClick={() => setMuted(!muted)}>
              <PixelIcon name="speaker" size={25} />
              {muted ? "Enable system sound" : "Mute system sound"}
            </button>
            <button onClick={() => setReduce(!reduce)}>
              {reduce ? "Enable subtle motion" : "Reduce motion"}
            </button>
            <button
              onClick={() => {
                const next = wallpaper === "forest" ? "plain" : "forest";
                setWallpaper(next);
                try {
                  localStorage.setItem("deadnet-wallpaper", next);
                } catch {}
              }}
            >
              {wallpaper === "forest"
                ? "Use plain wallpaper"
                : "Use forest wallpaper"}
            </button>
            <a
              href="https://github.com/sea-deep/deadnet"
              target="_blank"
              rel="noreferrer"
            >
              About this project ↗
            </a>
          </div>
        </nav>
      )}
      <footer inert={!connected} className="taskbar">
        <button
          className={`start-button ${start ? "pressed" : ""}`}
          onClick={() => setStart(!start)}
          aria-expanded={start}
        >
          <PixelIcon name="disk" size={23} />
          <strong>Start</strong>
        </button>
        <div className="task-divider" />
        <div className="task-buttons">
          {windows.map((w) => (
            <button
              key={w.id}
              className={
                focused === w.id && !w.minimized ? "pressed active" : ""
              }
              onClick={() => {
                if (focused === w.id && !w.minimized)
                  update(w.id, { minimized: true });
                else update(w.id, { minimized: false, z: ++z.current });
              }}
            >
              <PixelIcon name={APP_INFO[w.id].icon} size={19} />
              <span>{APP_INFO[w.id].title}</span>
            </button>
          ))}
        </div>
        <div className="task-status">
          <button
            aria-label={muted ? "Enable sound" : "Mute sound"}
            onClick={() => setMuted(!muted)}
            className={muted ? "muted" : ""}
          >
            <PixelIcon name="speaker" size={19} />
          </button>
          <button
            className="model-indicator"
            onClick={() => open("monitor")}
            title="Open System Monitor"
          >
            <i
              className={`led ${data?.world.mode === "baseline" ? "amber" : ""}`}
            />
            <span>
              {data?.world.mode === "baseline"
                ? "BASELINE"
                : data?.status.available
                  ? "Connected"
                  : "Disconnected"}
            </span>
          </button>
          <time>03:17 AM</time>
        </div>
      </footer>
      {!connected && (
        <div
          className="boot-screen"
          role="dialog"
          aria-label="Computer startup"
        >
          {bootStage < 0 ? (
            <div className="power-screen">
              <PixelIcon name="monitor" size={48} />
              <p className="power-premise">
                Nora Vale died in room 317. The police called it an accident.
                <br />
                Her computer is still answering. Find out who was there.
              </p>
              <button
                className="boot-connect"
                disabled={!data}
                onClick={powerOn}
              >
                {data ? "Power on" : "Please wait…"}
              </button>
              <label className="boot-sound">
                <input
                  type="checkbox"
                  checked={!muted}
                  onChange={(e) => setMuted(!e.target.checked)}
                />{" "}
                Sound
              </label>
            </div>
          ) : bootStage < 4 ? (
            <div className="post-screen">
              <p>DN-BIOS 4.51</p>
              <p>Copyright 1999 Deadnet Computer Systems</p>
              <br />
              <p>Memory Test : {bootStage > 0 ? "32768K OK" : "8192K"}</p>
              {bootStage > 1 && <p>Detecting Primary Master ... DN1200</p>}
              {bootStage > 2 && <p>Starting DEADNET 95...</p>}
              <span className="post-cursor">_</span>
            </div>
          ) : (
            <div className="boot-loading">
              <h1>
                DEADNET<span>95</span>
              </h1>
              <div
                className="boot-progress"
                role="progressbar"
                aria-label="Starting computer"
                aria-valuenow={(bootStage - 3) * 20}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {Array.from({ length: 14 }, (_, i) => (
                  <i key={i} className={i < (bootStage - 3) * 3 ? "lit" : ""} />
                ))}
              </div>
              <p>Starting up...</p>
            </div>
          )}
          {bootStage >= 0 && (
            <button className="skip-boot" onClick={boot}>
              Skip startup
            </button>
          )}
        </div>
      )}
    </div>
  );
}

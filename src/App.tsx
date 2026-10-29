import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import {
  act,
  clearSave,
  exhibition,
  hasProgress,
  OFFLINE_MESSAGE,
  readSave,
  readState,
  restore,
  writeSave,
} from "./api";
import type { Action, AgentId, Snapshot } from "./types";
import {
  APP_INFO,
  Archive,
  RecycleBin,
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
import { tone, setAmbient, duckAmbient } from "./sound";
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
  recycle: RecycleBin,
  people: People,
  monitor: Monitor,
  notebook: Notebook,
  games: Games,
  spirit: Spirit,
};
/** Keep keyboard focus inside a modal dialog until it is dismissed. */
function keepFocusInside(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "Tab") return;
  const controls = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
  if (!controls.length) return;
  const first = controls[0],
    last = controls.at(-1)!;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
const defaults: Record<AppId, { width: number; height: number }> = {
  readme: { width: 640, height: 640 },
  browser: { width: 970, height: 740 },
  mail: { width: 790, height: 560 },
  archive: { width: 800, height: 610 },
  recycle: { width: 800, height: 610 },
  people: { width: 660, height: 590 },
  monitor: { width: 790, height: 580 },
  notebook: { width: 650, height: 500 },
  games: { width: 900, height: 680 },
  spirit: { width: 620, height: 610 },
};
export default function App() {
  const [data, setData] = useState<Snapshot>();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const saveFile = useRef<HTMLInputElement>(null);
  const checkedSave = useRef(false);
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
  const [crtFilter, setCrtFilter] = useState(() => {
    try {
      return localStorage.getItem("deadnet-crt") === "true";
    } catch {
      return false;
    }
  });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stickyOpen, setStickyOpen] = useState(true);
  const [stickyExpanded, setStickyExpanded] = useState(() => innerWidth >= 740);
  const [readMail, setReadMail] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("deadnet-read-mail") || "[]",
      );
      return Array.isArray(saved)
        ? saved.filter((id): id is string => typeof id === "string")
        : [];
    } catch {
      return [];
    }
  });
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const received = useRef<Set<string> | null>(null);
  const incomingMail =
    data?.world.events.filter(
      (e) => e.channel === "mail" && e.to === "visitor" && e.actor !== "nora",
    ) || [];
  const unreadMail = incomingMail.filter((e) => !readMail.includes(e.id));
  const noticeMail = incomingMail.find((e) => e.id === noticeId);
  // Read receipts survive reloads so the badge never re-counts old mail.
  useEffect(() => {
    try {
      localStorage.setItem("deadnet-read-mail", JSON.stringify(readMail));
    } catch {}
  }, [readMail]);
  // Anything visible in an open inbox counts as read, including mail that
  // arrives while the window is already on screen.
  const mailOpen = windows.some((w) => w.id === "mail" && !w.minimized);
  useEffect(() => {
    if (!mailOpen || incomingMail.length === 0) return;
    const ids = incomingMail.map((e) => e.id);
    setReadMail((old) => {
      const next = [...new Set([...old, ...ids])];
      return next.length === old.length ? old : next;
    });
  }, [mailOpen, incomingMail.map((e) => e.id).join(",")]);
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
  // Bumped when the visitor acts, so a slow GET that started earlier cannot
  // overwrite the newer snapshot it raced with.
  const stateSeq = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const startMenu = useRef<HTMLElement>(null);
  // Autosave: the browser keeps a copy of the case after every change.
  useEffect(() => {
    // Only real progress is saved, so an emptied server never overwrites it.
    if (data && hasProgress(data.world)) writeSave(data.world);
  }, [data?.world.revision]);
  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(""), 4000);
    return () => clearTimeout(t);
  }, [info]);
  useEffect(() => {
    const resize = () => setSize({ width: innerWidth, height: innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    let alive = true;
    async function refresh() {
      const seq = stateSeq.current;
      try {
        let snapshot = await readState();
        // The server can lose a hosted case (e.g. a restart); bring back the
        // browser's copy whenever the server's is empty and ours is not.
        if (!checkedSave.current) {
          checkedSave.current = true;
          const saved = readSave();
          if (
            saved &&
            saved.storyId === snapshot.world.storyId &&
            hasProgress(saved) &&
            !hasProgress(snapshot.world)
          ) {
            try {
              snapshot = await restore(saved);
              setInfo("Your saved game was restored.");
            } catch {
              /* Keep the server's world. */
            }
          }
          checkedSave.current = false;
        }
        // An action may have committed while this request was in flight.
        if (alive && seq === stateSeq.current) {
          setData(snapshot);
          // Connection is back: drop a stale "can't reach the server" notice.
          setError((old) => (old === OFFLINE_MESSAGE ? "" : old));
        }
      } catch (e) {
        if (alive && seq === stateSeq.current) setError((e as Error).message);
      }
    }
    void refresh();
    const id = setInterval(() => {
      if (document.hidden) return;
      if (!generation.current) void refresh();
    }, 3000);
    // Returning to the tab refreshes immediately instead of waiting for the
    // next poll; hidden tabs stop asking the server for state.
    const onVisible = () => {
      if (!document.hidden && !generation.current) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const refreshDesktop = useCallback(async () => {
    tone("refresh", muted);
    setIsRefreshing(true);
    setSelectedIcon(undefined);
    setContextMenu(null);
    const seq = stateSeq.current;
    try {
      const snap = await readState();
      if (seq === stateSeq.current) setData(snap);
    } catch {}
    setTimeout(() => setIsRefreshing(false), 450);
  }, [muted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        void refreshDesktop();
      }
      if (e.key === "Escape") {
        if (start) startButton.current?.focus();
        setStart(false);
        setContextMenu(null);
        setConfirmReset(false);
        setPropertiesOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refreshDesktop, start]);
  // Opening Start puts keyboard users on its first command immediately.
  useEffect(() => {
    if (start)
      startMenu.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [start]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".context-menu")) {
        setContextMenu(null);
      }
      if (
        !target?.closest(".start-menu") &&
        !target?.closest(".start-button")
      ) {
        setStart(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const open = useCallback(
    (id: AppId) => {
      setStart(false);
      setContextMenu(null);
      tone("window_open", muted);
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
    },
    [muted],
  );
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
    stateSeq.current += 1;
    setBusy(true);
    setError("");
    try {
      // Starting over on purpose (Start menu or System Monitor) drops the save.
      if (action.type === "reset") {
        clearSave();
        setReadMail([]);
      }
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
    const updateAudio = () => {
      setAmbient(connected && !muted && !document.hidden);
      duckAmbient(focused === "games");
    };
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
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: Math.min(e.clientX, size.width - 200),
      y: Math.min(e.clientY, size.height - 280),
    });
    setStart(false);
    tone("click", muted);
  };
  return (
    <div
      ref={root}
      tabIndex={-1}
      className={`desktop wallpaper-${wallpaper} ${isRefreshing ? "refreshing" : ""} ${reduce ? "reduced-motion" : ""} ${exhibition ? "exhibition" : ""} ${busy ? "busy" : ""}`}
      data-ui
      onContextMenu={handleContextMenu}
      onClick={() => {
        setSelectedIcon(undefined);
        setContextMenu(null);
      }}
      style={
        wallpaper === "forest"
          ? {
              backgroundImage: `url(${import.meta.env.BASE_URL}assets/forest.jpg)`,
            }
          : wallpaper === "halloween"
            ? {
                backgroundImage: `url(${import.meta.env.BASE_URL}assets/halloween-sun.jpg)`,
              }
            : wallpaper === "earthrise"
              ? {
                  backgroundImage: `url(${import.meta.env.BASE_URL}assets/earthrise.jpg)`,
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
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIcon(id);
              tone("click", muted);
              if (mobile) open(id);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              setSelectedIcon(id);
              handleContextMenu(e);
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
              {id === "mail" && data && unreadMail.length > 0 ? (
                <b>{unreadMail.length}</b>
              ) : null}
            </span>
          </button>
        ))}
        {GAME_LIST.map((game) => (
          <button
            key={game.id}
            className={`desktop-icon ${selectedIcon === game.id ? "chosen" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIcon(game.id);
              tone("click", muted);
              if (mobile) launchGame(game.id);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              setSelectedIcon(game.id);
              handleContextMenu(e);
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
                  onFocusCapture={() => {
                    if (focused !== w.id) update(w.id, { z: ++z.current });
                  }}
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
                        onClick={() => {
                          tone("click", muted);
                          update(w.id, { minimized: true });
                        }}
                      >
                        <span className="minimize-icon" />
                      </button>
                      <button
                        aria-label={`Maximize ${APP_INFO[w.id].title}`}
                        onClick={() => {
                          tone("click", muted);
                          update(w.id, { maximized: !w.maximized });
                        }}
                      >
                        <span
                          className={
                            w.maximized ? "restore-icon" : "maximize-icon"
                          }
                        />
                      </button>
                      <button
                        aria-label={`Close ${APP_INFO[w.id].title}`}
                        onClick={() => {
                          tone("window_close", muted);
                          setWindows((old) => old.filter((x) => x.id !== w.id));
                        }}
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
        <nav
          ref={startMenu}
          className="start-menu"
          aria-label="Start menu"
          onKeyDown={(e) => {
            if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
            const items = Array.from(
              e.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
            );
            if (!items.length) return;
            e.preventDefault();
            const at = items.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            const step = e.key === "ArrowDown" ? 1 : -1;
            items[(at + step + items.length) % items.length]?.focus();
          }}
        >
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
            <button
              onClick={() => {
                setStart(false);
                if (data && writeSave(data.world))
                  setInfo("Game saved on this computer.");
                else setError("This browser won’t let DEADNET save.");
              }}
            >
              <PixelIcon name="disk" size={25} />
              Save game
            </button>
            <button
              onClick={() => {
                setStart(false);
                if (!data) return;
                const url = URL.createObjectURL(
                    new Blob([JSON.stringify(data.world)], {
                      type: "application/json",
                    }),
                  ),
                  a = document.createElement("a");
                a.href = url;
                a.download = "ROOM317.SAV";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              <PixelIcon name="disk" size={25} />
              Save to floppy…
            </button>
            <button
              onClick={() => {
                setStart(false);
                saveFile.current?.click();
              }}
            >
              <PixelIcon name="archive" size={25} />
              Load game…
            </button>
            <button
              onClick={() => {
                setStart(false);
                setConfirmReset(true);
              }}
            >
              <PixelIcon name="monitor" size={25} />
              Start over…
            </button>
            <button
              onClick={() => {
                setStart(false);
                setStickyOpen(true);
                setStickyExpanded(true);
                tone("click", muted);
              }}
            >
              <PixelIcon name="notebook" size={25} />
              Nora’s note
            </button>
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
      <input
        ref={saveFile}
        type="file"
        accept=".sav,.json,application/json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const next = await restore(JSON.parse(await file.text()));
            setData(next);
            writeSave(next.world);
            setInfo("Game loaded.");
          } catch (err) {
            setError(
              err instanceof SyntaxError
                ? "That isn’t a save file for this case."
                : (err as Error).message,
            );
          }
        }}
      />
      {confirmReset && (
        <div className="dialog-backdrop">
          <div
            className="window retro-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            aria-describedby="reset-text"
            onKeyDown={keepFocusInside}
          >
            <div className="title-bar">
              <div className="title-bar-text" id="reset-title">
                Start over
              </div>
              <div className="title-bar-controls">
                <button
                  aria-label="Close"
                  onClick={() => setConfirmReset(false)}
                />
              </div>
            </div>
            <div className="window-body">
              <PixelIcon name="monitor" size={32} />
              <p id="reset-text">
                This erases the whole investigation: messages, opened files,
                game saves and your report. Your Notepad stays.
                <br />
                <br />
                Are you sure you want to start over?
              </p>
            </div>
            <div className="retro-dialog-buttons">
              <button
                onClick={async () => {
                  setConfirmReset(false);
                  if (await perform({ type: "reset" })) {
                    clearSave();
                    setWindows([]);
                    open("readme");
                    setInfo("A new investigation has started.");
                  }
                }}
              >
                Yes
              </button>
              <button autoFocus onClick={() => setConfirmReset(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
      {connected && stickyOpen && (
        <aside
          className={`sticky-note ${mobile ? "mobile" : ""} ${mobile && !stickyExpanded ? "collapsed" : ""}`}
          aria-label="Nora's sticky note"
        >
          <div className="sticky-header">
            <strong>ROOM 317 — DO NOT REMOVE</strong>
            <span className="sticky-actions">
              {mobile && (
                <button
                  aria-expanded={stickyExpanded}
                  aria-label={
                    stickyExpanded ? "Collapse Nora's note" : "Read Nora's note"
                  }
                  onClick={() => {
                    tone("click", muted);
                    setStickyExpanded(!stickyExpanded);
                  }}
                >
                  {stickyExpanded ? "Fold" : "Read"}
                </button>
              )}
              <button
                aria-label="Dismiss note"
                onClick={() => {
                  tone("click", muted);
                  setStickyOpen(false);
                }}
              >
                ×
              </button>
            </span>
          </div>
          {(!mobile || stickyExpanded) && (
            <div className="sticky-body">
              <p>• Owen asked for inspection keys.</p>
              <p>• DO NOT give STAFF-04 until Adam checks signatures.</p>
              <p>• Len left at 02:58.</p>
              <p>• Tape is under Adam's keyboard.</p>
              <p>• Door locked from inside.</p>
              <small>OCT 31 · 03:17:00</small>
            </div>
          )}
        </aside>
      )}
      {contextMenu && (
        <nav
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          aria-label="Desktop Context Menu"
        >
          <button
            onClick={() => {
              void refreshDesktop();
            }}
          >
            <PixelIcon name="monitor" size={16} />
            <span>Refresh</span>
            <kbd>F5</kbd>
          </button>
          <hr />
          <button
            onClick={() => {
              setContextMenu(null);
              setSelectedIcon(undefined);
              tone("click", muted);
            }}
          >
            <span>Arrange Icons</span>
          </button>
          <button
            onClick={() => {
              setContextMenu(null);
              setSelectedIcon(undefined);
              tone("click", muted);
            }}
          >
            <span>Line Up Icons</span>
          </button>
          <hr />
          <button
            onClick={() => {
              setContextMenu(null);
              open("notebook");
            }}
          >
            <PixelIcon name="notebook" size={16} />
            <span>New Text Document</span>
          </button>
          <button
            onClick={() => {
              setContextMenu(null);
              setStickyOpen(true);
              tone("click", muted);
            }}
          >
            <span>Show Nora’s Note</span>
          </button>
          <hr />
          <button
            onClick={() => {
              setContextMenu(null);
              const next = !crtFilter;
              setCrtFilter(next);
              try {
                localStorage.setItem("deadnet-crt", String(next));
              } catch {}
              tone("click", muted);
            }}
          >
            <span>{crtFilter ? "✓ CRT Scanlines" : "  CRT Scanlines"}</span>
          </button>
          <button
            onClick={() => {
              setContextMenu(null);
              const wallpapers = ["forest", "halloween", "earthrise", "plain"];
              const curIndex = wallpapers.indexOf(wallpaper);
              const next = wallpapers[(curIndex + 1) % wallpapers.length];
              setWallpaper(next);
              try {
                localStorage.setItem("deadnet-wallpaper", next);
              } catch {}
              tone("click", muted);
            }}
          >
            <span>Change Wallpaper ({wallpaper})</span>
          </button>
          <hr />
          <button
            onClick={() => {
              setContextMenu(null);
              setPropertiesOpen(true);
              tone("click", muted);
            }}
          >
            <span>System Properties</span>
          </button>
        </nav>
      )}
      {propertiesOpen && (
        <div className="dialog-backdrop">
          <div
            className="window retro-dialog properties-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="props-title"
            onKeyDown={keepFocusInside}
          >
            <div className="title-bar">
              <div className="title-bar-text" id="props-title">
                System Properties
              </div>
              <div className="title-bar-controls">
                <button
                  aria-label="Close"
                  onClick={() => {
                    tone("click", muted);
                    setPropertiesOpen(false);
                  }}
                />
              </div>
            </div>
            <div className="window-body properties-body">
              <div className="props-tab-header">
                <span>General</span>
              </div>
              <div className="props-content">
                <PixelIcon name="monitor" size={48} />
                <div className="props-details">
                  <strong>System:</strong>
                  <p>
                    DEADNET 95 OSR2
                    <br />
                    Version 4.03.1214
                  </p>
                  <strong>Registered to:</strong>
                  <p>
                    Nora Vale
                    <br />
                    Westhaven House · Room 317
                    <br />
                    Node ID: 884-317-09
                  </p>
                  <strong>Computer:</strong>
                  <p>
                    Intel Pentium II Processor
                    <br />
                    32.0 MB RAM · DN-1200 HD (1.2 GB)
                  </p>
                </div>
              </div>
            </div>
            <div className="retro-dialog-buttons">
              <button
                autoFocus
                onClick={() => {
                  tone("click", muted);
                  setPropertiesOpen(false);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {crtFilter && <div className="crt-overlay" aria-hidden="true" />}
      {info && (
        <div role="status" className="error-toast info-toast">
          <PixelIcon name="disk" size={26} />
          <p>{info}</p>
          <button aria-label="Dismiss" onClick={() => setInfo("")}>
            ×
          </button>
        </div>
      )}
      <footer inert={!connected} className="taskbar">
        <button
          ref={startButton}
          className={`start-button ${start ? "pressed" : ""}`}
          onClick={() => {
            tone("click", muted);
            setStart(!start);
          }}
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
              aria-pressed={focused === w.id && !w.minimized}
              className={
                focused === w.id && !w.minimized ? "pressed active" : ""
              }
              onClick={() => {
                tone("click", muted);
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
            onClick={() => {
              tone("click", !muted);
              setMuted(!muted);
            }}
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
          <time title="31 OCT 1999 03:17:00 AM — Westhaven House Room 317">
            03:17 AM
          </time>
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

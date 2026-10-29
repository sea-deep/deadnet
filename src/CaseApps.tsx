import { useEffect, useRef, useState } from "react";
import type { AppProps } from "./Apps";
import type { AgentId } from "./types";
import { PixelIcon } from "./icons";
import { CONVERSATIONS, PHOTO_CAPTION } from "./story";
import { readyToReport } from "./rules";
import { exhibition } from "./api";

export function SaveItem({
  id,
  data,
  perform,
  busy,
  open,
}: AppProps & { id: string }) {
  const saved = data.world.collected.includes(id);
  return (
    <div className="save-item">
      <PixelIcon name="usb" size={20} />
      <button
        disabled={busy || saved}
        onClick={() => void perform({ type: "collect", evidenceId: id })}
      >
        {saved ? "Saved to casebook" : "Save to casebook"}
      </button>
      {saved && <button onClick={() => open("readme")}>Open casebook</button>}
    </div>
  );
}
const contacts = [
  { id: "adam", name: "Adam Moore", handle: "adam_m", note: "that’s you" },
  { id: "mara", name: "Mara Voss", handle: "mara_v", note: "Room 316" },
  { id: "len", name: "Len Mercer", handle: "len_29", note: "Night porter" },
  {
    id: "sysop",
    name: "Owen Keene",
    handle: "sysop",
    note: "Building manager",
  },
];
export function Messenger(props: AppProps) {
  const { open } = props;
  const [contact, setContact] = useState("adam");
  const [day, setDay] = useState("30 Oct");
  const current = contacts.find((c) => c.id === contact)!;
  const lines = CONVERSATIONS[contact][day];
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    log.current?.scrollTo(0, 0);
  }, [contact, day]);
  return (
    <div className="personal-messenger">
      <div className="personal-menubar">
        <span>Conversations</span>
        <button onClick={() => open("people")}>Address book</button>
        <button onClick={() => open("spirit")}>Unknown signal</button>
      </div>
      <div className="messenger-layout">
        <aside className="buddy-list">
          <div className="signed-in">
            <PixelIcon name="spirit" size={30} />
            <div>
              <strong>nora_v</strong>
              <span>Last online: 31 October</span>
            </div>
          </div>
          <h2>Conversations</h2>
          {contacts.map((c) => (
            <button
              key={c.id}
              aria-pressed={contact === c.id}
              onClick={() => setContact(c.id)}
            >
              <i className="buddy-offline" />
              <span>
                <strong>{c.name}</strong>
                <small>{c.note}</small>
              </span>
            </button>
          ))}
          <button className="signal-buddy" onClick={() => open("spirit")}>
            <i className="buddy-online" />
            <span>
              <strong>nora_v</strong>
              <small>Connection detected</small>
            </span>
          </button>
          <p className="away-message">“somewhere with a window that opens.”</p>
        </aside>
        <main className="conversation-pane">
          <header>
            <div>
              <h1>{current.name}</h1>
              <span>nora_v ↔ {current.handle}</span>
            </div>
            <label>
              History{" "}
              <select
                aria-label="Conversation date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                {["24 Oct", "30 Oct", "31 Oct"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
          </header>
          {day !== "31 Oct" && (
            <button
              className="latest-conversation"
              onClick={() => setDay("31 Oct")}
            >
              Last conversation · 31 October →
            </button>
          )}
          <div
            className="personal-chat"
            ref={log}
            role="log"
            aria-label="Conversation history"
          >
            <p className="conversation-date">
              {day.replace("Oct", "October")} 1999
            </p>
            {lines.map((line, i) => (
              <div
                className={`chat-line ${line.from === "nora_v" ? "noras-line" : ""}`}
                key={i}
              >
                <time>{line.time}</time>
                <div>
                  <strong>{line.from} says:</strong>
                  <p>{line.text}</p>
                </div>
              </div>
            ))}
            {day === "31 Oct" && contact === "adam" && (
              <p className="unanswered">No reply.</p>
            )}
          </div>
          {day === "31 Oct" && contact === "adam" && (
            <>
              <SaveItem {...props} id="birthday" />
              <button className="missed-call" onClick={() => open("mail")}>
                Nora left a voice message. Open Mail →
              </button>
            </>
          )}
          <div className="window-status">
            <span>History on Nora’s computer</span>
            <span>Read only</span>
          </div>
        </main>
      </div>
    </div>
  );
}
const photos = [
  {
    id: "woods",
    src: "forest.jpg",
    name: "Out of town",
    date: "17 October 1999",
    caption:
      "Mara said the walk would take twenty minutes. We were lost for two hours. Best Sunday in ages. — N",
  },
  {
    id: "moon",
    src: "earthrise.jpg",
    name: "Somewhere else",
    date: "21 October 1999",
    caption:
      "Adam sent me this picture of Earth from the Moon. Imagine being that far from the office downstairs. NASA / Apollo 8. — N",
  },
  {
    id: "key",
    src: "story/keys.jpg",
    name: "The spare key",
    date: "28 October 1999",
    caption: PHOTO_CAPTION,
  },
];
export function Photos(props: AppProps) {
  const [selected, setSelected] = useState(0),
    [zoom, setZoom] = useState(false);
  const photo = photos[selected];
  return (
    <div className="photos-app">
      <div className="personal-menubar">
        <span>Nora’s pictures</span>
        <button aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
          {zoom ? "Fit picture" : "Enlarge picture"}
        </button>
      </div>
      <div className="photo-film" aria-label="Photo album">
        {photos.map((p, i) => (
          <button
            key={p.id}
            aria-pressed={selected === i}
            onClick={() => {
              setSelected(i);
              setZoom(false);
            }}
          >
            <img src={`${import.meta.env.BASE_URL}assets/${p.src}`} alt="" />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
      <div className={`photo-viewer ${zoom ? "zoomed" : ""}`}>
        <img
          src={`${import.meta.env.BASE_URL}assets/${photo.src}`}
          alt={
            selected === 2
              ? "A large brass door key with a rounded head on a worn table"
              : photo.name
          }
        />
      </div>
      <div className="photo-caption">
        <h1>{photo.name}</h1>
        <time>{photo.date}</time>
        <p>{photo.caption}</p>
      </div>
      {selected === 2 && <SaveItem {...props} id="manifest" />}
      <div className="window-status">
        <span>{selected + 1} of 3 pictures</span>
        <span>
          {selected === 2
            ? "Photo: Gausanchennai · CC BY-SA 4.0"
            : selected === 0
              ? "Photo: Sebastian Unrau / Unsplash"
              : "NASA / William Anders · Public domain"}
        </span>
      </div>
    </div>
  );
}
const appointments: Record<
  number,
  { title: string; text: string; time: string }[]
> = {
  17: [
    {
      time: "11:00",
      title: "Walk with Mara",
      text: "Bring a coat. She says she knows the way this time.",
    },
  ],
  24: [
    {
      time: "20:00",
      title: "Mara’s soup",
      text: "Bring the blue bowls back. And the scarf.",
    },
  ],
  28: [
    {
      time: "18:30",
      title: "Get a spare cut",
      text: "Locked out again. Owen has the only spare. Photograph in the album so I remember which one to ask for.",
    },
  ],
  30: [
    {
      time: "18:00",
      title: "Packing",
      text: "November. Really this time. Ask Adam about the little flat near the station.",
    },
  ],
  31: [
    {
      time: "03:15",
      title: "Talk to Owen",
      text: "Fire inspection forms. Take copies to the council Monday. Don’t let him keep the originals.",
    },
    {
      time: "20:00",
      title: "Dinner at Mara’s",
      text: "Adam + Len. Bring bread. Stay for once.",
    },
  ],
};
export function Calendar({ open }: AppProps) {
  const [day, setDay] = useState(31);
  return (
    <div className="calendar-app">
      <h1>October 1999</h1>
      <div className="calendar-week">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={`empty${i}`} />
        ))}
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <button key={d} aria-pressed={day === d} onClick={() => setDay(d)}>
            <span>{d}</span>
            {appointments[d] && <i aria-label="Has an appointment" />}
          </button>
        ))}
      </div>
      <section className="calendar-agenda">
        <h2>{day} October</h2>
        {appointments[day]?.map((a) => (
          <article key={a.title}>
            <time>{a.time}</time>
            <div>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </div>
          </article>
        )) || <p>Nothing planned.</p>}
        {day === 28 && (
          <button onClick={() => open("archive")}>Open Photos</button>
        )}
        {day === 31 && (
          <button onClick={() => open("browser")}>Open Messenger</button>
        )}
      </section>
      <div className="window-status">
        <span>Nora’s calendar</span>
        <span>2 November 1999</span>
      </div>
    </div>
  );
}
export function Casebook(props: AppProps) {
  const { data, perform, open, busy } = props;
  const [tab, setTab] = useState<"items" | "theory">("items");
  const [suspect, setSuspect] = useState("");
  const [motive, setMotive] = useState("");
  const [method, setMethod] = useState("");
  const [feedback, setFeedback] = useState("");
  const ready = readyToReport(data.world);
  const hasMemory = Boolean(
    data.world.agents.find((a) => a.id === "nora")?.knownFacts.length,
  );
  const sourceApps = {
    carrier: "mail",
    birthday: "browser",
    manifest: "archive",
  } as const;
  return (
    <div className="casebook-app">
      <header className="casebook-header">
        <PixelIcon name="usb" size={32} />
        <div>
          <h1>Room 317</h1>
          <span>Adam Moore · Recovery drive</span>
        </div>
        <span className="casebook-state">
          {data.world.ending === "open" ? "Open case" : "Case closed"}
        </span>
      </header>
      <nav className="casebook-tabs" aria-label="Casebook pages">
        <button aria-pressed={tab === "items"} onClick={() => setTab("items")}>
          Saved items ({data.world.collected.length})
        </button>
        <button
          aria-pressed={tab === "theory"}
          onClick={() => setTab("theory")}
        >
          What happened?
        </button>
      </nav>
      <main>
        {data.world.ending !== "open" ? (
          <div className="casebook-aftermath">
            <h2>
              {data.world.ending === "exposed"
                ? "Nora’s name is on the report."
                : "The drive is still here."}
            </h2>
            <p>
              {data.world.ending === "exposed"
                ? "You sent the conversation, the email and the photograph together. Owen’s account no longer fits. Len has a witness to his journey home. Mara can finally stop setting a fourth place."
                : "You kept the evidence private. The official account still calls it an accident."}
            </p>
            <button onClick={() => open("spirit")}>
              Read Nora’s last message
            </button>
          </div>
        ) : tab === "items" ? (
          <>
            <p className="casebook-note">
              Mara asked you to look through Nora’s computer. The police say she
              fell. You still have her last message.
            </p>
            {!data.world.collected.length && (
              <div className="casebook-empty">
                <h2>Nothing saved yet.</h2>
                <p>
                  Save a conversation, email or photograph here while you look
                  around.
                </p>
                <button onClick={() => open("browser")}>Open Messenger</button>
              </div>
            )}
            {data.archive
              .filter((e) => data.world.collected.includes(e.id))
              .map((e) => (
                <article className="saved-artifact" key={e.id}>
                  <PixelIcon
                    name={
                      e.id === "carrier"
                        ? "mail"
                        : e.id === "birthday"
                          ? "spirit"
                          : "photos"
                    }
                    size={28}
                  />
                  <div>
                    <h2>{e.title}</h2>
                    <time>{e.date}</time>
                    <button
                      onClick={() =>
                        open(sourceApps[e.id as keyof typeof sourceApps])
                      }
                    >
                      Open original
                    </button>
                  </div>
                </article>
              ))}
            <div className="casebook-footer">
              <button onClick={() => open("spirit")}>Talk to Nora</button>
              <button onClick={() => setTab("theory")}>
                Put the pieces together
              </button>
            </div>
          </>
        ) : (
          <form
            className="theory-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setFeedback("");
              const ok = await perform({
                type: "resolve",
                choice: "exposed",
                suspect: suspect as Exclude<AgentId, "nora">,
                motive: motive as "inspections",
                method: method as "spare-key",
              });
              if (ok)
                setFeedback(
                  "If a piece doesn’t fit, Nora’s reply is in Unknown Signal. You can revise your theory.",
                );
            }}
          >
            <h2>What happened in Nora’s room?</h2>
            <p>A name alone won’t explain it. Connect what you found.</p>
            <label>
              Who came into the room?
              <select
                required
                aria-label="Report suspect"
                value={suspect}
                onChange={(e) => setSuspect(e.target.value)}
              >
                <option value="">Choose a person</option>
                <option value="mara">Mara Voss</option>
                <option value="len">Len Mercer</option>
                <option value="sysop">Owen Keene</option>
              </select>
            </label>
            <label>
              Why did they come?
              <select
                required
                aria-label="Report motive"
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
              >
                <option value="">Choose a motive</option>
                <option value="rent">An argument about unpaid rent</option>
                <option value="inspections">
                  To stop her exposing the forged inspections
                </option>
                <option value="jealousy">
                  Jealousy over her friendship with Adam
                </option>
              </select>
            </label>
            <label>
              How did they get in?
              <select
                required
                aria-label="Report method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="">Choose a way in</option>
                <option value="staff-key">Len’s red staff key</option>
                <option value="window">The broken window</option>
                <option value="spare-key">
                  The brass spare kept in the office
                </option>
              </select>
            </label>
            {!ready && (
              <p className="casebook-needs" role="status">
                {data.world.collected.length < 3
                  ? "Your casebook needs the final conversation, Len’s email and the spare-key photograph."
                  : !hasMemory
                    ? "Show Nora one of your saved items before you finish. Her memory may help."
                    : ""}
              </p>
            )}
            {feedback && <p role="status">{feedback}</p>}
            <div className="casebook-footer">
              <button type="button" onClick={() => open("spirit")}>
                Ask Nora
              </button>
              <button disabled={busy || !ready} type="submit">
                Send the report
              </button>
            </div>
          </form>
        )}
      </main>
      <footer className="window-status">
        <span>USB drive connected</span>
        <span>
          {exhibition || data.world.mode === "baseline"
            ? "Scripted dialogue"
            : "Live dialogue"}{" "}
          · Progress saves automatically
        </span>
      </footer>
    </div>
  );
}

const deletedItems = [
  {
    id: "mum",
    name: "Letter to Mum",
    kind: "Unsent letter",
    date: "29 Oct 1999",
    body: "Mum,\n\nI know I said I liked it here. I wanted you to stop worrying. The window sticks and the heating only works when Len kicks it. Mara makes it bearable.\n\nAdam found a place near the station. There’s room for a little table by the window. I haven’t said yes yet. I think I will.\n\nI’ll call Sunday.\n\nNora",
  },
  {
    id: "flat",
    name: "Station flat enquiry",
    kind: "Draft email",
    date: "30 Oct 1999",
    body: "Hello,\n\nIs the little flat by the station still available? My friend Adam said there was a south-facing window.\n\nI could come Monday. I don’t have much furniture. Is that all right?\n\nNora Vale",
  },
];
const RESTORED_KEY = "deadnet-personal-restored-v5";
function useRestored() {
  const read = (): string[] => {
    try {
      const v = JSON.parse(localStorage.getItem(RESTORED_KEY) || "[]");
      return Array.isArray(v)
        ? v.filter((id): id is string =>
            deletedItems.some((item) => item.id === id),
          )
        : [];
    } catch {
      return [];
    }
  };
  const [restored, setRestored] = useState(read);
  useEffect(() => {
    const update = () => setRestored(read());
    window.addEventListener("deadnet-restored", update);
    return () => window.removeEventListener("deadnet-restored", update);
  }, []);
  function restoreItem(id: string) {
    const next = [...new Set([...read(), id])];
    try {
      localStorage.setItem(RESTORED_KEY, JSON.stringify(next));
    } catch {
      return false;
    }
    setRestored(next);
    window.dispatchEvent(new Event("deadnet-restored"));
    return true;
  }
  return { restored, restoreItem };
}
export function Trash({ open }: AppProps) {
  const { restored, restoreItem } = useRestored();
  const [selection, setSelection] = useState("mum");
  const [error, setError] = useState("");
  const items = deletedItems.filter((item) => !restored.includes(item.id));
  const selected = items.find((item) => item.id === selection) || items[0];
  return (
    <div className="personal-files trash-app">
      <div className="personal-menubar">
        <PixelIcon name="recycle" size={22} />
        <span>Trash Bin</span>
        <button
          disabled={!selected}
          onClick={() => {
            if (selected && !restoreItem(selected.id))
              setError(
                "This browser blocked the restore. The original is still here.",
              );
          }}
        >
          Restore selected item
        </button>
        <button onClick={() => open("computer")}>My Computer</button>
      </div>
      <div className="file-manager-layout">
        <aside className="file-tree">
          <h2>Deleted items</h2>
          {items.map((item) => (
            <button
              key={item.id}
              aria-pressed={selected?.id === item.id}
              onClick={() => setSelection(item.id)}
            >
              <PixelIcon name="notebook" size={20} />
              {item.name}
            </button>
          ))}
        </aside>
        <main className="personal-document">
          {selected ? (
            <>
              <h1>{selected.name}</h1>
              <p className="document-meta">
                {selected.kind} · Deleted {selected.date}
              </p>
              <p className="document-copy">{selected.body}</p>
            </>
          ) : (
            <>
              <h1>The bin is empty.</h1>
              <p>
                Restored items are in My Computer → Nora’s disk → Documents.
              </p>
              <button onClick={() => open("computer")}>Open My Computer</button>
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </main>
      </div>
      <footer className="window-status">
        <span>{items.length} deleted items</span>
        <span>Restores to Nora’s Documents</span>
      </footer>
    </div>
  );
}
export function MyComputer({ open }: AppProps) {
  const [folder, setFolder] = useState<"root" | "disk" | "usb" | "documents">(
    "root",
  );
  const [selection, setSelection] = useState("");
  const [documentId, setDocumentId] = useState("");
  const { restored } = useRestored();
  const doc = deletedItems.find((item) => item.id === documentId);
  type Entry = {
    id: string;
    name: string;
    type: string;
    icon:
      | "computer"
      | "disk"
      | "usb"
      | "archive"
      | "photos"
      | "spirit"
      | "mail"
      | "calendar"
      | "notebook"
      | "games"
      | "recycle";
    app?: Parameters<typeof open>[0];
    folder?: typeof folder;
  };
  const entries: Entry[] =
    folder === "root"
      ? [
          {
            id: "disk",
            name: "Nora’s disk (C:)",
            type: "Local disk",
            icon: "disk",
            folder: "disk",
          },
          {
            id: "usb",
            name: "Recovery USB (E:)",
            type: "Removable drive",
            icon: "usb",
            folder: "usb",
          },
          {
            id: "trash",
            name: "Trash Bin",
            type: "Deleted items",
            icon: "recycle",
            app: "trash",
          },
        ]
      : folder === "usb"
        ? [
            {
              id: "casebook",
              name: "Casebook",
              type: "Recovery utility",
              icon: "usb",
              app: "readme",
            },
            {
              id: "monitor",
              name: "Connection settings",
              type: "System utility",
              icon: "computer",
              app: "monitor",
            },
          ]
        : folder === "documents"
          ? [
              {
                id: "notes",
                name: "Notepad",
                type: "Personal notes",
                icon: "notebook",
                app: "notebook",
              },
              ...deletedItems
                .filter((item) => restored.includes(item.id))
                .map((item) => ({
                  id: item.id,
                  name: item.name,
                  type: item.kind,
                  icon: "notebook" as const,
                })),
            ]
          : [
              {
                id: "documents",
                name: "Documents",
                type: "File folder",
                icon: "archive",
                folder: "documents",
              },
              {
                id: "photos",
                name: "Photos",
                type: "Photo album",
                icon: "photos",
                app: "archive",
              },
              {
                id: "messenger",
                name: "Messenger",
                type: "Conversations",
                icon: "spirit",
                app: "browser",
              },
              {
                id: "mail",
                name: "Mail",
                type: "Personal mail",
                icon: "mail",
                app: "mail",
              },
              {
                id: "calendar",
                name: "Calendar",
                type: "Appointments",
                icon: "calendar",
                app: "recycle",
              },
              {
                id: "games",
                name: "Games",
                type: "Game library",
                icon: "games",
                app: "games",
              },
            ];
  function enter(entry: Entry) {
    setSelection("");
    if (entry.folder) {
      setFolder(entry.folder);
      setDocumentId("");
    } else if (entry.app) open(entry.app);
    else setDocumentId(entry.id);
  }
  function navigate(next: typeof folder) {
    setFolder(next);
    setSelection("");
    setDocumentId("");
  }
  return (
    <div className="personal-files">
      <div className="file-manager-toolbar">
        <button
          disabled={folder === "root" && !doc}
          onClick={() =>
            doc
              ? setDocumentId("")
              : navigate(folder === "documents" ? "disk" : "root")
          }
        >
          Back
        </button>
        <button
          disabled={!selection}
          onClick={() => {
            const entry = entries.find((item) => item.id === selection);
            if (entry) enter(entry);
          }}
        >
          Open
        </button>
        <span className="file-address">
          {folder === "root"
            ? "My Computer"
            : folder === "usb"
              ? "E:\\Recovery"
              : folder === "documents"
                ? "C:\\Nora\\Documents"
                : "C:\\Nora"}
        </span>
      </div>
      <div className="file-manager-layout">
        <aside className="file-tree">
          <button onClick={() => navigate("root")}>
            <PixelIcon name="computer" size={22} />
            My Computer
          </button>
          <button onClick={() => navigate("disk")}>
            <PixelIcon name="disk" size={22} />
            Nora’s disk (C:)
          </button>
          <button onClick={() => navigate("documents")}>
            <PixelIcon name="archive" size={22} />
            Documents
          </button>
          <button onClick={() => navigate("usb")}>
            <PixelIcon name="usb" size={22} />
            Recovery USB (E:)
          </button>
          <button onClick={() => open("trash")}>
            <PixelIcon name="recycle" size={22} />
            Trash Bin
          </button>
        </aside>
        <main className={doc ? "personal-document" : "file-entries"}>
          {doc ? (
            <>
              <h1>{doc.name}</h1>
              <p className="document-meta">
                {doc.kind} · {doc.date}
              </p>
              <p className="document-copy">{doc.body}</p>
            </>
          ) : (
            <>
              <div className="file-table-heading">
                <span>Name</span>
                <span>Type</span>
              </div>
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  aria-pressed={selection === entry.id}
                  onClick={() => {
                    setSelection(entry.id);
                    if (innerWidth < 740) enter(entry);
                  }}
                  onDoubleClick={() => enter(entry)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      enter(entry);
                    }
                  }}
                >
                  <span>
                    <PixelIcon name={entry.icon} size={25} />
                    {entry.name}
                  </span>
                  <span>{entry.type}</span>
                </button>
              ))}
            </>
          )}
        </main>
      </div>
      <footer className="window-status">
        <span>{doc ? "Restored document" : `${entries.length} objects`}</span>
        <span>Nora Vale</span>
      </footer>
    </div>
  );
}

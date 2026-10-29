import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "./icons";
import { exhibition } from "./api";
import { tone } from "./sound";
export function GameEntrance({
  ready,
  muted,
  setMuted,
  powerOn,
  resumed,
}: {
  ready: boolean;
  muted: boolean;
  setMuted: (v: boolean) => void;
  powerOn: () => void;
  resumed: boolean;
}) {
  const [inserted, setInserted] = useState(false);
  const powerButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (inserted && ready) powerButton.current?.focus();
  }, [inserted, ready]);
  return (
    <div className="game-entrance">
      <div className="entrance-title">
        <h1>DEADNET</h1>
        <p>Room 317</p>
      </div>
      <main className="entrance-scene">
        <article className="maras-letter">
          <h2>Adam,</h2>
          <p>I couldn’t keep her computer in my room anymore.</p>
          <p>
            They say she fell. You heard the message she left. Please look
            before they come to collect it.
          </p>
          <p>Her messages are still there.</p>
          <p className="letter-signature">— Mara</p>
        </article>
        <section className="computer-start" aria-label="Recovery drive">
          <div className="entrance-computer">
            <PixelIcon name="monitor" size={64} />
            <div>
              <h2>Nora’s computer</h2>
              <p>
                {inserted
                  ? "Recovery drive connected."
                  : "Insert your recovery drive."}
              </p>
            </div>
            <i className={inserted ? "power-led on" : "power-led"} />
          </div>
          <button
            className={`usb-insert ${inserted ? "inserted" : ""}`}
            disabled={inserted}
            onClick={() => {
              setInserted(true);
              tone("disk", muted);
            }}
          >
            <PixelIcon name="usb" size={32} />
            <span>
              {inserted ? "USB connected · Casebook ready" : "Insert USB drive"}
            </span>
          </button>
          <button
            ref={powerButton}
            className="boot-connect"
            disabled={!ready || !inserted}
            onClick={powerOn}
          >
            {!ready
              ? "Connecting to computer…"
              : resumed
                ? "Return to the computer"
                : "Power on"}
          </button>
          <label className="entrance-sound">
            <input
              type="checkbox"
              checked={!muted}
              onChange={(e) => setMuted(!e.target.checked)}
            />{" "}
            Sound
          </label>
          {exhibition && (
            <p className="entrance-disclosure">
              Public edition · Scripted dialogue. Live AI requires the server.
            </p>
          )}
        </section>
      </main>
      <footer className="entrance-footer">
        <span>A fictional investigation. Headphones recommended.</span>
        <a
          href="https://github.com/sea-deep/deadnet/blob/main/docs/CREDITS.md"
          target="_blank"
          rel="noreferrer"
        >
          Credits
        </a>
      </footer>
    </div>
  );
}

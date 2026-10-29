import type { CSSProperties } from "react";
export const GAME_LIST = [
  {
    id: "snake",
    name: "Grave Snake",
    keys: "Arrow keys",
    author: "Patrick Gillespie",
    repo: "patorjk/JavaScript-Snake",
  },
  {
    id: "flappy",
    name: "Flappy Bat",
    keys: "Space or click",
    author: "pyforgedev",
    repo: "pyforgedev/flappy-bird",
  },
  {
    id: "tetris",
    name: "Crypt Blocks",
    keys: "Space · Arrow keys",
    author: "Jake Gordon",
    repo: "jakesgordon/javascript-tetris",
  },
  {
    id: "2048",
    name: "2048: Séance",
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
] as const;
export type GameId = (typeof GAME_LIST)[number]["id"];
export function GameIcon({ id }: { id: GameId }) {
  if (id === "phantomicus" || id === "2048")
    return (
      <img
        className="pixel-icon game-logo"
        src={`${import.meta.env.BASE_URL}assets/icons/${id === "2048" ? "2048-game" : "phantomicus-game"}.png`}
        width={36}
        height={36}
        alt=""
        aria-hidden="true"
      />
    );
  const icons = {
    snake: "grave-snake",
    tetris: "crypt-blocks",
    "2048": "seance",
    phantomicus: "phantomicus",
  };
  if (id === "flappy")
    return (
      <span className="game-sprite-icon bat-icon" aria-hidden="true">
        <span
          style={
            {
              width: 24,
              height: 24,
              backgroundImage: `url(${import.meta.env.BASE_URL}assets/horror/bat.png)`,
              // The sheet faces left; mirror it and outline it so it reads on dark wallpaper.
              transform: "scale(-1.5, 1.5)",
              filter:
                "drop-shadow(1px 0 0 #d9c6e8) drop-shadow(-1px 0 0 #d9c6e8) drop-shadow(0 1px 0 #d9c6e8) drop-shadow(0 -1px 0 #d9c6e8)",
            } as CSSProperties
          }
        />
      </span>
    );
  return (
    <img
      className="pixel-icon"
      aria-hidden="true"
      alt=""
      src={`${import.meta.env.BASE_URL}assets/icons/${icons[id]}.png`}
      width={32}
      height={32}
    />
  );
}

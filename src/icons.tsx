// Fugue Icons © Yusuke Kamiyamane, CC BY 3.0. See public/assets/icons/LICENSE.txt.
export type IconName =
  | "browser"
  | "mail"
  | "archive"
  | "people"
  | "monitor"
  | "notebook"
  | "speaker"
  | "disk"
  | "games";
export function PixelIcon({
  name,
  size = 32,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <img
      className="pixel-icon"
      src={`${import.meta.env.BASE_URL}assets/icons/${name}.png`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

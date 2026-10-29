/** Authored case canon. IDs are internal; the player encounters ordinary apps. */
export const STORY_ID = "westhaven-personal-v5";
export type ChatLine = { time: string; from: string; text: string };
export const CONVERSATIONS: Record<string, Record<string, ChatLine[]>> = {
  adam: {
    "24 Oct": [
      {
        time: "20:11",
        from: "nora_v",
        text: "your bat game ate my entire evening",
      },
      { time: "20:12", from: "adam_m", text: "You’re welcome." },
      { time: "20:12", from: "nora_v", text: "i was supposed to be packing" },
      {
        time: "20:13",
        from: "adam_m",
        text: "You’ve been ‘moving out next month’ since March.",
      },
      {
        time: "20:14",
        from: "nora_v",
        text: "november. really this time. somewhere with a window that opens.",
      },
    ],
    "30 Oct": [
      {
        time: "22:06",
        from: "adam_m",
        text: "Mara says you’re not coming tomorrow?",
      },
      {
        time: "22:07",
        from: "nora_v",
        text: "tell her i’m coming. tell her to stop making enough soup for twelve people.",
      },
      { time: "22:08", from: "adam_m", text: "She says it’s for six." },
      { time: "22:08", from: "nora_v", text: "she owns two bowls adam" },
      {
        time: "22:10",
        from: "nora_v",
        text: "also i found something weird in the inspection forms. same signature. same ink smudge. three different years.",
      },
      {
        time: "22:11",
        from: "adam_m",
        text: "Leave it until morning. Please.",
      },
    ],
    "31 Oct": [
      { time: "03:02", from: "nora_v", text: "you still awake?" },
      { time: "03:03", from: "adam_m", text: "Unfortunately. You okay?" },
      {
        time: "03:04",
        from: "nora_v",
        text: "those inspection signatures are copied. all of them. i photographed the originals.",
      },
      {
        time: "03:05",
        from: "adam_m",
        text: "Then we take them to the council. Tomorrow.",
      },
      {
        time: "03:06",
        from: "nora_v",
        text: "manager wants to talk. quarter past. says i’ve misunderstood.",
      },
      { time: "03:08", from: "adam_m", text: "Don’t let him in on your own." },
      {
        time: "03:09",
        from: "nora_v",
        text: "len’s gone home. i saw him leave.",
      },
      {
        time: "03:10",
        from: "nora_v",
        text: "i left the tape under your keyboard. keep it safe for me?",
      },
      { time: "03:11", from: "adam_m", text: "What tape? Nora, call me." },
      { time: "03:14", from: "nora_v", text: "don’t come through the lobby" },
      { time: "03:14", from: "adam_m", text: "Nora?" },
      { time: "03:23", from: "adam_m", text: "I’m coming up." },
    ],
  },
  mara: {
    "24 Oct": [
      {
        time: "18:32",
        from: "mara_v",
        text: "your scarf is on my chair again",
      },
      {
        time: "18:33",
        from: "nora_v",
        text: "it lives there now. please feed it.",
      },
      { time: "18:34", from: "mara_v", text: "come get it. soup at eight." },
      { time: "18:35", from: "nora_v", text: "you could just say you miss me" },
      { time: "18:35", from: "mara_v", text: "soup. eight." },
    ],
    "30 Oct": [
      {
        time: "21:14",
        from: "mara_v",
        text: "len fixed the fire door. again. owen will take the credit. again.",
      },
      {
        time: "21:15",
        from: "nora_v",
        text: "i think it’s worse than that. the inspections never happened.",
      },
      {
        time: "21:16",
        from: "mara_v",
        text: "please don’t go downstairs alone tonight",
      },
      {
        time: "21:18",
        from: "nora_v",
        text: "i’m not brave. i’m just tired of being frightened of the man who collects the rent.",
      },
    ],
    "31 Oct": [
      {
        time: "02:43",
        from: "mara_v",
        text: "my cold is worse. not coming out. knock twice if you need anything.",
      },
      {
        time: "02:44",
        from: "nora_v",
        text: "sleep. i’ll bring tea in the morning.",
      },
    ],
  },
  len: {
    "24 Oct": [
      {
        time: "19:01",
        from: "len_29",
        text: "Your window’s fixed. Please don’t use a fork as a doorstop again.",
      },
      { time: "19:03", from: "nora_v", text: "it was a very good fork" },
    ],
    "30 Oct": [
      {
        time: "23:48",
        from: "len_29",
        text: "Off at three tomorrow. Last bus is 2:58, so I’m leaving a minute early. Don’t tell.",
      },
      {
        time: "23:49",
        from: "nora_v",
        text: "your secret is safe. owen keeps you here late enough.",
      },
    ],
    "31 Oct": [
      {
        time: "02:51",
        from: "len_29",
        text: "Heading out. Left the red staff key on the hook. Take care of yourself, Nora.",
      },
      { time: "02:52", from: "nora_v", text: "get home before the rain does" },
    ],
  },
  sysop: {
    "24 Oct": [
      {
        time: "09:12",
        from: "sysop",
        text: "Rent is due Friday. Please use the office letterbox.",
      },
      {
        time: "09:16",
        from: "nora_v",
        text: "could we get the landing light fixed first?",
      },
      { time: "09:17", from: "sysop", text: "It is on the list." },
    ],
    "30 Oct": [
      {
        time: "22:39",
        from: "nora_v",
        text: "i’ve copied the inspection forms. why is the same signature on all three?",
      },
      {
        time: "22:45",
        from: "sysop",
        text: "You have taken office property without permission. We should discuss this in person.",
      },
    ],
    "31 Oct": [
      {
        time: "03:00",
        from: "sysop",
        text: "Quarter past. Your room. Please do not involve the other residents.",
      },
      {
        time: "03:01",
        from: "nora_v",
        text: "i’m sending the photographs tomorrow either way",
      },
    ],
  },
};
export const BUS_MAIL = {
  id: "personal-bus",
  actor: "len" as const,
  to: "visitor" as const,
  channel: "mail" as const,
  tick: 0,
  origin: "seed" as const,
  subject: "Home, somehow.",
  archivedAt: "31 Oct · 03:07",
  factIds: [] as string[],
  text: "Made the 2:58 by about six seconds. Ticket machine’s broken, so the driver wrote one out by hand. Kept it. First thing I’ve won all week.\n\nI’m home. It’s raining through my kitchen window again. Tell Mara I’ll look at her heater Monday.\n\nYou two still on for soup?\n\nLen",
};
export const PHOTO_CAPTION =
  "Locked myself out. Again. Owen watched me borrow his office spare for the entire twelve seconds it took to get in. Must get one of my own cut. — N";

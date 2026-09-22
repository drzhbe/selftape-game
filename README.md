# Selftape Game

Selftaping feels like work. This makes it feel like a game.

Actors log each selftape, score every take on six skills, and earn XP for doing the work —
whether or not casting ever writes back.

## The six skills

1. 🎻 **Instrument** — voice, hands, posture, tempo, size
2. 👂 **Moment to moment** — listening and reacting, not reciting
3. 📜 **Foreign text** — learned → thought through → inhabited
4. 🫀 **Embodied** — personalised circumstances that change the instrument
5. 📖 **Story** — protagonist, climax, meaning, A → B
6. 🎥 **On screen** — framing, light, eye line, distance

## Run

```bash
bun install
bun run dev
```

`bun run build` typechecks and builds to `dist/`.

## How it works

- Data lives in the browser: `localStorage` for tapes/scores, IndexedDB for attached video files.
  Export/import a JSON backup from the Progress screen.
- `src/criteria.ts` — the six criteria, their 1–5 anchors and improvement drills.
- `src/game.ts` — XP rules, levels, weekly streak, achievements, weak-spot insights.
- `src/store.ts` — state + actions; every rewarding action returns a `Reward` for the celebration screen.

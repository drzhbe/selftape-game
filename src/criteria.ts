export type CriterionKey = 'instrument' | 'moment' | 'text' | 'embodied' | 'story' | 'screen'

export interface Drill {
  title: string
  how: string
}

export interface Criterion {
  key: CriterionKey
  name: string
  emoji: string
  color: string
  question: string
  hint: string
  /** What a 1, 2, 3, 4, 5 looks like — keeps self-scoring honest. */
  anchors: [string, string, string, string, string]
  drills: Drill[]
}

export const CRITERIA: Criterion[] = [
  {
    key: 'instrument',
    name: 'Instrument',
    emoji: '🎻',
    color: '#ff9600',
    question: 'Are you using your whole acting instrument?',
    hint: 'Voice, hands, posture, tempo (fast / slow), size (big / small).',
    anchors: [
      'One gear the whole way — same voice, still body.',
      'A little variety, but mostly locked up.',
      'Some shifts in voice or body, a few flat stretches.',
      'Voice, body and tempo shift with the scene most of the time.',
      'Full range — every tool is alive and serves the moment.',
    ],
    drills: [
      { title: 'Opposite run', how: 'Do one take where every choice is the opposite: whisper what you shouted, go still where you moved. Keep what surprises you.' },
      { title: 'Tempo ladder', how: 'Run the scene at 50%, 100% and 150% speed. Mark in the script where each tempo felt true.' },
      { title: 'Hands only', how: 'Film just your hands for the scene. Are they telling the story, or hiding in your pockets?' },
      { title: 'Size dial', how: 'Pick three beats: play one at size 2/10, one at 5/10, one at 9/10. Find where the scene wants to breathe big.' },
    ],
  },
  {
    key: 'moment',
    name: 'Moment to moment',
    emoji: '👂',
    color: '#1cb0f6',
    question: 'Are you listening and reacting — or saying lines into nowhere?',
    hint: 'Do the reader\'s lines land on you and change what comes next?',
    anchors: [
      'Waiting for my cue, then reciting.',
      'Heard the other lines, but my reactions were planned.',
      'Some real listening; a few moments I just fired lines off.',
      'Mostly reacting to what I got, with genuine surprises.',
      'Fully alive — every line of mine is caused by theirs.',
    ],
    drills: [
      { title: 'Reader roulette', how: 'Ask your reader to change their delivery each take without telling you how. Your only job: let it change you.' },
      { title: 'Silent scene', how: 'Run the scene where you only react, no lines. Watch where your face and body already know what to do.' },
      { title: 'Repeat the last word', how: 'Before each of your lines, silently repeat the last word you heard. It forces you to actually receive it.' },
      { title: 'Cut your cues', how: 'Stop underlining your cue lines. Underline what the other person wants from you instead.' },
    ],
  },
  {
    key: 'text',
    name: 'Foreign text',
    emoji: '📜',
    color: '#ce82ff',
    question: 'Are the words yours — or still someone else\'s text?',
    hint: 'Learned → thought through → inhabited.',
    anchors: [
      'Reading or fighting to remember the lines.',
      'Lines learned, but you can see me remembering them.',
      'Know the lines and why I say them, mostly.',
      'Lines feel like my thoughts, with a few recited bits.',
      'Inhabited — the words come out as if I just thought of them.',
    ],
    drills: [
      { title: 'Paraphrase pass', how: 'Say the whole scene in your own words first. Then go back to the text — notice which exact words you now need.' },
      { title: 'Thought before word', how: 'Write the unspoken thought that triggers each line in the margin. Play the thought, let the line follow.' },
      { title: 'Lines while doing', how: 'Run lines while doing dishes or walking. If you can say them with half your brain busy, they are in your body.' },
      { title: 'Operative words', how: 'Pick one word per line that matters most. Don\'t hit it — just know it. It shapes the thinking.' },
    ],
  },
  {
    key: 'embodied',
    name: 'Embodied',
    emoji: '🫀',
    color: '#ff4b4b',
    question: 'Did personalised circumstances actually change your instrument?',
    hint: 'Your own "as if": where you are, what just happened, what it costs you.',
    anchors: [
      'No circumstances — just me in my room saying lines.',
      'Thought about circumstances, but they didn\'t reach my body.',
      'Some circumstances landed; the body followed sometimes.',
      'Clear, personal circumstances that shape breath, weight, energy.',
      'Fully in it — the circumstances are running my whole instrument.',
    ],
    drills: [
      { title: 'The moment before', how: 'Write 5 sensory details of the 60 seconds before the scene starts. Live them before you hit record.' },
      { title: 'Personal "as if"', how: 'Find a real event in your life with the same stakes. Don\'t play it — just let it sit in your body.' },
      { title: 'Temperature & weight', how: 'Decide: how hot/cold is it, how tired are you, what is in your hands? Let each one change your body.' },
      { title: 'Where does it live?', how: 'Locate the character\'s main feeling in one body part. Breathe into it before action.' },
    ],
  },
  {
    key: 'story',
    name: 'Story',
    emoji: '📖',
    color: '#58cc02',
    question: 'Did you tell the story — from A to B?',
    hint: 'Protagonist, climax, meaningful message, a change you can see.',
    anchors: [
      'No arc — same state at the start and end.',
      'I know the story but it didn\'t read on tape.',
      'There is a shift, but the climax is soft.',
      'Clear A → B change with a climax you can point to.',
      'Clear story, earned climax, and a meaning that stays with you.',
    ],
    drills: [
      { title: 'A → B in one line', how: 'Write "At the start I ___, by the end I ___." If you can\'t fill it in, the tape can\'t show it.' },
      { title: 'Find the turn', how: 'Mark the single line where everything changes. Everything before builds to it; everything after lives with it.' },
      { title: 'Three beats', how: 'Split the scene into three beats and title each one with a verb. Play the verbs, not the mood.' },
      { title: 'Why this scene?', how: 'Ask: why did the writer put this scene in the script? That\'s your meaningful message.' },
    ],
  },
  {
    key: 'screen',
    name: 'On screen',
    emoji: '🎥',
    color: '#2b70c9',
    question: 'Does it work on camera?',
    hint: 'Framing, angle, lighting, eye line, using distance for the climax.',
    anchors: [
      'Hard to watch — bad light, framing or sound.',
      'Watchable, but the eye line or light is off.',
      'Clean technically, nothing uses the camera.',
      'Good frame and eye line, the camera helps the story.',
      'Cinematic — light, frame and distance all serve the climax.',
    ],
    drills: [
      { title: 'Eye line tape', how: 'Put a small piece of tape just beside the lens where your reader is. Check your eyes never drift to the lens by accident.' },
      { title: 'Window test', how: 'Face a window (soft light on your face), not away from it. Film 10 seconds both ways and compare.' },
      { title: 'Lean in for the climax', how: 'Plan one moment to move closer to the camera — at the turn of the scene. Mark it on the floor.' },
      { title: 'Frame check', how: 'Mid-shot, eyes on the top third, a little headroom. Screenshot your frame and compare to a TV close-up.' },
    ],
  },
]

export const CRITERIA_BY_KEY = Object.fromEntries(CRITERIA.map((c) => [c.key, c])) as Record<
  CriterionKey,
  Criterion
>

export const CRITERIA_KEYS = CRITERIA.map((c) => c.key)

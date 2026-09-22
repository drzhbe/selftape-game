import { useEffect, useMemo, useState } from 'react'
import { MuteButton, ProgressBar, ScoreBars } from '../components/Bits'
import { CRITERIA, CRITERIA_KEYS, type CriterionKey } from '../criteria'
import { go } from '../router'
import { addTake, uid, useGame } from '../store'
import type { Scores } from '../types'
import { play } from '../sound'
import { celebrate } from '../ui'
import { saveVideo } from '../videoStore'
import { NotFound } from './TapeDetail'

type Step = 'video' | number | 'reflect'

export function ScoreFlow({ tapeId }: { tapeId: string }) {
  const s = useGame()
  const tape = s.tapes.find((t) => t.id === tapeId)
  const prev = tape?.takes[tape.takes.length - 1]

  const [step, setStep] = useState<Step>('video')
  const [file, setFile] = useState<File>()
  const [link, setLink] = useState('')
  const [scores, setScores] = useState<Partial<Scores>>({})
  const [notes, setNotes] = useState<Partial<Record<CriterionKey, string>>>({})
  const [nextIntent, setNextIntent] = useState('')
  const [saving, setSaving] = useState(false)

  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file])
  useEffect(() => () => void (fileUrl && URL.revokeObjectURL(fileUrl)), [fileUrl])

  const current = typeof step === 'number' ? CRITERIA[step] : undefined
  const selected = current ? scores[current.key] : undefined

  // Keyboard: 1–5 picks a score, Enter continues.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (current && /^[1-5]$/.test(e.key)) pick(Number(e.key))
      // A focused button already handles Enter itself.
      if (e.key === 'Enter' && tag !== 'BUTTON' && (!current || selected)) next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!tape) return <NotFound />
  const takeNo = tape.takes.length + 1

  const totalSteps = CRITERIA.length + 2
  const stepIndex = step === 'video' ? 0 : step === 'reflect' ? totalSteps - 1 : step + 1

  function pick(v: number) {
    if (!current) return
    play('select', v)
    setScores((sc) => ({ ...sc, [current.key]: v }))
  }
  function next() {
    if (step !== 'reflect') play('next')
    if (step === 'video') setStep(0)
    else if (typeof step === 'number') setStep(step < CRITERIA.length - 1 ? step + 1 : 'reflect')
    else submit()
  }
  function back() {
    play('back')
    if (step === 'reflect') setStep(CRITERIA.length - 1)
    else if (typeof step === 'number') setStep(step > 0 ? step - 1 : 'video')
  }

  async function submit() {
    if (saving || !tape) return
    setSaving(true)
    let videoId: string | undefined
    if (file) {
      videoId = uid()
      try {
        await saveVideo(videoId, file)
      } catch {
        videoId = undefined
        alert('Could not store the video in this browser (maybe it is too big). Scores are saved without it.')
      }
    }
    const { reward } = addTake(tape.id, {
      scores: scores as Scores,
      notes,
      nextIntent: nextIntent.trim() || undefined,
      videoId,
      videoLink: link.trim() || undefined,
    })
    go(`/tape/${tape.id}`)
    celebrate(reward, `Take ${takeNo} scored!`)
  }

  const quit = () => {
    if (Object.keys(scores).length === 0 || confirm('Quit scoring? This take won\'t be saved.')) go(`/tape/${tape.id}`)
  }

  const lowest = CRITERIA.filter((c) => scores[c.key]).sort((a, b) => scores[a.key]! - scores[b.key]!)[0]

  return (
    <div className="flow">
      <header className="flow-top">
        <button className="icon-btn" onClick={quit} aria-label="Quit">
          ✕
        </button>
        <ProgressBar value={stepIndex / (totalSteps - 1)} />
        <span className="small muted nowrap">Take {takeNo}</span>
        <MuteButton />
      </header>

      <main className="page flow-body">
        {fileUrl && step !== 'video' && <video className="video sticky" src={fileUrl} controls playsInline />}

        {step === 'video' && (
          <section className="card flow-card">
            <div className="flow-emoji">🎬</div>
            <h2>
              {tape.project} — take {takeNo}
            </h2>
            {prev?.nextIntent && (
              <div className="intent inline">
                <div className="eyebrow">📌 Last time you said you'd try</div>
                <p>“{prev.nextIntent}”</p>
              </div>
            )}
            <p className="muted">Watch your take back, then score it honestly. Attaching the video lets you rewatch while scoring (optional).</p>
            <label className="file-drop">
              <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0])} />
              {file ? `🎞️ ${file.name}` : '📁 Choose video file'}
            </label>
            {fileUrl && <video className="video" src={fileUrl} controls playsInline />}
            <label className="small">
              …or paste a link
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://vimeo.com/…" />
            </label>
          </section>
        )}

        {current && (
          <section className="card flow-card" style={{ ['--accent' as string]: current.color }}>
            <div className="row-between">
              <div className="eyebrow" style={{ color: current.color }}>
                {step as number + 1} / {CRITERIA.length} · {current.name}
              </div>
              {s.focus?.key === current.key && <span className="pill focus-pill">🎯 Your focus</span>}
            </div>
            <div className="flow-emoji">{current.emoji}</div>
            <h2>{current.question}</h2>
            <p className="muted">{current.hint}</p>
            <div className="score-options">
              {current.anchors.map((anchor, i) => {
                const v = i + 1
                return (
                  <button
                    key={v}
                    className={`score-option ${selected === v ? 'on' : ''}`}
                    onClick={() => pick(v)}
                  >
                    <span className="score-num">{v}</span>
                    <span className="score-anchor">{anchor}</span>
                    {prev?.scores[current.key] === v && <span className="prev-tag">last take</span>}
                  </button>
                )
              })}
            </div>
            <textarea
              rows={2}
              placeholder="Note to self (optional)"
              value={notes[current.key] ?? ''}
              onChange={(e) => setNotes((n) => ({ ...n, [current.key]: e.target.value }))}
            />
          </section>
        )}

        {step === 'reflect' && (
          <section className="card flow-card">
            <div className="flow-emoji">🪞</div>
            <h2>What will you try next take?</h2>
            <ScoreBars scores={scores as Scores} prev={prev?.scores} />
            {lowest && (
              <div className="drill">
                <b>
                  Idea for {lowest.emoji} {lowest.name}: {lowest.drills[0].title}
                </b>
                <p>{lowest.drills[0].how}</p>
                <button className="btn btn-ghost btn-sm" onClick={() => setNextIntent(`${lowest.drills[0].title}: ${lowest.drills[0].how}`)}>
                  Use this
                </button>
              </div>
            )}
            <textarea
              rows={3}
              autoFocus
              placeholder="e.g. Let the reader's second line actually hit me before I answer"
              value={nextIntent}
              onChange={(e) => setNextIntent(e.target.value)}
            />
            <p className="small muted">Writing an intention earns +10 XP and shows up when you start the next take.</p>
          </section>
        )}
      </main>

      <footer className="flow-foot">
        <div className="flow-foot-inner">
          {step !== 'video' && (
            <button className="btn btn-ghost" onClick={back}>
              Back
            </button>
          )}
          <button
            className="btn btn-primary grow"
            disabled={(!!current && !selected) || saving || (step === 'reflect' && !CRITERIA_KEYS.every((k) => scores[k]))}
            onClick={next}
          >
            {step === 'video' ? (file || link ? 'Start scoring' : 'Skip — start scoring') : step === 'reflect' ? 'Finish take' : 'Continue'}
          </button>
        </div>
      </footer>
    </div>
  )
}

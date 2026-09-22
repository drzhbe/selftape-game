import { fmtDate, ScoreBars, TopBar, Video } from '../components/Bits'
import { CRITERIA } from '../criteria'
import { takeAverage } from '../game'
import { go } from '../router'
import { deleteTake, useGame } from '../store'
import { NotFound } from './TapeDetail'

export function TakeView({ tapeId, takeId }: { tapeId: string; takeId: string }) {
  const s = useGame()
  const tape = s.tapes.find((t) => t.id === tapeId)
  const idx = tape?.takes.findIndex((t) => t.id === takeId) ?? -1
  if (!tape || idx < 0) return <NotFound />
  const take = tape.takes[idx]
  const prev = tape.takes[idx - 1]

  const remove = () => {
    if (confirm(`Delete take ${idx + 1}? XP you earned stays.`)) {
      deleteTake(tape.id, take.id)
      go(`/tape/${tape.id}`)
    }
  }

  return (
    <>
      <TopBar back={`/tape/${tape.id}`} title={`${tape.project} · Take ${idx + 1}`} />
      <main className="page">
        <Video videoId={take.videoId} link={take.videoLink} />
        <section className="card">
          <div className="row-between">
            <div>
              <h3>Take {idx + 1}</h3>
              <div className="muted small">
                {fmtDate(take.createdAt)} · +{take.xpEarned} XP
              </div>
            </div>
            <div className="take-avg big">{takeAverage(take).toFixed(1)}</div>
          </div>
          <ScoreBars scores={take.scores} prev={prev?.scores} />
          {prev && <p className="small muted">Arrows compare with take {idx}.</p>}
        </section>

        {(Object.values(take.notes).some(Boolean) || take.nextIntent) && (
          <section className="card">
            <h3>Notes</h3>
            {CRITERIA.filter((c) => take.notes[c.key]).map((c) => (
              <p key={c.key} className="note-line">
                <b>
                  {c.emoji} {c.name}:
                </b>{' '}
                {take.notes[c.key]}
              </p>
            ))}
            {take.nextIntent && (
              <p className="note-line">
                <b>📌 Next time:</b> {take.nextIntent}
              </p>
            )}
          </section>
        )}

        <button className="btn btn-danger-ghost btn-block" onClick={remove}>
          Delete take
        </button>
      </main>
    </>
  )
}

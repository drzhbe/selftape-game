import { useState } from 'react'
import { fmtDate, ScoreBars, STATUSES, TopBar } from '../components/Bits'
import { Radar, TrendChart } from '../components/Charts'
import { CRITERIA } from '../criteria'
import { takeAverage } from '../game'
import { go } from '../router'
import { deleteTape, setStatus, useGame } from '../store'
import { celebrate } from '../ui'

export function TapeDetail({ id }: { id: string }) {
  const s = useGame()
  const tape = s.tapes.find((t) => t.id === id)
  const [showTrend, setShowTrend] = useState(true)
  if (!tape) return <NotFound />

  const last = tape.takes[tape.takes.length - 1]
  const first = tape.takes[0]
  const best = tape.takes.length ? Math.max(...tape.takes.map(takeAverage)) : 0

  const changeStatus = (status: (typeof STATUSES)[number]['key']) => {
    const headline = { preparing: '', sent: 'Shipped it! 📮', callback: 'Callback! 📞', booked: 'YOU BOOKED IT! 🏆' }[status]
    celebrate(setStatus(tape.id, status), headline, status === 'sent' ? 'sent' : undefined)
  }

  const remove = () => {
    if (confirm(`Delete "${tape.project}" and all its takes? This can't be undone.`)) {
      deleteTape(tape.id)
      go('/')
    }
  }

  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <section className="card">
          <div className="row-between">
            <div>
              <h2 className="tape-heading">{tape.project}</h2>
              <div className="muted">
                {tape.role && `${tape.role} · `}
                {tape.kind}
                {tape.dueDate && ` · due ${fmtDate(tape.dueDate)}`}
              </div>
            </div>
            <a className="btn btn-ghost btn-sm" href={`#/tape/${tape.id}/edit`}>
              Edit
            </a>
          </div>
          {tape.notes && <p className="notes">{tape.notes}</p>}
          <div className="status-steps">
            {STATUSES.map((st) => (
              <button
                key={st.key}
                className={`status-step ${tape.status === st.key ? 'on' : ''} status-${st.key}`}
                onClick={() => changeStatus(st.key)}
              >
                <span>{st.emoji}</span>
                {st.label}
              </button>
            ))}
          </div>
          {tape.status === 'preparing' && tape.takes.length > 0 && (
            <p className="small muted">Sent it off? Tap “Sent” — shipping a tape is a win on its own, whatever comes back.</p>
          )}
        </section>

        {last?.nextIntent && (
          <section className="card intent">
            <div className="eyebrow">📌 Last take you said you'd try</div>
            <p>“{last.nextIntent}”</p>
          </section>
        )}

        <button className="btn btn-primary btn-block btn-lg" onClick={() => go(`/tape/${tape.id}/take/new`)}>
          🎥 Score take {tape.takes.length + 1}
        </button>

        {tape.takes.length > 0 && (
          <section className="card">
            <div className="row-between">
              <h3>Progress on this tape</h3>
              <div className="chips">
                <button className={`chip ${showTrend ? 'on' : ''}`} onClick={() => setShowTrend(true)}>
                  Trend
                </button>
                <button className={`chip ${!showTrend ? 'on' : ''}`} onClick={() => setShowTrend(false)}>
                  Shape
                </button>
              </div>
            </div>
            <div className="stats-row">
              <div>
                <b>{tape.takes.length}</b>
                <span>takes</span>
              </div>
              <div>
                <b>{takeAverage(last).toFixed(1)}</b>
                <span>latest</span>
              </div>
              <div>
                <b>{best.toFixed(1)}</b>
                <span>best</span>
              </div>
              <div>
                <b className={takeAverage(last) - takeAverage(first) >= 0 ? 'up' : 'down'}>
                  {(takeAverage(last) - takeAverage(first) >= 0 ? '+' : '') + (takeAverage(last) - takeAverage(first)).toFixed(1)}
                </b>
                <span>since take 1</span>
              </div>
            </div>
            {showTrend ? (
              <>
                <TrendChart takes={tape.takes.map((t) => t.scores)} />
                <div className="legend">
                  {CRITERIA.map((c) => (
                    <span key={c.key}>
                      <i style={{ background: c.color }} /> {c.emoji} {c.name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <Radar
                series={[
                  ...(tape.takes.length > 1 ? [{ scores: first.scores, color: '#afafaf', label: 'Take 1' }] : []),
                  { scores: last.scores, color: '#58cc02', label: `Take ${tape.takes.length}` },
                ]}
              />
            )}
          </section>
        )}

        {tape.takes.length > 0 && <h3 className="section-title">Takes</h3>}
        <div className="take-list">
          {[...tape.takes].reverse().map((take) => {
            const idx = tape.takes.indexOf(take)
            const prev = tape.takes[idx - 1]
            return (
              <a key={take.id} className="card take-item" href={`#/tape/${tape.id}/take/${take.id}`}>
                <div className="take-head">
                  <div>
                    <b>Take {idx + 1}</b>
                    <span className="muted small"> · {fmtDate(take.createdAt)}</span>
                    {(take.videoId || take.videoLink) && <span className="small"> · 🎞️</span>}
                  </div>
                  <div className="take-avg">{takeAverage(take).toFixed(1)}</div>
                </div>
                <ScoreBars scores={take.scores} prev={prev?.scores} compact />
              </a>
            )
          })}
        </div>

        <button className="btn btn-danger-ghost btn-block" onClick={remove}>
          Delete selftape
        </button>
      </main>
    </>
  )
}

export function NotFound() {
  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <section className="card empty">
          <div className="empty-emoji">🤷</div>
          <h3>Nothing here</h3>
          <a className="btn btn-primary" href="#/">
            Home
          </a>
        </section>
      </main>
    </>
  )
}

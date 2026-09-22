import { CRITERIA_BY_KEY } from '../criteria'
import { insight } from '../game'
import { clearFocus, setFocus, useGame } from '../store'
import { celebrate } from '../ui'

export function FocusCard() {
  const s = useGame()
  const ins = insight(s)

  if (s.focus) {
    const c = CRITERIA_BY_KEY[s.focus.key]
    const drill = c.drills[s.focus.drillIndex % c.drills.length]
    return (
      <section className="card focus" style={{ ['--accent' as string]: c.color }}>
        <div className="eyebrow">🎯 Your focus</div>
        <h3>
          {c.emoji} {c.name}
          {ins && <span className="focus-score">avg {ins.avg[c.key].toFixed(1)}</span>}
        </h3>
        <div className="drill">
          <b>Drill: {drill.title}</b>
          <p>{drill.how}</p>
        </div>
        <div className="row gap">
          <button className="btn btn-ghost btn-sm" onClick={() => setFocus(c.key, s.focus!.drillIndex + 1)}>
            Another drill
          </button>
          <button className="btn btn-ghost btn-sm" onClick={clearFocus}>
            Change focus
          </button>
        </div>
      </section>
    )
  }

  if (!ins) return null

  const c = CRITERIA_BY_KEY[ins.weakest]
  const pickFocus = () => celebrate(setFocus(c.key), 'Focus set!')
  return (
    <section className="card focus" style={{ ['--accent' as string]: c.color }}>
      <div className="eyebrow">{ins.isPattern ? '🔍 Pattern spotted' : '💡 Room to grow'}</div>
      <h3>
        {c.emoji} {c.name}
        <span className="focus-score">avg {ins.avg[c.key].toFixed(1)}</span>
      </h3>
      <p className="muted">
        {ins.isPattern
          ? `It was your lowest score in ${ins.weakestHits} of your last ${ins.recentCount} takes.`
          : `Your lowest average across your last ${ins.recentCount} take${ins.recentCount > 1 ? 's' : ''}.`}{' '}
        {CRITERIA_BY_KEY[ins.strongest].emoji} {CRITERIA_BY_KEY[ins.strongest].name} is your strength.
      </p>
      <div className="drill">
        <b>Try: {c.drills[0].title}</b>
        <p>{c.drills[0].how}</p>
      </div>
      <button className="btn btn-primary btn-sm" onClick={pickFocus}>
        Make it my focus
      </button>
    </section>
  )
}

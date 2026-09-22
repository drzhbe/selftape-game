import { fmtDate, ProgressBar, StatusPill, TopBar } from '../components/Bits'
import { Sparkline } from '../components/Charts'
import { FocusCard } from '../components/FocusCard'
import { levelInfo, takeAverage, totalXp, weeklyStreak } from '../game'
import { go } from '../router'
import { useGame } from '../store'

export function Home() {
  const s = useGame()
  const lvl = levelInfo(totalXp(s))
  const streak = weeklyStreak(s)

  return (
    <>
      <TopBar />
      <main className="page">
        <section className="card hero">
          <div className="row-between">
            <div>
              <div className="eyebrow">Level {lvl.level}</div>
              <h2 className="hero-title">{lvl.title}</h2>
            </div>
            <div className="hero-streak">
              <div className={`flame ${streak.activeThisWeek ? '' : 'cold'}`}>🔥</div>
              <div className="small">
                <b>{streak.weeks}</b> week{streak.weeks === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <ProgressBar value={lvl.into / lvl.span} color="var(--gold)" />
          <p className="small muted">
            {lvl.toNext} XP to level {lvl.level + 1}
            {!streak.activeThisWeek && s.tapes.length > 0 && ' · Score a take this week to keep your streak alive'}
          </p>
          {s.tapes.length > 0 && (
            <a className="btn btn-ghost btn-sm" href="#/progress">
              📈 My progress & achievements
            </a>
          )}
        </section>

        <button className="btn btn-primary btn-block btn-lg" onClick={() => go('/tape/new')}>
          + New selftape
        </button>

        {s.tapes.length === 0 ? (
          <section className="card empty">
            <div className="empty-emoji">🎭</div>
            <h3>Your tapes don't go into the void anymore.</h3>
            <p className="muted">
              Every selftape becomes a level. Score each take on 6 skills, watch yourself improve take by take, earn XP for doing the
              work — whether or not casting ever writes back.
            </p>
          </section>
        ) : (
          <>
            <FocusCard />
            <h3 className="section-title">Your selftapes</h3>
            <div className="tape-list">
              {s.tapes.map((t) => {
                const avgs = t.takes.map(takeAverage)
                const last = avgs[avgs.length - 1]
                return (
                  <a key={t.id} className="card tape-item" href={`#/tape/${t.id}`}>
                    <div className="tape-main">
                      <div className="tape-title">{t.project || 'Untitled'}</div>
                      <div className="muted small">
                        {t.role && `${t.role} · `}
                        {t.kind} · {fmtDate(t.createdAt)}
                      </div>
                      <div className="row gap small tape-meta">
                        <StatusPill status={t.status} />
                        <span className="muted">
                          {t.takes.length} take{t.takes.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <div className="tape-side">
                      {last ? <div className="tape-score">{last.toFixed(1)}</div> : <div className="tape-score empty">–</div>}
                      <Sparkline values={avgs} />
                    </div>
                  </a>
                )
              })}
            </div>
          </>
        )}
      </main>
    </>
  )
}

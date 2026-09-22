import { useState, type FormEvent } from 'react'
import { TopBar } from '../components/Bits'
import { go } from '../router'
import { createTape, updateTape, useGame } from '../store'
import { celebrate } from '../ui'

const KINDS = ['Film', 'TV', 'Commercial', 'Theatre', 'Voice', 'Other']

export function TapeForm({ id }: { id?: string }) {
  const s = useGame()
  const existing = id ? s.tapes.find((t) => t.id === id) : undefined
  const [project, setProject] = useState(existing?.project ?? '')
  const [role, setRole] = useState(existing?.role ?? '')
  const [kind, setKind] = useState(existing?.kind ?? 'Film')
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const fields = { project: project.trim(), role: role.trim(), kind, dueDate: dueDate || undefined, notes: notes.trim() || undefined }
    if (existing) {
      updateTape(existing.id, fields)
      go(`/tape/${existing.id}`)
    } else {
      const { tape, reward } = createTape(fields)
      go(`/tape/${tape.id}`)
      celebrate(reward, 'New level unlocked!')
    }
  }

  return (
    <>
      <TopBar back={existing ? `/tape/${existing.id}` : '/'} title={existing ? 'Edit selftape' : 'New selftape'} />
      <main className="page">
        <form className="card form" onSubmit={submit}>
          <label>
            Project
            <input autoFocus required value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. The Crown S7" />
          </label>
          <label>
            Role
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Young Diana" />
          </label>
          <div className="field">
            <span>Type</span>
            <div className="chips">
              {KINDS.map((k) => (
                <button type="button" key={k} className={`chip ${k === kind ? 'on' : ''}`} onClick={() => setKind(k)}>
                  {k}
                </button>
              ))}
            </div>
          </div>
          <label>
            Due date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label>
            Notes
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Casting notes, character breakdown, anything useful…" />
          </label>
          <button className="btn btn-primary btn-block btn-lg" type="submit">
            {existing ? 'Save' : 'Start this selftape'}
          </button>
        </form>
      </main>
    </>
  )
}

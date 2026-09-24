import { useState } from 'react'
import { play } from '../sound'

const KEY = 'selftape-game:cookie-notice'

const seen = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function CookieBanner() {
  const [hidden, setHidden] = useState(seen)
  if (hidden) return null

  const close = () => {
    play('tap')
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* storage blocked — the banner comes back next visit */
    }
    setHidden(true)
  }

  return (
    <div className="cookie-bar" role="note">
      <p>
        🍪 This site uses Google Analytics cookies to count visits. Your selftapes, scores and videos stay in your browser and are
        never uploaded.
      </p>
      <button className="btn btn-primary btn-sm" onClick={close}>
        Close
      </button>
    </div>
  )
}

import { useState } from 'react'
import { getGreeting } from '../constants'
import ProgressRing from './ProgressRing'

function Hero({ username, todos }) {
  const [date] = useState(() => new Date())
  const doneCount = todos.filter((todo) => todo.status === 'done').length
  const remaining = todos.length - doneCount
  const percent = todos.length ? Math.round((doneCount / todos.length) * 100) : 0
  const firstName = username.trim().split(/\s+/)[0] || 'there'
  const today = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  let summary = `You have ${remaining} task${remaining === 1 ? '' : 's'} left to finish.`
  if (todos.length === 0) summary = 'Your list is empty. What will you work on today?'
  else if (remaining === 0) summary = 'Everything is done. Nice work! 🎉'

  return (
    <div className="hero">
      <div>
        <p className="hero-date">{today}</p>
        <h1>
          {getGreeting(date)}, {firstName}
        </h1>
        <p className="hero-summary">{summary}</p>
      </div>
      <div className="hero-progress">
        <ProgressRing percent={percent} />
        <span>
          {doneCount}/{todos.length} done
        </span>
      </div>
    </div>
  )
}

export default Hero

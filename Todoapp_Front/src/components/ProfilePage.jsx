import { useState } from 'react'
import { MAX_DISPLAY_NAME_LENGTH, STATUSES, USERNAME_PATTERN, getInitials } from '../constants'
import { MailIcon, PencilIcon, StarIcon, StatusIcon, UserIcon } from './Icons'
import ProgressRing from './ProgressRing'

function ProfilePage({ user, onSave, todos }) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(user)

  const doneCount = todos.filter((todo) => todo.status === 'done').length
  const starredCount = todos.filter((todo) => todo.starred).length
  const percent = todos.length ? Math.round((doneCount / todos.length) * 100) : 0

  function startEditing() {
    setForm(user)
    setIsEditing(true)
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.displayName.trim()) return
    onSave({
      username: form.username.trim(),
      displayName: form.displayName.trim(),
      email: form.email.trim(),
    })
    setIsEditing(false)
  }

  return (
    <div className="profile-page">
      <div className="card profile-card">
        <div className="profile-banner" />
        <div className="profile-body">
          <span className="avatar xl">{getInitials(isEditing ? form.displayName : user.displayName)}</span>

          {isEditing ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <label className="field">
                Display name
                <input className="input" name="displayName" value={form.displayName} onChange={handleChange} maxLength={MAX_DISPLAY_NAME_LENGTH} required autoFocus />
              </label>
              <label className="field">
                Username
                <input
                  className="input"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  pattern={USERNAME_PATTERN}
                  title="3-30 characters: letters, numbers, dots or underscores"
                  required
                />
              </label>
              <label className="field">
                Email
                <input className="input" name="email" type="email" value={form.email} onChange={handleChange} maxLength={254} />
              </label>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save changes
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-head">
                <div>
                  <h2>{user.displayName}</h2>
                  <p className="muted">@{user.username}</p>
                </div>
                <button className="btn small" onClick={startEditing}>
                  <PencilIcon size={15} />
                  Edit profile
                </button>
              </div>
              <ul className="profile-details">
                <li>
                  <MailIcon size={17} />
                  {user.email || 'No email'}
                </li>
                <li>
                  <UserIcon size={17} />
                  @{user.username}
                </li>
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="card overview-card">
        <h3>Overview</h3>
        <div className="overview-progress">
          <ProgressRing percent={percent} size={84} stroke={8} />
          <div>
            <strong>{percent}% complete</strong>
            <p className="muted">
              {doneCount} of {todos.length} tasks done
            </p>
          </div>
        </div>
        <div className="stat-grid">
          {STATUSES.map((status) => (
            <div key={status.value} className={`stat ${status.value}`}>
              <StatusIcon status={status.value} size={18} />
              <strong>{todos.filter((todo) => todo.status === status.value).length}</strong>
              <span>{status.label}</span>
            </div>
          ))}
          <div className="stat starred">
            <StarIcon size={18} filled />
            <strong>{starredCount}</strong>
            <span>Starred</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

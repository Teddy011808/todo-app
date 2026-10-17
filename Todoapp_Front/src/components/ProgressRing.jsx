function ProgressRing({ percent, size = 72, stroke = 7 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  return (
    <div
      className="progress-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${percent}% complete`}
    >
      <svg width={size} height={size}>
        <circle className="ring-track" cx={center} cy={center} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className="ring-value"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span className="progress-ring-label">{percent}%</span>
    </div>
  )
}

export default ProgressRing

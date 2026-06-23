import { useState, useEffect, useRef } from 'react'
import api from '../api/axios.js'

// ─── Constants ───────────────────────────────────────────────────────────────
const WEEKS = 53
const DAYS_IN_WEEK = 7
const TOTAL_CELLS = WEEKS * DAYS_IN_WEEK // 371

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = [
  { idx: 1, label: 'Mon' },
  { idx: 3, label: 'Wed' },
  { idx: 5, label: 'Fri' },
]

/**
 * Given an activity map { "YYYY-MM-DD": count }, build an array of 371 cells
 * aligned so the last cell is today, and the grid starts on a Sunday.
 */
function buildGrid(activityMap) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Align so the last column ends today.
  // The grid always starts on a Sunday.
  // Start date = today - (TOTAL_CELLS - 1) days
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (TOTAL_CELLS - 1))

  const cells = []
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const count = activityMap[key] || 0
    const isFuture = d > today
    cells.push({ date: d, key, count, isFuture })
  }
  return cells
}

/**
 * Determine colour level 0-4 based on count.
 */
function getLevel(count) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

/**
 * Build month label positions.
 * For each week column, check what month the Sunday of that week is in.
 * Emit the label at the first column a new month appears.
 */
function buildMonthLabels(cells) {
  const labels = []
  let lastMonth = -1
  for (let col = 0; col < WEEKS; col++) {
    const cellIdx = col * DAYS_IN_WEEK // first cell (top) of this column
    if (cellIdx >= cells.length) break
    const month = cells[cellIdx].date.getMonth()
    if (month !== lastMonth) {
      labels.push({ col, label: MONTH_NAMES[month] })
      lastMonth = month
    }
  }
  return labels
}

/**
 * Format date for tooltip: "Jun 12, 2025"
 */
function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityHeatmap({ userId }) {
  const [activityMap, setActivityMap] = useState(null)
  // loading starts true; set false after first fetch
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState(null) // { text, x, y }
  const wrapRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    api
      .get(`/users/${userId}/heatmap`)
      .then(({ data }) => {
        if (!cancelled) {
          setActivityMap(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActivityMap({})
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (loading) {
    return (
      <div className='heatmap-wrap'>
        <div className='heatmap-header'>
          <span className='heatmap-title'>Contributions</span>
        </div>
        <div className='heatmap-skeleton' />
      </div>
    )
  }

  const cells = buildGrid(activityMap)
  const monthLabels = buildMonthLabels(cells)
  const totalContributions = Object.values(activityMap).reduce((s, v) => s + v, 0)

  const handleMouseEnter = (e, cell) => {
    if (cell.isFuture) return
    const rect = e.target.getBoundingClientRect()
    const wrapRect = wrapRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
    const text =
      cell.count === 0
        ? `No contributions on ${formatDate(cell.date)}`
        : `${cell.count} contribution${cell.count > 1 ? 's' : ''} on ${formatDate(cell.date)}`
    setTooltip({
      text,
      x: rect.left - wrapRect.left + rect.width / 2,
      y: rect.top - wrapRect.top - 8,
    })
  }

  const handleMouseLeave = () => setTooltip(null)

  return (
    <div className='heatmap-wrap' ref={wrapRef}>
      {/* Header */}
      <div className='heatmap-header'>
        <span className='heatmap-title'>
          {totalContributions.toLocaleString()} contribution{totalContributions !== 1 ? 's' : ''} in the last year
        </span>
      </div>

      {/* Grid area */}
      <div className='heatmap-body'>
        {/* Day labels (left axis) */}
        <div className='heatmap-day-labels'>
          {DAY_LABELS.map(({ idx, label }) => (
            <span key={label} className='heatmap-day-label' style={{ gridRow: idx + 1 }}>
              {label}
            </span>
          ))}
        </div>

        {/* Month + grid column */}
        <div className='heatmap-right'>
          {/* Month labels */}
          <div className='heatmap-month-labels'>
            {monthLabels.map(({ col, label }) => (
              <span
                key={`${col}-${label}`}
                className='heatmap-month-label'
                style={{ gridColumn: col + 1 }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* The actual grid: 53 columns × 7 rows */}
          <div className='heatmap-grid'>
            {cells.map((cell) => (
              <div
                key={cell.key}
                className='heatmap-cell'
                data-level={cell.isFuture ? 'future' : getLevel(cell.count)}
                onMouseEnter={(e) => handleMouseEnter(e, cell)}
                onMouseLeave={handleMouseLeave}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className='heatmap-tooltip'
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      <div className='heatmap-legend'>
        <span className='heatmap-legend-label'>Less</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <div key={lvl} className='heatmap-cell heatmap-cell--legend' data-level={lvl} />
        ))}
        <span className='heatmap-legend-label'>More</span>
      </div>
    </div>
  )
}

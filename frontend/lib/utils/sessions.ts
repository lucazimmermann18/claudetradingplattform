export interface SessionInfo {
  name: string
  short: string
  color: string
  rgb: string
  utcOpen: number
  utcClose: number
  crossesMidnight: boolean
}

export const SESSIONS: SessionInfo[] = [
  { name: 'Sydney',   short: 'SYD', color: 'var(--accent-violet)', rgb: '167,139,250', utcOpen: 21, utcClose: 6,  crossesMidnight: true },
  { name: 'Tokyo',    short: 'TKY', color: 'var(--accent-amber)',  rgb: '255,184,0',   utcOpen: 0,  utcClose: 9,  crossesMidnight: false },
  { name: 'London',   short: 'LON', color: 'var(--accent-blue)',   rgb: '0,212,255',   utcOpen: 7,  utcClose: 16, crossesMidnight: false },
  { name: 'New York', short: 'NY',  color: 'var(--accent-green)',  rgb: '0,255,136',   utcOpen: 12, utcClose: 21, crossesMidnight: false },
]

export function getOpenSessions(nowUtc = new Date()): SessionInfo[] {
  const h = nowUtc.getUTCHours()
  return SESSIONS.filter(s => {
    if (s.crossesMidnight) return h >= s.utcOpen || h < s.utcClose
    return h >= s.utcOpen && h < s.utcClose
  })
}

export function sessionProgress(s: SessionInfo, nowUtc = new Date()): number {
  const h = nowUtc.getUTCHours()
  const m = nowUtc.getUTCMinutes()
  const nowMins = h * 60 + m
  const openMins  = s.utcOpen  * 60
  const closeMins = s.utcClose * 60

  if (s.crossesMidnight) {
    const totalMins = (24 - s.utcOpen + s.utcClose) * 60
    const elapsed = nowMins >= openMins
      ? nowMins - openMins
      : (24 * 60 - openMins) + nowMins
    return Math.min(elapsed / totalMins, 1)
  }
  if (nowMins < openMins || nowMins >= closeMins) return 0
  return (nowMins - openMins) / (closeMins - openMins)
}

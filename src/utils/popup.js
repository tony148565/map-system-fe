import {formatCoordinate} from './coordinate'

export function buildPopupContent(data, mode = 'event') {
  const title =
    mode === 'selected'
      ? 'Selected Point'
      : (data.label || 'Event')

  const rows = mode === 'selected'
    ? [
        ['Lat', formatCoordinate(data.lat)],
        ['Lon', formatCoordinate(data.lon)]
      ]
    : [
        ['UID', data.uid],
        ['Type', data.type],
        ['Status', data.status],
        ['Lat', data.lat],
        ['Lon', data.lon]
      ]

  return `
    <div class="popup-content">
      <div class="popup-title">${title}</div>
      ${rows.map(([label, value]) => `
        <div class="popup-row">
          <span class="popup-label">${label}:</span>
          <span>${value ?? ''}</span>
        </div>
      `).join('')}
    </div>
  `
}
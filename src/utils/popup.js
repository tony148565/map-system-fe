import { formatCoordinate } from './coordinate'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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
        ['Lat', formatCoordinate(data.lat)],
        ['Lon', formatCoordinate(data.lon)]
      ]

  return `
    <div class="popup-content">
      <div class="popup-title">${escapeHtml(title)}</div>
      ${rows.map(([label, value]) => `
        <div class="popup-row">
          <span class="popup-label">${escapeHtml(label)}:</span>
          <span>${escapeHtml(value)}</span>
        </div>
      `).join('')}

      ${
        mode === 'event'
          ? `
          <div class="popup-actions">
            <button class="popup-edit-btn" data-uid="${escapeHtml(data.uid)}">
              Edit
            </button>
            <button class="popup-delete-btn" data-uid="${escapeHtml(data.uid)}">
              Delete
            </button>
          </div>
          `
          : ''
      }
    </div>
  `
}
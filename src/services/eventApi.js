const BASE_URL = 'http://127.0.0.1:5000'

export async function fetchEvents() {
  const response = await fetch(`${BASE_URL}/events`)

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`)
  }

  return await response.json()
}

export async function createEvent(eventData) {
  const response = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  })

  return await parseResponse(response)
}

export async function updateEvent(uid, eventData) {
  const response = await fetch(`${BASE_URL}/events/${encodeURIComponent(uid)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  })

  return await parseResponse(response)
}

export async function deleteEvent(uid) {
  const response = await fetch(`${BASE_URL}/events/${encodeURIComponent(uid)}`, {
    method: 'DELETE'
  })

  return await parseResponse(response)
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw {
      status: response.status,
      data
    }
  }

  return data
}
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
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  })

  if (!response.ok) {
    throw new Error(`Failed to create event: ${response.status}`)
  }

  return await response.json()
}

export async function updateEvent(uid, eventData) {
  const response = await fetch(`${BASE_URL}/events/${encodeURIComponent(uid)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  })

  if (!response.ok) {
    throw new Error(`Failed to update event: ${response.status}`)
  }

  return await response.json()
}

export async function deleteEvent(uid) {
  const response = await fetch(`${BASE_URL}/events/${encodeURIComponent(uid)}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    throw new Error(`Failed to delete event: ${response.status}`)
  }

  return await response.json()
}